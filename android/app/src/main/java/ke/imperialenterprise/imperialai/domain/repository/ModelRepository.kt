package ke.imperialenterprise.imperialai.domain.repository

import ke.imperialenterprise.imperialai.domain.model.AIModel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.StateFlow

data class ModelCatalogState(
    val models: List<AIModel> = emptyList(),
    val isLoading: Boolean = false,
    val lastUpdatedTimestamp: Long = 0L,
    val errorMessage: String? = null
)

interface ModelRepository {
    /**
     * Observable stream of the cached model catalog.
     */
    val catalogState: StateFlow<ModelCatalogState>

    /**
     * Refreshes the model catalog from the active AIProvider.
     * Uses previously cached list if network fails.
     */
    suspend fun refreshModels(): Result<List<AIModel>>

    /**
     * Get a specific model by ID from memory/cache.
     */
    suspend fun getModelById(modelId: String): AIModel?

    /**
     * Global Default Model observable flow.
     */
    fun getGlobalDefaultModelId(): Flow<String>

    /**
     * Persist user's choice for the global default model.
     */
    suspend fun setGlobalDefaultModelId(modelId: String)

    /**
     * Conversation-specific model override flow.
     */
    fun getConversationModelId(conversationId: String): Flow<String?>

    /**
     * Set a conversation-specific model override. Passing null falls back to global default.
     */
    suspend fun setConversationModelId(conversationId: String, modelId: String?)
}
