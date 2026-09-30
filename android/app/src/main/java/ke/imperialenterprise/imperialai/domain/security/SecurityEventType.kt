package ke.imperialenterprise.imperialai.domain.security

/**
 * Standardized security audit event classifications (Phase 5).
 */
enum class SecurityEventType(val displayName: String) {
    SECURITY_DENIED("Security Denied"),
    APPROVAL_REQUESTED("Approval Requested"),
    APPROVAL_GRANTED("Approval Granted"),
    APPROVAL_REJECTED("Approval Rejected"),
    APPROVAL_EXPIRED("Approval Expired"),
    CREDENTIAL_ACCESS_DENIED("Credential Access Denied"),
    SITE_CONTEXT_MISMATCH("Site Context Mismatch"),
    MCP_CONTEXT_MISMATCH("MCP Context Mismatch"),
    TOOL_BLOCKED("Tool Blocked"),
    EXECUTION_LIMIT_REACHED("Execution Limit Reached"),
    AGENT_CANCELLED("Agent Execution Cancelled")
}
