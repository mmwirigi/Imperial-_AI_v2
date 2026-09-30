package ke.imperialenterprise.imperialai.ui.sites

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import ke.imperialenterprise.imperialai.data.mcp.McpCredentialManager
import ke.imperialenterprise.imperialai.domain.agent.ConnectionTestReport
import ke.imperialenterprise.imperialai.domain.agent.McpManager
import ke.imperialenterprise.imperialai.domain.agent.ToolRegistry
import ke.imperialenterprise.imperialai.domain.model.*
import ke.imperialenterprise.imperialai.domain.repository.McpServerRepository
import ke.imperialenterprise.imperialai.domain.repository.SiteRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

data class SitesUiState(
    val sites: List<Site> = emptyList(),
    val selectedSiteForEdit: Site? = null,
    val isAddEditSheetOpen: Boolean = false,
    val selectedSiteForMcp: Site? = null,
    val activeMcpServer: MCPServer? = null,
    val isMcpSetupModalOpen: Boolean = false,
    val isTestingConnection: Boolean = false,
    val testConnectionReport: ConnectionTestReport? = null,
    val isConnectingMcp: Boolean = false,
    val mcpActionMessage: String? = null,
    val mcpDiscoveredTools: List<McpTool> = emptyList(),
    val maskedBearerToken: String? = null,
    val searchQuery: String = "",
    val isLoading: Boolean = false
)

