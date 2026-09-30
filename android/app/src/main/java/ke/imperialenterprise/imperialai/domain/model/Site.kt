package ke.imperialenterprise.imperialai.domain.model

import java.time.Instant
import java.util.UUID

/**
 * Site domain model representing a WordPress client website.
 * Enforces strict site boundary isolation across tasks, chat sessions, and MCP credentials.
 */
data class Site(
    val id: String = UUID.randomUUID().toString(),
    val siteName: String,
    val websiteUrl: String,
    val clientCompanyName: String,
    val mcpEndpoint: String = "",
    val mcpStatus: McpStatus = McpStatus.DISCONNECTED,
    val wordPressType: WordPressType = WordPressType.SELF_HOSTED,
    val seoPlugin: SeoPlugin = SeoPlugin.YOAST,
    val pageBuilder: PageBuilder = PageBuilder.GUTENBERG,
    val notes: String = "",
    val aiInstructions: String = "",
    val permissionPolicy: PermissionPolicy = PermissionPolicy(siteId = id),
    val lastConnection: String = "Never",
    val lastActivity: String = "No recorded activity",
    val isDemo: Boolean = false
)

enum class McpStatus {
    CONNECTED,
    DISCONNECTED,
    CONNECTING,
    ERROR
}

enum class WordPressType(val displayName: String) {
    SELF_HOSTED("WordPress.org (Self-Hosted)"),
    WORDPRESS_COM("WordPress.com VIP/Cloud"),
    HEADLESS("Headless WordPress (GraphQL/REST)"),
    MULTISITE("WordPress Multisite Network")
}

enum class SeoPlugin(val displayName: String) {
    YOAST("Yoast SEO"),
    RANK_MATH("Rank Math SEO"),
    AIO_SEO("All in One SEO"),
    THE_SEO_FRAMEWORK("The SEO Framework"),
    NONE("None / Custom")
}

enum class PageBuilder(val displayName: String) {
    GUTENBERG("Block Editor (Gutenberg)"),
    ELEMENTOR("Elementor Pro"),
    DIVI("Divi Builder"),
    BEAVER_BUILDER("Beaver Builder"),
    BRICKS("Bricks Builder"),
    NONE("Classic / Code Only")
}
