package ke.imperialenterprise.imperialai.domain.model

/**
 * Normalized representation of an MCP Tool advertised by a remote MCP Server.
 * 
 * Safety Rule:
 * Tools are bound to both `serverId` and `siteId`.
 * Unknown tools default to [ToolRiskLevel.HIGH_RISK_WRITE] and require approval.
 */
data class McpTool(
    val name: String,
    val title: String? = null,
    val description: String = "",
    val inputSchema: Map<String, Any?> = emptyMap(),
    val annotations: McpToolAnnotations? = null,
    val serverId: String,
    val siteId: String,
    val enabled: Boolean = true,
    val requiresApproval: Boolean = true,
    val riskLevel: ToolRiskLevel = ToolRiskLevel.HIGH_RISK_WRITE
)

/**
 * Risk classification for discovered tools.
 * Never trust names alone; unknown operations default to HIGH_RISK_WRITE.
 */
enum class ToolRiskLevel(val displayName: String, val requiresApprovalByDefault: Boolean) {
    READ("Read-Only Query", false),
    UNKNOWN("Unknown Risk", true),
    LOW_RISK_WRITE("Low-Risk Write", true),
    HIGH_RISK_WRITE("High-Risk Write", true),
    DESTRUCTIVE("Destructive Operation", true)
}

/**
 * Tool annotations optionally provided by MCP servers.
 * Used as metadata hints, but not as the sole security boundary.
 */
data class McpToolAnnotations(
    val readOnly: Boolean = false,
    val destructive: Boolean = false,
    val idempotent: Boolean = false,
    val openWorld: Boolean = false
) {
    fun deriveRiskLevel(toolName: String): ToolRiskLevel {
        val lower = toolName.lowercase()
        return when {
            destructive || lower.contains("delete") || lower.contains("drop") || lower.contains("purge") -> 
                ToolRiskLevel.DESTRUCTIVE
            readOnly || lower.startsWith("get_") || lower.startsWith("list_") || lower.startsWith("read_") || lower.contains("inspect") -> 
                ToolRiskLevel.READ
            lower.contains("draft") || lower.contains("cache") || lower.contains("transient") -> 
                ToolRiskLevel.LOW_RISK_WRITE
            else -> 
                ToolRiskLevel.HIGH_RISK_WRITE
        }
    }
}
