package ke.imperialenterprise.imperialai.domain.security

import ke.imperialenterprise.imperialai.domain.model.ApprovalRequest
import ke.imperialenterprise.imperialai.domain.model.ToolRiskLevel

/**
 * Tri-state security gate decision produced by PermissionEngine before any tool execution.
 * 
 * Safety Principle (Section 3 - Default-Deny):
 * UNKNOWN = DENY or REQUIRE_APPROVAL. Never UNKNOWN = ALLOW.
 */
sealed class PermissionDecision {

    /**
     * Tool execution is strictly permitted under current policies and mode.
     */
    data class Allow(
        val reason: String = "Allowed under security policy"
    ) : PermissionDecision()

    /**
     * Action requires explicit operator authorization before remote dispatch.
     */
    data class RequireApproval(
        val request: ApprovalRequest,
        val reason: String,
        val isDestructive: Boolean = false
    ) : PermissionDecision()

    /**
     * Action is categorically denied and will not be dispatched to remote MCP server.
     */
    data class Deny(
        val reason: String,
        val securityRuleViolated: String? = null,
        val eventType: SecurityEventType = SecurityEventType.SECURITY_DENIED
    ) : PermissionDecision()

    val isAllowed: Boolean get() = this is Allow
    val isApprovalRequired: Boolean get() = this is RequireApproval
    val isDenied: Boolean get() = this is Deny
}
