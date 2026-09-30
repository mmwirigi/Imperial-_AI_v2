package ke.imperialenterprise.imperialai.domain.repository

import ke.imperialenterprise.imperialai.domain.model.*
import ke.imperialenterprise.imperialai.domain.security.*

/**
 * Gatekeeper engine verifying whether a requested operation may execute,
 * requires explicit human approval, or violates security policies (Phase 5).
 * 
 * Target Precedence (Section 10):
 * GLOBAL POLICY -> SITE POLICY -> TOOL POLICY -> AGENT MODE -> APPROVAL -> EXECUTION.
 */
interface PermissionEngine {

    /**
     * Evaluates a requested tool execution against the policy hierarchy.
     */
    fun evaluateToolExecution(
        context: ActiveSiteContext,
        tool: McpTool,
        toolCall: AIToolCall,
        mode: AgentMode,
        runStats: AgentRunExecutionStats = AgentRunExecutionStats()
    ): PermissionDecision

    /**
     * Determines the risk level of an MCP tool using annotations, metadata, and policies.
     */
    fun classifyToolRisk(
        siteId: String,
        mcpServerId: String,
        tool: McpTool
    ): ToolRiskLevel

    /**
     * Retrieves the active SitePermissionPolicy for a client site.
     */
    fun getSitePolicy(siteId: String): SitePermissionPolicy

    /**
     * Updates the SitePermissionPolicy for a client site.
     */
    fun updateSitePolicy(policy: SitePermissionPolicy)

    /**
     * Retrieves the tool-specific policy, if configured.
     */
    fun getToolPolicy(siteId: String, mcpServerId: String, toolName: String): ToolPermissionPolicy?

    /**
     * Configures a tool-specific policy.
     */
    fun updateToolPolicy(policy: ToolPermissionPolicy)

    /**
     * Returns the non-overridable GlobalPermissionPolicy.
     */
    fun getGlobalPolicy(): GlobalPermissionPolicy

    /**
     * Legacy evaluation for backwards compatibility with Phase 1-3 tasks.
     */
    suspend fun evaluateAction(
        siteId: String,
        actionType: DangerousActionType,
        policy: PermissionPolicy
    ): PermissionEvaluationResult

    suspend fun recordOperatorApproval(
        approvalId: String,
        siteId: String,
        approved: Boolean,
        operatorNotes: String
    )
}

data class PermissionEvaluationResult(
    val requiresExplicitApproval: Boolean,
    val riskLevel: RiskLevel,
    val warningMessage: String,
    val isAllowedUnderPolicy: Boolean
)
