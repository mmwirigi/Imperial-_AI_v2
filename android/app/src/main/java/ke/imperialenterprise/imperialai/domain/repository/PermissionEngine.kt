package ke.imperialenterprise.imperialai.domain.repository

import ke.imperialenterprise.imperialai.domain.model.DangerousActionType
import ke.imperialenterprise.imperialai.domain.model.PermissionPolicy

/**
 * Gatekeeper engine verifying whether a requested operation requires explicit operator approval
 * or violates site boundary isolation.
 */
interface PermissionEngine {
    suspend fun evaluateAction(
        siteId: String,
        actionType: DangerousActionType,
        policy: PermissionPolicy
    ): PermissionEvaluationResult

    suspend fun recordOperatorApproval(
        approvalId: String,
        siteId: String,
        approved: Boolean,
        operatorNotes: String
    )
}

data class PermissionEvaluationResult(
    val requiresExplicitApproval: Boolean,
    val riskLevel: ke.imperialenterprise.imperialai.domain.model.RiskLevel,
    val warningMessage: String,
    val isAllowedUnderPolicy: Boolean
)
