package ke.imperialenterprise.imperialai.data.security

import ke.imperialenterprise.imperialai.domain.model.*
import ke.imperialenterprise.imperialai.domain.repository.AuditLogger
import ke.imperialenterprise.imperialai.domain.security.ApprovalEngine
import ke.imperialenterprise.imperialai.domain.security.SecurityEventType
import ke.imperialenterprise.imperialai.domain.security.SensitiveDataRedactor
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.concurrent.ConcurrentHashMap

/**
 * Production implementation of [ApprovalEngine].
 * Enforces cryptographic argument binding, automatic timeout expiration,
 * anti-replay guarantees, and context isolation.
 */
class DefaultApprovalEngine(
    private val auditLogger: AuditLogger? = null
) : ApprovalEngine {

    private val requests = ConcurrentHashMap<String, ApprovalRequest>()
    private val _pendingRequests = MutableStateFlow<List<ApprovalRequest>>(emptyList())
    override val pendingRequests: StateFlow<List<ApprovalRequest>> = _pendingRequests.asStateFlow()

    private fun updatePendingList() {
        val now = System.currentTimeMillis()
        val activePending = requests.values.filter {
            it.status == ApprovalStatus.PENDING && !it.isExpired(now)
        }.sortedByDescending { it.createdAt }
        _pendingRequests.value = activePending
    }

    override fun createApprovalRequest(
        siteId: String,
        mcpServerId: String,
        toolName: String,
        toolCallId: String,
        arguments: Map<String, Any?>,
        conversationId: String?,
        agentRunId: String?,
        reason: String?,
        isDestructive: Boolean
    ): ApprovalRequest {
        val argsHash = ApprovalRequest.computeArgumentsHash(arguments)
        val argsSummary = ApprovalRequest.sanitizeArgumentsSummary(arguments)
        val risk = if (isDestructive) ToolRiskLevel.DESTRUCTIVE else ToolRiskLevel.HIGH_RISK_WRITE

        val request = ApprovalRequest(
            siteId = siteId,
            conversationId = conversationId,
            agentRunId = agentRunId,
            mcpServerId = mcpServerId,
            toolName = toolName,
            toolId = toolName,
            toolCallId = toolCallId,
            sanitizedArguments = SensitiveDataRedactor.redactMap(arguments),
            argumentsSummary = argsSummary,
            argumentsHash = argsHash,
            riskLevel = risk,
            reason = reason ?: if (isDestructive) "Destructive WordPress modification requires authorization" else "Live site modification requires operator approval",
            isDestructive = isDestructive,
            status = ApprovalStatus.PENDING
        )

        requests[request.id] = request
        updatePendingList()

        auditLogger?.logEvent(
            siteId = siteId,
            siteName = siteId,
            userAction = SecurityEventType.APPROVAL_REQUESTED.name,
            aiAction = "PROPOSE_ACTION",
            tool = toolName,
            parametersSummary = SensitiveDataRedactor.summarizeArguments(arguments),
            resultSummary = "Approval queued (ID: ${request.id}, expires in ${if (isDestructive) "2 min" else "5 min"})",
            approvalStatus = ApprovalStatus.PENDING.name,
            isSuccess = true
        )

        return request
    }

    override fun getApprovalRequest(approvalId: String): ApprovalRequest? {
        val req = requests[approvalId] ?: return null
        if (req.status == ApprovalStatus.PENDING && req.isExpired()) {
            val expired = req.copy(status = ApprovalStatus.EXPIRED)
            requests[approvalId] = expired
            updatePendingList()
            return expired
        }
        return req
    }

    override fun resolveApproval(
        approvalId: String,
        approved: Boolean,
        operatorNotes: String,
        suppliedArgumentsHash: String?,
        targetContext: ActiveSiteContext?
    ): Boolean {
        val req = requests[approvalId] ?: return false

        // 1. Anti-Replay & Status check
        if (req.status != ApprovalStatus.PENDING || req.consumed) {
            return false
        }

        // 2. Expiration check
        if (req.isExpired()) {
            requests[approvalId] = req.copy(status = ApprovalStatus.EXPIRED)
            updatePendingList()
            auditLogger?.logEvent(
                siteId = req.siteId,
                siteName = req.siteId,
                userAction = SecurityEventType.APPROVAL_EXPIRED.name,
                aiAction = "VERIFY_APPROVAL",
                tool = req.toolName,
                parametersSummary = "approvalId=$approvalId",
                resultSummary = "Rejected: approval request has expired",
                approvalStatus = ApprovalStatus.EXPIRED.name,
                isSuccess = false
            )
            return false
        }

        // 3. Arguments Hash binding check (Section 12)
        if (suppliedArgumentsHash != null && req.argumentsHash != suppliedArgumentsHash) {
            auditLogger?.logEvent(
                siteId = req.siteId,
                siteName = req.siteId,
                userAction = SecurityEventType.SECURITY_DENIED.name,
                aiAction = "VERIFY_APPROVAL",
                tool = req.toolName,
                parametersSummary = "approvalId=$approvalId",
                resultSummary = "Hash mismatch: tool arguments were tampered with after approval creation",
                approvalStatus = ApprovalStatus.REJECTED.name,
                isSuccess = false
            )
            return false
        }

        // 4. Target context check (Section 21)
        if (targetContext != null && targetContext.siteId != req.siteId) {
            auditLogger?.logEvent(
                siteId = req.siteId,
                siteName = req.siteId,
                userAction = SecurityEventType.SITE_CONTEXT_MISMATCH.name,
                aiAction = "VERIFY_APPROVAL",
                tool = req.toolName,
                parametersSummary = "activeSite=${targetContext.siteId}; expectedSite=${req.siteId}",
                resultSummary = "Site mismatch: operator tried to resolve approval for non-active site",
                approvalStatus = ApprovalStatus.REJECTED.name,
                isSuccess = false
            )
            return false
        }

        val newStatus = if (approved) ApprovalStatus.APPROVED else ApprovalStatus.REJECTED
        val updated = req.copy(
            status = newStatus,
            operatorNotes = operatorNotes
        )
        requests[approvalId] = updated
        updatePendingList()

        auditLogger?.logEvent(
            siteId = req.siteId,
            siteName = req.siteId,
            userAction = if (approved) SecurityEventType.APPROVAL_GRANTED.name else SecurityEventType.APPROVAL_REJECTED.name,
            aiAction = "OPERATOR_DECISION",
            tool = req.toolName,
            parametersSummary = "approvalId=$approvalId; notes=$operatorNotes",
            resultSummary = if (approved) "Operator approved action" else "Operator rejected action",
            approvalStatus = newStatus.name,
            isSuccess = approved
        )

        return true
    }

    override fun consumeApprovalForExecution(
        approvalId: String,
        siteId: String,
        mcpServerId: String,
        toolName: String,
        toolCallId: String,
        argumentsHash: String
    ): Boolean {
        val req = requests[approvalId] ?: return false

        // Anti-Replay check
        if (req.consumed || req.status != ApprovalStatus.APPROVED || req.isExpired()) {
            return false
        }

        // Match exact bindings
        if (req.siteId != siteId ||
            req.mcpServerId != mcpServerId ||
            (req.toolName != toolName && req.toolId != toolName) ||
            req.toolCallId != toolCallId ||
            req.argumentsHash != argumentsHash
        ) {
            return false
        }

        // Consume it
        requests[approvalId] = req.copy(consumed = true, status = ApprovalStatus.EXECUTED)
        updatePendingList()
        return true
    }

    override fun revalidatePendingRequests() {
        val now = System.currentTimeMillis()
        var changed = false
        for ((id, req) in requests) {
            if (req.status == ApprovalStatus.PENDING && req.isExpired(now)) {
                requests[id] = req.copy(status = ApprovalStatus.EXPIRED)
                changed = true
                auditLogger?.logEvent(
                    siteId = req.siteId,
                    siteName = req.siteId,
                    userAction = SecurityEventType.APPROVAL_EXPIRED.name,
                    aiAction = "SESSION_LOCK_CHECK",
                    tool = req.toolName,
                    parametersSummary = "approvalId=$id",
                    resultSummary = "Expired during background session",
                    approvalStatus = ApprovalStatus.EXPIRED.name,
                    isSuccess = false
                )
            }
        }
        if (changed) {
            updatePendingList()
        }
    }

    override fun cancelAllPending(siteId: String?) {
        for ((id, req) in requests) {
            if (req.status == ApprovalStatus.PENDING) {
                if (siteId == null || req.siteId == siteId) {
                    requests[id] = req.copy(status = ApprovalStatus.CANCELLED)
                }
            }
        }
        updatePendingList()
    }
}
