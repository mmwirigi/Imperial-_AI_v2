package ke.imperialenterprise.imperialai.ui.chat

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import ke.imperialenterprise.imperialai.domain.agent.*
import ke.imperialenterprise.imperialai.domain.model.*
import ke.imperialenterprise.imperialai.domain.repository.*
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

data class ChatUiState(
    val sites: List<Site> = emptyList(),
    val activeSite: Site? = null,
    val conversation: ChatConversation? = null,
    val messages: List<ChatMessage> = emptyList(),
    val inputText: String = "",
    val isSiteSelectorOpen: Boolean = false,
    val isModelPickerOpen: Boolean = false,
    val isToolsDrawerOpen: Boolean = false,
    val isStreaming: Boolean = false,
    val isAgentExecuting: Boolean = false,
    val agentThought: String? = null,
    val currentIteration: Int = 1,
    val maxIterations: Int = 10,
    val streamingPartialText: String = "",
    val activeAiModelId: String = "google/gemini-2.0-flash-exp:free",
    val activeAiModel: AIModel? = null,
    val availableModels: List<AIModel> = emptyList(),
    val isOpenRouterConfigured: Boolean = false,
    val activeError: AIError? = null,
    val pendingDangerousApproval: ApprovalPromptData? = null,
    val pendingApprovalId: String? = null,
    val pendingToolExecutionRequest: ToolExecutionRequest? = null,
    val activeMcpStatus: McpConnectionStatus = McpConnectionStatus.NOT_CONFIGURED,
    val activeSiteTools: List<McpTool> = emptyList()
)

