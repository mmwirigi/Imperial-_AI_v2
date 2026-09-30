package ke.imperialenterprise.imperialai

import ke.imperialenterprise.imperialai.data.agent.DefaultAgentEngine
import ke.imperialenterprise.imperialai.data.mcp.DefaultMcpManager
import ke.imperialenterprise.imperialai.data.mcp.DefaultToolRegistry
import ke.imperialenterprise.imperialai.data.mcp.McpCredentialManager
import ke.imperialenterprise.imperialai.data.repository.*
import ke.imperialenterprise.imperialai.domain.agent.*
import ke.imperialenterprise.imperialai.domain.model.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.emptyFlow
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class AgentEngineLoopTest {

    private lateinit var siteRepository: InMemorySiteRepository
    private lateinit var conversationRepository: InMemoryConversationRepository
    private lateinit var mcpServerRepository: InMemoryMcpServerRepository
    private lateinit var credentialStore: AndroidKeystoreCredentialStore
    private lateinit var credentialManager: McpCredentialManager
    private lateinit var toolRegistry: DefaultToolRegistry
    private lateinit var auditLogger: InMemoryAuditLogger
    private lateinit var mcpManager: DefaultMcpManager
    private lateinit var permissionEngine: DefaultPermissionEngine

    private val testSite = Site(
        id = "site_001",
        siteName = "Juba Raha Paradise Hotel",
        websiteUrl = "https://jubarahaparadisehotel.com",
        mcpStatus = McpStatus.CONNECTED
    )

    private val testServer = MCPServer(
        id = "mcp_jubarah",
        name = "Juba Raha MCP Server",
        endpoint = "https://jubarahaparadisehotel.com/mcp",
        siteId = "site_001",
        connectionStatus = McpConnectionStatus.CONNECTED,
        enabled = true,
        authenticationType = McpAuthType.NONE
    )

    private val activeContext = ActiveSiteContext(
        siteId = "site_001",
        siteName = "Juba Raha Paradise Hotel",
        websiteUrl = "https://jubarahaparadisehotel.com",
        activeMcpServerId = "mcp_jubarah",
        activeConversationId = "conv_001"
    )

    @Before
    fun setUp() = runBlocking {
        siteRepository = InMemorySiteRepository()
        siteRepository.addSite(testSite)

        conversationRepository = InMemoryConversationRepository()
        conversationRepository.createConversation("site_001", "Ops Session")

        mcpServerRepository = InMemoryMcpServerRepository()
        mcpServerRepository.saveServer(testServer)

        credentialStore = AndroidKeystoreCredentialStore()
        credentialManager = McpCredentialManager(credentialStore)
        toolRegistry = DefaultToolRegistry()
        auditLogger = InMemoryAuditLogger()
        permissionEngine = DefaultPermissionEngine()

        mcpManager = DefaultMcpManager(
            mcpServerRepository = mcpServerRepository,
            siteRepository = siteRepository,
            toolRegistry = toolRegistry,
            credentialManager = credentialManager,
            auditLogger = auditLogger
        )
        mcpManager.switchActiveSite(testSite, "conv_001")

        // Register tools for site_001
        val readTool = McpTool(
            name = "wp_get_site_health",
            description = "Inspects site health",
            serverId = "mcp_jubarah",
            siteId = "site_001",
            riskLevel = ToolRiskLevel.READ,
            requiresApproval = false
        )
        val writeTool = McpTool(
            name = "wp_delete_post",
            description = "Permanently deletes a post",
            inputSchema = mapOf("post_id" to mapOf("type" to "integer")),
            serverId = "mcp_jubarah",
            siteId = "site_001",
            riskLevel = ToolRiskLevel.DESTRUCTIVE,
            requiresApproval = true
        )
        toolRegistry.registerDiscoveredTools("site_001", "mcp_jubarah", listOf(readTool, writeTool))
    }

    @Test
    fun `test direct final response without tool calls terminates in 1 iteration`() = runBlocking {
        val mockProvider = object : AIProvider {
            override val providerId: String = "mock"
            override val providerDisplayName: String = "Mock"
            override suspend fun sendMessage(request: AIRequest): Result<AIResponse> {
                return Result.success(
                    AIResponse(
                        content = "All WordPress systems operational on Juba Raha.",
                        toolCalls = emptyList(),
                        modelUsed = "test-model"
                    )
                )
            }
            override fun streamMessage(request: AIRequest): Flow<AIStreamChunk> = emptyFlow()
            override suspend fun listModels(forceRefresh: Boolean): List<AIModel> = emptyList()
            override suspend fun getModel(modelId: String): AIModel? = null
            override suspend fun testConnection(apiKey: String?): ConnectionTestResult =
                ConnectionTestResult(true, 10, "OK")
            override fun cancelGeneration() {}
        }

        val engine = DefaultAgentEngine(
            aiProvider = mockProvider,
            toolRegistry = toolRegistry,
            permissionEngine = permissionEngine,
            mcpManager = mcpManager,
            siteRepository = siteRepository,
            conversationRepository = conversationRepository,
            mcpServerRepository = mcpServerRepository,
            credentialStore = credentialStore,
            auditLogger = auditLogger
        )

        val events = engine.runTurn(activeContext, "Status report please", emptyList(), "test-model").toList()

        assertTrue(events.any { it is AgentExecutionEvent.Started })
        assertTrue(events.any { it is AgentExecutionEvent.IterationStarted && it.iteration == 1 })
        val completion = events.filterIsInstance<AgentExecutionEvent.TurnCompleted>().firstOrNull()
        assertNotNull(completion)
        assertEquals("All WordPress systems operational on Juba Raha.", completion!!.finalResponse)
        assertEquals(1, completion.totalIterations)
        assertEquals(0, completion.executedToolsCount)
    }

    @Test
    fun `test agent loop executes read tool and returns final response`() = runBlocking {
        var turnCount = 0
        val mockProvider = object : AIProvider {
            override val providerId: String = "mock"
            override val providerDisplayName: String = "Mock"
            override suspend fun sendMessage(request: AIRequest): Result<AIResponse> {
                turnCount++
                return if (turnCount == 1) {
                    // Turn 1: Propose tool call
                    Result.success(
                        AIResponse(
                            content = null,
                            toolCalls = listOf(
                                AIToolCall(
                                    id = "call_health_1",
                                    name = "wp_get_site_health",
                                    argumentsJson = "{}"
                                )
                            ),
                            modelUsed = "test-model"
                        )
                    )
                } else {
                    // Turn 2: Final response after receiving tool output
                    Result.success(
                        AIResponse(
                            content = "Diagnostics completed: Core integrity verified (Optimal status).",
                            toolCalls = emptyList(),
                            modelUsed = "test-model"
                        )
                    )
                }
            }
            override fun streamMessage(request: AIRequest): Flow<AIStreamChunk> = emptyFlow()
            override suspend fun listModels(forceRefresh: Boolean): List<AIModel> = emptyList()
            override suspend fun getModel(modelId: String): AIModel? = null
            override suspend fun testConnection(apiKey: String?): ConnectionTestResult =
                ConnectionTestResult(true, 10, "OK")
            override fun cancelGeneration() {}
        }

        val engine = DefaultAgentEngine(
            aiProvider = mockProvider,
            toolRegistry = toolRegistry,
            permissionEngine = permissionEngine,
            mcpManager = mcpManager,
            siteRepository = siteRepository,
            conversationRepository = conversationRepository,
            mcpServerRepository = mcpServerRepository,
            credentialStore = credentialStore,
            auditLogger = auditLogger
        )

        val events = engine.runTurn(activeContext, "Run health check", emptyList(), "test-model").toList()

        assertTrue(events.any { it is AgentExecutionEvent.ToolCallDetected && it.toolCall.name == "wp_get_site_health" })
        assertTrue(events.any { it is AgentExecutionEvent.ToolExecuting && it.toolCall.name == "wp_get_site_health" })
        assertTrue(events.any { it is AgentExecutionEvent.ToolExecutionFinished })

        val completion = events.filterIsInstance<AgentExecutionEvent.TurnCompleted>().firstOrNull()
        assertNotNull(completion)
        assertEquals("Diagnostics completed: Core integrity verified (Optimal status).", completion!!.finalResponse)
        assertEquals(2, completion.totalIterations)
        assertEquals(1, completion.executedToolsCount)
    }

    @Test
    fun `test maximum iteration safeguard prevents infinite loop`() = runBlocking {
        // Mock provider always calls a tool indefinitely
        val infiniteToolProvider = object : AIProvider {
            override val providerId: String = "mock"
            override val providerDisplayName: String = "Mock"
            override suspend fun sendMessage(request: AIRequest): Result<AIResponse> {
                return Result.success(
                    AIResponse(
                        content = null,
                        toolCalls = listOf(
                            AIToolCall(
                                id = "call_loop_${System.nanoTime()}",
                                name = "wp_get_site_health",
                                argumentsJson = "{}"
                            )
                        ),
                        modelUsed = "test-model"
                    )
                )
            }
            override fun streamMessage(request: AIRequest): Flow<AIStreamChunk> = emptyFlow()
            override suspend fun listModels(forceRefresh: Boolean): List<AIModel> = emptyList()
            override suspend fun getModel(modelId: String): AIModel? = null
            override suspend fun testConnection(apiKey: String?): ConnectionTestResult =
                ConnectionTestResult(true, 10, "OK")
            override fun cancelGeneration() {}
        }

        val engine = DefaultAgentEngine(
            aiProvider = infiniteToolProvider,
            toolRegistry = toolRegistry,
            permissionEngine = permissionEngine,
            mcpManager = mcpManager,
            siteRepository = siteRepository,
            conversationRepository = conversationRepository,
            mcpServerRepository = mcpServerRepository,
            credentialStore = credentialStore,
            auditLogger = auditLogger
        )

        val events = engine.runTurn(
            context = activeContext,
            prompt = "Infinite test",
            history = emptyList(),
            modelId = "test-model",
            maxIterations = 3
        ).toList()

        assertTrue(events.any { it is AgentExecutionEvent.MaxIterationsReached && it.iterationsRun == 3 })
        val completion = events.filterIsInstance<AgentExecutionEvent.TurnCompleted>().firstOrNull()
        assertNotNull(completion)
        assertEquals(3, completion!!.totalIterations)
        assertTrue(completion.finalResponse.contains("Maximum iteration safety limit"))
    }

    @Test
    fun `test strict tool isolation blocks cross-site tool execution`() = runBlocking {
        // Register an unauthorized tool belonging to another site (site_002)
        val foreignTool = McpTool(
            name = "wp_foreign_site_tool",
            description = "Foreign tool",
            serverId = "mcp_jubarah",
            siteId = "site_002",
            riskLevel = ToolRiskLevel.READ
        )
        // Manually place it in registry under site_001 with wrong siteId metadata
        toolRegistry.registerDiscoveredTools("site_001", "mcp_jubarah", listOf(foreignTool))

        var callCount = 0
        val mockProvider = object : AIProvider {
            override val providerId: String = "mock"
            override val providerDisplayName: String = "Mock"
            override suspend fun sendMessage(request: AIRequest): Result<AIResponse> {
                callCount++
                return if (callCount == 1) {
                    Result.success(
                        AIResponse(
                            content = null,
                            toolCalls = listOf(
                                AIToolCall(
                                    id = "call_foreign",
                                    name = "wp_foreign_site_tool",
                                    argumentsJson = "{}"
                                )
                            ),
                            modelUsed = "test-model"
                        )
                    )
                } else {
                    Result.success(
                        AIResponse(
                            content = "Acknowledged: Security prevented unauthorized cross-site action.",
                            toolCalls = emptyList(),
                            modelUsed = "test-model"
                        )
                    )
                }
            }
            override fun streamMessage(request: AIRequest): Flow<AIStreamChunk> = emptyFlow()
            override suspend fun listModels(forceRefresh: Boolean): List<AIModel> = emptyList()
            override suspend fun getModel(modelId: String): AIModel? = null
            override suspend fun testConnection(apiKey: String?): ConnectionTestResult =
                ConnectionTestResult(true, 10, "OK")
            override fun cancelGeneration() {}
        }

        val engine = DefaultAgentEngine(
            aiProvider = mockProvider,
            toolRegistry = toolRegistry,
            permissionEngine = permissionEngine,
            mcpManager = mcpManager,
            siteRepository = siteRepository,
            conversationRepository = conversationRepository,
            mcpServerRepository = mcpServerRepository,
            credentialStore = credentialStore,
            auditLogger = auditLogger
        )

        val events = engine.runTurn(activeContext, "Try cross site", emptyList(), "test-model").toList()

        val rejected = events.filterIsInstance<AgentExecutionEvent.ToolExecutionRejected>().firstOrNull()
        assertNotNull(rejected)
        assertTrue(rejected!!.reason.contains("Cross-site tool execution is prohibited"))
        // Check audit log logged security violation
        val audits = auditLogger.getEventsForSite("site_001")
        assertTrue(audits.any { it.userAction.contains("SECURITY_VIOLATION_RULE_5") })
    }

    @Test
    fun `test operator approval rejection pauses loop and returns operator refusal to model`() = runBlocking {
        var callCount = 0
        val mockProvider = object : AIProvider {
            override val providerId: String = "mock"
            override val providerDisplayName: String = "Mock"
            override suspend fun sendMessage(request: AIRequest): Result<AIResponse> {
                callCount++
                return if (callCount == 1) {
                    Result.success(
                        AIResponse(
                            content = null,
                            toolCalls = listOf(
                                AIToolCall(
                                    id = "call_del_1",
                                    name = "wp_delete_post",
                                    argumentsJson = """{"post_id": 42}"""
                                )
                            ),
                            modelUsed = "test-model"
                        )
                    )
                } else {
                    Result.success(
                        AIResponse(
                            content = "Operation aborted as requested by human operator.",
                            toolCalls = emptyList(),
                            modelUsed = "test-model"
                        )
                    )
                }
            }
            override fun streamMessage(request: AIRequest): Flow<AIStreamChunk> = emptyFlow()
            override suspend fun listModels(forceRefresh: Boolean): List<AIModel> = emptyList()
            override suspend fun getModel(modelId: String): AIModel? = null
            override suspend fun testConnection(apiKey: String?): ConnectionTestResult =
                ConnectionTestResult(true, 10, "OK")
            override fun cancelGeneration() {}
        }

        val engine = DefaultAgentEngine(
            aiProvider = mockProvider,
            toolRegistry = toolRegistry,
            permissionEngine = permissionEngine,
            mcpManager = mcpManager,
            siteRepository = siteRepository,
            conversationRepository = conversationRepository,
            mcpServerRepository = mcpServerRepository,
            credentialStore = credentialStore,
            auditLogger = auditLogger
        )

        val events = mutableListOf<AgentExecutionEvent>()
        val job = launch {
            engine.runTurn(activeContext, "Delete post 42", emptyList(), "test-model").collect {
                events.add(it)
                if (it is AgentExecutionEvent.ToolApprovalRequired) {
                    // Operator explicitly rejects the destructive action
                    engine.resolveApproval(it.approvalId, approved = false, operatorNotes = "No post deletions allowed")
                }
            }
        }
        job.join()

        assertTrue(events.any { it is AgentExecutionEvent.ToolApprovalRequired })
        assertTrue(events.any { it is AgentExecutionEvent.ToolExecutionRejected })
        val completion = events.filterIsInstance<AgentExecutionEvent.TurnCompleted>().firstOrNull()
        assertNotNull(completion)
        assertEquals("Operation aborted as requested by human operator.", completion!!.finalResponse)
        assertEquals(0, completion.executedToolsCount) // Destructive tool was NOT executed!
    }
}
