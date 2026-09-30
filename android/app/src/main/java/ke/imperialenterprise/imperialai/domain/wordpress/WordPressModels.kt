package ke.imperialenterprise.imperialai.domain.wordpress

import ke.imperialenterprise.imperialai.domain.model.ToolRiskLevel
import java.util.UUID

/**
 * Discovered architectural profile of a WordPress installation (Section 2).
 * Strictly contains only verified discoveries — unknown values remain null or "UNKNOWN".
 */
data class SiteStackProfile(
    val siteId: String,
    val siteName: String,
    val siteUrl: String,
    val wordpressVersion: String? = null,
    val phpVersion: String? = null,
    val databaseType: String? = null,
    val themeName: String? = null,
    val themeVersion: String? = null,
    val activePlugins: List<String> = emptyList(),
    val inactivePlugins: List<String> = emptyList(),
    val pageBuilder: String? = null,
    val seoPlugin: String? = null,
    val formsPlugin: String? = null,
    val commercePlatform: String? = null,
    val learningPlatform: String? = null,
    val bookingPlatform: String? = null,
    val cachePlugin: String? = null,
    val securityPlugin: String? = null,
    val backupPlugin: String? = null,
    val analyticsIntegration: String? = null,
    val searchConsoleIntegration: String? = null,
    val mcpCapabilities: List<String> = emptyList(),
    val lastInspectedAt: Long = 0L,
    val inspectionStatus: InspectionStatus = InspectionStatus.NOT_INSPECTED
)

enum class InspectionStatus(val displayName: String) {
    NOT_INSPECTED("Not Inspected"),
    INSPECTING("Inspecting..."),
    COMPLETED("Inspection Complete"),
    FAILED("Inspection Failed"),
    STALE("Stale Cache")
}

/**
 * Functional categories for discovered WordPress capabilities (Section 3).
 */
enum class CapabilityCategory(val displayName: String) {
    SITE("Site & Environment"),
    CONTENT("Content Management"),
    PAGES("Pages"),
    POSTS("Posts"),
    MEDIA("Media Library"),
    USERS("User Accounts & Roles"),
    COMMENTS("Discussion & Comments"),
    TAXONOMIES("Categories & Tags"),
    SEO("Search Engine Optimization"),
    FORMS("Forms & Inquiries"),
    PLUGINS("Plugin Management"),
    THEMES("Theme Management"),
    SETTINGS("Core WordPress Settings"),
    BACKUPS("Backups & Checkpoints"),
    WOOCOMMERCE("WooCommerce"),
    LEARNPRESS("LearnPress Courses"),
    BOOKING("Reservation & Booking"),
    ELEMENTOR("Elementor Page Builder"),
    ELEMENTSKIT("ElementsKit Addons"),
    ANALYTICS("Analytics"),
    SEARCH_CONSOLE("Google Search Console"),
    DATABASE("Database Operations"),
    SECURITY("Security Hardening"),
    OTHER("Custom & Extensible")
}

/**
 * Normalized WordPress capability mapped from discovered remote MCP tools (Section 3).
 */
