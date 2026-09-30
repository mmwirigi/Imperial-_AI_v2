package ke.imperialenterprise.imperialai.domain.repository

import ke.imperialenterprise.imperialai.domain.model.AgentRun
import kotlinx.coroutines.flow.Flow

/**
 * Repository interface for managing and querying persisted [AgentRun] records.
 */
interface AgentRunRepository {
    suspend fun saveRun(run: AgentRun)
    suspend fun getRun(runId: String): AgentRun?
    suspend fun getRunsForSite(siteId: String): List<AgentRun>
    suspend fun getRunsForConversation(conversationId: String): List<AgentRun>
    fun observeRunsForSite(siteId: String): Flow<List<AgentRun>>
}
