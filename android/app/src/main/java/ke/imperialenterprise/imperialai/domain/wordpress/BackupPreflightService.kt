package ke.imperialenterprise.imperialai.domain.wordpress

import ke.imperialenterprise.imperialai.domain.agent.McpManager
import ke.imperialenterprise.imperialai.domain.agent.ToolRegistry
import ke.imperialenterprise.imperialai.domain.model.ActiveSiteContext
import ke.imperialenterprise.imperialai.domain.model.ToolExecutionRequest
import ke.imperialenterprise.imperialai.domain.repository.AuditLogger
import java.util.UUID

/**
 * Preflight backup service validating backup capabilities before risky operations (Section 19).
 * 
 * Safety Rule:
 * Never pretend a backup was created if no backup tool exists.
 * Provide honest warnings when backup mechanisms are absent.
 */
class BackupPreflightService(
    private val toolRegistry: ToolRegistry,
    private val mcpManager: McpManager,
    private val auditLogger: AuditLogger? = null
) {

    data class PreflightResult(
        val hasBackupTool: Boolean,
        val checkpoint: BackupCheckpoint?,
        val warningMessage: String? = null,
        val requiresExplicitConfirmation: Boolean = false
    )

    /**
     * Checks for backup capabilities and creates a checkpoint if supported.
     */
    suspend fun executePreflightCheck(context: ActiveSiteContext, scope: String = "Pre-mutation Snapshot"): PreflightResult {
        val tools = toolRegistry.getToolsForSite(context.siteId)
        val backupTool = tools.find { tool ->
            val name = tool.name.lowercase()
            name.contains("backup") || name.contains("snapshot") || tool.description.lowercase().contains("backup")
        }

        if (backupTool == null) {
            val warning = "Caution: No backup capability detected on ${context.siteName}. Ensure external snapshots exist before mutating."
            auditLogger?.logEvent(
                siteId = context.siteId,
                siteName = context.siteName,
                userAction = "BACKUP_PREFLIGHT_WARNING",
                aiAction = "PREFLIGHT_CHECK",
                tool = "BackupPreflightService",
                parametersSummary = "scope=$scope",
                resultSummary = "No backup tool discovered. Operator warned.",
                approvalStatus = "WARNED",
                isSuccess = true
            )
            return PreflightResult(
                hasBackupTool = false,
                checkpoint = null,
                warningMessage = warning,
                requiresExplicitConfirmation = true
            )
        }

        // Execute discovered backup creation tool
        val backupRef = "snap_${context.siteId}_${System.currentTimeMillis()}"
        val req = ToolExecutionRequest(
            siteId = context.siteId,
            mcpServerId = backupTool.serverId,
            toolName = backupTool.name,
            arguments = mapOf("reference" to backupRef, "scope" to scope),
            conversationId = context.activeConversationId,
            operatorAuthorized = true
        )

        val execResult = mcpManager.executeTool(req)
        val checkpoint = if (execResult.isSuccess) {
            BackupCheckpoint(
                id = UUID.randomUUID().toString(),
                siteId = context.siteId,
                backupTool = backupTool.name,
                backupReference = backupRef,
                createdAt = System.currentTimeMillis(),
                status = BackupStatus.CREATED,
                scope = scope
            )
        } else {
            BackupCheckpoint(
                id = UUID.randomUUID().toString(),
                siteId = context.siteId,
                backupTool = backupTool.name,
                backupReference = null,
                createdAt = System.currentTimeMillis(),
                status = BackupStatus.FAILED,
                scope = scope
            )
        }

        auditLogger?.logEvent(
            siteId = context.siteId,
            siteName = context.siteName,
            userAction = "BACKUP_CHECKPOINT_CREATED",
            aiAction = "EXECUTE_BACKUP",
            tool = backupTool.name,
            parametersSummary = "ref=$backupRef; scope=$scope",
            resultSummary = "Checkpoint status: ${checkpoint.status}",
            approvalStatus = "AUTHORIZED",
            isSuccess = checkpoint.status == BackupStatus.CREATED
        )

        return PreflightResult(
            hasBackupTool = true,
            checkpoint = checkpoint,
            warningMessage = if (checkpoint.status == BackupStatus.FAILED) "Backup creation failed. Proceed with caution." else null,
            requiresExplicitConfirmation = (checkpoint.status == BackupStatus.FAILED)
        )
    }
}
