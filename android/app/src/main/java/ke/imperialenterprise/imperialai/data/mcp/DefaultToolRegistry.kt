package ke.imperialenterprise.imperialai.data.mcp

import ke.imperialenterprise.imperialai.domain.agent.ToolRegistry
import ke.imperialenterprise.imperialai.domain.model.DangerousActionType
import ke.imperialenterprise.imperialai.domain.model.McpTool
import ke.imperialenterprise.imperialai.domain.model.ToolRiskLevel
import java.util.concurrent.ConcurrentHashMap

/**
 * Thread-safe in-memory registry for discovered MCP tools.
 * Isolates tool catalogs by `siteId`.
 */
class DefaultToolRegistry : ToolRegistry {

    // siteId -> (toolName -> McpTool)
    private val siteTools = ConcurrentHashMap<String, ConcurrentHashMap<String, McpTool>>()

    override fun registerDiscoveredTools(siteId: String, serverId: String, tools: List<McpTool>) {
        val map = siteTools.computeIfAbsent(siteId) { ConcurrentHashMap() }
        // Clean out prior tools for this specific serverId
        map.entries.removeIf { it.value.serverId == serverId }
        for (tool in tools) {
            val enrichedTool = tool.copy(
                riskLevel = evaluateRiskLevel(tool),
                requiresApproval = evaluateRiskLevel(tool) != ToolRiskLevel.READ
            )
            map[tool.name] = enrichedTool
        }
    }

    override fun getToolsForSite(siteId: String): List<McpTool> {
        return siteTools[siteId]?.values?.toList() ?: emptyList()
    }

    override fun findTool(siteId: String, toolName: String): McpTool? {
        return siteTools[siteId]?.get(toolName)
    }

    override fun clearTools(siteId: String, serverId: String?) {
        if (serverId == null) {
            siteTools.remove(siteId)
        } else {
            siteTools[siteId]?.entries?.removeIf { it.value.serverId == serverId }
        }
    }

    override fun evaluateRiskLevel(tool: McpTool): ToolRiskLevel {
        // Section 10: Explicit MCP metadata annotations take precedence when available
        tool.annotations?.let { annotations ->
            if (annotations.destructive) return ToolRiskLevel.DESTRUCTIVE
            if (annotations.readOnly) return ToolRiskLevel.READ
        }

        val name = tool.name.lowercase()

        // Explicit destructive actions
        if (name.contains("delete") || name.contains("drop") || name.contains("purge") ||
            name.contains("uninstall") || name.contains("reset") || name.contains("remove") ||
            name.contains("dangerous_demo")) {
            return ToolRiskLevel.DESTRUCTIVE
        }

        // Explicit mutating/write actions
        if (name.contains("create") || name.contains("update") || name.contains("edit") ||
            name.contains("modify") || name.contains("publish") || name.contains("write") ||
            name.contains("save") || name.contains("write_demo")) {
            return ToolRiskLevel.HIGH_RISK_WRITE
        }

        if (name.contains("draft") || name.contains("preview") || name.contains("validate")) {
            return ToolRiskLevel.LOW_RISK_WRITE
        }

        // Section 10: Do NOT infer a tool is safe just because name contains get/list/read/fetch
        // Only classify as READ if explicitly known safe read tools or read_demo
        if (name == "read_demo" || name == "wp_get_site_health" || name == "wp_list_posts" || name == "wp_list_plugins") {
            return ToolRiskLevel.READ
        }

        // Section 10: If the application cannot confidently classify a tool -> REQUIRE APPROVAL (UNKNOWN)
        return ToolRiskLevel.UNKNOWN
    }

    override fun mapToolToDangerousAction(toolName: String): DangerousActionType {
        val lower = toolName.lowercase()
        return when {
            lower.contains("delete_post") -> DangerousActionType.DELETE_POST
            lower.contains("delete_page") -> DangerousActionType.DELETE_PAGE
            lower.contains("delete") || lower.contains("purge") -> DangerousActionType.DELETE_PAGE
            lower.contains("setting") || lower.contains("option") || lower.contains("config") -> DangerousActionType.CHANGE_SITE_SETTINGS
            lower.contains("publish") -> DangerousActionType.PUBLISH_CONTENT
            lower.contains("plugin") -> DangerousActionType.MODIFY_PLUGIN
            lower.contains("theme") -> DangerousActionType.MODIFY_THEME
            lower.contains("user") || lower.contains("author") || lower.contains("role") -> DangerousActionType.CHANGE_USER
            lower.contains("dns") || lower.contains("domain") || lower.contains("ssl") || lower.contains("redirect") -> DangerousActionType.CHANGE_DNS_SETTINGS
            lower.contains("bulk") || lower.contains("batch") || lower.contains("migrate") -> DangerousActionType.BULK_EDIT_CONTENT
            lower.startsWith("get_") || lower.startsWith("list_") || lower.startsWith("read_") || lower.contains("inspect") -> DangerousActionType.READ_ONLY_AUDIT
            else -> DangerousActionType.CHANGE_SITE_SETTINGS
        }
    }
}