class ChatViewModel(
    private val siteRepository: SiteRepository,
    private val conversationRepository: ConversationRepository,
    private val aiProvider: AIProvider,
    private val modelRepository: ModelRepository,
    private val credentialStore: CredentialStore,
    private val mcpManager: McpManager,
    private val toolRegistry: ToolRegistry,
    private val agentEngine: AgentEngine
) : ViewModel() {

    private val _uiState = MutableStateFlow(ChatUiState())
    val uiState: StateFlow<ChatUiState> = _uiState.asStateFlow()

    private var activeGenerationJob: Job? = null

    init {
        loadSites()
        observeOpenRouterStatus()
        observeModels()
        observeMcpState()
    }

    private fun loadSites() {
        viewModelScope.launch {
            siteRepository.getSites().collect { siteList ->
                val currentActive = _uiState.value.activeSite
                val newActive = if (currentActive != null && siteList.any { it.id == currentActive.id }) {
                    siteList.first { it.id == currentActive.id }
                } else {
                    siteList.firstOrNull()
                }

                _uiState.update {
                    it.copy(
                        sites = siteList,
                        activeSite = newActive
                    )
                }

                if (newActive != null) {
                    loadConversationForSite(newActive)
                    mcpManager.switchActiveSite(newActive, _uiState.value.conversation?.id)
                }
            }
        }
    }

    private fun observeOpenRouterStatus() {
        viewModelScope.launch {
            val hasKey = credentialStore.hasOpenRouterApiKey()
            _uiState.update { it.copy(isOpenRouterConfigured = hasKey) }
        }
    }

    private fun observeMcpState() {
        viewModelScope.launch {
            combine(
                mcpManager.activeConnectionStatus,
                mcpManager.activeSiteTools
            ) { status, tools ->
                _uiState.update {
                    it.copy(
                        activeMcpStatus = status,
                        activeSiteTools = tools
                    )
                }
            }.collect()
        }
    }

    private fun observeModels() {
        viewModelScope.launch {
            combine(
                modelRepository.catalogState,
                modelRepository.getGlobalDefaultModelId()
            ) { catalog, globalDefaultId ->
                val currentConv = _uiState.value.conversation
                val effectiveModelId = if (currentConv != null) {
                    modelRepository.getConversationModelId(currentConv.id).first() ?: globalDefaultId
                } else {
                    globalDefaultId
                }

                val modelObj = catalog.models.find { it.id == effectiveModelId }
                    ?: catalog.models.find { it.id == globalDefaultId }

                _uiState.update {
                    it.copy(
                        availableModels = catalog.models,
                        activeAiModelId = effectiveModelId,
                        activeAiModel = modelObj
                    )
                }
            }.collect()
        }
    }

    fun openSiteSelector() {
        _uiState.update { it.copy(isSiteSelectorOpen = true) }
    }

    fun closeSiteSelector() {
        _uiState.update { it.copy(isSiteSelectorOpen = false) }
    }

    fun openModelPicker() {
        _uiState.update { it.copy(isModelPickerOpen = true) }
    }

    fun closeModelPicker() {
        _uiState.update { it.copy(isModelPickerOpen = false) }
    }

    fun toggleToolsDrawer() {
        _uiState.update { it.copy(isToolsDrawerOpen = !it.isToolsDrawerOpen) }
    }

    fun selectActiveSite(site: Site) {
        if (_uiState.value.activeSite?.id == site.id) {
            closeSiteSelector()
            return
        }
        _uiState.update {
            it.copy(
                activeSite = site,
                isSiteSelectorOpen = false
            )
        }
        loadConversationForSite(site)
        viewModelScope.launch {
            mcpManager.switchActiveSite(site, _uiState.value.conversation?.id)
        }
    }

    fun selectModel(modelId: String) {
        viewModelScope.launch {
            val conv = _uiState.value.conversation
            if (conv != null) {
                modelRepository.setConversationModelId(conv.id, modelId)
            }
            val modelObj = _uiState.value.availableModels.find { it.id == modelId }
            _uiState.update {
                it.copy(
                    activeAiModelId = modelId,
                    activeAiModel = modelObj,
                    isModelPickerOpen = false
                )
            }
        }
    }

    private fun loadConversationForSite(site: Site) {
        viewModelScope.launch {
            var conv = conversationRepository.getActiveConversationForSite(site.id)
            if (conv == null) {
                conv = conversationRepository.createConversation(
                    siteId = site.id,
                    title = "Site Operations: ${site.siteName}"
                )
            }

            _uiState.update { it.copy(conversation = conv) }

            // Switch MCP context with new conversation ID
            mcpManager.switchActiveSite(site, conv.id)

            // Observe messages
            conversationRepository.getMessages(conv.id).collect { msgList ->
                _uiState.update { it.copy(messages = msgList) }
            }
        }
    }

    fun onInputTextChanged(newText: String) {
        _uiState.update { it.copy(inputText = newText) }
    }

    fun cancelGeneration() {
        activeGenerationJob?.cancel()
        agentEngine.cancel()
        _uiState.update {
            it.copy(
                isStreaming = false,
                isAgentExecuting = false,
                streamingPartialText = "",
                pendingDangerousApproval = null,
                pendingApprovalId = null,
                agentThought = null
            )
        }
    }

    /**
     * Executes the Phase 4 autonomous agent loop:
     * User Message -> AgentEngine -> OpenRouter -> Tool Call? -> Validation -> Approval -> MCP -> Model Feedback -> Final Answer
     */
    fun sendMessage() {
        val text = _uiState.value.inputText.trim()
        val site = _uiState.value.activeSite ?: return
        val conv = _uiState.value.conversation ?: return
        if (text.isBlank() || _uiState.value.isStreaming || _uiState.value.isAgentExecuting) return

        _uiState.update {
            it.copy(
                inputText = "",
                activeError = null,
                isAgentExecuting = true,
                isStreaming = true,
                agentThought = "Initiating autonomous agent loop...",
                streamingPartialText = ""
            )
        }

        val userMessage = ChatMessage(
            id = "msg_${System.currentTimeMillis()}",
            conversationId = conv.id,
            siteId = site.id,
            sender = MessageRole.USER,
            content = text,
            timestamp = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date())
        )

        viewModelScope.launch {
            conversationRepository.addMessage(userMessage)

            val siteContext = ActiveSiteContext(
                siteId = site.id,
                siteName = site.siteName,
                websiteUrl = site.websiteUrl,
                activeMcpServerId = mcpManager.activeContext.value?.activeMcpServerId,
                activeConversationId = conv.id
            )

            val modelId = _uiState.value.activeAiModelId
            val history = _uiState.value.messages

            activeGenerationJob = viewModelScope.launch {
                agentEngine.runTurn(
                    context = siteContext,
                    prompt = text,
                    history = history,
                    modelId = modelId,
                    maxIterations = 10
                ).catch { e ->
                    val aiError = if (e is AIProviderException) e.error else AIError.networkError(e)
                    _uiState.update {
                        it.copy(
                            isStreaming = false,
                            isAgentExecuting = false,
                            activeError = aiError,
                            agentThought = null
                        )
                    }
                }.collect { event ->
                    when (event) {
                        is AgentExecutionEvent.Started -> {
                            _uiState.update { it.copy(agentThought = "Starting agent loop for ${event.siteName}...") }
                        }
                        is AgentExecutionEvent.IterationStarted -> {
                            _uiState.update {
                                it.copy(
                                    currentIteration = event.iteration,
                                    maxIterations = event.maxIterations,
                                    agentThought = "Step ${event.iteration} of ${event.maxIterations}: reasoning..."
                                )
                            }
                        }
                        is AgentExecutionEvent.Thinking -> {
                            _uiState.update { it.copy(agentThought = event.thought) }
                        }
                        is AgentExecutionEvent.StreamingDelta -> {
                            _uiState.update { it.copy(streamingPartialText = event.accumulatedText) }
                        }
                        is AgentExecutionEvent.ToolCallDetected -> {
                            val callMsg = ChatMessage(
                                id = "msg_call_${event.toolCall.id}",
                                conversationId = conv.id,
                                siteId = site.id,
                                sender = MessageRole.ASSISTANT,
                                content = "Proposed tool call: ${event.tool.name}",
                                timestamp = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date()),
                                toolCall = ToolCallData(
                                    toolName = event.tool.name,
                                    callId = event.toolCall.id,
                                    argumentsSummary = event.toolCall.argumentsJson,
                                    status = ToolCallStatus.PROPOSED
                                )
                            )
                            conversationRepository.addMessage(callMsg)
                            _uiState.update { it.copy(agentThought = "Identified tool: ${event.tool.name}") }
                        }
                        is AgentExecutionEvent.ToolApprovalRequired -> {
                            _uiState.update {
                                it.copy(
                                    pendingDangerousApproval = event.promptData,
                                    pendingApprovalId = event.approvalId,
                                    pendingToolExecutionRequest = event.request,
                                    agentThought = "Awaiting operator authorization for ${event.tool.name}"
                                )
                            }
                        }
                        is AgentExecutionEvent.ToolExecuting -> {
                            _uiState.update { it.copy(agentThought = "Executing ${event.tool.name} on remote MCP server...") }
                        }
                        is AgentExecutionEvent.ToolExecutionFinished -> {
                            val resultMsg = ChatMessage(
                                id = "msg_res_${event.result.toolCallId}",
                                conversationId = conv.id,
                                siteId = site.id,
                                sender = MessageRole.TOOL,
                                content = event.result.content,
                                timestamp = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date()),
                                toolResult = ToolResultData(
                                    toolName = event.tool.name,
                                    callId = event.result.toolCallId,
                                    outputSummary = event.result.content.take(120),
                                    executionDurationMs = event.result.durationMs,
                                    isError = event.result.isError
                                )
                            )
                            conversationRepository.addMessage(resultMsg)
                            _uiState.update {
                                it.copy(
                                    pendingDangerousApproval = null,
                                    pendingApprovalId = null,
                                    agentThought = "Executed ${event.tool.name} in ${event.result.durationMs}ms"
                                )
                            }
                        }
                        is AgentExecutionEvent.ToolExecutionRejected -> {
                            _uiState.update {
                                it.copy(
                                    pendingDangerousApproval = null,
                                    pendingApprovalId = null,
                                    agentThought = "Tool execution rejected: ${event.reason}"
                                )
                            }
                        }
                        is AgentExecutionEvent.MaxIterationsReached -> {
                            _uiState.update {
                                it.copy(agentThought = "Reached maximum iteration limit (${event.iterationsRun}).")
                            }
                        }
                        is AgentExecutionEvent.TurnCompleted -> {
                            val assistantMsg = ChatMessage(
                                id = "msg_${System.currentTimeMillis()}",
                                conversationId = conv.id,
                                siteId = site.id,
                                sender = MessageRole.ASSISTANT,
                                content = event.finalResponse,
                                timestamp = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date()),
                                usage = event.usage,
                                modelName = _uiState.value.activeAiModel?.name
                            )
                            conversationRepository.addMessage(assistantMsg)
                            _uiState.update {
                                it.copy(
                                    isStreaming = false,
                                    isAgentExecuting = false,
                                    streamingPartialText = "",
                                    agentThought = null,
                                    pendingDangerousApproval = null,
                                    pendingApprovalId = null
                                )
                            }
                        }
                        is AgentExecutionEvent.Cancelled -> {
                            _uiState.update {
                                it.copy(
                                    isStreaming = false,
                                    isAgentExecuting = false,
                                    streamingPartialText = "",
                                    agentThought = null
                                )
                            }
                        }
                        is AgentExecutionEvent.Error -> {
                            _uiState.update {
                                it.copy(
                                    isStreaming = false,
                                    isAgentExecuting = false,
                                    activeError = event.error,
                                    agentThought = null
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    fun approvePendingAction() {
        val approvalId = _uiState.value.pendingApprovalId ?: return
        _uiState.update {
            it.copy(
                pendingDangerousApproval = null,
                pendingApprovalId = null
            )
        }
        viewModelScope.launch {
            agentEngine.resolveApproval(approvalId, approved = true)
        }
    }

    fun rejectPendingAction() {
        val approvalId = _uiState.value.pendingApprovalId ?: return
        _uiState.update {
            it.copy(
                pendingDangerousApproval = null,
                pendingApprovalId = null
            )
        }
        viewModelScope.launch {
            agentEngine.resolveApproval(approvalId, approved = false, operatorNotes = "Rejected by operator in Chat")
        }
    }
}
