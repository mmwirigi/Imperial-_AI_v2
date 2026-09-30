package ke.imperialenterprise.imperialai.data.mcp

import ke.imperialenterprise.imperialai.domain.model.McpAuthType
import ke.imperialenterprise.imperialai.domain.repository.CredentialStore

/**
 * Manages MCP connection authentication headers and tokens with strict client isolation.
 * 
 * Never logs or serializes authorization headers.
 */
class McpCredentialManager(
    private val credentialStore: CredentialStore
) {
    suspend fun getAuthorizationHeader(siteId: String, serverId: String, authType: McpAuthType): String? {
        return when (authType) {
            McpAuthType.NONE -> null
            McpAuthType.BEARER_TOKEN -> {
                val token = credentialStore.getMcpServerBearerToken(siteId, serverId)
                    ?: credentialStore.getSiteMcpToken(siteId)
                if (!token.isNullOrBlank()) "Bearer $token" else null
            }
            McpAuthType.OAUTH2 -> {
                val token = credentialStore.getMcpServerBearerToken(siteId, serverId)
                if (!token.isNullOrBlank()) "Bearer $token" else null
            }
        }
    }

    suspend fun setBearerToken(siteId: String, serverId: String, token: String) {
        credentialStore.setMcpServerBearerToken(siteId, serverId, token)
    }

    suspend fun clearToken(siteId: String, serverId: String) {
        credentialStore.clearMcpServerBearerToken(siteId, serverId)
    }

    suspend fun getMaskedToken(siteId: String, serverId: String): String? {
        return credentialStore.getMaskedMcpServerToken(siteId, serverId)
    }

    suspend fun hasCredential(siteId: String, serverId: String): Boolean {
        return credentialStore.hasMcpServerToken(siteId, serverId)
    }
}
