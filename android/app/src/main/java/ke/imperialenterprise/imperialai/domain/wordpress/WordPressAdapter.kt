package ke.imperialenterprise.imperialai.domain.wordpress

import ke.imperialenterprise.imperialai.domain.model.ActiveSiteContext
import kotlinx.coroutines.flow.StateFlow

/**
 * Universal WordPress Intelligence Adapter (Section 1).
 * Coordinates site inspection, stack discovery, capability mapping,
 * and the 7-stage operational workflow.
 */
interface WordPressAdapter {

    fun getSiteProfile(siteId: String): StateFlow<SiteStackProfile?>
    fun getSiteCapabilities(siteId: String): StateFlow<List<WordPressCapability>>
    fun getSiteFindings(siteId: String): StateFlow<List<AuditFinding>>
    fun getAvailableCommands(siteId: String): List<WordPressCommand>

    /**
     * Executes the 20-stage read-only discovery inspection.
     */
    suspend fun inspectSite(context: ActiveSiteContext): Result<SiteStackProfile>

    /**
     * Executes the Imperial 7-Stage Operational Workflow (Section 20):
     * AUDIT -> PROPOSE -> APPROVE -> BACKUP -> IMPLEMENT -> VERIFY -> REPORT
     */
    suspend fun executeWorkflow(
        context: ActiveSiteContext,
        taskTitle: String,
        targetResource: String,
        auditToolName: String,
        auditArgs: Map<String, Any?>,
        mutationToolName: String,
        mutationArgs: Map<String, Any?>,
        expectedVerificationState: String,
        onStageUpdate: (WordPressTask) -> Unit = {}
    ): Result<WordPressTask>
}
