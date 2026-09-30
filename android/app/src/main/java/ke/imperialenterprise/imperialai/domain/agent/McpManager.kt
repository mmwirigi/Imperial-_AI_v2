package ke.imperialenterprise.imperialai.domain.agent

import ke.imperialenterprise.imperialai.domain.model.*
import kotlinx.coroutines.flow.StateFlow

/**
 * High-level coordinator managing MCP connections, site isolation boundaries,
 * and secure tool execution.
 * 
 * Strict Site Boundary:
 * The application must NOT allow an MCP server belonging to one site to silently
 * become active for another site.
 */
interface McpManager {
    /**
     * Observable active site execution boundary.
     */
    val activeContext: StateFlow<ActiveSiteContext?>

    /**
     * Observable connection status for the currently active site's MCP server.
     */
    val activeConnectionStatus: StateFlow<McpConnectionStatus>

    /**
     * Discovered tools for the currently active site.
     */
    val activeSiteTools: StateFlow<List<McpTool>>

    /**
     * Sets the active site context. Disconnects or pauses previous site's MCP connection,
     * and activates the new site's MCP connection if configured.
     */
    suspend fun switchActiveSite(site: Site, conversationId: String? = null)

    /**
     * Connects and initializes an MCP server for a designated site.
     * Flow:
     * 1. Initialize MCP session (Streamable HTTP)
     * 2. Read server information & negotiated protocol version
     * 3. Read capabilities
     * 4. Discover advertised tools
     * 5. Save connection metadata
     */
    suspend fun connectServer(server: MCPServer): Result<MCPServer>

    /**
     * Tests connectivity to an MCP endpoint without changing active persistence.
     * Returns latency, server information, and discovered tool count.
     */
    suspend fun testConnection(server: MCPServer, bearerToken: String? = null): ConnectionTestReport

    /**
     * Disconnects the active MCP server for the designated site.
     */
    suspend fun disconnectServer(siteId: String, serverId: String)

    /**
     * Refreshes dynamic tools advertised by the remote MCP server.
     */
    suspend fun refreshTools(siteId: String, serverId: String): Result<List<McpTool>>

    /**
     * Executes an MCP tool strictly enforcing client isolation rules:
     * 1. Verify siteId matches activeContext
     * 2. Verify mcpServerId belongs to siteId
     * 3. Verify server is currently connected/authorized
     * 4. Verify conversation belongs to siteId
     * 
     * If any validation fails: DO NOT EXECUTE. Return a safe error.
     */
    suspend fun executeTool(request: ToolExecutionRequest): Result<McpToolResult>
}

data class ConnectionTestReport(
    val success: Boolean,
    val latencyMs: Long = 0L,
    val serverName: String? = null,
    val serverVersion: String? = null,
    val protocolVersion: String? = null,
    val discoveredToolsCount: Int = 0,
    val errorMessage: String? = null
)
