package ke.imperialenterprise.imperialai.data.agent

import ke.imperialenterprise.imperialai.data.repository.InMemoryAgentRunRepository
import ke.imperialenterprise.imperialai.data.security.DefaultApprovalEngine
import ke.imperialenterprise.imperialai.domain.agent.*
import ke.imperialenterprise.imperialai.domain.model.*
import ke.imperialenterprise.imperialai.domain.repository.*
import ke.imperialenterprise.imperialai.domain.security.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

/**
 * Production implementation of [AgentEngine] (Phases 4 & 5).
 * 
 * Target Execution Chain:
 * AI -> Tool Call -> Tool Registry -> Permission Engine -> Site Isolation Validation
 * -> Approval Requirement -> User Approval where required -> MCP Execution -> Verification -> Audit.
 */
class DefaultAgentEngine(
    private val aiProvider: AIProvider,
    private val toolRegistry: ToolRegistry,
    private val permissionEngine: PermissionEngine,
    private val mcpManager: McpManager,
    private val siteRepository: SiteRepository,
    private val conversationRepository: ConversationRepository,
    private val mcpServerRepository: McpServerRepository,
    private val credentialStore: CredentialStore,
    private val auditLogger: AuditLogger,
    private val agentRunRepository: AgentRunRepository = InMemoryAgentRunRepository(),
    private val approvalEngine: ApprovalEngine = DefaultApprovalEngine(auditLogger),
    private val wordPressAdapter: ke.imperialenterprise.imperialai.domain.wordpress.WordPressAdapter? = null
) : AgentEngine {

    private val toolSecurityValidator = ToolSecurityValidator(
        siteRepository = siteRepository,
        conversationRepository = conversationRepository,
        mcpServerRepository = mcpServerRepository,
        toolRegistry = toolRegistry,
        credentialStore = credentialStore
    )

    // Maps approvalId -> (ApprovalRequest, CompletableDeferred<Boolean>)
    private val pendingApprovals = ConcurrentHashMap<String, Pair<ApprovalRequest, CompletableDeferred<Boolean>>>()
    
    // Execution context lock
    @Volatile
    private var lockedSiteContext: ActiveSiteContext? = null
    private var currentExecutionJob: Job? = null

    override fun isRunning(): Boolean = lockedSiteContext != null

    override fun getLockedSiteId(): String? = lockedSiteContext?.siteId

    override fun runTurn(
        context: ActiveSiteContext,
        prompt: String,
        history: List<ChatMessage>,
        modelId: String,
        mode: AgentMode,
        maxIterations: Int
    ): Flow<AgentExecutionEvent> = flow {
        // Section 21: Execution Context Lock
        val currentLock = lockedSiteContext
        if (currentLock != null && currentLock.siteId != context.siteId) {
            val errMsg = "An agent is currently running for ${currentLock.siteName}. Stop the current task before switching sites."
            emit(AgentExecutionEvent.Error(AIError.networkError(errMsg)))
            return@flow
        }
        lockedSiteContext = context

        // Section 34: Persist AgentRun record locally
        var currentRun = AgentRun(
            siteId = context.siteId,
            conversationId = context.activeConversationId ?: "conv_${context.siteId}",
            model = modelId,
            mode = mode,
            status = AgentRunStatus.RUNNING,
            startedAt = System.currentTimeMillis()
        )
        agentRunRepository.saveRun(currentRun)

        auditLogger.logEvent(
            siteId = context.siteId,
            siteName = context.siteName,
            userAction = "AGENT_RUN_STARTED",
            aiAction = "INITIALIZE_LOOP",
            tool = "AgentEngine",
            parametersSummary = "mode=$mode; model=$modelId; maxIterations=$maxIterations",
            resultSummary = "Agent loop started for ${context.siteName}",
            approvalStatus = "NONE",
            isSuccess = true
        )

        emit(
            AgentExecutionEvent.Started(
                siteId = context.siteId,
                siteName = context.siteName,
                conversationId = context.activeConversationId ?: "conv_${context.siteId}",
                userPrompt = prompt,
                mode = mode
            )
        )

        try {
            // Step 1: Strict Site Isolation - Fetch only tools registered for this siteId
            val siteTools = toolRegistry.getToolsForSite(context.siteId)
            val (validToolDefs, schemaDiagnostics) = ToolSchemaConverter.convertAll(siteTools)

            schemaDiagnostics.forEach { diag ->
                auditLogger.logEvent(
                    siteId = context.siteId,
                    siteName = context.siteName,
                    userAction = "SCHEMA_CONVERSION_WARNING",
                    aiAction = "PREPARE_TOOLS",
                    tool = "ToolSchemaConverter",
                    parametersSummary = SensitiveDataRedactor.redact(diag.take(80)),
                    resultSummary = "Tool skipped due to schema normalization issue",
                    approvalStatus = "NONE",
                    isSuccess = false
                )
            }

            // Step 2: System prompt building with separation & WordPress Intelligence
            val site = siteRepository.getSiteById(context.siteId)
            val wpProfile = wordPressAdapter?.getSiteProfile(context.siteId)?.value
            val wpCapabilities = wordPressAdapter?.getSiteCapabilities(context.siteId)?.value ?: emptyList()
            val wpContextText = if (wpProfile != null || wpCapabilities.isNotEmpty()) {
                ke.imperialenterprise.imperialai.domain.wordpress.WordPressContextBuilder.buildAiContext(
                    context = context,
                    profile = wpProfile,
                    capabilities = wpCapabilities
                )
            } else null

            val systemPrompt = SystemPromptBuilder.buildSystemPrompt(
                context = context,
                mode = mode,
                availableTools = siteTools,
                siteSpecificAiInstructions = site?.aiInstructions,
                wordPressIntelligenceContext = wpContextText
            )

            // Step 3: Conversation context
            val turnMessages = mutableListOf<ChatMessage>()
            turnMessages.addAll(history.takeLast(10))
            turnMessages.add(
                ChatMessage(
                    conversationId = context.activeConversationId ?: "conv_${context.siteId}",
                    siteId = context.siteId,
                    sender = MessageRole.USER,
                    content = prompt,
                    timestamp = "00:00"
                )
            )

            var iteration = 0
            var totalExecutedTools = 0
            val executedToolCallNames = mutableListOf<String>()
            var accumulatedUsage: AIUsage? = null

            // Execution stats for limit enforcement (Section 17)
            var executionStats = AgentRunExecutionStats()

            // Step 4: Autonomous Agent Execution Loop
            while (iteration < maxIterations) {
                iteration++
                emit(AgentExecutionEvent.IterationStarted(iteration = iteration, maxIterations = maxIterations))
                emit(AgentExecutionEvent.Thinking("Evaluating operations for ${context.siteName}..."))

                val request = AIRequest(
                    messages = turnMessages,
                    modelId = modelId,
                    systemPrompt = systemPrompt,
                    temperature = 0.4,
                    tools = validToolDefs,
                    siteId = context.siteId,
                    activeSiteContext = context,
                    mode = mode
                )

                val inferenceResult = aiProvider.sendMessage(request)
                if (inferenceResult.isFailure) {
                    val ex = inferenceResult.exceptionOrNull()
                    val aiError = if (ex is AIProviderException) ex.error else AIError.networkError(ex)
                    currentRun = currentRun.copy(
                        status = AgentRunStatus.FAILED,
                        completedAt = System.currentTimeMillis(),
                        error = aiError.userFriendlyMessage,
                        iterations = iteration
                    )
                    agentRunRepository.saveRun(currentRun)
                    emit(AgentExecutionEvent.Error(aiError))
                    return@flow
                }

                val response = inferenceResult.getOrThrow()
                if (response.usage != null) {
                    accumulatedUsage = response.usage
                }

                // Check if model emitted tool calls
                if (response.hasToolCalls) {
                    for (toolCall in response.toolCalls) {
                        executedToolCallNames.add(toolCall.name)

                        val tool = toolRegistry.findTool(context.siteId, toolCall.name)
                        if (tool == null) {
                            emit(AgentExecutionEvent.ToolExecutionRejected(toolCall, "Tool '${toolCall.name}' is not registered for site ${context.siteId}"))
                            val errResult = AIToolResult(
                                toolCallId = toolCall.id,
                                toolName = toolCall.name,
                                content = "Error: Tool '${toolCall.name}' is not registered or discovered for site ${context.siteId}.",
                                isError = true
                            )
                            appendToolCallAndResult(turnMessages, context, toolCall, errResult)
                            continue
                        }

                        emit(AgentExecutionEvent.ToolCallDetected(toolCall, tool))

                        // Step 4a: Strict Tool Isolation (8 rules)
                        val securityCheck = toolSecurityValidator.verifyToolExecution(context, tool.serverId, tool.name)
                        if (securityCheck is ToolSecurityValidator.SecurityCheckResult.Denied) {
                            auditLogger.logEvent(
                                siteId = context.siteId,
                                siteName = context.siteName,
                                userAction = "SECURITY_VIOLATION_RULE_${securityCheck.ruleNumber}",
                                aiAction = "ISOLATION_CHECK",
                                tool = tool.name,
                                parametersSummary = SensitiveDataRedactor.summarizeArguments(toolCall.parsedArguments),
                                resultSummary = "REJECTED: ${securityCheck.technicalDetails}",
                                approvalStatus = "BLOCKED",
                                isSuccess = false
                            )
                            emit(AgentExecutionEvent.ToolExecutionRejected(toolCall, securityCheck.safeAgentErrorMessage))
                            val errResult = AIToolResult(
                                toolCallId = toolCall.id,
                                toolName = tool.name,
                                content = securityCheck.safeAgentErrorMessage,
                                isError = true
                            )
                            appendToolCallAndResult(turnMessages, context, toolCall, errResult)
                            continue
                        }

                        // Step 4b: Argument Validation against Schema
                        val argValidation = ToolCallValidator.validateArguments(toolCall, tool)
                        if (argValidation is ToolCallValidator.ValidationResult.Invalid) {
                            emit(AgentExecutionEvent.ToolExecutionRejected(toolCall, argValidation.structuredErrorMessage))
                            val errResult = AIToolResult(
                                toolCallId = toolCall.id,
                                toolName = tool.name,
                                content = argValidation.structuredErrorMessage,
                                isError = true
                            )
                            appendToolCallAndResult(turnMessages, context, toolCall, errResult)
                            continue
                        }
                        val parsedArguments = (argValidation as ToolCallValidator.ValidationResult.Valid).parsedArguments
                        val validatedToolCall = toolCall.copy(parsedArguments = parsedArguments)

                        // Step 4c & 4d: PermissionEngine Security Gate (Phase 5)
                        val permissionDecision = permissionEngine.evaluateToolExecution(
                            context = context,
                            tool = tool,
                            toolCall = validatedToolCall,
                            mode = mode,
                            runStats = executionStats
                        )

                        when (permissionDecision) {
                            is PermissionDecision.Deny -> {
                                auditLogger.logEvent(
                                    siteId = context.siteId,
                                    siteName = context.siteName,
                                    userAction = permissionDecision.eventType.name,
                                    aiAction = "PERMISSION_CHECK",
                                    tool = tool.name,
                                    parametersSummary = SensitiveDataRedactor.summarizeArguments(parsedArguments),
                                    resultSummary = "DENIED: ${permissionDecision.reason}",
                                    approvalStatus = "DENIED",
                                    isSuccess = false
                                )
                                emit(AgentExecutionEvent.ToolExecutionRejected(validatedToolCall, permissionDecision.reason))
                                val errResult = AIToolResult(
                                    toolCallId = validatedToolCall.id,
                                    toolName = tool.name,
                                    content = "Execution Denied: ${permissionDecision.reason}",
                                    isError = true
                                )
                                appendToolCallAndResult(turnMessages, context, validatedToolCall, errResult)
                                continue
                            }
                            is PermissionDecision.RequireApproval -> {
                                val approvalReq = permissionDecision.request
                                currentRun = currentRun.copy(status = AgentRunStatus.WAITING_APPROVAL)
                                agentRunRepository.saveRun(currentRun)

                                emit(
                                    AgentExecutionEvent.ToolApprovalRequired(
                                        approvalRequest = approvalReq,
                                        toolCall = validatedToolCall,
                                        tool = tool
                                    )
                                )

                                val deferred = CompletableDeferred<Boolean>()
                                pendingApprovals[approvalReq.id] = Pair(approvalReq, deferred)

                                val operatorAuthorized = try {
                                    deferred.await()
                                } catch (e: CancellationException) {
                                    pendingApprovals.remove(approvalReq.id)
                                    currentRun = currentRun.copy(
                                        status = AgentRunStatus.CANCELLED,
                                        completedAt = System.currentTimeMillis()
                                    )
                                    agentRunRepository.saveRun(currentRun)
                                    emit(AgentExecutionEvent.Cancelled)
                                    return@flow
                                } finally {
                                    pendingApprovals.remove(approvalReq.id)
                                }

                                if (!operatorAuthorized) {
                                    emit(AgentExecutionEvent.ToolExecutionRejected(validatedToolCall, "Operator declined authorization for ${tool.name}."))
                                    val rejectionResult = AIToolResult(
                                        toolCallId = validatedToolCall.id,
                                        toolName = tool.name,
                                        content = "Operator Refusal: The human operator reviewed and REJECTED execution of ${tool.name}.",
                                        isError = true
                                    )
                                    appendToolCallAndResult(turnMessages, context, validatedToolCall, rejectionResult)
                                    continue
                                }

                                // Anti-Replay Consumption Check (Section 11 & 12)
                                val consumed = approvalEngine.consumeApprovalForExecution(
                                    approvalId = approvalReq.id,
                                    siteId = context.siteId,
                                    mcpServerId = tool.serverId,
                                    toolName = tool.name,
                                    toolCallId = validatedToolCall.id,
                                    argumentsHash = approvalReq.argumentsHash
                                )
                                if (!consumed) {
                                    val replayErr = "Security Error: Approval token is invalid, expired, or already consumed."
                                    emit(AgentExecutionEvent.ToolExecutionRejected(validatedToolCall, replayErr))
                                    val errResult = AIToolResult(
                                        toolCallId = validatedToolCall.id,
                                        toolName = tool.name,
                                        content = replayErr,
                                        isError = true
                                    )
                                    appendToolCallAndResult(turnMessages, context, validatedToolCall, errResult)
                                    continue
                                }
                            }
                            is PermissionDecision.Allow -> {
                                // Direct execution permitted under policy
                            }
                        }

                        // Step 4e: Safe Execution via MCPManager (never directly via MCPClient)
                        emit(AgentExecutionEvent.ToolExecuting(validatedToolCall, tool))
                        val startTime = System.currentTimeMillis()

                        val execRequest = ToolExecutionRequest(
                            siteId = context.siteId,
                            mcpServerId = tool.serverId,
                            toolName = tool.name,
                            arguments = parsedArguments,
                            conversationId = context.activeConversationId,
                            operatorAuthorized = true
                        )

                        val executionResult = mcpManager.executeTool(execRequest)
                        val durationMs = System.currentTimeMillis() - startTime
                        totalExecutedTools++

                        // Update execution stats for limits enforcement
                        val toolRisk = permissionEngine.classifyToolRisk(context.siteId, tool.serverId, tool)
                        executionStats = executionStats.copy(
                            totalToolCalls = executionStats.totalToolCalls + 1,
                            writeOperationsCount = executionStats.writeOperationsCount + if (toolRisk != ToolRiskLevel.READ) 1 else 0,
                            destructiveOperationsCount = executionStats.destructiveOperationsCount + if (toolRisk == ToolRiskLevel.DESTRUCTIVE) 1 else 0
                        )

                        // Step 4f: Sanitize and Truncate result (wrapped in untrusted data delimiters)
                        val rawText = if (executionResult.isSuccess) {
                            executionResult.getOrThrow().toDisplayText()
                        } else {
                            "Error: ${executionResult.exceptionOrNull()?.message ?: "Execution failed"}"
                        }

                        val aiToolResult = ToolResultSanitizer.sanitizeAndTruncate(
                            rawContent = rawText,
                            toolCallId = validatedToolCall.id,
                            toolName = tool.name,
                            isError = executionResult.isFailure || (executionResult.getOrNull()?.isError == true),
                            durationMs = durationMs
                        )

                        auditLogger.logEvent(
                            siteId = context.siteId,
                            siteName = context.siteName,
                            userAction = "TOOL_EXECUTED",
                            aiAction = "MCP_EXECUTION_FINISH",
                            tool = tool.name,
                            parametersSummary = SensitiveDataRedactor.summarizeArguments(parsedArguments),
                            resultSummary = SensitiveDataRedactor.redact(aiToolResult.content.take(100)),
                            approvalStatus = "AUTHORIZED",
                            isSuccess = !aiToolResult.isError
                        )

                        emit(AgentExecutionEvent.ToolExecutionFinished(validatedToolCall, tool, aiToolResult))
                        appendToolCallAndResult(turnMessages, context, validatedToolCall, aiToolResult)
                    }
                } else {
                    // Step 5: Final Response Reached
                    val finalContent = response.content ?: "Operation completed."
                    currentRun = currentRun.copy(
                        status = AgentRunStatus.COMPLETED,
                        completedAt = System.currentTimeMillis(),
                        iterations = iteration,
                        toolCalls = executedToolCallNames,
                        usage = accumulatedUsage
                    )
                    agentRunRepository.saveRun(currentRun)

                    auditLogger.logEvent(
                        siteId = context.siteId,
                        siteName = context.siteName,
                        userAction = "AGENT_RUN_COMPLETED",
                        aiAction = "FINAL_RESPONSE",
                        tool = "AgentEngine",
                        parametersSummary = "totalIterations=$iteration; executedTools=$totalExecutedTools",
                        resultSummary = SensitiveDataRedactor.redact(finalContent.take(100)),
                        approvalStatus = "NONE",
                        isSuccess = true
                    )

                    emit(
                        AgentExecutionEvent.TurnCompleted(
                            finalResponse = finalContent,
                            totalIterations = iteration,
                            usage = accumulatedUsage,
                            executedToolsCount = totalExecutedTools
                        )
                    )
                    return@flow
                }
            }

            // Step 6: Maximum Iterations Reached
            currentRun = currentRun.copy(
                status = AgentRunStatus.MAX_ITERATIONS,
                completedAt = System.currentTimeMillis(),
                iterations = maxIterations,
                toolCalls = executedToolCallNames,
                usage = accumulatedUsage
            )
            agentRunRepository.saveRun(currentRun)

            emit(AgentExecutionEvent.MaxIterationsReached(iterationsRun = maxIterations))
            emit(
                AgentExecutionEvent.TurnCompleted(
                    finalResponse = "Imperial AI stopped because the maximum agent iterations were reached ($maxIterations iterations). Maximum iteration safety limit enforced.",
                    totalIterations = maxIterations,
                    usage = accumulatedUsage,
                    executedToolsCount = totalExecutedTools
                )
            )
        } finally {
            // Release context lock
            lockedSiteContext = null
        }
    }.flowOn(Dispatchers.IO)

    private fun appendToolCallAndResult(
        messages: MutableList<ChatMessage>,
        context: ActiveSiteContext,
        toolCall: AIToolCall,
        toolResult: AIToolResult
    ) {
        messages.add(
            ChatMessage(
                id = "msg_call_${UUID.randomUUID()}",
                conversationId = context.activeConversationId ?: "conv_${context.siteId}",
                siteId = context.siteId,
                sender = MessageRole.ASSISTANT,
                content = "Calling tool: ${toolCall.name}",
                timestamp = "00:00",
                toolCall = ToolCallData(
                    toolName = toolCall.name,
                    callId = toolCall.id,
                    argumentsSummary = SensitiveDataRedactor.redact(toolCall.argumentsJson),
                    status = if (toolResult.isError) ToolCallStatus.FAILED else ToolCallStatus.SUCCESS
                )
            )
        )

        messages.add(
            ChatMessage(
                id = "msg_res_${UUID.randomUUID()}",
                conversationId = context.activeConversationId ?: "conv_${context.siteId}",
                siteId = context.siteId,
                sender = MessageRole.TOOL,
                content = toolResult.formatSafeModelPayload(),
                timestamp = "00:00",
                toolResult = ToolResultData(
                    toolName = toolCall.name,
                    callId = toolCall.id,
                    outputSummary = SensitiveDataRedactor.redact(toolResult.content.take(120)),
                    executionDurationMs = toolResult.durationMs,
                    isError = toolResult.isError
                )
            )
        )
    }

    override suspend fun resolveApproval(
        approvalId: String,
        approved: Boolean,
        operatorNotes: String,
        suppliedArgumentsHash: String?
    ): Boolean {
        // Resolve in ApprovalEngine (validates hash, context, expiration)
        val resolved = approvalEngine.resolveApproval(
            approvalId = approvalId,
            approved = approved,
            operatorNotes = operatorNotes,
            suppliedArgumentsHash = suppliedArgumentsHash,
            targetContext = lockedSiteContext
        )

        val pair = pendingApprovals[approvalId]
        if (pair != null) {
            pair.second.complete(approved && resolved)
            return resolved
        }
        return resolved
    }

    override fun cancel() {
        currentExecutionJob?.cancel()
        aiProvider.cancelGeneration()
        approvalEngine.cancelAllPending(lockedSiteContext?.siteId)
        pendingApprovals.values.forEach { it.second.cancel() }
        pendingApprovals.clear()
        lockedSiteContext = null
    }
}
