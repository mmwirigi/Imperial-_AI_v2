package ke.imperialenterprise.imperialai.domain.repository

import ke.imperialenterprise.imperialai.domain.model.MCPServer
import ke.imperialenterprise.imperialai.domain.model.McpConnectionStatus
import kotlinx.coroutines.flow.Flow

/**
 * Repository interface for managing MCP Server configurations.
 * 
 * Strict Site-to-MCP Rule:
 * Every server is strictly bound to a `siteId`.
 * No server can be queried or modified without identifying its owner site.
 */
interface McpServerRepository {
    fun getServersForSite(siteId: String): Flow<List<MCPServer>>
    suspend fun getServerById(siteId: String, serverId: String): MCPServer?
    suspend fun getServerForSite(siteId: String): MCPServer?
    suspend fun saveServer(server: MCPServer)
    suspend fun updateConnectionStatus(siteId: String, serverId: String, status: McpConnectionStatus, error: String? = null)
    suspend fun updateServerMetadata(siteId: String, serverId: String, updated: MCPServer)
    suspend fun deleteServer(siteId: String, serverId: String)
}
