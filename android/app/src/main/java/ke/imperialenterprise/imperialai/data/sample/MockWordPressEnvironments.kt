package ke.imperialenterprise.imperialai.data.sample

import ke.imperialenterprise.imperialai.domain.model.McpTool
import ke.imperialenterprise.imperialai.domain.model.McpToolAnnotations
import ke.imperialenterprise.imperialai.domain.model.Site
import ke.imperialenterprise.imperialai.domain.model.ToolRiskLevel

/**
 * Mock WordPress environment datasets demonstrating heterogeneous site stacks (Section 37).
 * Proves that each site discovers only its actual installed capabilities:
 * - Site A: Elementor Pro + Rank Math SEO + Fluent Forms Pro
 * - Site B: WooCommerce + Yoast SEO + Contact Form 7
 * - Site C: LearnPress LMS + Gutenberg + Native SEO
 * - Site D: MotoPress Hotel Booking + Gutenberg
 */
object MockWordPressEnvironments {

    // -------------------------------------------------------------
    // SITE A: Juba Raha Paradise Hotel (Elementor, Rank Math, Fluent Forms)
    // -------------------------------------------------------------
    val SITE_A_TOOLS = listOf(
        McpTool(
            name = "wp_get_site_health",
            title = "Inspect Site Health",
            description = "Read WordPress 6.7 environment and PHP 8.2 indicators",
            serverId = "mcp_jubarah",
            siteId = "site_juba",
            riskLevel = ToolRiskLevel.READ,
            requiresApproval = false,
            annotations = McpToolAnnotations(readOnly = true)
        ),
        McpTool(
            name = "wp_list_posts",
            title = "List Hotel Articles",
            description = "List published blog posts and promotions",
            serverId = "mcp_jubarah",
            siteId = "site_juba",
            riskLevel = ToolRiskLevel.READ,
            requiresApproval = false
        ),
        McpTool(
            name = "wp_update_post",
            title = "Update Post Content",
            description = "Update existing post content and publishing state",
            serverId = "mcp_jubarah",
            siteId = "site_juba",
            riskLevel = ToolRiskLevel.HIGH_RISK_WRITE,
            requiresApproval = true
        ),
        McpTool(
            name = "elementor_inspect_page",
            title = "Inspect Elementor Structure",
            description = "Read Elementor sections, widgets, containers, and headings",
            serverId = "mcp_jubarah",
            siteId = "site_juba",
            riskLevel = ToolRiskLevel.READ,
            requiresApproval = false
        ),
        McpTool(
            name = "elementor_update_widget",
            title = "Update Elementor Widget",
            description = "Update headings or buttons inside an Elementor container",
            serverId = "mcp_jubarah",
            siteId = "site_juba",
            riskLevel = ToolRiskLevel.HIGH_RISK_WRITE,
            requiresApproval = true
        ),
        McpTool(
            name = "rank_math_read_seo",
            title = "Read Rank Math SEO",
            description = "Inspect meta titles, descriptions, focus keywords, and schemas",
            serverId = "mcp_jubarah",
            siteId = "site_juba",
            riskLevel = ToolRiskLevel.READ,
            requiresApproval = false
        ),
        McpTool(
            name = "rank_math_update_seo",
            title = "Update Rank Math SEO",
            description = "Modify SEO title, meta description, and social share cards",
            serverId = "mcp_jubarah",
            siteId = "site_juba",
            riskLevel = ToolRiskLevel.HIGH_RISK_WRITE,
            requiresApproval = true
        ),
        McpTool(
            name = "fluent_forms_list",
            title = "List Fluent Forms",
            description = "Query contact and banquet inquiry forms and fields",
            serverId = "mcp_jubarah",
            siteId = "site_juba",
            riskLevel = ToolRiskLevel.READ,
            requiresApproval = false
        ),
        McpTool(
            name = "wp_backup_create_snapshot",
            title = "Create Snapshot Backup",
            description = "Create an on-demand database and uploads snapshot",
            serverId = "mcp_jubarah",
            siteId = "site_juba",
            riskLevel = ToolRiskLevel.HIGH_RISK_WRITE,
            requiresApproval = true
        )
    )

