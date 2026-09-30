package ke.imperialenterprise.imperialai.domain.model

/**
 * Enforces security gates on dangerous WordPress operations.
 * Operations with high risk require explicit operator approval before execution.
 */
data class PermissionPolicy(
    val siteId: String,
    val requireApprovalForDeletePages: Boolean = true,
    val requireApprovalForDeletePosts: Boolean = true,
    val requireApprovalForSiteSettings: Boolean = true,
    val requireApprovalForPublishing: Boolean = true,
    val requireApprovalForPlugins: Boolean = true,
    val requireApprovalForThemes: Boolean = true,
    val requireApprovalForUsers: Boolean = true,
    val requireApprovalForDns: Boolean = true,
    val requireApprovalForBulkEdit: Boolean = true
) {
    fun isApprovalRequired(action: DangerousActionType): Boolean {
        return when (action) {
            DangerousActionType.DELETE_PAGE -> requireApprovalForDeletePages
            DangerousActionType.DELETE_POST -> requireApprovalForDeletePosts
            DangerousActionType.CHANGE_SITE_SETTINGS -> requireApprovalForSiteSettings
            DangerousActionType.PUBLISH_CONTENT -> requireApprovalForPublishing
            DangerousActionType.MODIFY_PLUGIN -> requireApprovalForPlugins
            DangerousActionType.MODIFY_THEME -> requireApprovalForThemes
            DangerousActionType.CHANGE_USER -> requireApprovalForUsers
            DangerousActionType.CHANGE_DNS_SETTINGS -> requireApprovalForDns
            DangerousActionType.BULK_EDIT_CONTENT -> requireApprovalForBulkEdit
            DangerousActionType.READ_ONLY_AUDIT -> false
        }
    }
}

enum class DangerousActionType(val displayName: String, val riskLevel: RiskLevel) {
    DELETE_PAGE("Delete Page", RiskLevel.CRITICAL),
    DELETE_POST("Delete Post", RiskLevel.HIGH),
    CHANGE_SITE_SETTINGS("Modify Site Settings", RiskLevel.CRITICAL),
    PUBLISH_CONTENT("Publish Content", RiskLevel.MEDIUM),
    MODIFY_PLUGIN("Install / Deactivate Plugin", RiskLevel.CRITICAL),
    MODIFY_THEME("Modify Active Theme", RiskLevel.CRITICAL),
    CHANGE_USER("Modify User Roles & Permissions", RiskLevel.CRITICAL),
    CHANGE_DNS_SETTINGS("Modify Domain / DNS Settings", RiskLevel.CRITICAL),
    BULK_EDIT_CONTENT("Bulk Edit Content", RiskLevel.HIGH),
    READ_ONLY_AUDIT("Read-Only Audit & Inspection", RiskLevel.LOW)
}

enum class RiskLevel {
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL
}
