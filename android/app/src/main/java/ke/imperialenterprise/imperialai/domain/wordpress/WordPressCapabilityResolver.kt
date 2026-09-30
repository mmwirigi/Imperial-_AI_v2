package ke.imperialenterprise.imperialai.domain.wordpress

import ke.imperialenterprise.imperialai.domain.model.McpTool
import ke.imperialenterprise.imperialai.domain.model.ToolRiskLevel

/**
 * Resolves discovered MCP tools into normalized WordPress capabilities (Section 4).
 * Uses conservative matching across tool names, descriptions, input schemas, and metadata.
 * 
 * Safety Principle (Section 40):
 * Never guess. If uncertain, tool is mapped to UNKNOWN or omitted.
 */
object WordPressCapabilityResolver {

    /**
     * Resolves all discovered tools for a site into normalized capabilities.
     */
    fun resolveCapabilities(tools: List<McpTool>): List<WordPressCapability> {
        val capabilityMap = mutableMapOf<String, MutableList<McpTool>>()

        for (tool in tools) {
            val capId = matchToolToCapabilityId(tool) ?: continue
            capabilityMap.getOrPut(capId) { mutableListOf() }.add(tool)
        }

        val results = mutableListOf<WordPressCapability>()

        // Build WordPressCapability definitions for all matches
        for ((capId, matchedTools) in capabilityMap) {
            val def = createCapabilityDefinition(capId, matchedTools)
            results.add(def)
        }

        return results.sortedBy { it.category.ordinal }
    }

    /**
     * Conservative matching mapping a single McpTool to a capability ID.
     */
    fun matchToolToCapabilityId(tool: McpTool): String? {
        val name = tool.name.lowercase()
        val desc = tool.description.lowercase()

        // 1. Site Health & Environment
        if (name.contains("site_health") || name.contains("get_system_status") || desc.contains("site health")) {
            return WordPressCapability.SITE_HEALTH_READ
        }

        // 2. Posts
        if (name.contains("post")) {
            return when {
                name.contains("delete") || name.contains("trash") || desc.contains("delete post") -> WordPressCapability.POST_DELETE
                name.contains("create") || name.contains("insert") || name.contains("add_post") || desc.contains("create post") -> WordPressCapability.POST_CREATE
                name.contains("update") || name.contains("edit") || name.contains("publish") || desc.contains("update post") -> WordPressCapability.POST_UPDATE
                name.contains("get") || name.contains("list") || name.contains("read") || name.contains("search") || desc.contains("read post") || desc.contains("list post") -> WordPressCapability.POST_READ
                else -> null
            }
        }

        // 3. Pages
        if (name.contains("page")) {
            return when {
                name.contains("delete") || name.contains("trash") || desc.contains("delete page") -> WordPressCapability.PAGE_DELETE
                name.contains("create") || name.contains("insert") || name.contains("add_page") || desc.contains("create page") -> WordPressCapability.PAGE_CREATE
                name.contains("update") || name.contains("edit") || desc.contains("update page") -> WordPressCapability.PAGE_UPDATE
                name.contains("get") || name.contains("list") || name.contains("read") || desc.contains("read page") || desc.contains("list page") -> WordPressCapability.PAGE_READ
                else -> null
            }
        }

        // 4. Media
        if (name.contains("media") || name.contains("image") || name.contains("attachment")) {
            return when {
                name.contains("delete") || desc.contains("delete media") -> WordPressCapability.MEDIA_DELETE
                name.contains("upload") || name.contains("create") || desc.contains("upload media") -> WordPressCapability.MEDIA_UPLOAD
                name.contains("update") || name.contains("alt_text") || desc.contains("update media") || desc.contains("alt text") -> WordPressCapability.MEDIA_UPDATE
                name.contains("get") || name.contains("list") || name.contains("read") || desc.contains("list media") -> WordPressCapability.MEDIA_READ
                else -> null
            }
        }

        // 5. SEO (Yoast, Rank Math, AIO SEO)
        if (name.contains("seo") || name.contains("rank_math") || name.contains("yoast") || desc.contains("meta description") || desc.contains("seo title")) {
            return when {
                name.contains("update") || name.contains("set") || desc.contains("update seo") || desc.contains("set seo") -> WordPressCapability.SEO_UPDATE
                else -> WordPressCapability.SEO_READ
            }
        }

        // 6. Plugins
        if (name.contains("plugin")) {
            return when {
                name.contains("delete") || name.contains("uninstall") -> WordPressCapability.PLUGIN_DELETE
                name.contains("install") -> WordPressCapability.PLUGIN_INSTALL
                name.contains("activate") && !name.contains("deactivate") -> WordPressCapability.PLUGIN_ACTIVATE
                name.contains("deactivate") -> WordPressCapability.PLUGIN_DEACTIVATE
                else -> WordPressCapability.PLUGIN_READ
            }
        }

        // 7. Themes
        if (name.contains("theme")) {
            return when {
                name.contains("update") || name.contains("switch") || name.contains("install") -> WordPressCapability.THEME_UPDATE
                else -> WordPressCapability.THEME_READ
            }
        }

        // 8. Users
        if (name.contains("user")) {
            return when {
                name.contains("delete") -> WordPressCapability.USER_DELETE
                name.contains("create") || name.contains("add") -> WordPressCapability.USER_CREATE
                name.contains("role") -> WordPressCapability.USER_ROLE_CHANGE
                name.contains("update") -> WordPressCapability.USER_UPDATE
                else -> WordPressCapability.USER_READ
            }
        }

        // 9. Backups
        if (name.contains("backup") || name.contains("snapshot") || desc.contains("backup")) {
            return when {
                name.contains("restore") -> WordPressCapability.BACKUP_RESTORE
                else -> WordPressCapability.BACKUP_CREATE
            }
        }

        // 10. Forms (Fluent Forms, Gravity Forms, etc.)
        if (name.contains("form") || name.contains("fluent") || desc.contains("form submission")) {
            return when {
                name.contains("update") || name.contains("create") || name.contains("submit") -> WordPressCapability.FORMS_UPDATE
                else -> WordPressCapability.FORMS_READ
            }
        }

        // 11. WooCommerce
        if (name.contains("woo") || name.contains("product") || name.contains("order") || desc.contains("woocommerce")) {
            return when {
                name.contains("update") || name.contains("create") || name.contains("refund") -> WordPressCapability.WOOCOMMERCE_UPDATE
                else -> WordPressCapability.WOOCOMMERCE_READ
            }
        }

        // 12. LearnPress
        if (name.contains("course") || name.contains("lesson") || name.contains("quiz") || desc.contains("learnpress")) {
            return when {
                name.contains("update") || name.contains("create") -> WordPressCapability.LEARNPRESS_UPDATE
                else -> WordPressCapability.LEARNPRESS_READ
            }
        }

        // 13. Booking (MotoPress, Hotel Booking)
        if (name.contains("booking") || name.contains("reservation") || name.contains("room") || desc.contains("motopress")) {
            return when {
                name.contains("create") || name.contains("update") || name.contains("cancel") -> WordPressCapability.BOOKING_UPDATE
                else -> WordPressCapability.BOOKING_READ
            }
        }

        // 14. Elementor Page Builder
        if (name.contains("elementor") || desc.contains("elementor")) {
            return when {
                name.contains("update") || name.contains("save") -> WordPressCapability.ELEMENTOR_UPDATE
                else -> WordPressCapability.ELEMENTOR_READ
            }
        }

        return null
    }

