package ke.imperialenterprise.imperialai.domain.model

import java.util.UUID

/**
 * Task model representing scheduled or executed operations against a WordPress site.
 * Strictly bound to a single siteId to prevent cross-site execution.
 */
data class Task(
    val id: String = UUID.randomUUID().toString(),
    val title: String,
    val description: String,
    val siteId: String,
    val siteName: String,
    val category: TaskCategory = TaskCategory.GENERAL,
    val createdDate: String,
    val updatedDate: String,
    val status: TaskState = TaskState.DRAFT,
    val requestedAction: String,
    val dangerousActionType: DangerousActionType = DangerousActionType.READ_ONLY_AUDIT,
    val approvalRequirement: ApprovalRequirement = ApprovalRequirement.NONE,
    val executionResult: ExecutionResult? = null
)

enum class TaskCategory(val displayName: String, val iconDescription: String) {
    SECURITY("Security", "Shield"),
    MAINTENANCE("Maintenance", "Tool"),
    CONTENT("Content", "Document"),
    SEO("SEO & Metadata", "Search"),
    PERFORMANCE("Performance", "Bolt"),
    GENERAL("General", "Folder")
}

enum class TaskState(val displayName: String) {
    DRAFT("Draft"),
    PLANNED("Planned"),
    AWAITING_APPROVAL("Awaiting Approval"),
    RUNNING("Running"),
    COMPLETED("Completed"),
    FAILED("Failed"),
    CANCELLED("Cancelled")
}

enum class ApprovalRequirement(val displayName: String) {
    NONE("No Approval Needed"),
    REQUIRED("Operator Approval Required"),
    APPROVED("Approved by Operator"),
    REJECTED("Rejected by Operator")
}

data class ExecutionResult(
    val summary: String,
    val logs: List<String> = emptyList(),
    val executionDurationMs: Long = 0L,
    val completedAt: String = "",
    val success: Boolean = true
)
