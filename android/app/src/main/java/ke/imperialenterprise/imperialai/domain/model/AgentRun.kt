package ke.imperialenterprise.imperialai.domain.model

import java.util.UUID

/**
 * Status enumeration for autonomous agent execution turns.
 */
enum class AgentRunStatus {
    QUEUED,
    RUNNING,
    WAITING_APPROVAL,
    COMPLETED,
    FAILED,
    CANCELLED,
    MAX_ITERATIONS
}

/**
 * Persisted domain record of an autonomous agent execution lifecycle.
 */
data class AgentRun(
    val id: String = UUID.randomUUID().toString(),
    val siteId: String,
    val conversationId: String,
    val model: String,
    val mode: AgentMode,
    val status: AgentRunStatus,
    val startedAt: Long = System.currentTimeMillis(),
    val completedAt: Long? = null,
    val iterations: Int = 0,
    val toolCalls: List<String> = emptyList(),
    val error: String? = null,
    val usage: AIUsage? = null
)
