package ke.imperialenterprise.imperialai.data.repository

import ke.imperialenterprise.imperialai.domain.model.*
import ke.imperialenterprise.imperialai.domain.repository.McpServerRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.map
import java.util.concurrent.ConcurrentHashMap

/**
 * In-memory repository for MCP Servers partitioned strictly by [siteId].
 * Pre-populates clean default configurations for sample sites without hardcoding secrets.
 */
class InMemoryMcpServerRepository : McpServerRepository {

    // siteId -> List<MCPServer>
    private val serversMap = ConcurrentHashMap<String, MutableList<MCPServer>>()
    private val stateFlow = MutableStateFlow<Map<String, List<MCPServer>>>(emptyMap())

    init {
        // Seed default MCP server definitions bound to sample sites
        val seedServers = listOf(
            MCPServer(
                id = "mcp_jubarah",
                name = "Juba Raha WordPress MCP",
                endpoint = "https://jubarahahotel.com/wp-json/mcp/v1",
                description = "Primary Model Context Protocol gateway for Juba Raha Paradise Hotel WP",
                siteId = "site_001",
                enabled = true,
                connectionStatus = McpConnectionStatus.CONNECTED,
                transport = McpTransportType.STREAMABLE_HTTP,
                authenticationType = McpAuthType.BEARER_TOKEN,
                protocolVersion = "2024-11-05",
                serverInfo = McpServerInfo("WP-MCP-Remote", "1.4.2"),
                capabilities = McpServerCapabilities(tools = true, prompts = false, resources = true),
                discoveredToolsCount = 6,
                isDemo = true
            ),
            MCPServer(
                id = "mcp_lamu",
                name = "Lamu Heritage Cultural MCP",
                endpoint = "https://lamuheritage.co.ke/wp-json/mcp/v1",
                description = "Content & Preservation Management MCP for Lamu Heritage Archives",
                siteId = "site_002",
                enabled = true,
                connectionStatus = McpConnectionStatus.NOT_CONFIGURED,
                transport = McpTransportType.STREAMABLE_HTTP,
                authenticationType = McpAuthType.BEARER_TOKEN,
                discoveredToolsCount = 0,
                isDemo = true
            ),
            MCPServer(
                id = "mcp_nairobi",
                name = "Nairobi Metro Logistics MCP",
                endpoint = "https://nairobimetro.co.ke/wp-json/mcp/v1",
                description = "Fleet & WooCommerce Operations MCP Engine",
                siteId = "site_003",
                enabled = true,
                connectionStatus = McpConnectionStatus.NOT_CONFIGURED,
                transport = McpTransportType.STREAMABLE_HTTP,
                authenticationType = McpAuthType.BEARER_TOKEN,
                discoveredToolsCount = 0,
                isDemo = true
            ),
            MCPServer(
                id = "mcp_mombasa",
                name = "Mombasa Sands Booking MCP",
                endpoint = "https://mombasasands.com/wp-json/mcp/v1",
                description = "Resort booking engine & promotions MCP gateway",
                siteId = "site_004",
                enabled = true,
                connectionStatus = McpConnectionStatus.NOT_CONFIGURED,
                transport = McpTransportType.STREAMABLE_HTTP,
                authenticationType = McpAuthType.NONE,
                discoveredToolsCount = 0,
                isDemo = true
            )
        )

        for (srv in seedServers) {
            serversMap.computeIfAbsent(srv.siteId) { mutableListOf() }.add(srv)
        }
        stateFlow.value = serversMap.toMap()
    }

    override fun getServersForSite(siteId: String): Flow<List<MCPServer>> {
        return stateFlow.map { map -> map[siteId] ?: emptyList() }
    }

    override suspend fun getServerById(siteId: String, serverId: String): MCPServer? {
        return serversMap[siteId]?.find { it.id == serverId }
    }

    override suspend fun getServerForSite(siteId: String): MCPServer? {
        return serversMap[siteId]?.firstOrNull { it.enabled } ?: serversMap[siteId]?.firstOrNull()
    }

    override suspend fun saveServer(server: MCPServer) {
        val list = serversMap.computeIfAbsent(server.siteId) { mutableListOf() }
        val idx = list.indexOfFirst { it.id == server.id }
        if (idx >= 0) {
            list[idx] = server.copy(updatedAt = System.currentTimeMillis())
        } else {
            list.add(server)
        }
        stateFlow.value = serversMap.toMap()
    }

    override suspend fun updateConnectionStatus(
        siteId: String,
        serverId: String,
        status: McpConnectionStatus,
        error: String?
    ) {
        val list = serversMap[siteId] ?: return
        val idx = list.indexOfFirst { it.id == serverId }
        if (idx >= 0) {
            val existing = list[idx]
            list[idx] = existing.copy(
                connectionStatus = status,
                lastError = error,
                lastConnected = if (status == McpConnectionStatus.CONNECTED) {
                    java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss", java.util.Locale.US).format(java.util.Date())
                } else existing.lastConnected,
                updatedAt = System.currentTimeMillis()
            )
            stateFlow.value = serversMap.toMap()
        }
    }

    override suspend fun updateServerMetadata(
        siteId: String,
        serverId: String,
        updated: MCPServer
    ) {
        val list = serversMap[siteId] ?: return
        val idx = list.indexOfFirst { it.id == serverId }
        if (idx >= 0) {
            list[idx] = updated.copy(updatedAt = System.currentTimeMillis())
            stateFlow.value = serversMap.toMap()
        }
    }

    override suspend fun deleteServer(siteId: String, serverId: String) {
        val list = serversMap[siteId] ?: return
        list.removeIf { it.id == serverId }
        stateFlow.value = serversMap.toMap()
    }
}