data class WordPressCapability(
    val id: String,
    val name: String,
    val category: CapabilityCategory,
    val description: String,
    val available: Boolean = false,
    val mcpToolNames: List<String> = emptyList(),
    val requiredPermission: String = "READ",
    val riskLevel: ToolRiskLevel = ToolRiskLevel.HIGH_RISK_WRITE,
    val requiresApproval: Boolean = true,
    val supportedOperations: List<String> = emptyList(),
    val lastVerified: Long = 0L
) {
    companion object {
        // Standard Capability IDs
        const val SITE_HEALTH_READ = "SITE_HEALTH_READ"
        const val CONTENT_READ = "CONTENT_READ"
        const val CONTENT_CREATE = "CONTENT_CREATE"
        const val CONTENT_UPDATE = "CONTENT_UPDATE"
        const val CONTENT_DELETE = "CONTENT_DELETE"
        const val PAGE_READ = "PAGE_READ"
        const val PAGE_CREATE = "PAGE_CREATE"
        const val PAGE_UPDATE = "PAGE_UPDATE"
        const val PAGE_DELETE = "PAGE_DELETE"
        const val POST_READ = "POST_READ"
        const val POST_CREATE = "POST_CREATE"
        const val POST_UPDATE = "POST_UPDATE"
        const val POST_DELETE = "POST_DELETE"
        const val MEDIA_READ = "MEDIA_READ"
        const val MEDIA_UPLOAD = "MEDIA_UPLOAD"
        const val MEDIA_UPDATE = "MEDIA_UPDATE"
        const val MEDIA_DELETE = "MEDIA_DELETE"
        const val SEO_READ = "SEO_READ"
        const val SEO_UPDATE = "SEO_UPDATE"
        const val PLUGIN_READ = "PLUGIN_READ"
        const val PLUGIN_INSTALL = "PLUGIN_INSTALL"
        const val PLUGIN_ACTIVATE = "PLUGIN_ACTIVATE"
        const val PLUGIN_DEACTIVATE = "PLUGIN_DEACTIVATE"
        const val PLUGIN_DELETE = "PLUGIN_DELETE"
        const val THEME_READ = "THEME_READ"
        const val THEME_UPDATE = "THEME_UPDATE"
        const val USER_READ = "USER_READ"
        const val USER_CREATE = "USER_CREATE"
        const val USER_UPDATE = "USER_UPDATE"
        const val USER_DELETE = "USER_DELETE"
        const val USER_ROLE_CHANGE = "USER_ROLE_CHANGE"
        const val BACKUP_CREATE = "BACKUP_CREATE"
        const val BACKUP_RESTORE = "BACKUP_RESTORE"
        const val FORMS_READ = "FORMS_READ"
        const val FORMS_UPDATE = "FORMS_UPDATE"
        const val WOOCOMMERCE_READ = "WOOCOMMERCE_READ"
        const val WOOCOMMERCE_UPDATE = "WOOCOMMERCE_UPDATE"
        const val LEARNPRESS_READ = "LEARNPRESS_READ"
        const val LEARNPRESS_UPDATE = "LEARNPRESS_UPDATE"
        const val BOOKING_READ = "BOOKING_READ"
        const val BOOKING_UPDATE = "BOOKING_UPDATE"
        const val ELEMENTOR_READ = "ELEMENTOR_READ"
        const val ELEMENTOR_UPDATE = "ELEMENTOR_UPDATE"
    }
}

/**
 * Finding produced during a read-only WordPress site audit (Section 9).
 */
data class AuditFinding(
    val id: String = UUID.randomUUID().toString(),
    val siteId: String,
    val category: String,
    val severity: AuditSeverity,
    val title: String,
    val description: String,
    val evidence: String,
    val recommendation: String,
    val sourceTool: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)

enum class AuditSeverity(val displayName: String) {
    INFO("Informational"),
    LOW("Low Severity"),
    MEDIUM("Medium Severity"),
    HIGH("High Severity"),
    CRITICAL("Critical Security Finding")
}

/**
 * Preflight backup checkpoint recorded prior to mutation (Section 19).
 */
data class BackupCheckpoint(
    val id: String = UUID.randomUUID().toString(),
    val siteId: String,
    val backupTool: String?,
    val backupReference: String?,
    val createdAt: Long = System.currentTimeMillis(),
    val status: BackupStatus = BackupStatus.CREATED,
    val scope: String = "Full Database & Content Snapshot"
)

enum class BackupStatus {
    PENDING,
    CREATED,
    FAILED,
    SKIPPED_NO_TOOL
}

/**
 * Material change proposal presented to the operator prior to approval (Section 22).
 */
