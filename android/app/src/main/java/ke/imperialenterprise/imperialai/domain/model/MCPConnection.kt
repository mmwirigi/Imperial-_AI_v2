package ke.imperialenterprise.imperialai.domain.model

import java.util.UUID

/**
 * Model representing remote MCP (Model Context Protocol) connection settings for a WordPress site.
 */
data class MCPConnection(
    val id: String = UUID.randomUUID().toString(),
    val siteId: String,
    val endpointUrl: String,
    val transportType: McpTransportType = McpTransportType.SSE,
    val status: McpStatus = McpStatus.DISCONNECTED,
    val lastHeartbeat: String = "None",
    val latencyMs: Long = 0L,
    val discoveredToolsCount: Int = 0
)

enum class McpTransportType {
    SSE,        // Server-Sent Events (Recommended for remote WordPress MCP endpoints)
    WEBSOCKET,  // Persistent bi-directional stream
    STDIO       // Local CLI process bridge (Desktop only)
}
