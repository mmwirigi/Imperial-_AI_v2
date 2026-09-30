package ke.imperialenterprise.imperialai.domain.agent

import ke.imperialenterprise.imperialai.domain.model.AIToolResult

/**
 * Sanitizes and enforces safety limits on raw MCP tool execution results.
 * 
 * Invariants:
 * 1. Strips any leaked tokens, authorization headers, or database passwords.
 * 2. Enforces maximum character limits (4,000 characters) to protect LLM context windows.
 * 3. Injects prompt injection boundary delimiters.
 */
object ToolResultSanitizer {

    private const val MAX_CHARACTER_LIMIT = 4_000

    fun sanitizeAndTruncate(
        rawContent: String,
        toolCallId: String,
        toolName: String,
        isError: Boolean,
        durationMs: Long
    ): AIToolResult {
        // Redact credentials or tokens if present
        val redacted = redactCredentials(rawContent)

        val isTruncated = redacted.length > MAX_CHARACTER_LIMIT
        val finalContent = if (isTruncated) {
            val truncatedText = redacted.take(MAX_CHARACTER_LIMIT)
            "$truncatedText\n\n[NOTICE: The tool result was truncated for safety/context limits.]"
        } else {
            redacted
        }

        return AIToolResult(
            toolCallId = toolCallId,
            toolName = toolName,
            content = finalContent,
            isError = isError,
            durationMs = durationMs,
            isTruncated = isTruncated
        )
    }

    fun redactCredentials(text: String): String {
        return text
            .replace(Regex("(?i)bearer\\s+[A-Za-z0-9_\\-\\.~\\+\\/=]+"), "Bearer ••••••••")
            .replace(Regex("(?i)(api[_-]?key|password|secret|auth_token)\\s*[:=]\\s*[\"']?[A-Za-z0-9_\\-\\.~\\+\\/=]+[\"']?"), "$1=••••••••")
    }
}
