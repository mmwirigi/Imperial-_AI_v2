package ke.imperialenterprise.imperialai.data.repository

import ke.imperialenterprise.imperialai.domain.model.*
import ke.imperialenterprise.imperialai.domain.repository.AuditLogger
import ke.imperialenterprise.imperialai.domain.repository.PermissionEngine
import ke.imperialenterprise.imperialai.domain.repository.PermissionEvaluationResult
import ke.imperialenterprise.imperialai.domain.security.*
import java.util.concurrent.ConcurrentHashMap

/**
 * Production implementation of [PermissionEngine] (Phase 5).
 * 
 * Enforces strict policy precedence:
 * GLOBAL POLICY -> SITE POLICY -> TOOL POLICY -> AGENT MODE -> APPROVAL -> EXECUTION.
 * 
 * Default-Deny:
 * UNKNOWN = DENY or REQUIRE_APPROVAL. Never UNKNOWN = ALLOW.
 */
class DefaultPermissionEngine(
    private val approvalEngine: ApprovalEngine = DefaultApprovalEngine(auditLogger),
    private val auditLogger: AuditLogger? = null,
    private val globalPolicy: GlobalPermissionPolicy = GlobalPermissionPolicy()
) : PermissionEngine {

    // Site Policies: siteId -> SitePermissionPolicy
    private val sitePolicies = ConcurrentHashMap<String, SitePermissionPolicy>()

    // Tool Policies: "${siteId}:${mcpServerId}:${toolName}" -> ToolPermissionPolicy
    private val toolPolicies = ConcurrentHashMap<String, ToolPermissionPolicy>()

    private fun toolPolicyKey(siteId: String, mcpServerId: String, toolName: String) =
        "$siteId:$mcpServerId:$toolName"

    override fun getGlobalPolicy(): GlobalPermissionPolicy = globalPolicy

    override fun getSitePolicy(siteId: String): SitePermissionPolicy {
        return sitePolicies.getOrPut(siteId) {
            SitePermissionPolicy(siteId = siteId)
        }
    }

    override fun updateSitePolicy(policy: SitePermissionPolicy) {
        sitePolicies[policy.siteId] = policy
    }

    override fun getToolPolicy(siteId: String, mcpServerId: String, toolName: String): ToolPermissionPolicy? {
        return toolPolicies[toolPolicyKey(siteId, mcpServerId, toolName)]
    }

    override fun updateToolPolicy(policy: ToolPermissionPolicy) {
        toolPolicies[toolPolicyKey(policy.siteId, policy.mcpServerId, policy.toolId)] = policy
    }

    override fun classifyToolRisk(
        siteId: String,
        mcpServerId: String,
        tool: McpTool
    ): ToolRiskLevel {
        // 1. Check if an administrator configured explicit ToolPermissionPolicy
        val toolPolicy = getToolPolicy(siteId, mcpServerId, tool.name)
        if (toolPolicy != null) {
            return toolPolicy.riskLevel
        }

        // 2. Check globally blocked tools
        if (globalPolicy.globallyBlockedTools.contains(tool.name.lowercase())) {
            return ToolRiskLevel.DESTRUCTIVE
        }

        // 3. Check tool annotations if provided by MCP server
        val annotations = tool.annotations
        if (annotations != null) {
            if (annotations.destructive) return ToolRiskLevel.DESTRUCTIVE
            if (annotations.readOnly) return ToolRiskLevel.READ
        }

        // 4. Known tool metadata & name semantics
        val lower = tool.name.lowercase()
        return when {
            lower.contains("delete") || lower.contains("drop") || lower.contains("purge") ||
                    lower.contains("uninstall") || lower.contains("truncate") || lower.contains("reset") -> {
                ToolRiskLevel.DESTRUCTIVE
            }
            lower.startsWith("get_") || lower.startsWith("list_") || lower.startsWith("read_") ||
                    lower.startsWith("inspect_") || lower.startsWith("search_") || lower.contains("health") ||
                    lower.contains("status") -> {
                ToolRiskLevel.READ
            }
            lower.contains("draft") || lower.contains("cache") || lower.contains("transient") || lower.contains("preview") -> {
                ToolRiskLevel.LOW_RISK_WRITE
            }
            lower.contains("publish") || lower.contains("update") || lower.contains("create") ||
                    lower.contains("edit") || lower.contains("upload") || lower.contains("install") ||
                    lower.contains("activate") || lower.contains("deactivate") || lower.contains("user") ||
                    lower.contains("setting") -> {
                ToolRiskLevel.HIGH_RISK_WRITE
            }
            tool.riskLevel != ToolRiskLevel.UNKNOWN -> {
                tool.riskLevel
            }
            else -> {
                // Section 4: If uncertain: UNKNOWN
                ToolRiskLevel.UNKNOWN
            }
        }
    }

    override fun evaluateToolExecution(
        context: ActiveSiteContext,
        tool: McpTool,
        toolCall: AIToolCall,
        mode: AgentMode,
        runStats: AgentRunExecutionStats
    ): PermissionDecision {
        val siteId = context.siteId
        val mcpServerId = tool.serverId
        val toolName = tool.name.lowercase()

        // ==========================================
        // 1. GLOBAL POLICY PRECEDENCE (Section 9 & 10)
        // ==========================================
        if (globalPolicy.noExecutionWithoutActiveSite && siteId.isBlank()) {
            return PermissionDecision.Deny(
                reason = "Execution denied: No active client site selected.",
                securityRuleViolated = "GlobalPolicy.NoExecutionWithoutActiveSite",
                eventType = SecurityEventType.SITE_CONTEXT_MISMATCH
            )
        }

        if (globalPolicy.globallyBlockedTools.contains(toolName)) {
            auditLogger?.logEvent(
                siteId = siteId,
                siteName = context.siteName,
                userAction = SecurityEventType.TOOL_BLOCKED.name,
                aiAction = "EVALUATE_POLICY",
                tool = tool.name,
                parametersSummary = toolCall.argumentsJson.take(80),
                resultSummary = "BLOCKED: Tool '${tool.name}' is globally forbidden for security.",
                approvalStatus = "DENIED",
                isSuccess = false
            )
            return PermissionDecision.Deny(
                reason = "Tool '${tool.name}' is globally prohibited on all Imperial AI installations.",
                securityRuleViolated = "GlobalPolicy.GloballyBlockedTools",
                eventType = SecurityEventType.TOOL_BLOCKED
            )
        }

        // Global execution limits (Section 17)
        if (runStats.totalToolCalls >= globalPolicy.maxToolCallsPerRunLimit) {
            return PermissionDecision.Deny(
                reason = "Execution limit reached: Maximum tool calls per run (${globalPolicy.maxToolCallsPerRunLimit}) exceeded.",
                securityRuleViolated = "GlobalPolicy.MaxToolCallsLimit",
                eventType = SecurityEventType.EXECUTION_LIMIT_REACHED
            )
        }
        if (runStats.writeOperationsCount >= globalPolicy.maxWriteOperationsPerRunLimit &&
            classifyToolRisk(siteId, mcpServerId, tool) != ToolRiskLevel.READ) {
            return PermissionDecision.Deny(
                reason = "Execution limit reached: Maximum write operations per run (${globalPolicy.maxWriteOperationsPerRunLimit}) exceeded.",
                securityRuleViolated = "GlobalPolicy.MaxWritesLimit",
                eventType = SecurityEventType.EXECUTION_LIMIT_REACHED
            )
        }
        if (runStats.estimatedAffectedObjectsCount > globalPolicy.maxAffectedObjectsLimit) {
            return PermissionDecision.Deny(
                reason = "Massive operation blocked: Affected objects (${runStats.estimatedAffectedObjectsCount}) exceed maximum threshold (${globalPolicy.maxAffectedObjectsLimit}).",
                securityRuleViolated = "GlobalPolicy.MaxAffectedObjectsLimit",
                eventType = SecurityEventType.EXECUTION_LIMIT_REACHED
            )
        }

        // ==========================================
        // 2. SITE POLICY PRECEDENCE (Section 8)
        // ==========================================
        val sitePolicy = getSitePolicy(siteId)

        // Site blocklist
        if (sitePolicy.blockedTools.contains(tool.name) || sitePolicy.blockedTools.contains(toolName)) {
            return PermissionDecision.Deny(
                reason = "Tool '${tool.name}' is blocked by site security policy for ${context.siteName}.",
                securityRuleViolated = "SitePolicy.BlockedTools",
                eventType = SecurityEventType.TOOL_BLOCKED
            )
        }

        // Site allowlist
        if (sitePolicy.allowedTools.isNotEmpty() &&
            !sitePolicy.allowedTools.contains(tool.name) &&
            !sitePolicy.allowedTools.contains(toolName)) {
            return PermissionDecision.Deny(
                reason = "Tool '${tool.name}' is not in the site-approved allowlist for ${context.siteName}.",
                securityRuleViolated = "SitePolicy.AllowedTools",
                eventType = SecurityEventType.TOOL_BLOCKED
            )
        }

        // Site run limits
        if (runStats.totalToolCalls >= sitePolicy.maxToolCallsPerRun) {
            return PermissionDecision.Deny(
                reason = "Site limit reached: Maximum tool calls for ${context.siteName} (${sitePolicy.maxToolCallsPerRun}) exceeded.",
                securityRuleViolated = "SitePolicy.MaxToolCalls",
                eventType = SecurityEventType.EXECUTION_LIMIT_REACHED
            )
        }

        // Determine tool risk
        val risk = classifyToolRisk(siteId, mcpServerId, tool)

        // Destructive site check
        if (risk == ToolRiskLevel.DESTRUCTIVE && !sitePolicy.allowDestructive) {
            return PermissionDecision.Deny(
                reason = "Destructive operations are disabled in site policy for ${context.siteName}.",
                securityRuleViolated = "SitePolicy.AllowDestructive",
                eventType = SecurityEventType.SECURITY_DENIED
            )
        }

        // ==========================================
        // 3. TOOL POLICY PRECEDENCE (Section 7)
        // ==========================================
        val toolPolicy = getToolPolicy(siteId, mcpServerId, tool.name)
        if (toolPolicy != null) {
            if (!toolPolicy.enabled) {
                return PermissionDecision.Deny(
                    reason = "Tool '${tool.name}' is explicitly disabled in tool policy.",
                    securityRuleViolated = "ToolPolicy.Enabled",
                    eventType = SecurityEventType.TOOL_BLOCKED
                )
            }
            if (!toolPolicy.allowedModes.contains(mode)) {
                return PermissionDecision.Deny(
                    reason = "Tool '${tool.name}' is not permitted in $mode mode.",
                    securityRuleViolated = "ToolPolicy.AllowedModes",
                    eventType = SecurityEventType.SECURITY_DENIED
                )
            }
        }

        // ==========================================
        // 4. BULK ACTION PROTECTION (Section 16)
        // ==========================================
        val isBulk = isBulkOperation(toolCall, tool)
        if (isBulk && sitePolicy.requireApprovalForBulkActions) {
            val req = approvalEngine.createApprovalRequest(
                siteId = siteId,
                mcpServerId = mcpServerId,
                toolName = tool.name,
                toolCallId = toolCall.id,
                arguments = toolCall.parsedArguments,
                conversationId = context.activeConversationId,
                reason = "Bulk operation detected: affecting multiple WordPress resources.",
                isDestructive = (risk == ToolRiskLevel.DESTRUCTIVE)
            )
            return PermissionDecision.RequireApproval(
                request = req,
                reason = "Bulk action affecting multiple objects requires operator authorization.",
                isDestructive = (risk == ToolRiskLevel.DESTRUCTIVE)
            )
        }

        // ==========================================
        // 5. AGENT MODE ENFORCEMENT (Section 5)
        // ==========================================
        val isReadOnly = (risk == ToolRiskLevel.READ) && !tool.requiresApproval && (toolPolicy?.requiresApproval != true)

        when (mode) {
            AgentMode.READ -> {
                if (!isReadOnly) {
                    return PermissionDecision.Deny(
                        reason = "READ mode allows read-only queries only. Tool '${tool.name}' ($risk) is blocked.",
                        securityRuleViolated = "AgentMode.READ",
                        eventType = SecurityEventType.SECURITY_DENIED
                    )
                }
            }
            AgentMode.PLAN -> {
                if (!isReadOnly) {
                    return PermissionDecision.Deny(
                        reason = "PLAN mode allows inspection and proposing actions only. Live execution of '${tool.name}' is blocked.",
                        securityRuleViolated = "AgentMode.PLAN",
                        eventType = SecurityEventType.SECURITY_DENIED
                    )
                }
            }
            AgentMode.EXECUTE, AgentMode.ASSISTED, AgentMode.AUTONOMOUS -> {
                // In EXECUTE mode, evaluate approval requirement
            }
        }

        // ==========================================
        // 6. GLOBAL SAFETY RULES & APPROVAL (Section 6 & 10)
        // ==========================================
        val isGlobalSafetyAction = isGlobalSafetyOperation(tool.name)

        if (isReadOnly && !isGlobalSafetyAction && !isBulk) {
            // Read tool with no approval triggers
            return PermissionDecision.Allow("Read-only query allowed under policy.")
        }

        // Any non-read, destructive, bulk, or global safety operation requires approval
        val isDestructive = (risk == ToolRiskLevel.DESTRUCTIVE)
        val reasonText = when {
            isDestructive -> "Destructive operation on ${context.siteName} requires explicit operator authorization."
            isGlobalSafetyAction -> "Critical WordPress modification (${tool.name}) requires operator authorization."
            risk == ToolRiskLevel.UNKNOWN -> "Unknown risk tool requires operator authorization."
            else -> "Live modification requires operator authorization."
        }

        val approvalReq = approvalEngine.createApprovalRequest(
            siteId = siteId,
            mcpServerId = mcpServerId,
            toolName = tool.name,
            toolCallId = toolCall.id,
            arguments = toolCall.parsedArguments,
            conversationId = context.activeConversationId,
            reason = reasonText,
            isDestructive = isDestructive
        )

        return PermissionDecision.RequireApproval(
            request = approvalReq,
            reason = reasonText,
            isDestructive = isDestructive
        )
    }

    private fun isBulkOperation(toolCall: AIToolCall, tool: McpTool): Boolean {
        val lower = tool.name.lowercase()
        if (lower.contains("bulk") || lower.contains("batch") || lower.contains("purge_all")) {
            return true
        }

        val args = toolCall.parsedArguments
        for ((k, v) in args) {
            val keyLower = k.lowercase()
            if (keyLower.contains("ids") || keyLower.contains("posts") || keyLower.contains("items") || keyLower.contains("pages")) {
                if (v is List<*> && v.size >= 5) return true
                if (v is Array<*> && v.size >= 5) return true
            }
            if (keyLower == "count" || keyLower == "limit" || keyLower == "quantity") {
                val num = (v as? Number)?.toInt() ?: 0
                if (num >= 20) return true
            }
        }
        return false
    }

    private fun isGlobalSafetyOperation(toolName: String): Boolean {
        val lower = toolName.lowercase()
        return lower.contains("delete") ||
                lower.contains("publish") ||
                lower.contains("unpublish") ||
                lower.contains("user") ||
                lower.contains("role") ||
                lower.contains("plugin") ||
                lower.contains("theme") ||
                lower.contains("setting") ||
                lower.contains("option") ||
                lower.contains("config") ||
                lower.contains("dns") ||
                lower.contains("mail") ||
                lower.contains("database") ||
                lower.contains("sql")
    }

    // ==========================================
    // Backwards Compatibility (Phase 1-3)
    // ==========================================
    override suspend fun evaluateAction(
        siteId: String,
        actionType: DangerousActionType,
        policy: PermissionPolicy
    ): PermissionEvaluationResult {
        val requiresApproval = policy.isApprovalRequired(actionType)
        val warningMessage = when (actionType) {
            DangerousActionType.DELETE_PAGE -> "This operation will permanently delete a WordPress page."
            DangerousActionType.DELETE_POST -> "This operation will delete a published post from the database."
            DangerousActionType.CHANGE_SITE_SETTINGS -> "Modifying core WordPress options can alter site availability."
            DangerousActionType.PUBLISH_CONTENT -> "This will immediately publish drafted content to live visitors."
            DangerousActionType.MODIFY_PLUGIN -> "Installing, updating, or deactivating plugins can break site layouts."
            DangerousActionType.MODIFY_THEME -> "Altering theme files or active themes modifies visual presentation."
            DangerousActionType.CHANGE_USER -> "Modifying user accounts or privileges carries high administrative risk."
            DangerousActionType.CHANGE_DNS_SETTINGS -> "DNS modifications affect domain routing and SSL certificates."
            DangerousActionType.BULK_EDIT_CONTENT -> "Bulk changes modify multiple posts/pages in a single transaction."
            DangerousActionType.READ_ONLY_AUDIT -> "Safe read-only operation."
        }

        return PermissionEvaluationResult(
            requiresExplicitApproval = requiresApproval,
            riskLevel = actionType.riskLevel,
            warningMessage = warningMessage,
            isAllowedUnderPolicy = true
        )
    }

    override suspend fun recordOperatorApproval(
        approvalId: String,
        siteId: String,
        approved: Boolean,
        operatorNotes: String
    ) {
        approvalEngine.resolveApproval(
            approvalId = approvalId,
            approved = approved,
            operatorNotes = operatorNotes
        )
    }
}