    // -------------------------------------------------------------
    // SITE B: Debrazz Security Systems (WooCommerce, Yoast SEO, CF7)
    // -------------------------------------------------------------
    val SITE_B_TOOLS = listOf(
        McpTool(
            name = "wp_get_site_health",
            description = "Read core status for Debrazz Security",
            serverId = "mcp_debrazz",
            siteId = "site_debrazz",
            riskLevel = ToolRiskLevel.READ,
            requiresApproval = false
        ),
        McpTool(
            name = "woocommerce_list_products",
            title = "List Security Products",
            description = "Query CCTV cameras, access control hardware, and pricing",
            serverId = "mcp_debrazz",
            siteId = "site_debrazz",
            riskLevel = ToolRiskLevel.READ,
            requiresApproval = false
        ),
        McpTool(
            name = "woocommerce_update_stock",
            title = "Update Product Inventory",
            description = "Modify stock inventory quantities on WooCommerce",
            serverId = "mcp_debrazz",
            siteId = "site_debrazz",
            riskLevel = ToolRiskLevel.HIGH_RISK_WRITE,
            requiresApproval = true
        ),
        McpTool(
            name = "yoast_read_seo",
            title = "Read Yoast SEO Metadata",
            description = "Query Yoast canonical tags, robots index status, and snippets",
            serverId = "mcp_debrazz",
            siteId = "site_debrazz",
            riskLevel = ToolRiskLevel.READ,
            requiresApproval = false
        ),
        McpTool(
            name = "yoast_update_seo",
            title = "Update Yoast SEO Metadata",
            description = "Update Yoast meta description and social OpenGraph tags",
            serverId = "mcp_debrazz",
            siteId = "site_debrazz",
            riskLevel = ToolRiskLevel.HIGH_RISK_WRITE,
            requiresApproval = true
        ),
        McpTool(
            name = "wp_list_plugins",
            description = "Inventory active security plugins",
            serverId = "mcp_debrazz",
            siteId = "site_debrazz",
            riskLevel = ToolRiskLevel.READ,
            requiresApproval = false
        )
    )

    // -------------------------------------------------------------
    // SITE C: Anthony Gatune Foundation (LearnPress LMS)
    // -------------------------------------------------------------
    val SITE_C_TOOLS = listOf(
        McpTool(
            name = "wp_get_site_health",
            description = "Read foundation environment indicators",
            serverId = "mcp_gatune",
            siteId = "site_gatune",
            riskLevel = ToolRiskLevel.READ,
            requiresApproval = false
        ),
        McpTool(
            name = "learnpress_list_courses",
            title = "List Academy Courses",
            description = "Inspect scholarship courses, lessons, and student enrollment counts",
            serverId = "mcp_gatune",
            siteId = "site_gatune",
            riskLevel = ToolRiskLevel.READ,
            requiresApproval = false
        ),
        McpTool(
            name = "wp_list_pages",
            title = "List Foundation Pages",
            description = "Read charity static pages and disclosure reports",
            serverId = "mcp_gatune",
            siteId = "site_gatune",
            riskLevel = ToolRiskLevel.READ,
            requiresApproval = false
        ),
        McpTool(
            name = "wp_update_page",
            title = "Update Foundation Page",
            description = "Modify public charity disclosure and scholarship details",
            serverId = "mcp_gatune",
            siteId = "site_gatune",
            riskLevel = ToolRiskLevel.HIGH_RISK_WRITE,
            requiresApproval = true
        )
    )

    // -------------------------------------------------------------
    // SITE D: Resource Kenya (MotoPress Hotel Booking)
    // -------------------------------------------------------------
    val SITE_D_TOOLS = listOf(
        McpTool(
            name = "wp_get_site_health",
            description = "Read Resource Kenya core indicators",
            serverId = "mcp_resource",
            siteId = "site_resource",
            riskLevel = ToolRiskLevel.READ,
            requiresApproval = false
        ),
        McpTool(
            name = "motopress_check_availability",
            title = "Check Room Availability",
            description = "Query safari lodge rooms and seasonal booking calendar",
            serverId = "mcp_resource",
            siteId = "site_resource",
            riskLevel = ToolRiskLevel.READ,
            requiresApproval = false
        ),
        McpTool(
            name = "motopress_list_bookings",
            title = "List Reservations",
            description = "Query upcoming safari reservations and guest check-ins",
            serverId = "mcp_resource",
            siteId = "site_resource",
            riskLevel = ToolRiskLevel.READ,
            requiresApproval = false
        )
    )
}
