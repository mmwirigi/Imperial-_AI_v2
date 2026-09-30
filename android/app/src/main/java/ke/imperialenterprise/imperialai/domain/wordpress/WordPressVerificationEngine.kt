package ke.imperialenterprise.imperialai.domain.wordpress

import ke.imperialenterprise.imperialai.domain.agent.McpManager
import ke.imperialenterprise.imperialai.domain.agent.ToolRegistry
import ke.imperialenterprise.imperialai.domain.model.ActiveSiteContext
import ke.imperialenterprise.imperialai.domain.model.ToolExecutionRequest
import ke.imperialenterprise.imperialai.domain.repository.AuditLogger

/**
 * Post-mutation verification engine validating that actual WordPress site state
 * matches the intended state (Section 23).
 * 
 * Safety Rule:
 * Never claim success without verification. If state does not match, fail closed.
 */
class WordPressVerificationEngine(
    private val toolRegistry: ToolRegistry,
    private val mcpManager: McpManager,
    private val auditLogger: AuditLogger? = null
) {

    /**
     * Verifies that a target resource reflects the expected modification.
     */
    suspend fun verifyMutation(
        context: ActiveSiteContext,
        targetResource: String,
        readToolName: String,
        readArguments: Map<String, Any?>,
        expectedSubstringOrKey: String
    ): VerificationResult {
        val tools = toolRegistry.getToolsForSite(context.siteId)
        val readTool = tools.find { it.name == readToolName }

        if (readTool == null) {
            return VerificationResult(
                success = false,
                siteId = context.siteId,
                tool = readToolName,
                target = targetResource,
                expectedState = expectedSubstringOrKey,
                actualState = "Verification read tool '$readToolName' unavailable",
                differences = "Cannot verify without registered read tool",
                verifiedAt = System.currentTimeMillis()
            )
        }

        val execReq = ToolExecutionRequest(
            siteId = context.siteId,
            mcpServerId = readTool.serverId,
            toolName = readTool.name,
            arguments = readArguments,
            conversationId = context.activeConversationId,
            operatorAuthorized = true
        )

        val result = mcpManager.executeTool(execReq)
        if (result.isFailure) {
            return VerificationResult(
                success = false,
                siteId = context.siteId,
                tool = readToolName,
                target = targetResource,
                expectedState = expectedSubstringOrKey,
                actualState = "Error reading state: ${result.exceptionOrNull()?.message}",
                differences = "Verification query failed",
                verifiedAt = System.currentTimeMillis()
            )
        }

        val actualText = result.getOrThrow().toDisplayText()
        val isVerified = actualText.contains(expectedSubstringOrKey, ignoreCase = true)

        val verification = VerificationResult(
            success = isVerified,
            siteId = context.siteId,
            tool = readToolName,
            target = targetResource,
            expectedState = expectedSubstringOrKey,
            actualState = actualText.take(150),
            differences = if (isVerified) "None (Matches expected state)" else "Actual state did not contain expected value",
            verifiedAt = System.currentTimeMillis()
        )

        auditLogger?.logEvent(
            siteId = context.siteId,
            siteName = context.siteName,
            userAction = if (isVerified) "VERIFICATION_SUCCESS" else "VERIFICATION_FAILED",
            aiAction = "VERIFY_STATE",
            tool = readToolName,
            parametersSummary = "target=$targetResource; expected=$expectedSubstringOrKey",
            resultSummary = if (isVerified) "Verification passed" else "Verification failed: discrepancy detected",
            approvalStatus = if (isVerified) "VERIFIED" else "DISCREPANCY",
            isSuccess = isVerified
        )

        return verification
    }
}
