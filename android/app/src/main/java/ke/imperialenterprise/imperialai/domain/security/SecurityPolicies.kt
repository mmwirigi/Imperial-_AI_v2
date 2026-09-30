package ke.imperialenterprise.imperialai.domain.security

import ke.imperialenterprise.imperialai.domain.model.AgentMode
import ke.imperialenterprise.imperialai.domain.model.ToolRiskLevel

/**
 * Tool-level permission policy (Section 7).
 * Scoped to specific site and MCP server.
 */
data class ToolPermissionPolicy(
    val toolId: String,
    val siteId: String,
    val mcpServerId: String,
    val riskLevel: ToolRiskLevel = ToolRiskLevel.HIGH_RISK_WRITE,
    val enabled: Boolean = true,
    val requiresApproval: Boolean = true,
    val allowedModes: Set<AgentMode> = setOf(AgentMode.EXECUTE),
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)

/**
 * Site-level permission policy (Section 8).
 * New sites start conservatively:
 * - Reads: allowed
 * - Writes: blocked/approval required
 * - Destructive: blocked until explicitly configured
 */
data class SitePermissionPolicy(
    val siteId: String,
    val defaultMode: AgentMode = AgentMode.READ,
    val allowReads: Boolean = true,
    val allowWrites: Boolean = false,
    val allowDestructive: Boolean = false,
    val requireApprovalForWrites: Boolean = true,
    val requireApprovalForPublishing: Boolean = true,
    val requireApprovalForBulkActions: Boolean = true,
    val allowedTools: Set<String> = emptySet(), // Optional allowlist; if non-empty, only these may execute
    val blockedTools: Set<String> = emptySet(), // Site-specific blocklist
    val maxToolCallsPerRun: Int = 20,
    val maxAgentIterations: Int = 10
)

/**
 * Non-overridable Global Security Policy (Section 9).
 * Site policies must NEVER override global safety rules.
 */
data class GlobalPermissionPolicy(
    val clientIsolationEnforced: Boolean = true,
    val credentialIsolationEnforced: Boolean = true,
    val destructiveApprovalEnforced: Boolean = true,
    val auditLoggingEnforced: Boolean = true,
    val credentialRedactionEnforced: Boolean = true,
    val noExecutionWithoutActiveSite: Boolean = true,
    val maxToolCallsPerRunLimit: Int = 20,
    val maxWriteOperationsPerRunLimit: Int = 10,
    val maxDestructiveOperationsPerRunLimit: Int = 0, // 0 without explicit approval
    val maxAffectedObjectsLimit: Int = 100,
    val globallyBlockedTools: Set<String> = setOf(
        "wp_drop_database",
        "wp_eval_php",
        "wp_exec_shell",
        "wp_delete_admin_user",
        "wp_reset_site",
        "wp_modify_wp_config",
        "system_exec",
        "bash_exec"
    )
)

/**
 * Tracks execution metrics during an active AgentRun to enforce execution limits (Section 17).
 */
data class AgentRunExecutionStats(
    val totalToolCalls: Int = 0,
    val writeOperationsCount: Int = 0,
    val destructiveOperationsCount: Int = 0,
    val estimatedAffectedObjectsCount: Int = 1
)
