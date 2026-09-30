package ke.imperialenterprise.imperialai.domain.model

/**
 * Strict context boundary object identifying the currently active client site.
 * 
 * Invariant: Every tool execution MUST strictly validate against this context.
 */
data class ActiveSiteContext(
    val siteId: String,
    val siteName: String,
    val websiteUrl: String,
    val activeMcpServerId: String? = null,
    val activeConversationId: String? = null
)
