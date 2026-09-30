package ke.imperialenterprise.imperialai.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import ke.imperialenterprise.imperialai.domain.model.*
import ke.imperialenterprise.imperialai.domain.repository.AuditLogger
import ke.imperialenterprise.imperialai.domain.repository.CredentialStore
import ke.imperialenterprise.imperialai.domain.repository.ModelRepository
import ke.imperialenterprise.imperialai.domain.repository.SiteRepository
import ke.imperialenterprise.imperialai.domain.repository.TaskRepository
import kotlinx.coroutines.flow.*

data class HomeUiState(
    val sites: List<Site> = emptyList(),
    val totalConnectedSites: Int = 0,
    val totalSitesCount: Int = 0,
    val activeTasksCount: Int = 0,
    val aiProviderName: String = "OpenRouter",
    val isOpenRouterConfigured: Boolean = false,
    val currentAiModelName: String = "Gemini 2.0 Flash Experimental (Free)",
    val currentAiModelId: String = "google/gemini-2.0-flash-exp:free",
    val overallMcpStatus: String = "3 Connected · 2 Idle",
    val recentActivity: List<AuditEvent> = emptyList(),
    val isLoading: Boolean = false,
    val isEmpty: Boolean = false
)

class HomeViewModel(
    private val siteRepository: SiteRepository,
    private val taskRepository: TaskRepository,
    private val auditLogger: AuditLogger,
    private val credentialStore: CredentialStore,
    private val modelRepository: ModelRepository
) : ViewModel() {

    private val _hasApiKey = MutableStateFlow(false)

    init {
        // Check API key configuration status
        viewModelScope.launch {
            _hasApiKey.value = credentialStore.hasOpenRouterApiKey()
        }
    }

    val uiState: StateFlow<HomeUiState> = combine(
        siteRepository.getSites(),
        taskRepository.getAllTasks(),
        auditLogger.getRecentEvents(10),
        modelRepository.getGlobalDefaultModelId(),
        modelRepository.catalogState,
        _hasApiKey
    ) { sites, tasks, auditEvents, defaultModelId, catalog, hasKey ->
        val connectedCount = sites.count { it.mcpStatus == McpStatus.CONNECTED }
        val activeTasks = tasks.count { it.status == TaskState.RUNNING || it.status == TaskState.AWAITING_APPROVAL }
        val activeModel = catalog.models.find { it.id == defaultModelId }
        val modelDisplayName = activeModel?.name ?: defaultModelId

        HomeUiState(
            sites = sites,
            totalConnectedSites = connectedCount,
            totalSitesCount = sites.size,
            activeTasksCount = activeTasks,
            aiProviderName = "OpenRouter",
            isOpenRouterConfigured = hasKey,
            currentAiModelName = modelDisplayName,
            currentAiModelId = defaultModelId,
            overallMcpStatus = if (sites.isEmpty()) "No MCP endpoints registered" else "$connectedCount of ${sites.size} Connected",
            recentActivity = auditEvents,
            isLoading = false,
            isEmpty = sites.isEmpty()
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = HomeUiState(isLoading = true)
    )

    fun refreshKeyStatus() {
        viewModelScope.launch {
            _hasApiKey.value = credentialStore.hasOpenRouterApiKey()
        }
    }
}
