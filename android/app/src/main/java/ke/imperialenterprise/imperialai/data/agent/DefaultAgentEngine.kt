package ke.imperialenterprise.imperialai.data.agent

import ke.imperialenterprise.imperialai.domain.agent.*
import ke.imperialenterprise.imperialai.domain.model.*
import ke.imperialenterprise.imperialai.domain.repository.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

/**
 * Production implementation of [AgentEngine].
 * 
 * Orchestrates the closed-loop agent cycle:
 * User Request -> Tool Catalog (filtered to ActiveSiteContext) -> OpenRouter ->
 * Tool Call Parsing -> Strict Security Validation (8 rules) -> Permission/Approval ->
 * Tool Execution via MCPManager -> Untrusted Data Delimiting -> Model Feedback -> Final Answer.
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
    private val auditLogger: AuditLogger
) : AgentEngine {

    private val toolSecurityValidator = ToolSecurityValidator(
        siteRepository = siteRepository,
        conversationRepository = conversationRepository,
        mcpServerRepository = mcpServerRepository,
        toolRegistry = toolRegistry,
        credentialStore = credentialStore
    )

    private val pendingApprovals = ConcurrentHashMap<String, CompletableDeferred<Boolean>>()
    private var currentExecutionJob: Job? = null

    override fun runTurn(
        context: ActiveSiteContext,
        prompt: String,
        history: List<ChatMessage>,
        modelId: String,
        maxIterations: Int
    ): Flow<AgentExecutionEvent> = flow {
        emit(
            AgentExecutionEvent.Started(
                siteId = context.siteId,
                siteName = context.siteName,
                conversationId = context.activeConversationId ?: "conv_${context.siteId}",
                userPrompt = prompt
            )
        )

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
                parametersSummary = diag.take(80),
                resultSummary = "Tool skipped due to schema normalization issue",
                approvalStatus = "NONE",
                isSuccess = false
            )
        }

        // Step 2: Assemble System Prompt with explicit site isolation instructions
        val toolsListing = if (validToolDefs.isNotEmpty()) {
            siteTools.joinToString("\n") { "- ${it.name} (${it.riskLevel.displayName}): ${it.description}" }
        } else {
            "No remote MCP tools currently available for this client site."
        }

        val systemPrompt = """
            You are Imperial AI, an elite autonomous executive WordPress operations agent for ${context.siteName} (${context.websiteUrl}).
            Strict Site Isolation: You are strictly operating on site ID '${context.siteId}'. Never attempt to interact with or reference other client properties.
            
            Available Remote MCP Tools:
            $toolsListing
            
            Operating Rules:
            1. Use the provided tools to inspect, query, and perform operations on ${context.siteName}.
            2. Destructive operations (deleting posts, updating options, etc.) require explicit human authorization before execution.
            3. Always verify and explain your actions clearly and concisely.
        """.trimIndent()

        // Step 3: Seed conversation context
        val turnMessages = mutableListOf<ChatMessage>()
        turnMessages.addAll(history.takeLast(12)) // Include recent conversational turns
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
        var accumulatedUsage: AIUsage? = null

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
                activeSiteContext = context
            )

            val inferenceResult = aiProvider.sendMessage(request)
            if (inferenceResult.isFailure) {
                val ex = inferenceResult.exceptionOrNull()
                val aiError = if (ex is AIProviderException) ex.error else AIError.networkError(ex)
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
                            parametersSummary = toolCall.argumentsJson.take(80),
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

                    // Step 4c: Prepare ToolExecutionRequest
                    val execRequest = ToolExecutionRequest(
                        siteId = context.siteId,
                        mcpServerId = tool.serverId,
                        toolName = tool.name,
                        arguments = parsedArguments,
                        conversationId = context.activeConversationId,
                        operatorAuthorized = false
                    )

                    // Step 4d: Safe Approval Policy Check
                    // READ tools execute automatically; WRITE / DESTRUCTIVE require explicit operator confirmation
                    val isAutoApproved = tool.riskLevel == ToolRiskLevel.READ && !tool.requiresApproval
                    var operatorAuthorized = isAutoApproved

                    if (!isAutoApproved) {
                        val approvalId = "approval_${UUID.randomUUID()}"
                        val dangerousAction = toolRegistry.mapToolToDangerousAction(tool.name)
                        val promptData = ApprovalPromptData(
                            actionType = dangerousAction,
                            description = "Execute remote MCP tool: ${tool.name} on ${context.siteName}\nParameters: ${execRequest.sanitizedArgumentsSummary()}",
                            targetResource = context.websiteUrl,
                            status = ApprovalStatus.PENDING
                        )

                        emit(
                            AgentExecutionEvent.ToolApprovalRequired(
                                approvalId = approvalId,
                                toolCall = toolCall,
                                tool = tool,
                                request = execRequest,
                                promptData = promptData
                            )
                        )

                        val deferred = CompletableDeferred<Boolean>()
                        pendingApprovals[approvalId] = deferred
                        try {
                            operatorAuthorized = deferred.await()
                        } catch (e: CancellationException) {
                            pendingApprovals.remove(approvalId)
                            emit(AgentExecutionEvent.Cancelled)
                            return@flow
                        } finally {
                            pendingApprovals.remove(approvalId)
                        }

                        if (!operatorAuthorized) {
                            emit(AgentExecutionEvent.ToolExecutionRejected(toolCall, "Operator declined authorization."))
                            val rejectionResult = AIToolResult(
                                toolCallId = toolCall.id,
                                toolName = tool.name,
                                content = "Operator Refusal: The human operator reviewed and REJECTED execution of ${tool.name}.",
                                isError = true
                            )
                            appendToolCallAndResult(turnMessages, context, toolCall, rejectionResult)
                            continue
                        }
                    }

                    // Step 4e: Safe Execution via MCPManager (never directly via MCPClient)
                    emit(AgentExecutionEvent.ToolExecuting(toolCall, tool))
                    val startTime = System.currentTimeMillis()
                    val executionResult = mcpManager.executeTool(execRequest.copy(operatorAuthorized = true))
                    val durationMs = System.currentTimeMillis() - startTime
                    totalExecutedTools++

                    val aiToolResult: AIToolResult = if (executionResult.isSuccess) {
                        val mcpResult = executionResult.getOrThrow()
                        AIToolResult(
                            toolCallId = toolCall.id,
                            toolName = tool.name,
                            content = mcpResult.toDisplayText(),
                            isError = mcpResult.isError,
                            rawStructuredData = mcpResult.rawStructuredData,
                            durationMs = durationMs
                        )
                    } else {
                        val ex = executionResult.exceptionOrNull()
                        AIToolResult(
                            toolCallId = toolCall.id,
                            toolName = tool.name,
                            content = "Execution error: ${ex?.message ?: "Unknown error"}",
                            isError = true,
                            durationMs = durationMs
                        )
                    }

                    emit(AgentExecutionEvent.ToolExecutionFinished(toolCall, tool, aiToolResult))
                    appendToolCallAndResult(turnMessages, context, toolCall, aiToolResult)
                }

                // Continue loop with tool results attached to turnMessages
            } else {
                // Step 5: Model produced final response (no further tool calls needed)
                val finalContent = response.content ?: "Operation completed."
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

        // Loop terminated due to iteration limit safeguard
        emit(AgentExecutionEvent.MaxIterationsReached(iterationsRun = maxIterations))
        emit(
            AgentExecutionEvent.TurnCompleted(
                finalResponse = "Agent paused: reached maximum iteration safety limit ($maxIterations iterations).",
                totalIterations = maxIterations,
                usage = accumulatedUsage,
                executedToolsCount = totalExecutedTools
            )
        )
    }.flowOn(Dispatchers.IO)

    private fun appendToolCallAndResult(
        messages: MutableList<ChatMessage>,
        context: ActiveSiteContext,
        toolCall: AIToolCall,
        toolResult: AIToolResult
    ) {
        // Assistant Message with ToolCall
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
                    argumentsSummary = toolCall.argumentsJson,
                    status = if (toolResult.isError) ToolCallStatus.FAILED else ToolCallStatus.SUCCESS
                )
            )
        )

        // Tool Message with Delimited Data Output (Prompt-injection defense)
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
                    outputSummary = toolResult.content.take(120),
                    executionDurationMs = toolResult.durationMs,
                    isError = toolResult.isError
                )
            )
        )
    }

    override suspend fun resolveApproval(
        approvalId: String,
        approved: Boolean,
        operatorNotes: String
    ): Boolean {
        val deferred = pendingApprovals[approvalId] ?: return false
        deferred.complete(approved)
        return true
    }

    override fun cancel() {
        currentExecutionJob?.cancel()
        aiProvider.cancelGeneration()
        pendingApprovals.values.forEach { it.cancel() }
        pendingApprovals.clear()
    }
}
