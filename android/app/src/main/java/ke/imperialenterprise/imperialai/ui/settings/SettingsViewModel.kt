package ke.imperialenterprise.imperialai.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import ke.imperialenterprise.imperialai.domain.agent.AIProvider
import ke.imperialenterprise.imperialai.domain.agent.ConnectionTestResult
import ke.imperialenterprise.imperialai.domain.model.AIModel
import ke.imperialenterprise.imperialai.domain.repository.CredentialStore
import ke.imperialenterprise.imperialai.domain.repository.ModelRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

data class SettingsUiState(
    val hasApiKey: Boolean = false,
    val maskedApiKey: String? = null,
    val apiKeyInput: String = "",
    val isKeyEntryDialogOpen: Boolean = false,
    val isTestingConnection: Boolean = false,
    val connectionTestResult: ConnectionTestResult? = null,
    val isRefreshingModels: Boolean = false,
    val availableModels: List<AIModel> = emptyList(),
    val selectedModelId: String = "google/gemini-2.0-flash-exp:free",
    val selectedModelName: String = "Gemini 2.0 Flash Experimental (Free)",
    val lastCatalogUpdateTimestamp: Long = 0L,
    val defaultMcpTransport: String = "Server-Sent Events (SSE)",
    val isHardwareKeystoreActive: Boolean = true,
    val biometricGatingEnabled: Boolean = true,
    val notificationsEnabled: Boolean = true,
    val darkThemeOnly: Boolean = true,
    val appVersion: String = "2.0.0-phase2 (Build 2026.09)",
    val companyName: String = "Imperial Enterprise Kenya"
)

class SettingsViewModel(
    private val credentialStore: CredentialStore,
    private val aiProvider: AIProvider,
    private val modelRepository: ModelRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    init {
        loadCredentialState()
        observeModelsAndDefault()
    }

    private fun loadCredentialState() {
        viewModelScope.launch {
            val hasKey = credentialStore.hasOpenRouterApiKey()
            val masked = credentialStore.getMaskedOpenRouterApiKey()
            val hardwareSafe = credentialStore.isHardwareBackedKeystoreAvailable()

            _uiState.update {
                it.copy(
                    hasApiKey = hasKey,
                    maskedApiKey = masked,
                    isHardwareKeystoreActive = hardwareSafe
                )
            }
        }
    }

    private fun observeModelsAndDefault() {
        viewModelScope.launch {
            combine(
                modelRepository.catalogState,
                modelRepository.getGlobalDefaultModelId()
            ) { catalog, defaultId ->
                val activeModel = catalog.models.find { it.id == defaultId }
                _uiState.update { current ->
                    current.copy(
                        availableModels = catalog.models,
                        selectedModelId = defaultId,
                        selectedModelName = activeModel?.name ?: defaultId,
                        lastCatalogUpdateTimestamp = catalog.lastUpdatedTimestamp,
                        isRefreshingModels = catalog.isLoading
                    )
                }
            }.collect()
        }
    }

    fun openKeyEntryDialog() {
        _uiState.update { it.copy(isKeyEntryDialogOpen = true, apiKeyInput = "") }
    }

    fun closeKeyEntryDialog() {
        _uiState.update { it.copy(isKeyEntryDialogOpen = false, apiKeyInput = "") }
    }

    fun onApiKeyInputChanged(input: String) {
        _uiState.update { it.copy(apiKeyInput = input) }
    }

    fun saveApiKey() {
        val key = _uiState.value.apiKeyInput.trim()
        if (key.isBlank()) return

        viewModelScope.launch {
            credentialStore.setOpenRouterApiKey(key)
            val masked = credentialStore.getMaskedOpenRouterApiKey()
            _uiState.update {
                it.copy(
                    hasApiKey = true,
                    maskedApiKey = masked,
                    isKeyEntryDialogOpen = false,
                    apiKeyInput = "",
                    connectionTestResult = null
                )
            }
            // Auto refresh model catalog on new key
            modelRepository.refreshModels()
        }
    }

    fun removeApiKey() {
        viewModelScope.launch {
            credentialStore.clearOpenRouterApiKey()
            _uiState.update {
                it.copy(
                    hasApiKey = false,
                    maskedApiKey = null,
                    connectionTestResult = null
                )
            }
        }
    }

    fun testConnection() {
        viewModelScope.launch {
            _uiState.update { it.copy(isTestingConnection = true, connectionTestResult = null) }
            val result = aiProvider.testConnection()
            _uiState.update {
                it.copy(
                    isTestingConnection = false,
                    connectionTestResult = result
                )
            }
        }
    }

    fun refreshModels() {
        viewModelScope.launch {
            _uiState.update { it.copy(isRefreshingModels = true) }
            modelRepository.refreshModels()
            _uiState.update { it.copy(isRefreshingModels = false) }
        }
    }

    fun selectModel(modelId: String) {
        viewModelScope.launch {
            modelRepository.setGlobalDefaultModelId(modelId)
        }
    }

    fun toggleBiometrics(enabled: Boolean) {
        _uiState.update { it.copy(biometricGatingEnabled = enabled) }
    }

    fun toggleNotifications(enabled: Boolean) {
        _uiState.update { it.copy(notificationsEnabled = enabled) }
    }
}