data class ChangeProposal(
    val id: String = UUID.randomUUID().toString(),
    val siteId: String,
    val taskId: String,
    val operation: String,
    val target: String,
    val currentState: String,
    val proposedState: String,
    val reason: String,
    val riskLevel: ToolRiskLevel = ToolRiskLevel.HIGH_RISK_WRITE,
    val affectedObjects: Int = 1,
    val requiresApproval: Boolean = true,
    val createdAt: Long = System.currentTimeMillis()
)

/**
 * Post-execution verification record validating real site state against intended outcome (Section 23).
 */
data class VerificationResult(
    val success: Boolean,
    val siteId: String,
    val tool: String,
    val target: String,
    val expectedState: String,
    val actualState: String,
    val differences: String = "",
    val verifiedAt: Long = System.currentTimeMillis()
)

/**
 * Stages of the Imperial 7-Stage Operational Workflow (Section 20).
 * AUDIT -> PROPOSE -> APPROVAL_PENDING -> BACKUP -> IMPLEMENT -> VERIFY -> REPORT
 */
enum class WorkflowStage(val displayName: String) {
    AUDIT("1. Audit Site State"),
    PROPOSE("2. Formulate Change Proposal"),
    APPROVAL_PENDING("3. Awaiting Operator Approval"),
    BACKUP("4. Backup Preflight Check"),
    IMPLEMENT("5. Execute MCP Tool Mutation"),
    VERIFY("6. Verify Intended Outcome"),
    REPORT("7. Operational Report"),
    COMPLETED("Task Completed"),
    FAILED("Execution / Verification Failed"),
    CANCELLED("Cancelled")
}

/**
 * Rich WordPress operational task model (Section 21).
 */
data class WordPressTask(
    val id: String = UUID.randomUUID().toString(),
    val siteId: String,
    val title: String,
    val description: String,
    val category: String = "CONTENT",
    val status: String = "PENDING",
    val workflowStage: WorkflowStage = WorkflowStage.AUDIT,
    val riskLevel: ToolRiskLevel = ToolRiskLevel.HIGH_RISK_WRITE,
    val affectedResources: List<String> = emptyList(),
    val proposedChanges: ChangeProposal? = null,
    val approvalRequestId: String? = null,
    val backupCheckpointId: String? = null,
    val executionSummary: String? = null,
    val verificationSummary: VerificationResult? = null,
    val report: String? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)

/**
 * Normalized WordPress error taxonomy (Section 33).
 */
enum class WordPressErrorCode(val userFriendlyMessage: String) {
    WORDPRESS_CONNECTION_ERROR("Could not connect to WordPress MCP endpoint."),
    MCP_CAPABILITY_UNAVAILABLE("The requested capability is not supported on this WordPress installation."),
    PERMISSION_DENIED("Operation denied by security policy."),
    APPROVAL_REQUIRED("Operation requires explicit human authorization."),
    APPROVAL_EXPIRED("The approval request has expired. Re-authorization required."),
    BACKUP_UNAVAILABLE("No backup mechanism detected on target site."),
    IMPLEMENTATION_FAILED("Failed to execute WordPress tool operation."),
    VERIFICATION_FAILED("Verification failed: Site state did not reflect intended modification."),
    SITE_CONTEXT_CHANGED("Active site changed during execution. Task cancelled for safety."),
    TOOL_NOT_SUPPORTED("MCP tool is not supported or recognized."),
    INVALID_ARGUMENTS("Invalid parameters provided for WordPress operation."),
    RESOURCE_NOT_FOUND("The target WordPress post, page, or resource does not exist."),
    RATE_LIMITED("WordPress MCP endpoint rate limit exceeded."),
    AUTHENTICATION_FAILED("Authentication credentials rejected by WordPress MCP server."),
    UNKNOWN_ERROR("An unexpected WordPress operational error occurred.")
}

data class WordPressError(
    val code: WordPressErrorCode,
    val technicalMessage: String,
    val userFriendlyMessage: String = code.userFriendlyMessage,
    val siteId: String? = null
)
