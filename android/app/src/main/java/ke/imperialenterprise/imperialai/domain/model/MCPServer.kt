package ke.imperialenterprise.imperialai.domain.model

import java.util.UUID

/**
 * Model representing a remote Model Context Protocol (MCP) server.
 * 
 * Strict Site Boundary Rule:
 * Every MCP Server MUST belong to a specific Site (`siteId`).
 * Cross-site execution is strictly rejected by the ToolRegistry and McpManager.
 * 
 * Security Rule:
 * Secrets and Bearer tokens are NEVER stored in this model.
 * They are sealed in CredentialStore keyed by `(siteId, serverId)`.
 */
data class MCPServer(
    val id: String = UUID.randomUUID().toString(),
    val name: String,
    val endpoint: String,
    val description: String = "",
    val siteId: String,
    val enabled: Boolean = true,
    val connectionStatus: McpConnectionStatus = McpConnectionStatus.NOT_CONFIGURED,
    val transport: McpTransportType = McpTransportType.STREAMABLE_HTTP,
    val authenticationType: McpAuthType = McpAuthType.NONE,
    val lastConnected: String? = null,
    val lastError: String? = null,
    val serverInfo: McpServerInfo? = null,
    val protocolVersion: String? = null,
    val capabilities: McpServerCapabilities? = null,
    val discoveredToolsCount: Int = 0,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
    val isDemo: Boolean = false
)

enum class McpConnectionStatus(val displayName: String) {
    NOT_CONFIGURED("Not Configured"),
    CONNECTING("Connecting..."),
    CONNECTED("Connected"),
    DISCONNECTED("Disconnected"),
    AUTH_REQUIRED("Authentication Required"),
    AUTHENTICATING("Authenticating..."),
    ERROR("Connection Error"),
    SESSION_EXPIRED("Session Expired")
}

enum class McpAuthType(val displayName: String) {
    NONE("No Authentication (Open / LAN)"),
    BEARER_TOKEN("Bearer Token (Header)"),
    OAUTH2("OAuth 2.0 with PKCE")
}

data class McpServerInfo(
    val name: String,
    val version: String
)

data class McpServerCapabilities(
    val tools: Boolean = true,
    val prompts: Boolean = false,
    val resources: Boolean = false,
    val logging: Boolean = false
)
