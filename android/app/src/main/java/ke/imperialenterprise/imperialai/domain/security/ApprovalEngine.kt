package ke.imperialenterprise.imperialai.domain.security

import ke.imperialenterprise.imperialai.domain.model.ActiveSiteContext
import ke.imperialenterprise.imperialai.domain.model.ApprovalRequest
import ke.imperialenterprise.imperialai.domain.model.ApprovalStatus
import kotlinx.coroutines.flow.StateFlow

/**
 * Manages the lifecycle of human operator approval requests (Section 11).
 * 
 * Guarantees:
 * - Deterministic argument binding preventing parameter manipulation (Section 12)
 * - Automatic expiration (Section 13, 31)
 * - Anti-replay: approvals cannot be reused once consumed
 * - Session lock revalidation on return from background (Section 28)
 */
interface ApprovalEngine {

    val pendingRequests: StateFlow<List<ApprovalRequest>>

    /**
     * Creates and registers a new pending approval request.
     */
    fun createApprovalRequest(
        siteId: String,
        mcpServerId: String,
        toolName: String,
        toolCallId: String,
        arguments: Map<String, Any?>,
        conversationId: String? = null,
        agentRunId: String? = null,
        reason: String? = null,
        isDestructive: Boolean = false
    ): ApprovalRequest

    /**
     * Retrieves an approval request by its ID.
     */
    fun getApprovalRequest(approvalId: String): ApprovalRequest?

    /**
     * Resolves an approval request with operator decision.
     * Revalidates site context, argument hash, and expiration.
     */
    fun resolveApproval(
        approvalId: String,
        approved: Boolean,
        operatorNotes: String = "",
        suppliedArgumentsHash: String? = null,
        targetContext: ActiveSiteContext? = null
    ): Boolean

    /**
     * Consumes an approved request for immediate execution.
     * Prevents replay by marking the request as EXECUTED.
     */
    fun consumeApprovalForExecution(
        approvalId: String,
        siteId: String,
        mcpServerId: String,
        toolName: String,
        toolCallId: String,
        argumentsHash: String
    ): Boolean

    /**
     * Revalidates pending requests (e.g., when the application returns from background).
     * Automatically expires requests exceeding validity cooldowns.
     */
    fun revalidatePendingRequests()

    /**
     * Cancels all pending approvals (e.g. on agent turn cancellation).
     */
    fun cancelAllPending(siteId: String? = null)
}