    private fun createCapabilityDefinition(capId: String, tools: List<McpTool>): WordPressCapability {
        val toolNames = tools.map { it.name }
        val maxRisk = tools.maxOfOrNull { it.riskLevel } ?: ToolRiskLevel.HIGH_RISK_WRITE
        val requiresApproval = tools.any { it.requiresApproval } || maxRisk != ToolRiskLevel.READ

        return when (capId) {
            WordPressCapability.SITE_HEALTH_READ -> WordPressCapability(
                id = capId,
                name = "Inspect Site Health",
                category = CapabilityCategory.SITE,
                description = "Read-only inspection of WordPress core versions, PHP environment, and integrity indicators.",
                available = true,
                mcpToolNames = toolNames,
                requiredPermission = "READ",
                riskLevel = ToolRiskLevel.READ,
                requiresApproval = false,
                supportedOperations = listOf("read_status", "inspect_core", "check_health"),
                lastVerified = System.currentTimeMillis()
            )
            WordPressCapability.POST_READ -> WordPressCapability(
                id = capId,
                name = "Read & Search Posts",
                category = CapabilityCategory.POSTS,
                description = "Inspect and query published, drafted, and scheduled WordPress articles.",
                available = true,
                mcpToolNames = toolNames,
                requiredPermission = "READ",
                riskLevel = ToolRiskLevel.READ,
                requiresApproval = false,
                supportedOperations = listOf("list", "get", "search"),
                lastVerified = System.currentTimeMillis()
            )
            WordPressCapability.POST_UPDATE -> WordPressCapability(
                id = capId,
                name = "Update & Publish Posts",
                category = CapabilityCategory.POSTS,
                description = "Modify existing post metadata, content, categories, and publication state.",
                available = true,
                mcpToolNames = toolNames,
                requiredPermission = "WRITE",
                riskLevel = ToolRiskLevel.HIGH_RISK_WRITE,
                requiresApproval = true,
                supportedOperations = listOf("update", "publish", "set_status"),
                lastVerified = System.currentTimeMillis()
            )
            WordPressCapability.POST_DELETE -> WordPressCapability(
                id = capId,
                name = "Delete Posts",
                category = CapabilityCategory.POSTS,
                description = "Permanently delete or trash articles from the WordPress database.",
                available = true,
                mcpToolNames = toolNames,
                requiredPermission = "DESTRUCTIVE",
                riskLevel = ToolRiskLevel.DESTRUCTIVE,
                requiresApproval = true,
                supportedOperations = listOf("delete", "trash"),
                lastVerified = System.currentTimeMillis()
            )
            WordPressCapability.PAGE_READ -> WordPressCapability(
                id = capId,
                name = "Read & Search Pages",
                category = CapabilityCategory.PAGES,
                description = "Inspect WordPress hierarchy, page templates, and published static pages.",
                available = true,
                mcpToolNames = toolNames,
                requiredPermission = "READ",
                riskLevel = ToolRiskLevel.READ,
                requiresApproval = false,
                supportedOperations = listOf("list", "get"),
                lastVerified = System.currentTimeMillis()
            )
            WordPressCapability.PAGE_UPDATE -> WordPressCapability(
                id = capId,
                name = "Update Pages",
                category = CapabilityCategory.PAGES,
                description = "Modify content, attributes, and templates on existing static pages.",
                available = true,
                mcpToolNames = toolNames,
                requiredPermission = "WRITE",
                riskLevel = ToolRiskLevel.HIGH_RISK_WRITE,
                requiresApproval = true,
                supportedOperations = listOf("update", "set_template"),
                lastVerified = System.currentTimeMillis()
            )
            WordPressCapability.PAGE_DELETE -> WordPressCapability(
                id = capId,
                name = "Delete Pages",
                category = CapabilityCategory.PAGES,
                description = "Permanently remove pages from the WordPress site.",
                available = true,
                mcpToolNames = toolNames,
                requiredPermission = "DESTRUCTIVE",
                riskLevel = ToolRiskLevel.DESTRUCTIVE,
                requiresApproval = true,
                supportedOperations = listOf("delete"),
                lastVerified = System.currentTimeMillis()
            )
            WordPressCapability.SEO_READ -> WordPressCapability(
                id = capId,
                name = "Read SEO Metadata",
                category = CapabilityCategory.SEO,
                description = "Inspect meta titles, descriptions, canonical URLs, and schema indexing.",
                available = true,
                mcpToolNames = toolNames,
                requiredPermission = "READ",
                riskLevel = ToolRiskLevel.READ,
                requiresApproval = false,
                supportedOperations = listOf("read_meta", "audit_schema"),
                lastVerified = System.currentTimeMillis()
            )
            WordPressCapability.SEO_UPDATE -> WordPressCapability(
                id = capId,
                name = "Update SEO Metadata",
                category = CapabilityCategory.SEO,
                description = "Modify focus keyphrases, meta descriptions, and OpenGraph social share cards.",
                available = true,
                mcpToolNames = toolNames,
                requiredPermission = "WRITE",
                riskLevel = ToolRiskLevel.HIGH_RISK_WRITE,
                requiresApproval = true,
                supportedOperations = listOf("update_meta", "set_title", "set_description"),
                lastVerified = System.currentTimeMillis()
            )
            WordPressCapability.MEDIA_READ -> WordPressCapability(
                id = capId,
                name = "Inspect Media Library",
                category = CapabilityCategory.MEDIA,
                description = "List media attachments, dimensions, MIME types, and alt-text tags.",
                available = true,
                mcpToolNames = toolNames,
                requiredPermission = "READ",
                riskLevel = ToolRiskLevel.READ,
                requiresApproval = false,
                supportedOperations = listOf("list", "search", "get_metadata"),
                lastVerified = System.currentTimeMillis()
            )
            WordPressCapability.MEDIA_UPDATE -> WordPressCapability(
                id = capId,
                name = "Update Media Metadata & Alt Text",
                category = CapabilityCategory.MEDIA,
                description = "Modify image alt-text, captions, and descriptions for SEO and accessibility.",
                available = true,
                mcpToolNames = toolNames,
                requiredPermission = "WRITE",
                riskLevel = ToolRiskLevel.LOW_RISK_WRITE,
                requiresApproval = true,
                supportedOperations = listOf("set_alt_text", "set_caption"),
                lastVerified = System.currentTimeMillis()
            )
            WordPressCapability.PLUGIN_READ -> WordPressCapability(
                id = capId,
                name = "Inspect Installed Plugins",
                category = CapabilityCategory.PLUGINS,
                description = "List active and inactive WordPress plugins, versions, and update flags.",
                available = true,
                mcpToolNames = toolNames,
                requiredPermission = "READ",
                riskLevel = ToolRiskLevel.READ,
                requiresApproval = false,
                supportedOperations = listOf("list_plugins", "check_versions"),
                lastVerified = System.currentTimeMillis()
            )
            WordPressCapability.PLUGIN_ACTIVATE -> WordPressCapability(
                id = capId,
                name = "Activate / Deactivate Plugins",
                category = CapabilityCategory.PLUGINS,
                description = "Change active status of installed WordPress plugins.",
                available = true,
                mcpToolNames = toolNames,
                requiredPermission = "WRITE",
                riskLevel = ToolRiskLevel.HIGH_RISK_WRITE,
                requiresApproval = true,
                supportedOperations = listOf("activate", "deactivate"),
                lastVerified = System.currentTimeMillis()
            )
            WordPressCapability.BACKUP_CREATE -> WordPressCapability(
                id = capId,
                name = "Create Preflight Backup",
                category = CapabilityCategory.BACKUPS,
                description = "Capture an on-demand database or snapshot backup before performing mutations.",
                available = true,
                mcpToolNames = toolNames,
                requiredPermission = "WRITE",
                riskLevel = ToolRiskLevel.HIGH_RISK_WRITE,
                requiresApproval = true,
                supportedOperations = listOf("create_checkpoint", "snapshot"),
                lastVerified = System.currentTimeMillis()
            )
            WordPressCapability.BOOKING_READ -> WordPressCapability(
                id = capId,
                name = "Inspect Room & Booking Availability",
                category = CapabilityCategory.BOOKING,
                description = "Query room types, seasonal rates, dates, and reservations on booking platforms.",
                available = true,
                mcpToolNames = toolNames,
                requiredPermission = "READ",
                riskLevel = ToolRiskLevel.READ,
                requiresApproval = false,
                supportedOperations = listOf("check_availability", "list_rooms", "read_bookings"),
                lastVerified = System.currentTimeMillis()
            )
            WordPressCapability.WOOCOMMERCE_READ -> WordPressCapability(
                id = capId,
                name = "Inspect WooCommerce Catalog & Orders",
                category = CapabilityCategory.WOOCOMMERCE,
                description = "Query store products, SKU inventory, and order fulfillment states.",
                available = true,
                mcpToolNames = toolNames,
                requiredPermission = "READ",
                riskLevel = ToolRiskLevel.READ,
                requiresApproval = false,
                supportedOperations = listOf("list_products", "check_inventory", "list_orders"),
                lastVerified = System.currentTimeMillis()
            )
            WordPressCapability.LEARNPRESS_READ -> WordPressCapability(
                id = capId,
                name = "Inspect LearnPress Course Catalog",
                category = CapabilityCategory.LEARNPRESS,
                description = "Query active courses, modules, lessons, and student enrollment totals.",
                available = true,
                mcpToolNames = toolNames,
                requiredPermission = "READ",
                riskLevel = ToolRiskLevel.READ,
                requiresApproval = false,
                supportedOperations = listOf("list_courses", "read_curriculum"),
                lastVerified = System.currentTimeMillis()
            )
            WordPressCapability.FORMS_READ -> WordPressCapability(
                id = capId,
                name = "Inspect Forms & Submission Schemas",
                category = CapabilityCategory.FORMS,
                description = "Query configured forms, field keys, and notification routing configurations.",
                available = true,
                mcpToolNames = toolNames,
                requiredPermission = "READ",
                riskLevel = ToolRiskLevel.READ,
                requiresApproval = false,
                supportedOperations = listOf("list_forms", "read_fields"),
                lastVerified = System.currentTimeMillis()
            )
            WordPressCapability.ELEMENTOR_READ -> WordPressCapability(
                id = capId,
                name = "Inspect Elementor Structure",
                category = CapabilityCategory.ELEMENTOR,
                description = "Analyze page layout containers, sections, widgets, and headings.",
                available = true,
                mcpToolNames = toolNames,
                requiredPermission = "READ",
                riskLevel = ToolRiskLevel.READ,
                requiresApproval = false,
                supportedOperations = listOf("inspect_widgets", "read_sections"),
                lastVerified = System.currentTimeMillis()
            )
            else -> WordPressCapability(
                id = capId,
                name = capId.replace("_", " "),
                category = CapabilityCategory.OTHER,
                description = "Discovered operational capability mapped to tools: ${toolNames.joinToString(", ")}",
                available = true,
                mcpToolNames = toolNames,
                requiredPermission = if (maxRisk == ToolRiskLevel.READ) "READ" else "WRITE",
                riskLevel = maxRisk,
                requiresApproval = requiresApproval,
                supportedOperations = toolNames,
                lastVerified = System.currentTimeMillis()
            )
        }
    }
}
