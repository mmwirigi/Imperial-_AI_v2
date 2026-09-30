package ke.imperialenterprise.imperialai.data.repository

import ke.imperialenterprise.imperialai.domain.model.AgentRun
import ke.imperialenterprise.imperialai.domain.repository.AgentRunRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.map
import java.util.concurrent.ConcurrentHashMap

/**
 * In-memory thread-safe implementation of [AgentRunRepository].
 */
class InMemoryAgentRunRepository : AgentRunRepository {

    private val runs = ConcurrentHashMap<String, AgentRun>()
    private val runsState = MutableStateFlow<Map<String, AgentRun>>(emptyMap())

    override suspend fun saveRun(run: AgentRun) {
        runs[run.id] = run
        runsState.value = HashMap(runs)
    }

    override suspend fun getRun(runId: String): AgentRun? {
        return runs[runId]
    }

    override suspend fun getRunsForSite(siteId: String): List<AgentRun> {
        return runs.values.filter { it.siteId == siteId }.sortedByDescending { it.startedAt }
    }

    override suspend fun getRunsForConversation(conversationId: String): List<AgentRun> {
        return runs.values.filter { it.conversationId == conversationId }.sortedByDescending { it.startedAt }
    }

    override fun observeRunsForSite(siteId: String): Flow<List<AgentRun>> {
        return runsState.map { map ->
            map.values.filter { it.siteId == siteId }.sortedByDescending { it.startedAt }
        }
    }
}
