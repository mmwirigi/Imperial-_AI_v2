package ke.imperialenterprise.imperialai.domain.agent

import ke.imperialenterprise.imperialai.domain.model.DangerousActionType
import ke.imperialenterprise.imperialai.domain.model.McpTool
import ke.imperialenterprise.imperialai.domain.model.ToolRiskLevel

/**
 * Universal registry for WordPress & generic MCP tools.
 * Dynamically indexes tools discovered from remote servers and
 * enforces security risk classifications.
 */
interface ToolRegistry {
    /**
     * Registers tools discovered from an MCP server for a specific site.
     */
    fun registerDiscoveredTools(siteId: String, serverId: String, tools: List<McpTool>)

    /**
     * Retrieves all tools currently available for a site.
     */
    fun getToolsForSite(siteId: String): List<McpTool>

    /**
     * Finds a tool by name within a site's registered tools.
     */
    fun findTool(siteId: String, toolName: String): McpTool?

    /**
     * Clears tools registered for a specific site/server.
     */
    fun clearTools(siteId: String, serverId: String? = null)

    /**
     * Evaluates tool safety level based on annotations and naming heuristics.
     */
    fun evaluateRiskLevel(tool: McpTool): ToolRiskLevel

    /**
     * Maps an MCP tool name to an existing [DangerousActionType] for permission enforcement.
     */
    fun mapToolToDangerousAction(toolName: String): DangerousActionType
}