class SitesViewModel(
    private val siteRepository: SiteRepository,
    private val mcpServerRepository: McpServerRepository,
    private val mcpManager: McpManager,
    private val mcpCredentialManager: McpCredentialManager,
    private val toolRegistry: ToolRegistry
) : ViewModel() {

    private val _uiState = MutableStateFlow(SitesUiState(isLoading = true))
    val uiState: StateFlow<SitesUiState> = _uiState.asStateFlow()

    init {
        loadSites()
    }

    private fun loadSites() {
        viewModelScope.launch {
            siteRepository.getSites().collect { list ->
                _uiState.update {
                    it.copy(
                        sites = list,
                        isLoading = false
                    )
                }
            }
        }
    }

    fun selectSiteForMcpManagement(site: Site) {
        viewModelScope.launch {
            val server = mcpServerRepository.getServerForSite(site.id)
            val tools = toolRegistry.getToolsForSite(site.id)
            val masked = if (server != null) {
                mcpCredentialManager.getMaskedToken(site.id, server.id)
            } else null

            _uiState.update {
                it.copy(
                    selectedSiteForMcp = site,
                    activeMcpServer = server,
                    mcpDiscoveredTools = tools,
                    maskedBearerToken = masked,
                    testConnectionReport = null,
                    mcpActionMessage = null
                )
            }
        }
    }

    fun openAddEditSiteDialog(site: Site? = null) {
        _uiState.update {
            it.copy(
                selectedSiteForEdit = site,
                isAddEditSheetOpen = true
            )
        }
    }

    fun closeAddEditDialog() {
        _uiState.update {
            it.copy(
                selectedSiteForEdit = null,
                isAddEditSheetOpen = false
            )
        }
    }

    fun openMcpSetupModal(site: Site) {
        viewModelScope.launch {
            val existing = mcpServerRepository.getServerForSite(site.id)
            val masked = if (existing != null) {
                mcpCredentialManager.getMaskedToken(site.id, existing.id)
            } else null

            _uiState.update {
                it.copy(
                    selectedSiteForMcp = site,
                    activeMcpServer = existing,
                    maskedBearerToken = masked,
                    isMcpSetupModalOpen = true,
                    testConnectionReport = null,
                    mcpActionMessage = null
                )
            }
        }
    }

    fun closeMcpSetupModal() {
        _uiState.update {
            it.copy(
                isMcpSetupModalOpen = false,
                testConnectionReport = null,
                mcpActionMessage = null
            )
        }
    }

    fun saveMcpServer(
        siteId: String,
        name: String,
        endpoint: String,
        authType: McpAuthType,
        bearerToken: String?
    ) {
        viewModelScope.launch {
            val existing = mcpServerRepository.getServerForSite(siteId)
            val server = existing?.copy(
                name = name,
                endpoint = endpoint,
                authenticationType = authType
            ) ?: MCPServer(
                name = name,
                endpoint = endpoint,
                siteId = siteId,
                authenticationType = authType,
                connectionStatus = McpConnectionStatus.NOT_CONFIGURED
            )

            mcpServerRepository.saveServer(server)

            if (authType == McpAuthType.BEARER_TOKEN && !bearerToken.isNullOrBlank()) {
                mcpCredentialManager.setBearerToken(siteId, server.id, bearerToken)
            } else if (authType == McpAuthType.NONE) {
                mcpCredentialManager.clearToken(siteId, server.id)
            }

            val masked = mcpCredentialManager.getMaskedToken(siteId, server.id)
            _uiState.update {
                it.copy(
                    activeMcpServer = server,
                    maskedBearerToken = masked,
                    mcpActionMessage = "MCP server configuration saved successfully."
                )
            }
        }
    }

    fun testConnection(
        siteId: String,
        name: String,
        endpoint: String,
        authType: McpAuthType,
        bearerToken: String?
    ) {
        viewModelScope.launch {
            _uiState.update { it.copy(isTestingConnection = true, testConnectionReport = null, mcpActionMessage = null) }

            val tempServer = MCPServer(
                name = name,
                endpoint = endpoint,
                siteId = siteId,
                authenticationType = authType
            )

            val report = mcpManager.testConnection(tempServer, bearerToken)
            _uiState.update {
                it.copy(
                    isTestingConnection = false,
                    testConnectionReport = report
                )
            }
        }
    }

    fun connectMcp(server: MCPServer) {
        viewModelScope.launch {
            _uiState.update { it.copy(isConnectingMcp = true, mcpActionMessage = null) }
            val result = mcpManager.connectServer(server)
            if (result.isSuccess) {
                val updated = result.getOrThrow()
                val tools = toolRegistry.getToolsForSite(server.siteId)
                _uiState.update {
                    it.copy(
                        isConnectingMcp = false,
                        activeMcpServer = updated,
                        mcpDiscoveredTools = tools,
                        mcpActionMessage = "Connected successfully! ${tools.size} tools discovered."
                    )
                }
            } else {
                val err = result.exceptionOrNull()?.message ?: "Failed to connect to MCP server"
                _uiState.update {
                    it.copy(
                        isConnectingMcp = false,
                        mcpActionMessage = "Connection failed: $err"
                    )
                }
            }
        }
    }

    fun disconnectMcp(siteId: String, serverId: String) {
        viewModelScope.launch {
            mcpManager.disconnectServer(siteId, serverId)
            val updated = mcpServerRepository.getServerById(siteId, serverId)
            _uiState.update {
                it.copy(
                    activeMcpServer = updated,
                    mcpDiscoveredTools = emptyList(),
                    mcpActionMessage = "MCP server disconnected."
                )
            }
        }
    }

    fun refreshTools(siteId: String, serverId: String) {
        viewModelScope.launch {
            val result = mcpManager.refreshTools(siteId, serverId)
            if (result.isSuccess) {
                val tools = result.getOrThrow()
                _uiState.update {
                    it.copy(
                        mcpDiscoveredTools = tools,
                        mcpActionMessage = "Tools refreshed. ${tools.size} tools available."
                    )
                }
            } else {
                _uiState.update {
                    it.copy(
                        mcpActionMessage = "Failed to refresh tools: ${result.exceptionOrNull()?.message}"
                    )
                }
            }
        }
    }

    fun saveSite(site: Site) {
        viewModelScope.launch {
            val existing = siteRepository.getSiteById(site.id)
            if (existing != null) {
                siteRepository.updateSite(site)
            } else {
                siteRepository.insertSite(site)
            }
            closeAddEditDialog()
        }
    }

    fun deleteSite(siteId: String) {
        viewModelScope.launch {
            val server = mcpServerRepository.getServerForSite(siteId)
            if (server != null) {
                mcpManager.disconnectServer(siteId, server.id)
                mcpServerRepository.deleteServer(siteId, server.id)
            }
            siteRepository.deleteSite(siteId)
        }
    }
}
