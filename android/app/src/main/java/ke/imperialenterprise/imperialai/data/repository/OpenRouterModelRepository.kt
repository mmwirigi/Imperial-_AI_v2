package ke.imperialenterprise.imperialai.data.repository

import ke.imperialenterprise.imperialai.data.sample.SampleData
import ke.imperialenterprise.imperialai.domain.agent.AIProvider
import ke.imperialenterprise.imperialai.domain.model.AIModel
import ke.imperialenterprise.imperialai.domain.repository.ModelCatalogState
import ke.imperialenterprise.imperialai.domain.repository.ModelRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map

/**
 * Repository responsible for the local caching of OpenRouter models,
 * refreshing catalogs, and managing global/conversation-scoped model overrides.
 */
class OpenRouterModelRepository(
    private val aiProvider: AIProvider
) : ModelRepository {

    // Default to the popular high-speed free model
    private val _globalDefaultModelId = MutableStateFlow("google/gemini-2.0-flash-exp:free")
    
    // Per-conversation overrides: conversationId -> modelId
    private val conversationModelOverrides = mutableMapOf<String, MutableStateFlow<String?>>()

    // In-memory catalog state initialized with baseline verified models
    private val _catalogState = MutableStateFlow(
        ModelCatalogState(
            models = SampleData.availableModels,
            lastUpdatedTimestamp = System.currentTimeMillis() - 3600000 // 1 hour ago
        )
    )
    override val catalogState: StateFlow<ModelCatalogState> = _catalogState.asStateFlow()

    override suspend fun refreshModels(): Result<List<AIModel>> {
        _catalogState.value = _catalogState.value.copy(isLoading = true, errorMessage = null)
        return try {
            val remoteModels = aiProvider.listModels(forceRefresh = true)
            if (remoteModels.isNotEmpty()) {
                _catalogState.value = ModelCatalogState(
                    models = remoteModels,
                    isLoading = false,
                    lastUpdatedTimestamp = System.currentTimeMillis(),
                    errorMessage = null
                )
                Result.success(remoteModels)
            } else {
                // Keep existing cached catalog if remote is empty or unauthenticated
                _catalogState.value = _catalogState.value.copy(
                    isLoading = false,
                    errorMessage = "Using previously cached model catalog. Connect OpenRouter key to fetch live models."
                )
                Result.success(_catalogState.value.models)
            }
        } catch (e: Exception) {
            _catalogState.value = _catalogState.value.copy(
                isLoading = false,
                errorMessage = "Network error while refreshing models. Using cached catalog."
            )
            Result.success(_catalogState.value.models)
        }
    }

    override suspend fun getModelById(modelId: String): AIModel? {
        return _catalogState.value.models.find { it.id == modelId }
            ?: aiProvider.getModel(modelId)
    }

    override fun getGlobalDefaultModelId(): Flow<String> {
        return _globalDefaultModelId
    }

    override suspend fun setGlobalDefaultModelId(modelId: String) {
        _globalDefaultModelId.value = modelId
    }

    override fun getConversationModelId(conversationId: String): Flow<String?> {
        val flow = conversationModelOverrides.getOrPut(conversationId) {
            MutableStateFlow(null)
        }
        return flow
    }

    override suspend fun setConversationModelId(conversationId: String, modelId: String?) {
        val flow = conversationModelOverrides.getOrPut(conversationId) {
            MutableStateFlow(null)
        }
        flow.value = modelId
    }
}
