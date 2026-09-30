package ke.imperialenterprise.imperialai.domain.agent

import ke.imperialenterprise.imperialai.domain.model.*
import ke.imperialenterprise.imperialai.domain.repository.*

/**
 * Validates the 8 mandatory security isolation rules before ANY tool execution is allowed.
 * 
 * Strict Client Isolation Rules:
 * 1. Active site exists in [SiteRepository].
 * 2. Active conversation belongs to active site.
 * 3. MCP server belongs to active site.
 * 4. Tool belongs to MCP server.
 * 5. Tool belongs to active site.
 * 6. MCP server is currently connected and enabled.
 * 7. Required credentials belong to that MCP server.
 * 8. Tool is currently registered in [ToolRegistry].
 * 
 * If ANY rule fails:
 * Execution is blocked immediately, an audit event is logged, and NO remote request is made.
 */
class ToolSecurityValidator(
    private val siteRepository: SiteRepository,
    private val conversationRepository: ConversationRepository,
    private val mcpServerRepository: McpServerRepository,
    private val toolRegistry: ToolRegistry,
    private val credentialStore: CredentialStore
) {
    sealed class SecurityCheckResult {
        object Allowed : SecurityCheckResult()
        data class Denied(
            val ruleNumber: Int,
            val ruleName: String,
            val technicalDetails: String,
            val safeAgentErrorMessage: String
        ) : SecurityCheckResult()
    }

    suspend fun verifyToolExecution(
        context: ActiveSiteContext,
        targetServerId: String,
        targetToolName: String
    ): SecurityCheckResult {
        // Rule 1: Active site exists
        val site = siteRepository.getSiteById(context.siteId)
        if (site == null) {
            return SecurityCheckResult.Denied(
                ruleNumber = 1,
                ruleName = "ActiveSiteExists",
                technicalDetails = "Site with ID '${context.siteId}' does not exist in SiteRepository.",
                safeAgentErrorMessage = "Security Rejection [Rule 1]: The target client site does not exist or has been deleted."
            )
        }

        // Rule 2: Active conversation belongs to active site
        if (!context.activeConversationId.isNullOrBlank()) {
            val conv = conversationRepository.getConversation(context.activeConversationId)
            if (conv != null && conv.siteId != context.siteId) {
                return SecurityCheckResult.Denied(
                    ruleNumber = 2,
                    ruleName = "ConversationBelongsToSite",
                    technicalDetails = "Conversation '${context.activeConversationId}' belongs to site '${conv.siteId}', but active site is '${context.siteId}'.",
                    safeAgentErrorMessage = "Security Rejection [Rule 2]: Conversation context does not belong to active site."
                )
            }
        }

        // Rule 3: MCP server belongs to active site
        val server = mcpServerRepository.getServerById(context.siteId, targetServerId)
        if (server == null || server.siteId != context.siteId) {
            return SecurityCheckResult.Denied(
                ruleNumber = 3,
                ruleName = "ServerBelongsToSite",
                technicalDetails = "MCP Server '$targetServerId' is not registered or does not belong to site '${context.siteId}'.",
                safeAgentErrorMessage = "Security Rejection [Rule 3]: Target MCP Server is not bound to this client site."
            )
        }

        // Rule 8: Tool is currently registered
        val tool = toolRegistry.findTool(context.siteId, targetToolName)
        if (tool == null) {
            return SecurityCheckResult.Denied(
                ruleNumber = 8,
                ruleName = "ToolIsRegistered",
                technicalDetails = "Tool '$targetToolName' is not registered in ToolRegistry for site '${context.siteId}'.",
                safeAgentErrorMessage = "Security Rejection [Rule 8]: Tool '$targetToolName' is not currently registered or discovered."
            )
        }

        // Rule 4: Tool belongs to MCP server
        if (tool.serverId != targetServerId) {
            return SecurityCheckResult.Denied(
                ruleNumber = 4,
                ruleName = "ToolBelongsToServer",
                technicalDetails = "Tool '$targetToolName' is registered under server '${tool.serverId}', but execution requested for '$targetServerId'.",
                safeAgentErrorMessage = "Security Rejection [Rule 4]: Tool does not belong to requested MCP server."
            )
        }

        // Rule 5: Tool belongs to active site
        if (tool.siteId != context.siteId) {
            return SecurityCheckResult.Denied(
                ruleNumber = 5,
                ruleName = "ToolBelongsToSite",
                technicalDetails = "Tool '$targetToolName' is registered under site '${tool.siteId}', cross-site execution prohibited.",
                safeAgentErrorMessage = "Security Rejection [Rule 5]: Cross-site tool execution is prohibited."
            )
        }

        // Rule 6: MCP server is connected and enabled
        if (!server.enabled) {
            return SecurityCheckResult.Denied(
                ruleNumber = 6,
                ruleName = "ServerConnectedAndEnabled",
                technicalDetails = "MCP Server '${server.name}' ($targetServerId) is disabled.",
                safeAgentErrorMessage = "Security Rejection [Rule 6]: MCP Server '${server.name}' is currently disabled."
            )
        }
        if (server.connectionStatus != McpConnectionStatus.CONNECTED) {
            return SecurityCheckResult.Denied(
                ruleNumber = 6,
                ruleName = "ServerConnectedAndEnabled",
                technicalDetails = "MCP Server '${server.name}' ($targetServerId) has status '${server.connectionStatus}' (expected CONNECTED).",
                safeAgentErrorMessage = "Security Rejection [Rule 6]: MCP Server '${server.name}' is disconnected or offline."
            )
        }

        // Rule 7: Required credentials belong to that MCP server
        if (server.authenticationType == McpAuthType.BEARER_TOKEN) {
            val token = credentialStore.getMcpBearerToken(context.siteId, server.id)
            if (token.isNullOrBlank()) {
                return SecurityCheckResult.Denied(
                    ruleNumber = 7,
                    ruleName = "ServerCredentialsValid",
                    technicalDetails = "Server requires Bearer token, but no token is found in Keystore for site '${context.siteId}' and server '${server.id}'.",
                    safeAgentErrorMessage = "Security Rejection [Rule 7]: Missing authorization credentials for target MCP server."
                )
            }
        }

        return SecurityCheckResult.Allowed
    }
}
