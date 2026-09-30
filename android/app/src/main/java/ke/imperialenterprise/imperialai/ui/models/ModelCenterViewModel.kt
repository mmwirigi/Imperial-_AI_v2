package ke.imperialenterprise.imperialai.ui.models

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import ke.imperialenterprise.imperialai.domain.model.AIModel
import ke.imperialenterprise.imperialai.domain.repository.ModelRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

enum class ModelFilter(val label: String) {
    ALL("All"),
    FREE("Free"),
    PAID("Paid"),
    VISION("Vision"),
    TOOLS("Tools"),
    REASONING("Reasoning")
}

enum class ModelSort(val label: String) {
    NAME("Name"),
    CONTEXT_LENGTH("Context Length"),
    COST("Cost")
}

data class ModelCenterUiState(
    val models: List<AIModel> = emptyList(),
    val freeModels: List<AIModel> = emptyList(),
    val selectedGlobalModelId: String = "",
    val conversationOverrideModelId: String? = null,
    val activeFilter: ModelFilter = ModelFilter.ALL,
    val activeSort: ModelSort = ModelSort.NAME,
    val searchQuery: String = "",
    val isLoading: Boolean = false,
    val lastUpdatedTimestamp: Long = 0L,
    val errorMessage: String? = null,
    val isSuccessFeedbackVisible: Boolean = false
)

class ModelCenterViewModel(
    private val modelRepository: ModelRepository,
    private val targetConversationId: String? = null
) : ViewModel() {

    private val _searchQuery = MutableStateFlow("")
    private val _activeFilter = MutableStateFlow(ModelFilter.ALL)
    private val _activeSort = MutableStateFlow(ModelSort.NAME)
    private val _isSuccessFeedbackVisible = MutableStateFlow(false)

    val uiState: StateFlow<ModelCenterUiState> = combine(
        modelRepository.catalogState,
        modelRepository.getGlobalDefaultModelId(),
        if (targetConversationId != null) modelRepository.getConversationModelId(targetConversationId) else flowOf(null),
        _searchQuery,
        _activeFilter,
        _activeSort
    ) { catalog, globalDefault, convOverride, query, filter, sort ->
        val queryLower = query.trim().lowercase()

        // Filter models
        val filtered = catalog.models.filter { model ->
            val matchesQuery = queryLower.isEmpty() ||
                    model.name.lowercase().contains(queryLower) ||
                    model.id.lowercase().contains(queryLower) ||
                    model.provider.lowercase().contains(queryLower) ||
                    model.description.lowercase().contains(queryLower)

            val matchesFilter = when (filter) {
                ModelFilter.ALL -> true
                ModelFilter.FREE -> model.isFree
                ModelFilter.PAID -> !model.isFree
                ModelFilter.VISION -> model.supportsVision
                ModelFilter.TOOLS -> model.supportsTools
                ModelFilter.REASONING -> model.supportsReasoning
            }

            matchesQuery && matchesFilter
        }

        // Sort models
        val sorted = when (sort) {
            ModelSort.NAME -> filtered.sortedBy { it.name.lowercase() }
            ModelSort.CONTEXT_LENGTH -> filtered.sortedByDescending { it.contextLength }
            ModelSort.COST -> filtered.sortedBy { it.inputCost }
        }

        // Free models convenience group
        val freeOnly = catalog.models.filter { it.isFree }

        ModelCenterUiState(
            models = sorted,
            freeModels = freeOnly,
            selectedGlobalModelId = globalDefault,
            conversationOverrideModelId = convOverride,
            activeFilter = filter,
            activeSort = sort,
            searchQuery = query,
            isLoading = catalog.isLoading,
            lastUpdatedTimestamp = catalog.lastUpdatedTimestamp,
            errorMessage = catalog.errorMessage,
            isSuccessFeedbackVisible = _isSuccessFeedbackVisible.value
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = ModelCenterUiState()
    )

    fun onSearchQueryChanged(query: String) {
        _searchQuery.value = query
    }

    fun onFilterSelected(filter: ModelFilter) {
        _activeFilter.value = filter
    }

    fun onSortSelected(sort: ModelSort) {
        _activeSort.value = sort
    }

    fun refreshCatalog() {
        viewModelScope.launch {
            modelRepository.refreshModels()
        }
    }

    fun selectModelAsGlobalDefault(modelId: String) {
        viewModelScope.launch {
            modelRepository.setGlobalDefaultModelId(modelId)
            _isSuccessFeedbackVisible.value = true
        }
    }

    fun selectModelForConversation(modelId: String) {
        val convId = targetConversationId ?: return
        viewModelScope.launch {
            modelRepository.setConversationModelId(convId, modelId)
            _isSuccessFeedbackVisible.value = true
        }
    }

    fun clearConversationOverride() {
        val convId = targetConversationId ?: return
        viewModelScope.launch {
            modelRepository.setConversationModelId(convId, null)
        }
    }
}
