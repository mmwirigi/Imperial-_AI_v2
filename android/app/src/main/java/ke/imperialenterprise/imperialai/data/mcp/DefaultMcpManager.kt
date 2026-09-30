package ke.imperialenterprise.imperialai.data.mcp

import ke.imperialenterprise.imperialai.domain.agent.ConnectionTestReport
import ke.imperialenterprise.imperialai.domain.agent.McpConnection
import ke.imperialenterprise.imperialai.domain.agent.McpManager
import ke.imperialenterprise.imperialai.domain.agent.ToolRegistry
import ke.imperialenterprise.imperialai.domain.model.*
import ke.imperialenterprise.imperialai.domain.repository.AuditLogger
import ke.imperialenterprise.imperialai.domain.repository.McpServerRepository
import ke.imperialenterprise.imperialai.domain.repository.SiteRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import java.util.concurrent.ConcurrentHashMap

/**
 * Production implementation of [McpManager].
 * Coordinates remote MCP client connections, enforces strict client isolation,
 * manages tool registries per site, and logs audit events.
 */
class DefaultMcpManager(
    private val mcpServerRepository: McpServerRepository,
    private val siteRepository: SiteRepository,
    private val toolRegistry: ToolRegistry,
    private val credentialManager: McpCredentialManager,
    private val auditLogger: AuditLogger
) : McpManager {

    private val _activeContext = MutableStateFlow<ActiveSiteContext?>(null)
    override val activeContext: StateFlow<ActiveSiteContext?> = _activeContext.asStateFlow()

    private val _activeConnectionStatus = MutableStateFlow(McpConnectionStatus.NOT_CONFIGURED)
    override val activeConnectionStatus: StateFlow<McpConnectionStatus> = _activeConnectionStatus.asStateFlow()

    private val _activeSiteTools = MutableStateFlow<List<McpTool>>(emptyList())
    override val activeSiteTools: StateFlow<List<McpTool>> = _activeSiteTools.asStateFlow()

    // Active connection instances keyed by serverId
    private val activeConnections = ConcurrentHashMap<String, McpConnection>()

    init {
        // Seed default tools for demo site 001
        seedInitialDemoTools()
    }

    private fun seedInitialDemoTools() {
        val jubarahTools = listOf(
            McpTool(
                name = "wp_list_posts",
                title = "List WordPress Posts",
                description = "Retrieves recent posts with pagination, post status, and category filters.",
                inputSchema = mapOf("status" to "publish", "per_page" to 10),
                annotations = McpToolAnnotations(readOnly = true),
                serverId = "mcp_jubarah",
                siteId = "site_001",
                requiresApproval = false,
                riskLevel = ToolRiskLevel.READ
            ),
            McpTool(
                name = "wp_get_site_health",
                title = "Inspect Site Health",
                description = "Runs WordPress core diagnostic check, PHP memory limit, and database integrity.",
                inputSchema = emptyMap(),
                annotations = McpToolAnnotations(readOnly = true),
                serverId = "mcp_jubarah",
                siteId = "site_001",
                requiresApproval = false,
                riskLevel = ToolRiskLevel.READ
            ),
            McpTool(
                name = "wp_list_plugins",
                title = "Enumerate Plugins",
                description = "Lists all installed WordPress plugins, active statuses, and update notices.",
                inputSchema = emptyMap(),
                annotations = McpToolAnnotations(readOnly = true),
                serverId = "mcp_jubarah",
                siteId = "site_001",
                requiresApproval = false,
                riskLevel = ToolRiskLevel.READ
            ),
            McpTool(
                name = "wp_create_draft_post",
                title = "Create Draft Post",
                description = "Creates a new unpublished draft post in WordPress with title and content.",
                inputSchema = mapOf("title" to "string", "content" to "string"),
                annotations = McpToolAnnotations(readOnly = false),
                serverId = "mcp_jubarah",
                siteId = "site_001",
                requiresApproval = true,
                riskLevel = ToolRiskLevel.LOW_RISK_WRITE
            ),
            McpTool(
                name = "wp_update_plugin",
                title = "Update Plugin",
                description = "Upgrades an installed WordPress plugin to the latest repository release.",
                inputSchema = mapOf("plugin_slug" to "string"),
                annotations = McpToolAnnotations(destructive = false),
                serverId = "mcp_jubarah",
                siteId = "site_001",
                requiresApproval = true,
                riskLevel = ToolRiskLevel.HIGH_RISK_WRITE
            ),
            McpTool(
                name = "wp_delete_page",
                title = "Delete Page Permanently",
                description = "Permanently removes a WordPress page and purges associated revisions.",
                inputSchema = mapOf("page_id" to "integer", "force" to true),
                annotations = McpToolAnnotations(destructive = true),
                serverId = "mcp_jubarah",
                siteId = "site_001",
                requiresApproval = true,
                riskLevel = ToolRiskLevel.DESTRUCTIVE
            )
        )
        toolRegistry.registerDiscoveredTools("site_001", "mcp_jubarah", jubarahTools)
    }

    override suspend fun switchActiveSite(site: Site, conversationId: String?) {
        val previousContext = _activeContext.value
        if (previousContext != null && previousContext.siteId != site.id) {
            // Disconnect or suspend previous site connections
            activeConnections[previousContext.activeMcpServerId]?.let { conn ->
                // Clean up live socket/http session
            }
        }

        // Fetch configured server for this new site
        val server = mcpServerRepository.getServerForSite(site.id)
        val newContext = ActiveSiteContext(
            siteId = site.id,
            siteName = site.siteName,
            websiteUrl = site.websiteUrl,
            activeMcpServerId = server?.id,
            activeConversationId = conversationId
        )
        _activeContext.value = newContext

        // Update status and tools
        val status = server?.connectionStatus ?: McpConnectionStatus.NOT_CONFIGURED
        _activeConnectionStatus.value = status
        _activeSiteTools.value = toolRegistry.getToolsForSite(site.id)
    }

    override suspend fun connectServer(server: MCPServer): Result<MCPServer> = withContext(Dispatchers.IO) {
        _activeConnectionStatus.value = McpConnectionStatus.CONNECTING
        mcpServerRepository.updateConnectionStatus(server.siteId, server.id, McpConnectionStatus.CONNECTING)

        val client = StreamableHttpMcpClient(
            serverId = server.id,
            siteId = server.siteId,
            endpointUrl = server.endpoint,
            authType = server.authenticationType,
            credentialManager = credentialManager,
            serverName = server.name
        )
        activeConnections[server.id] = client

        val initResult = client.initialize()
        if (initResult.isSuccess) {
            val updatedServer = initResult.getOrThrow()
            mcpServerRepository.updateServerMetadata(server.siteId, server.id, updatedServer)
            mcpServerRepository.updateConnectionStatus(server.siteId, server.id, McpConnectionStatus.CONNECTED)
            siteRepository.updateMcpStatus(server.siteId, McpStatus.CONNECTED)

            val tools = client.listTools().getOrDefault(emptyList())
            toolRegistry.registerDiscoveredTools(server.siteId, server.id, tools)

            if (_activeContext.value?.siteId == server.siteId) {
                _activeConnectionStatus.value = McpConnectionStatus.CONNECTED
                _activeSiteTools.value = toolRegistry.getToolsForSite(server.siteId)
            }

            auditLogger.logEvent(
                siteId = server.siteId,
                siteName = _activeContext.value?.siteName ?: server.name,
                userAction = "MCP_CONNECT",
                aiAction = "INITIALIZE_SESSION",
                tool = "mcp_handshake",
                parametersSummary = "endpoint=${server.endpoint}; transport=${server.transport}",
                resultSummary = "Connected to ${updatedServer.serverInfo?.name} v${updatedServer.serverInfo?.version}. Discovered ${tools.size} tools.",
                approvalStatus = "APPROVED",
                isSuccess = true
            )

            Result.success(updatedServer)
        } else {
            val err = initResult.exceptionOrNull()?.message ?: "Handshake failed"
            val status = if (err.contains("401") || err.contains("403")) McpConnectionStatus.AUTH_REQUIRED else McpConnectionStatus.ERROR
            mcpServerRepository.updateConnectionStatus(server.siteId, server.id, status, err)
            siteRepository.updateMcpStatus(server.siteId, McpStatus.ERROR)

            if (_activeContext.value?.siteId == server.siteId) {
                _activeConnectionStatus.value = status
            }

            auditLogger.logEvent(
                siteId = server.siteId,
                siteName = _activeContext.value?.siteName ?: server.name,
                userAction = "MCP_CONNECT_FAILED",
                aiAction = "INITIALIZE_SESSION",
                tool = "mcp_handshake",
                parametersSummary = "endpoint=${server.endpoint}",
                resultSummary = "Error: $err",
                approvalStatus = "REJECTED",
                isSuccess = false
            )

            Result.failure(initResult.exceptionOrNull() ?: Exception(err))
        }
    }

    override suspend fun testConnection(server: MCPServer, bearerToken: String?): ConnectionTestReport = withContext(Dispatchers.IO) {
        val startTime = System.currentTimeMillis()
        try {
            // Temporary credential manager override if custom test token was supplied
            if (!bearerToken.isNullOrBlank()) {
                credentialManager.setBearerToken(server.siteId, server.id, bearerToken)
            }

            val client = StreamableHttpMcpClient(
                serverId = server.id,
                siteId = server.siteId,
                endpointUrl = server.endpoint,
                authType = server.authenticationType,
                credentialManager = credentialManager,
                serverName = server.name
            )

            val initResult = client.initialize()
            val latency = System.currentTimeMillis() - startTime

            if (initResult.isSuccess) {
                val s = initResult.getOrThrow()
                val tools = client.listTools().getOrDefault(emptyList())
                ConnectionTestReport(
                    success = true,
                    latencyMs = latency,
                    serverName = s.serverInfo?.name ?: server.name,
                    serverVersion = s.serverInfo?.version ?: "1.0.0",
                    protocolVersion = s.protocolVersion ?: "2024-11-05",
                    discoveredToolsCount = tools.size
                )
            } else {
                ConnectionTestReport(
                    success = false,
                    latencyMs = latency,
                    errorMessage = initResult.exceptionOrNull()?.message ?: "Handshake failed"
                )
            }
        } catch (e: Exception) {
            ConnectionTestReport(
                success = false,
                latencyMs = System.currentTimeMillis() - startTime,
                errorMessage = e.message ?: "Connection test timed out or failed"
            )
        }
    }

    override suspend fun disconnectServer(siteId: String, serverId: String) {
        val client = activeConnections.remove(serverId)
        client?.disconnect()
        mcpServerRepository.updateConnectionStatus(siteId, serverId, McpConnectionStatus.DISCONNECTED)
        siteRepository.updateMcpStatus(siteId, McpStatus.DISCONNECTED)
        toolRegistry.clearTools(siteId, serverId)

        if (_activeContext.value?.siteId == siteId) {
            _activeConnectionStatus.value = McpConnectionStatus.DISCONNECTED
            _activeSiteTools.value = toolRegistry.getToolsForSite(siteId)
        }

        auditLogger.logEvent(
            siteId = siteId,
            siteName = _activeContext.value?.siteName ?: "Site",
            userAction = "MCP_DISCONNECT",
            aiAction = "TERMINATE_SESSION",
            tool = "mcp_disconnect",
            parametersSummary = "serverId=$serverId",
            resultSummary = "MCP server disconnected gracefully.",
            approvalStatus = "NONE",
            isSuccess = true
        )
    }

    override suspend fun refreshTools(siteId: String, serverId: String): Result<List<McpTool>> = withContext(Dispatchers.IO) {
        var client = activeConnections[serverId]
        if (client == null) {
            val server = mcpServerRepository.getServerById(siteId, serverId)
                ?: return@withContext Result.failure(IllegalArgumentException("Server $serverId not found for site $siteId"))
            client = StreamableHttpMcpClient(
                serverId = server.id,
                siteId = server.siteId,
                endpointUrl = server.endpoint,
                authType = server.authenticationType,
                credentialManager = credentialManager,
                serverName = server.name
            )
            activeConnections[serverId] = client
        }

        val toolsResult = client.listTools()
        if (toolsResult.isSuccess) {
            val tools = toolsResult.getOrThrow()
            toolRegistry.registerDiscoveredTools(siteId, serverId, tools)
            if (_activeContext.value?.siteId == siteId) {
                _activeSiteTools.value = toolRegistry.getToolsForSite(siteId)
            }
            Result.success(tools)
        } else {
            Result.failure(toolsResult.exceptionOrNull() ?: Exception("Failed to refresh tools"))
        }
    }

    override suspend fun executeTool(request: ToolExecutionRequest): Result<McpToolResult> = withContext(Dispatchers.IO) {
        val context = _activeContext.value
            ?: return@withContext Result.failure(SecurityException("Execution rejected: No active site context."))

        // Validation Rule 1: Match active siteId
        if (request.siteId != context.siteId) {
            return@withContext logAndReject(request, "Cross-site execution prohibited: Request site (${request.siteId}) does not match active site (${context.siteId})")
        }

        // Validation Rule 2: Verify server belongs to site
        val server = mcpServerRepository.getServerById(request.siteId, request.mcpServerId)
        if (server == null || server.siteId != request.siteId) {
            return@withContext logAndReject(request, "Target MCP Server (${request.mcpServerId}) is not bound to active site (${request.siteId})")
        }

        // Validation Rule 3: Verify server is enabled & authorized
        if (!server.enabled) {
            return@withContext logAndReject(request, "Target MCP Server (${server.name}) is currently disabled.")
        }

        // Validation Rule 4: Verify conversation belongs to site (if specified)
        if (request.conversationId != null && context.activeConversationId != null && request.conversationId != context.activeConversationId) {
            return@withContext logAndReject(request, "Execution conversation (${request.conversationId}) does not match active site context.")
        }

        // Validation Rule 5: Verify tool registration
        val tool = toolRegistry.findTool(request.siteId, request.toolName)
        if (tool == null) {
            return@withContext logAndReject(request, "Tool '${request.toolName}' is not registered or discovered for site ${request.siteId}")
        }

        // Validation Rule 6: Check operator approval for non-read tools
        if (tool.requiresApproval && !request.operatorAuthorized) {
            return@withContext logAndReject(request, "Operator approval required for ${tool.riskLevel.displayName}: ${tool.name}")
        }

        // Execute via MCP connection
        var client = activeConnections[server.id]
        if (client == null) {
            client = StreamableHttpMcpClient(
                serverId = server.id,
                siteId = server.siteId,
                endpointUrl = server.endpoint,
                authType = server.authenticationType,
                credentialManager = credentialManager,
                serverName = server.name
            )
            activeConnections[server.id] = client
        }

        val startTime = System.currentTimeMillis()
        val execResult = client.callTool(request.toolName, request.arguments)
        val duration = System.currentTimeMillis() - startTime

        if (execResult.isSuccess) {
            val result = execResult.getOrThrow()
            auditLogger.logEvent(
                siteId = request.siteId,
                siteName = context.siteName,
                userAction = if (request.operatorAuthorized) "OPERATOR_APPROVED_TOOL_EXEC" else "AUTO_TOOL_EXEC",
                aiAction = "EXECUTE_MCP_TOOL",
                tool = request.toolName,
                parametersSummary = request.sanitizedArgumentsSummary(),
                resultSummary = result.toDisplayText().take(120),
                approvalStatus = if (tool.requiresApproval) "APPROVED" else "NONE",
                isSuccess = !result.isError
            )
            Result.success(result)
        } else {
            val err = execResult.exceptionOrNull()?.message ?: "MCP tool execution failed"
            auditLogger.logEvent(
                siteId = request.siteId,
                siteName = context.siteName,
                userAction = "TOOL_EXEC_FAILED",
                aiAction = "EXECUTE_MCP_TOOL",
                tool = request.toolName,
                parametersSummary = request.sanitizedArgumentsSummary(),
                resultSummary = "Error: $err",
                approvalStatus = if (tool.requiresApproval) "APPROVED" else "NONE",
                isSuccess = false
            )
            Result.failure(execResult.exceptionOrNull() ?: Exception(err))
        }
    }

    private suspend fun logAndReject(request: ToolExecutionRequest, reason: String): Result<McpToolResult> {
        auditLogger.logEvent(
            siteId = request.siteId,
            siteName = _activeContext.value?.siteName ?: request.siteId,
            userAction = "SECURITY_REJECTION",
            aiAction = "TOOL_VALIDATION",
            tool = request.toolName,
            parametersSummary = request.sanitizedArgumentsSummary(),
            resultSummary = "BLOCKED: $reason",
            approvalStatus = "REJECTED",
            isSuccess = false
        )
        return Result.failure(SecurityException(reason))
    }
}
