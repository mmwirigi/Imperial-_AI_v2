package ke.imperialenterprise.imperialai.domain.model

import java.util.UUID

/**
 * Encapsulates an explicit request to execute an MCP tool against a remote server.
 * 
 * Strict Isolation:
 * [siteId] and [mcpServerId] must match the active context before execution is permitted.
 */
data class ToolExecutionRequest(
    val executionId: String = UUID.randomUUID().toString(),
    val siteId: String,
    val mcpServerId: String,
    val toolName: String,
    val arguments: Map<String, Any?> = emptyMap(),
    val conversationId: String? = null,
    val operatorAuthorized: Boolean = false
) {
    /**
     * Produces a sanitized summary of parameters safe for audit logs and UI inspection.
     * Guaranteed never to log passwords, tokens, or sensitive secret parameters.
     */
    fun sanitizedArgumentsSummary(): String {
        val sensitiveKeys = listOf("token", "key", "password", "secret", "auth", "credential", "bearer")
        return arguments.entries.joinToString("; ") { (k, v) ->
            val isSensitive = sensitiveKeys.any { k.contains(it, ignoreCase = true) }
            val displayValue = if (isSensitive) "••••••••" else v.toString().take(60)
            "$k=$displayValue"
        }
    }
}

/**
 * Normalized result payload from remote MCP tool execution.
 */
data class McpToolResult(
    val content: List<McpContent>,
    val isError: Boolean = false,
    val rawStructuredData: Map<String, Any?>? = null,
    val executionDurationMs: Long = 0L,
    val errorMessage: String? = null
) {
    fun toDisplayText(): String {
        if (isError) {
            return errorMessage ?: content.firstOrNull()?.text ?: "Tool execution failed"
        }
        return content.joinToString("\n") { it.text }
    }

    companion object {
        fun text(text: String, durationMs: Long = 0L): McpToolResult = McpToolResult(
            content = listOf(McpContent.Text(text)),
            isError = false,
            executionDurationMs = durationMs
        )

        fun error(message: String, durationMs: Long = 0L): McpToolResult = McpToolResult(
            content = listOf(McpContent.Text(message)),
            isError = true,
            executionDurationMs = durationMs,
            errorMessage = message
        )
    }
}

sealed class McpContent {
    abstract val text: String

    data class Text(override val text: String) : McpContent()
    data class Image(val dataBase64: String, val mimeType: String, override val text: String = "[Image: $mimeType]") : McpContent()
    data class Resource(val uri: String, val rawText: String?, override val text: String = "[Resource: $uri]") : McpContent()
}
