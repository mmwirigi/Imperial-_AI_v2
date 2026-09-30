package ke.imperialenterprise.imperialai.domain.wordpress

/**
 * Command palette item for active WordPress operations (Section 24).
 */
data class WordPressCommand(
    val id: String,
    val title: String,
    val description: String,
    val category: CapabilityCategory,
    val requiredCapabilityId: String,
    val promptTemplate: String,
    val isDestructive: Boolean = false
)

/**
 * Dynamic registry exposing only commands supported by discovered capabilities (Section 24).
 */
object WordPressCommandRegistry {

    private val ALL_COMMANDS = listOf(
        WordPressCommand(
            id = "cmd_audit_site",
            title = "Audit this site",
            description = "Run complete read-only health and configuration audit",
            category = CapabilityCategory.SITE,
            requiredCapabilityId = WordPressCapability.SITE_HEALTH_READ,
            promptTemplate = "Please perform a comprehensive read-only site health audit for this WordPress site."
        ),
        WordPressCommand(
            id = "cmd_list_plugins",
            title = "Show installed plugins",
            description = "Inventory active and inactive WordPress plugins",
            category = CapabilityCategory.PLUGINS,
            requiredCapabilityId = WordPressCapability.PLUGIN_READ,
            promptTemplate = "List all active and inactive plugins with their versions and status."
        ),
        WordPressCommand(
            id = "cmd_seo_audit",
            title = "Find pages missing meta descriptions",
            description = "Audit SEO metadata and identify missing descriptions",
            category = CapabilityCategory.SEO,
            requiredCapabilityId = WordPressCapability.SEO_READ,
            promptTemplate = "Find all published pages and posts that are missing meta descriptions or SEO focus keywords."
        ),
        WordPressCommand(
            id = "cmd_list_posts",
            title = "List published posts",
            description = "Display recent posts and publication dates",
            category = CapabilityCategory.POSTS,
            requiredCapabilityId = WordPressCapability.POST_READ,
            promptTemplate = "List the 10 most recent posts with their publication status and categories."
        ),
        WordPressCommand(
            id = "cmd_media_alt",
            title = "Find images without alt text",
            description = "Inspect media library for accessibility and SEO image tags",
            category = CapabilityCategory.MEDIA,
            requiredCapabilityId = WordPressCapability.MEDIA_READ,
            promptTemplate = "Inspect the media library and report image attachments that are missing alt-text descriptions."
        ),
        WordPressCommand(
            id = "cmd_check_backups",
            title = "Show available backups",
            description = "Verify backup availability before making changes",
            category = CapabilityCategory.BACKUPS,
            requiredCapabilityId = WordPressCapability.BACKUP_CREATE,
            promptTemplate = "Inspect available backup snapshots and check if preflight backups are ready."
        ),
        WordPressCommand(
            id = "cmd_check_booking",
            title = "Show booking availability",
            description = "Inspect room inventory and current reservations",
            category = CapabilityCategory.BOOKING,
            requiredCapabilityId = WordPressCapability.BOOKING_READ,
            promptTemplate = "Query room availability and current booking calendar."
        ),
        WordPressCommand(
            id = "cmd_inspect_elementor",
            title = "Inspect Elementor homepage",
            description = "Analyze Elementor sections, widgets, and headings",
            category = CapabilityCategory.ELEMENTOR,
            requiredCapabilityId = WordPressCapability.ELEMENTOR_READ,
            promptTemplate = "Inspect the Elementor layout and widget structure of the homepage."
        ),
        WordPressCommand(
            id = "cmd_list_forms",
            title = "Find forms and fields",
            description = "Inspect configured forms and fields",
            category = CapabilityCategory.FORMS,
            requiredCapabilityId = WordPressCapability.FORMS_READ,
            promptTemplate = "List all configured forms and summarize their input fields."
        ),
        WordPressCommand(
            id = "cmd_woo_products",
            title = "Show WooCommerce products",
            description = "List store products, stock levels, and pricing",
            category = CapabilityCategory.WOOCOMMERCE,
            requiredCapabilityId = WordPressCapability.WOOCOMMERCE_READ,
            promptTemplate = "Query WooCommerce store inventory and list products with low stock."
        ),
        WordPressCommand(
            id = "cmd_learnpress_courses",
            title = "Show LearnPress courses",
            description = "Inspect course catalog and student enrollment totals",
            category = CapabilityCategory.LEARNPRESS,
            requiredCapabilityId = WordPressCapability.LEARNPRESS_READ,
            promptTemplate = "List active LearnPress courses, lesson counts, and enrollment stats."
        )
    )

    /**
     * Filters commands strictly to those supported by discovered capabilities on the active site.
     */
    fun getAvailableCommands(capabilities: List<WordPressCapability>): List<WordPressCommand> {
        val availableIds = capabilities.filter { it.available }.map { it.id }.toSet()
        return ALL_COMMANDS.filter { availableIds.contains(it.requiredCapabilityId) }
    }
}
