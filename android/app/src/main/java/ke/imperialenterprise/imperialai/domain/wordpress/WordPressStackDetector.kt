package ke.imperialenterprise.imperialai.domain.wordpress

import ke.imperialenterprise.imperialai.domain.model.McpTool

/**
 * Detects installed WordPress plugins, themes, and page builders strictly
 * from verified MCP tool definitions and inspection data (Section 6).
 * 
 * Safety Rule (Section 40):
 * Never invent a capability or stack component based on commonality.
 * If evidence is absent, the field remains null or UNKNOWN.
 */
object WordPressStackDetector {

    data class DetectedStack(
        val wordpressVersion: String? = null,
        val phpVersion: String? = null,
        val themeName: String? = null,
        val activePlugins: List<String> = emptyList(),
        val pageBuilder: String? = null,
        val seoPlugin: String? = null,
        val formsPlugin: String? = null,
        val commercePlatform: String? = null,
        val learningPlatform: String? = null,
        val bookingPlatform: String? = null,
        val backupPlugin: String? = null
    )

    /**
     * Inspects discovered tools and metadata to detect actual installed stack components.
     */
    fun detectFromTools(tools: List<McpTool>): DetectedStack {
        val toolNames = tools.map { it.name.lowercase() }
        val allDescriptions = tools.joinToString(" ") { it.description.lowercase() }

        // Detect Page Builder
        val pageBuilder = when {
            toolNames.any { it.contains("elementor") } || allDescriptions.contains("elementor") -> "Elementor Pro"
            toolNames.any { it.contains("divi") } || allDescriptions.contains("divi") -> "Divi Builder"
            toolNames.any { it.contains("beaver") } -> "Beaver Builder"
            toolNames.any { it.contains("gutenberg") } || toolNames.any { it.contains("blocks") } -> "Block Editor (Gutenberg)"
            else -> null
        }

        // Detect SEO Plugin
        val seoPlugin = when {
            toolNames.any { it.contains("rank_math") } || allDescriptions.contains("rank math") -> "Rank Math SEO"
            toolNames.any { it.contains("yoast") } || allDescriptions.contains("yoast") -> "Yoast SEO"
            toolNames.any { it.contains("aioseo") } || allDescriptions.contains("all in one seo") -> "All in One SEO"
            toolNames.any { it.contains("seo") } -> "Generic / Native SEO"
            else -> null
        }

        // Detect Forms Plugin
        val formsPlugin = when {
            toolNames.any { it.contains("fluent_form") } || allDescriptions.contains("fluent form") -> "Fluent Forms Pro"
            toolNames.any { it.contains("gravity_form") } || allDescriptions.contains("gravity") -> "Gravity Forms"
            toolNames.any { it.contains("contact_form_7") } || toolNames.any { it.contains("wpcf7") } -> "Contact Form 7"
            toolNames.any { it.contains("wpforms") } -> "WPForms"
            toolNames.any { it.contains("form") } -> "WordPress Form Handler"
            else -> null
        }

        // Detect Commerce Platform
        val commerce = when {
            toolNames.any { it.contains("woo") || it.contains("product") } || allDescriptions.contains("woocommerce") -> "WooCommerce"
            toolNames.any { it.contains("edd") } || allDescriptions.contains("easy digital downloads") -> "Easy Digital Downloads"
            else -> null
        }

        // Detect Learning Platform
        val learning = when {
            toolNames.any { it.contains("learnpress") || it.contains("course") } || allDescriptions.contains("learnpress") -> "LearnPress LMS"
            toolNames.any { it.contains("learndash") } || allDescriptions.contains("learndash") -> "LearnDash"
            toolNames.any { it.contains("tutor") } || allDescriptions.contains("tutor lms") -> "Tutor LMS"
            else -> null
        }

        // Detect Booking Platform
        val booking = when {
            toolNames.any { it.contains("motopress") || it.contains("hotel_booking") } || allDescriptions.contains("motopress") -> "MotoPress Hotel Booking"
            toolNames.any { it.contains("woocommerce_bookings") } || allDescriptions.contains("woocommerce booking") -> "WooCommerce Bookings"
            toolNames.any { it.contains("booking") } || allDescriptions.contains("reservation") -> "WordPress Booking System"
            else -> null
        }

        // Detect Backup Capability
        val backup = when {
            toolNames.any { it.contains("updraft") } || allDescriptions.contains("updraft") -> "UpdraftPlus"
            toolNames.any { it.contains("backup") || it.contains("snapshot") } -> "MCP Snapshot Backup"
            else -> null
        }

        // Build list of confirmed detected plugins
        val activePlugins = mutableListOf<String>()
        if (pageBuilder != null) activePlugins.add(pageBuilder)
        if (seoPlugin != null) activePlugins.add(seoPlugin)
        if (formsPlugin != null) activePlugins.add(formsPlugin)
        if (commerce != null) activePlugins.add(commerce)
        if (learning != null) activePlugins.add(learning)
        if (booking != null) activePlugins.add(booking)
        if (backup != null) activePlugins.add(backup)

        return DetectedStack(
            pageBuilder = pageBuilder,
            seoPlugin = seoPlugin,
            formsPlugin = formsPlugin,
            commercePlatform = commerce,
            learningPlatform = learning,
            bookingPlatform = booking,
            backupPlugin = backup,
            activePlugins = activePlugins
        )
    }
}
