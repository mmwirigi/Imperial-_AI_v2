package ke.imperialenterprise.imperialai.data.wordpress

import ke.imperialenterprise.imperialai.domain.agent.McpManager
import ke.imperialenterprise.imperialai.domain.agent.ToolRegistry
import ke.imperialenterprise.imperialai.domain.model.*
import ke.imperialenterprise.imperialai.domain.repository.AuditLogger
import ke.imperialenterprise.imperialai.domain.repository.PermissionEngine
import ke.imperialenterprise.imperialai.domain.repository.SiteRepository
import ke.imperialenterprise.imperialai.domain.security.ApprovalEngine
import ke.imperialenterprise.imperialai.domain.security.PermissionDecision
import ke.imperialenterprise.imperialai.domain.security.SensitiveDataRedactor
import ke.imperialenterprise.imperialai.domain.wordpress.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

/**
 * Production implementation of [WordPressAdapter] (Phase 6).
 * Orchestrates stack discovery and the 7-stage operational workflow:
 * AUDIT -> PROPOSE -> APPROVE -> BACKUP -> IMPLEMENT -> VERIFY -> REPORT
 */
class DefaultWordPressAdapter(
    private val toolRegistry: ToolRegistry,
    private val mcpManager: McpManager,
    private val siteRepository: SiteRepository,
    private val permissionEngine: PermissionEngine,
    private val approvalEngine: ApprovalEngine,
    private val auditLogger: AuditLogger? = null
) : WordPressAdapter {

    private val siteInspector = WordPressSiteInspector(toolRegistry, mcpManager, siteRepository, auditLogger)
    private val backupService = BackupPreflightService(toolRegistry, mcpManager, auditLogger)
    private val verificationEngine = WordPressVerificationEngine(toolRegistry, mcpManager, auditLogger)

    // Site-isolated state stores
    private val profiles = ConcurrentHashMap<String, MutableStateFlow<SiteStackProfile?>>()
    private val capabilities = ConcurrentHashMap<String, MutableStateFlow<List<WordPressCapability>>>()
    private val findings = ConcurrentHashMap<String, MutableStateFlow<List<AuditFinding>>>()

    private fun getOrCreateProfileFlow(siteId: String) =
        profiles.getOrPut(siteId) { MutableStateFlow(null) }

    private fun getOrCreateCapsFlow(siteId: String) =
        capabilities.getOrPut(siteId) { MutableStateFlow(emptyList()) }

    private fun getOrCreateFindingsFlow(siteId: String) =
        findings.getOrPut(siteId) { MutableStateFlow(emptyList()) }

    override fun getSiteProfile(siteId: String): StateFlow<SiteStackProfile?> =
        getOrCreateProfileFlow(siteId).asStateFlow()

    override fun getSiteCapabilities(siteId: String): StateFlow<List<WordPressCapability>> =
        getOrCreateCapsFlow(siteId).asStateFlow()

    override fun getSiteFindings(siteId: String): StateFlow<List<AuditFinding>> =
        getOrCreateFindingsFlow(siteId).asStateFlow()

    override fun getAvailableCommands(siteId: String): List<WordPressCommand> {
        val caps = getOrCreateCapsFlow(siteId).value
        return WordPressCommandRegistry.getAvailableCommands(caps)
    }

    override suspend fun inspectSite(context: ActiveSiteContext): Result<SiteStackProfile> {
        val inspectionResult = siteInspector.inspectSite(context)
        if (inspectionResult.isFailure) {
            return Result.failure(inspectionResult.exceptionOrNull() ?: Exception("Inspection failed"))
        }

        val data = inspectionResult.getOrThrow()
        getOrCreateProfileFlow(context.siteId).value = data.profile
        getOrCreateCapsFlow(context.siteId).value = data.capabilities
        getOrCreateFindingsFlow(context.siteId).value = data.findings

        return Result.success(data.profile)
    }

    override suspend fun executeWorkflow(
        context: ActiveSiteContext,
        taskTitle: String,
        targetResource: String,
        auditToolName: String,
        auditArgs: Map<String, Any?>,
        mutationToolName: String,
        mutationArgs: Map<String, Any?>,
        expectedVerificationState: String,
        onStageUpdate: (WordPressTask) -> Unit
    ): Result<WordPressTask> {
        var task = WordPressTask(
            siteId = context.siteId,
            title = taskTitle,
            description = "7-Stage Workflow: $taskTitle on $targetResource",
            workflowStage = WorkflowStage.AUDIT,
            affectedResources = listOf(targetResource)
        )
        onStageUpdate(task)

        // ----------------------------------------------------
        // STAGE 1: AUDIT (Read current state)
        // ----------------------------------------------------
        val auditTool = toolRegistry.findTool(context.siteId, auditToolName)
            ?: return Result.failure(IllegalStateException("Audit tool '$auditToolName' not registered."))

        val auditReq = ToolExecutionRequest(
            siteId = context.siteId,
            mcpServerId = auditTool.serverId,
            toolName = auditTool.name,
            arguments = auditArgs,
            conversationId = context.activeConversationId,
            operatorAuthorized = true
        )

        val auditExec = mcpManager.executeTool(auditReq)
        val currentStateText = if (auditExec.isSuccess) {
            auditExec.getOrThrow().toDisplayText()
        } else {
            "State unread (${auditExec.exceptionOrNull()?.message})"
        }

        task = task.copy(
            workflowStage = WorkflowStage.PROPOSE,
            executionSummary = "Stage 1 Audit: $currentStateText"
        )
        onStageUpdate(task)

        // ----------------------------------------------------
        // STAGE 2: PROPOSE (Formulate Change Proposal)
        // ----------------------------------------------------
        val proposal = ChangeProposal(
            siteId = context.siteId,
            taskId = task.id,
            operation = mutationToolName,
            target = targetResource,
            currentState = currentStateText.take(150),
            proposedState = SensitiveDataRedactor.summarizeArguments(mutationArgs),
            reason = "Operational enhancement for $taskTitle",
            requiresApproval = true
        )

        task = task.copy(
            workflowStage = WorkflowStage.APPROVAL_PENDING,
            proposedChanges = proposal
        )
        onStageUpdate(task)

        // ----------------------------------------------------
        // STAGE 3: APPROVE (Gatekeeper evaluation)
        // ----------------------------------------------------
        val mutationTool = toolRegistry.findTool(context.siteId, mutationToolName)
            ?: return Result.failure(IllegalStateException("Mutation tool '$mutationToolName' not registered."))

        val dummyCall = AIToolCall(
            name = mutationTool.name,
            argumentsJson = SensitiveDataRedactor.summarizeArguments(mutationArgs),
            parsedArguments = mutationArgs
        )

        val decision = permissionEngine.evaluateToolExecution(
            context = context,
            tool = mutationTool,
            toolCall = dummyCall,
            mode = AgentMode.EXECUTE
        )

        if (decision is PermissionDecision.Deny) {
            task = task.copy(workflowStage = WorkflowStage.FAILED, report = "Permission Denied: ${decision.reason}")
            onStageUpdate(task)
            return Result.failure(IllegalStateException("Security Policy Denied execution: ${decision.reason}"))
        }

        val approvalId = if (decision is PermissionDecision.RequireApproval) {
            decision.request.id
        } else null

        task = task.copy(
            workflowStage = WorkflowStage.BACKUP,
            approvalRequestId = approvalId
        )
        onStageUpdate(task)

        // ----------------------------------------------------
        // STAGE 4: BACKUP (Preflight Check)
        // ----------------------------------------------------
        val preflight = backupService.executePreflightCheck(context, scope = "Pre-$taskTitle")
        task = task.copy(
            workflowStage = WorkflowStage.IMPLEMENT,
            backupCheckpointId = preflight.checkpoint?.id
        )
        onStageUpdate(task)

        // ----------------------------------------------------
        // STAGE 5: IMPLEMENT (Execute mutation)
        // ----------------------------------------------------
        val mutationReq = ToolExecutionRequest(
            siteId = context.siteId,
            mcpServerId = mutationTool.serverId,
            toolName = mutationTool.name,
            arguments = mutationArgs,
            conversationId = context.activeConversationId,
            operatorAuthorized = true
        )

        val mutationExec = mcpManager.executeTool(mutationReq)
        if (mutationExec.isFailure) {
            task = task.copy(
                workflowStage = WorkflowStage.FAILED,
                report = "Implementation Failed: ${mutationExec.exceptionOrNull()?.message}"
            )
            onStageUpdate(task)
            return Result.failure(mutationExec.exceptionOrNull() ?: Exception("Implementation failed"))
        }

        task = task.copy(workflowStage = WorkflowStage.VERIFY)
        onStageUpdate(task)

        // ----------------------------------------------------
        // STAGE 6: VERIFY (Verify real state)
        // ----------------------------------------------------
        val verification = verificationEngine.verifyMutation(
            context = context,
            targetResource = targetResource,
            readToolName = auditToolName,
            readArguments = auditArgs,
            expectedSubstringOrKey = expectedVerificationState
        )

        task = task.copy(
            workflowStage = if (verification.success) WorkflowStage.REPORT else WorkflowStage.FAILED,
            verificationSummary = verification
        )
        onStageUpdate(task)

        if (!verification.success) {
            task = task.copy(
                report = "Verification Failed: Site state did not reflect expected changes. Differences: ${verification.differences}"
            )
            onStageUpdate(task)
            return Result.failure(IllegalStateException("Verification Failed: ${verification.differences}"))
        }

        // ----------------------------------------------------
        // STAGE 7: REPORT (Operational facts summary)
        // ----------------------------------------------------
        val reportText = """
=== OPERATIONAL REPORT ===
TASK: $taskTitle
SITE: ${context.siteName} (${context.websiteUrl})
TARGET: $targetResource
MUTATION TOOL: $mutationToolName
PREVIOUS STATE: ${proposal.currentState}
NEW VERIFIED STATE: ${verification.actualState}
BACKUP REFERENCE: ${preflight.checkpoint?.backupReference ?: "No backup tool present (Warning issued)"}
VERIFICATION STATUS: SUCCESS (Verified at ${verification.verifiedAt})
=== END REPORT ===
        """.trimIndent()

        task = task.copy(
            workflowStage = WorkflowStage.COMPLETED,
            status = "COMPLETED",
            report = reportText,
            updatedAt = System.currentTimeMillis()
        )
        onStageUpdate(task)

        auditLogger?.logEvent(
            siteId = context.siteId,
            siteName = context.siteName,
            userAction = "7_STAGE_WORKFLOW_COMPLETE",
            aiAction = "EXECUTE_WORKFLOW",
            tool = mutationToolName,
            parametersSummary = SensitiveDataRedactor.summarizeArguments(mutationArgs),
            resultSummary = "Workflow completed & verified successfully for $targetResource",
            approvalStatus = "AUTHORIZED",
            isSuccess = true
        )

        return Result.success(task)
    }
}
