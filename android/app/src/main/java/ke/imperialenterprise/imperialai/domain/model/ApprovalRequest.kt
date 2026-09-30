package ke.imperialenterprise.imperialai.domain.model

import ke.imperialenterprise.imperialai.domain.security.SensitiveDataRedactor
import java.security.MessageDigest
import java.util.UUID

/**
 * Encapsulates an operator approval request for a tool invocation (Sections 11, 12, 13, 31).
 * 
 * Safety Invariants:
 * 1. An approval request MUST expire (default 5 minutes, 2 minutes for destructive actions).
 * 2. An approval is strictly bound to: siteId, mcpServerId, toolId/toolName, toolCallId, and argumentsHash.
 * 3. Never displays secrets, tokens, or passwords in [argumentsSummary] or [sanitizedArguments].
 * 4. Replay-protected: an approval cannot be consumed more than once.
 */
data class ApprovalRequest(
    val id: String = UUID.randomUUID().toString(),
    val siteId: String,
    val conversationId: String? = null,
    val agentRunId: String? = null,
    val mcpServerId: String,
    val toolName: String,
    val toolId: String = toolName,
    val toolCallId: String,
    val sanitizedArguments: Map<String, Any?> = emptyMap(),
    val argumentsSummary: String = "",
    val argumentsHash: String = "",
    val riskLevel: ToolRiskLevel = ToolRiskLevel.HIGH_RISK_WRITE,
    val reason: String = "Action requires human authorization",
    val isDestructive: Boolean = (riskLevel == ToolRiskLevel.DESTRUCTIVE),
    val createdAt: Long = System.currentTimeMillis(),
    val expiresAt: Long = createdAt + if (riskLevel == ToolRiskLevel.DESTRUCTIVE) 2 * 60 * 1000L else 5 * 60 * 1000L,
    val status: ApprovalStatus = ApprovalStatus.PENDING,
    val operatorNotes: String = "",
    val consumed: Boolean = false
) {
    val approvalId: String get() = id

    /**
     * Checks if this approval request has timed out.
     */
    fun isExpired(currentTime: Long = System.currentTimeMillis()): Boolean {
        return currentTime > expiresAt || status == ApprovalStatus.EXPIRED
    }

    /**
     * Validates that the approval resolution matches the exact tool call parameters.
     * Prevents replay and parameter tampering.
     */
    fun matches(
        targetSiteId: String,
        targetMcpServerId: String,
        targetToolName: String,
        targetToolCallId: String,
        targetArgsHash: String
    ): Boolean {
        return !consumed &&
                status == ApprovalStatus.PENDING &&
                !isExpired() &&
                siteId == targetSiteId &&
                mcpServerId == targetMcpServerId &&
                (toolName == targetToolName || toolId == targetToolName) &&
                toolCallId == targetToolCallId &&
                argumentsHash == targetArgsHash
    }

    companion object {
        /**
         * Computes a deterministic SHA-256 hash of normalized tool arguments.
         */
        fun computeArgumentsHash(arguments: Map<String, Any?>): String {
            val sortedStr = arguments.entries
                .sortedBy { it.key }
                .joinToString("&") { "${it.key}=${it.value}" }
            val md = MessageDigest.getInstance("SHA-256")
            val digest = md.digest(sortedStr.toByteArray(Charsets.UTF_8))
            return digest.joinToString("") { "%02x".format(it) }
        }

        /**
         * Produces a sanitized, human-readable summary of arguments for operator inspection,
         * masking passwords, API keys, tokens, and authorization parameters.
         */
        fun sanitizeArgumentsSummary(arguments: Map<String, Any?>): String {
            val redacted = SensitiveDataRedactor.redactMap(arguments)
            return redacted.entries.joinToString("\n") { (k, v) ->
                val displayValue = v?.toString()?.take(100) ?: "null"
                "$k: $displayValue"
            }
        }
    }
}
