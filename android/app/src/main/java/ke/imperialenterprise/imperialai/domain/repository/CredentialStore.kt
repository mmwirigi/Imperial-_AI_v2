package ke.imperialenterprise.imperialai.domain.repository

/**
 * Security abstraction for managing sensitive credentials (OpenRouter API keys,
 * WordPress Application Passwords, and MCP Bearer Tokens).
 * 
 * NEVER store secrets in plain SharedPreferences, SQLite, or logs!
 * Backed by Android Keystore / EncryptedSharedPreferences.
 */
interface CredentialStore {
    suspend fun getOpenRouterApiKey(): String?
    suspend fun setOpenRouterApiKey(apiKey: String)
    suspend fun clearOpenRouterApiKey()
    suspend fun hasOpenRouterApiKey(): Boolean
    suspend fun getMaskedOpenRouterApiKey(): String?

    /**
     * Site + Server scoped MCP Bearer Token storage:
     * Guarantees Site A credentials cannot be accessed by Site B, and
     * Server 1 cannot access Server 2's credentials even within the same site.
     */
    suspend fun getMcpServerBearerToken(siteId: String, serverId: String): String?
    suspend fun setMcpServerBearerToken(siteId: String, serverId: String, token: String)
    suspend fun clearMcpServerBearerToken(siteId: String, serverId: String)
    suspend fun getMaskedMcpServerToken(siteId: String, serverId: String): String?
    suspend fun hasMcpServerToken(siteId: String, serverId: String): Boolean

    /**
     * Site-isolated legacy credential getters (Phase 1):
     */
    suspend fun getSiteMcpToken(siteId: String): String?
    suspend fun setSiteMcpToken(siteId: String, token: String)

    suspend fun getWordPressAppPassword(siteId: String): String?
    suspend fun setWordPressAppPassword(siteId: String, password: String)

    suspend fun clearSiteCredentials(siteId: String)
    
    /**
     * Diagnostic check confirming hardware-backed Keystore availability (TEE/StrongBox).
     */
    fun isHardwareBackedKeystoreAvailable(): Boolean
}
