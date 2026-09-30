package ke.imperialenterprise.imperialai.domain.model

import java.util.UUID

/**
 * Immutable audit log record.
 * 
 * SECURITY RULE:
 * Absolutely never store passwords, API keys, MCP tokens, or WordPress application
 * passwords in audit logs. All parameter summaries must be sanitized and redacted before storage.
 */
data class AuditEvent(
    val id: String = UUID.randomUUID().toString(),
    val timestamp: String,
    val siteId: String,
    val siteName: String,
    val userAction: String,
    val aiAction: String,
    val tool: String,
    val parametersSummary: String, // Pre-sanitized, non-secret summary
    val resultSummary: String,
    val approvalStatus: String,
    val isSuccess: Boolean
)
