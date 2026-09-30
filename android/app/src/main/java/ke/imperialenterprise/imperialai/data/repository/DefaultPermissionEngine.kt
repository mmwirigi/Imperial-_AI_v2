package ke.imperialenterprise.imperialai.data.repository

import ke.imperialenterprise.imperialai.domain.model.DangerousActionType
import ke.imperialenterprise.imperialai.domain.model.PermissionPolicy
import ke.imperialenterprise.imperialai.domain.model.RiskLevel
import ke.imperialenterprise.imperialai.domain.repository.PermissionEngine
import ke.imperialenterprise.imperialai.domain.repository.PermissionEvaluationResult

/**
 * Gatekeeper engine evaluating dangerous actions against site policies.
 * 
 * Dangerous actions:
 * - deleting pages
 * - deleting posts
 * - changing site settings
 * - publishing content
 * - modifying plugins
 * - modifying themes
 * - changing users
 * - changing DNS-related settings
 * - bulk editing content
 */
class DefaultPermissionEngine : PermissionEngine {

    override suspend fun evaluateAction(
        siteId: String,
        actionType: DangerousActionType,
        policy: PermissionPolicy
    ): PermissionEvaluationResult {
        val requiresApproval = policy.isApprovalRequired(actionType)
        val warningMessage = when (actionType) {
            DangerousActionType.DELETE_PAGE -> "This operation will permanently delete a WordPress page."
            DangerousActionType.DELETE_POST -> "This operation will delete a published post from the database."
            DangerousActionType.CHANGE_SITE_SETTINGS -> "Modifying core WordPress options can alter site availability."
            DangerousActionType.PUBLISH_CONTENT -> "This will immediately publish drafted content to live visitors."
            DangerousActionType.MODIFY_PLUGIN -> "Installing, updating, or deactivating plugins can break site layouts."
            DangerousActionType.MODIFY_THEME -> "Altering theme files or active themes modifies visual presentation."
            DangerousActionType.CHANGE_USER -> "Modifying user accounts or privileges carries high administrative risk."
            DangerousActionType.CHANGE_DNS_SETTINGS -> "DNS modifications affect domain routing and SSL certificates."
            DangerousActionType.BULK_EDIT_CONTENT -> "Bulk changes modify multiple posts/pages in a single transaction."
            DangerousActionType.READ_ONLY_AUDIT -> "Safe read-only operation."
        }

        return PermissionEvaluationResult(
            requiresExplicitApproval = requiresApproval,
            riskLevel = actionType.riskLevel,
            warningMessage = warningMessage,
            isAllowedUnderPolicy = true
        )
    }

    override suspend fun recordOperatorApproval(
        approvalId: String,
        siteId: String,
        approved: Boolean,
        operatorNotes: String
    ) {
        // Logged into audit trail via AuditLogger in orchestrator
    }
}
