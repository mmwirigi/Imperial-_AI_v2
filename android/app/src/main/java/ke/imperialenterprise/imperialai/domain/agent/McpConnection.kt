package ke.imperialenterprise.imperialai.domain.agent

import ke.imperialenterprise.imperialai.domain.model.*
import kotlinx.coroutines.flow.StateFlow

/**
 * Universal interface abstraction for an active Model Context Protocol (MCP) session.
 */
interface McpConnection {
    val serverId: String
    val siteId: String
    val status: StateFlow<McpConnectionStatus>

    suspend fun initialize(): Result<MCPServer>
    suspend fun listTools(): Result<List<McpTool>>
    suspend fun callTool(name: String, arguments: Map<String, Any?>): Result<McpToolResult>
    suspend fun disconnect()
    fun isConnected(): Boolean
}
