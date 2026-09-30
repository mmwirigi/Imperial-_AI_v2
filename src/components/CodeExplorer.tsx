import React, { useState } from 'react';
import { FileCode, Folder, Check, Copy, ChevronRight, Layers, Shield, Cpu, ExternalLink } from 'lucide-react';

interface FileEntry {
  path: string;
  name: string;
  category: string;
  description: string;
  codeSnippet: string;
}

export const CodeExplorer: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const files: FileEntry[] = [
    {
      path: 'android/app/build.gradle.kts',
      name: 'app/build.gradle.kts',
      category: 'Build & Config',
      description: 'Module build configuration targeting compileSdk 35, minSdk 29 (Android 10+), Jetpack Compose BoM 2025.02, Material 3, and AndroidX Security Crypto.',
      codeSnippet: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "ke.imperialenterprise.imperialai"
    compileSdk = 35

    defaultConfig {
        applicationId = "ke.imperialenterprise.imperialai"
        minSdk = 29 // Android 10+
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0-phase1"
    }
    // Jetpack Compose & M3 dependencies...
}`,
    },
    {
      path: 'android/app/src/main/AndroidManifest.xml',
      name: 'AndroidManifest.xml',
      category: 'Build & Config',
      description: 'App manifest declaring ImperialAiApplication, MainActivity edge-to-edge Compose entry point, and strict backup exclusion rules.',
      codeSnippet: `<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <application
        android:name=".ImperialAiApplication"
        android:allowBackup="false"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:label="@string/app_name"
        android:theme="@style/Theme.ImperialAI">
        <activity android:name=".MainActivity" android:exported="true" />
    </application>
</manifest>`,
    },
    {
      path: 'android/app/src/main/java/ke/imperialenterprise/imperialai/domain/model/Site.kt',
      name: 'Site.kt',
      category: 'Domain Models',
      description: 'Data model representing WordPress client installation with WordPressType, SeoPlugin, PageBuilder, notes, AI directives, and permission policy.',
      codeSnippet: `package ke.imperialenterprise.imperialai.domain.model

data class Site(
    val id: String = UUID.randomUUID().toString(),
    val siteName: String,
    val websiteUrl: String,
    val clientCompanyName: String,
    val mcpEndpoint: String = "",
    val mcpStatus: McpStatus = McpStatus.DISCONNECTED,
    val wordPressType: WordPressType = WordPressType.SELF_HOSTED,
    val seoPlugin: SeoPlugin = SeoPlugin.YOAST,
    val pageBuilder: PageBuilder = PageBuilder.GUTENBERG,
    val notes: String = "",
    val aiInstructions: String = "",
    val permissionPolicy: PermissionPolicy = PermissionPolicy(siteId = id),
    val lastConnection: String = "Never",
    val lastActivity: String = "No recorded activity",
    val isDemo: Boolean = false
)`,
    },
    {
      path: 'android/app/src/main/java/ke/imperialenterprise/imperialai/domain/model/Task.kt',
      name: 'Task.kt',
      category: 'Domain Models',
      description: 'Task state lifecycle model with TaskCategory (SECURITY, MAINTENANCE, CONTENT, SEO, PERFORMANCE, GENERAL) and approval checkpoints.',
      codeSnippet: `package ke.imperialenterprise.imperialai.domain.model

data class Task(
    val id: String = UUID.randomUUID().toString(),
    val title: String,
    val description: String,
    val siteId: String,
    val siteName: String,
    val category: TaskCategory = TaskCategory.GENERAL,
    val createdDate: String,
    val updatedDate: String,
    val status: TaskState = TaskState.DRAFT,
    val requestedAction: String,
    val dangerousActionType: DangerousActionType = DangerousActionType.READ_ONLY_AUDIT,
    val approvalRequirement: ApprovalRequirement = ApprovalRequirement.NONE,
    val executionResult: ExecutionResult? = null
)

enum class TaskCategory(val displayName: String, val iconDescription: String) {
    SECURITY("Security", "Shield"),
    MAINTENANCE("Maintenance", "Tool"),
    CONTENT("Content", "Document"),
    SEO("SEO & Metadata", "Search"),
    PERFORMANCE("Performance", "Bolt"),
    GENERAL("General", "Folder")
}`,
    },
    {
      path: 'android/app/src/main/java/ke/imperialenterprise/imperialai/domain/model/PermissionPolicy.kt',
      name: 'PermissionPolicy.kt',
      category: 'Security & Isolation',
      description: 'Security rules defining operator approval gating for dangerous actions (deleting pages, deleting posts, plugin modifications, DNS changes, etc.).',
      codeSnippet: `package ke.imperialenterprise.imperialai.domain.model

data class PermissionPolicy(
    val siteId: String,
    val requireApprovalForDeletePages: Boolean = true,
    val requireApprovalForDeletePosts: Boolean = true,
    val requireApprovalForSiteSettings: Boolean = true,
    val requireApprovalForPublishing: Boolean = true,
    val requireApprovalForPlugins: Boolean = true,
    val requireApprovalForThemes: Boolean = true,
    val requireApprovalForUsers: Boolean = true,
    val requireApprovalForDns: Boolean = true,
    val requireApprovalForBulkEdit: Boolean = true
)`,
    },
    {
      path: 'android/app/src/main/java/ke/imperialenterprise/imperialai/domain/repository/CredentialStore.kt',
      name: 'CredentialStore.kt',
      category: 'Security & Isolation',
      description: 'Android Keystore cryptographic contract guaranteeing plain SharedPreferences are never used for API keys, MCP tokens, or WordPress passwords.',
      codeSnippet: `package ke.imperialenterprise.imperialai.domain.repository

interface CredentialStore {
    suspend fun getOpenRouterApiKey(): String?
    suspend fun setOpenRouterApiKey(apiKey: String)
    suspend fun clearOpenRouterApiKey()

    // Site-isolated credential getters:
    suspend fun getSiteMcpToken(siteId: String): String?
    suspend fun setSiteMcpToken(siteId: String, token: String)

    suspend fun getWordPressAppPassword(siteId: String): String?
    suspend fun setWordPressAppPassword(siteId: String, password: String)
    suspend fun clearSiteCredentials(siteId: String)
    fun isHardwareBackedKeystoreAvailable(): Boolean
}`,
    },
    {
      path: 'android/app/src/main/java/ke/imperialenterprise/imperialai/domain/agent/AIProvider.kt',
      name: 'AIProvider.kt',
      category: 'Agent Architecture',
      description: 'Interface placeholder for future OpenRouter LLM streaming completion without coupling WordPress logic to UI screens.',
      codeSnippet: `package ke.imperialenterprise.imperialai.domain.agent

interface AIProvider {
    fun streamChatCompletion(
        siteId: String,
        model: AIModel,
        systemInstruction: String,
        messages: List<ChatMessage>
    ): Flow<AIStreamEvent>

    suspend fun testConnection(apiKey: String): ConnectionTestResult
}`,
    },
    {
      path: 'android/app/src/main/java/ke/imperialenterprise/imperialai/domain/agent/MCPClient.kt',
      name: 'MCPClient.kt',
      category: 'Agent Architecture',
      description: 'Interface abstraction for future remote MCP (Model Context Protocol) JSON-RPC client connection and tool invocation.',
      codeSnippet: `package ke.imperialenterprise.imperialai.domain.agent

interface MCPClient {
    suspend fun connect(siteId: String, endpointUrl: String): McpConnectionResult
    suspend fun disconnect(siteId: String)
    fun observeStatus(siteId: String): Flow<McpStatus>
    suspend fun listTools(siteId: String): List<MCPToolDefinition>
    suspend fun executeTool(siteId: String, toolName: String, argumentsJson: String): MCPToolExecutionResult
}`,
    },
    {
      path: 'android/app/src/main/java/ke/imperialenterprise/imperialai/data/sample/SampleData.kt',
      name: 'SampleData.kt',
      category: 'Data & Repositories',
      description: 'Preloaded sample datasets containing the 5 demo WordPress client sites for Imperial Enterprise Kenya.',
      codeSnippet: `package ke.imperialenterprise.imperialai.data.sample

object SampleData {
    val demoSites: List<Site> = listOf(
        // 1. Juba Raha Paradise Hotel (https://jrparadisehotel.com)
        // 2. Debrazz Security Systems (https://debrazzsecuritysystems.co.ke)
        // 3. Anthony Gatune Foundation (https://anthonygatunefoundation.org)
        // 4. Resource Management International Africa (https://resourcekenya.com)
        // 5. CHICHI EXIM Engineering (https://chichiexim.com)
    )
}`,
    },
    {
      path: 'android/app/src/main/java/ke/imperialenterprise/imperialai/ui/theme/Theme.kt',
      name: 'Theme.kt',
      category: 'Jetpack Compose UI',
      description: 'Imperial AI Dark-first Material 3 theme implementation with Amber gold brand accents, Obsidian surfaces, and system bars configuration.',
      codeSnippet: `package ke.imperialenterprise.imperialai.ui.theme

private val DarkColorScheme = darkColorScheme(
    primary = ImperialGoldPrimary,
    onPrimary = ObsidianSurface,
    background = ObsidianSurface,
    surface = CardSurface,
    outline = BorderHairline,
    error = StatusError
)

@Composable
fun ImperialAITheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = DarkColorScheme, typography = Typography, content = content)
}`,
    },
    {
      path: 'android/app/src/main/java/ke/imperialenterprise/imperialai/MainActivity.kt',
      name: 'MainActivity.kt',
      category: 'Jetpack Compose UI',
      description: 'Root Single-Activity orchestrating NavHost across Home, Sites, Tasks, Chat, and Settings with bottom navigation.',
      codeSnippet: `package ke.imperialenterprise.imperialai

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val app = application as ImperialAiApplication
        setContent {
            ImperialAITheme {
                ImperialAiApp(app)
            }
        }
    }
}`,
    },
    {
      path: 'android/app/src/main/java/ke/imperialenterprise/imperialai/data/openrouter/OpenRouterProvider.kt',
      name: 'OpenRouterProvider.kt',
      category: 'Agent Architecture',
      description: 'Production AIProvider implementation routing to OpenRouter OpenAI-compatible chat completions and model endpoints with SSE streaming, token usage metering, cancellation, and error classification.',
      codeSnippet: `package ke.imperialenterprise.imperialai.data.openrouter

class OpenRouterProvider(
    private val credentialStore: CredentialStore
) : AIProvider {
    override val providerId = "openrouter"
    
    override fun streamMessage(request: AIRequest): Flow<AIStreamChunk> = flow {
        val apiKey = credentialStore.getOpenRouterApiKey()
        if (apiKey.isNullOrBlank()) {
            emit(AIStreamChunk.Error(AIError.noApiKey()))
            return@flow
        }
        // Progressive SSE stream processing line by line...
    }
}`,
    },
    {
      path: 'android/app/src/main/java/ke/imperialenterprise/imperialai/data/openrouter/OpenRouterNormalizer.kt',
      name: 'OpenRouterNormalizer.kt',
      category: 'Agent Architecture',
      description: 'Normalizes OpenRouter raw JSON model responses into application domain models. Detects free tiers from $0.00 pricing, extracts context lengths, and verifies tools/vision/reasoning metadata.',
      codeSnippet: `package ke.imperialenterprise.imperialai.data.openrouter

object OpenRouterNormalizer {
    fun parseModelsResponse(jsonString: String): List<AIModel> { ... }
    
    fun parseSingleModel(item: JSONObject): AIModel? {
        val promptPrice = item.optJSONObject("pricing")?.optString("prompt", "0") ?: "0"
        val completionPrice = item.optJSONObject("pricing")?.optString("completion", "0") ?: "0"
        val isFree = (promptPrice == "0" && completionPrice == "0") || id.endsWith(":free")
        ...
    }
}`,
    },
    {
      path: 'android/app/src/main/java/ke/imperialenterprise/imperialai/ui/models/ModelCenterScreen.kt',
      name: 'ModelCenterScreen.kt',
      category: 'Jetpack Compose UI',
      description: 'Jetpack Compose AI Model Center providing live search, filters (ALL, FREE, PAID, VISION, TOOLS, REASONING), sorting by context/cost, a dedicated Free Models section, and selection.',
      codeSnippet: `@Composable
fun ModelCenterScreen(viewModel: ModelCenterViewModel, onNavigateBack: () -> Unit) {
    val uiState by viewModel.uiState.collectAsState()
    Scaffold(topBar = { ... }) { padding ->
        Column {
            OutlinedTextField(value = uiState.searchQuery, ...)
            ModelFilterChips(selected = uiState.activeFilter, ...)
            LazyColumn {
                if (uiState.activeFilter == ModelFilter.ALL && uiState.freeModels.isNotEmpty()) {
                    item { FreeModelsBanner(count = uiState.freeModels.size) }
                }
                items(uiState.models) { model ->
                    ModelCatalogCard(model = model, isGlobalDefault = ..., ...)
                }
            }
        }
    }
}`,
    },
    {
      path: 'android/app/src/test/java/ke/imperialenterprise/imperialai/OpenRouterNormalizerAndErrorTest.kt',
      name: 'OpenRouterNormalizerAndErrorTest.kt',
      category: 'Agent Architecture',
      description: 'Unit test suite validating free model detection from zero-cost pricing, capability detection (vision, tools, reasoning), pricing calculation, and structured HTTP error mapping.',
      codeSnippet: `class OpenRouterNormalizerAndErrorTest {
    @Test
    fun testFreeModelDetectionFromZeroCostPricing() {
        val model = OpenRouterNormalizer.parseSingleModel(jsonObj)
        assertTrue(model.isFree)
        assertEquals(0.0, model.inputCost, 0.0001)
    }

    @Test
    fun testErrorMappingWithoutLeakingHeaders() {
        val err401 = AIError.fromHttpStatus(401)
        assertEquals(AIErrorCode.INVALID_API_KEY, err401.code)
    }
}`,
    },
    {
      path: 'android/app/src/main/java/ke/imperialenterprise/imperialai/data/mcp/StreamableHttpMcpClient.kt',
      name: 'StreamableHttpMcpClient.kt',
      category: 'Remote MCP Engine',
      description: 'Production MCP client implementing Streamable HTTP JSON-RPC 2.0 with session ID headers, bounded non-destructive retries, timeouts, and Bearer token injection.',
      codeSnippet: `package ke.imperialenterprise.imperialai.data.mcp

class StreamableHttpMcpClient(
    override val serverId: String,
    override val siteId: String,
    private val endpointUrl: String,
    private val authType: McpAuthType,
    private val credentialManager: McpCredentialManager,
    private val serverName: String = "Remote MCP Server"
) : McpConnection {
    // JSON-RPC 2.0 initialize, tools/list, tools/call
    override suspend fun initialize(): Result<MCPServer> { ... }
    override suspend fun listTools(): Result<List<McpTool>> { ... }
    override suspend fun callTool(name: String, args: Map<String, Any?>): Result<McpToolResult> { ... }
}`,
    },
    {
      path: 'android/app/src/main/java/ke/imperialenterprise/imperialai/data/mcp/DefaultMcpManager.kt',
      name: 'DefaultMcpManager.kt',
      category: 'Remote MCP Engine',
      description: 'High-level MCP coordinator managing client site isolation boundaries, context switching, dynamic tool catalogs, and security verification prior to execution.',
      codeSnippet: `package ke.imperialenterprise.imperialai.data.mcp

class DefaultMcpManager(...) : McpManager {
    override suspend fun executeTool(request: ToolExecutionRequest): Result<McpToolResult> {
        val context = _activeContext.value ?: return logAndReject(request, "No active site")
        if (request.siteId != context.siteId) return logAndReject(request, "Cross-site execution prohibited")
        val server = mcpServerRepository.getServerById(request.siteId, request.mcpServerId)
        if (server == null || server.siteId != request.siteId) return logAndReject(request, "Server not bound to site")
        if (server.connectionStatus != McpConnectionStatus.CONNECTED) return logAndReject(request, "Server not connected")
        // Enforce operator approval & dispatch...
    }
}`,
    },
    {
      path: 'android/app/src/test/java/ke/imperialenterprise/imperialai/McpSecurityAndIsolationTest.kt',
      name: 'McpSecurityAndIsolationTest.kt',
      category: 'Remote MCP Engine',
      description: 'Comprehensive test suite verifying site/MCP relationship validation, cross-site rejection (Site A -> MCP B -> tool REJECTED), credential isolation, and audit sanitization.',
      codeSnippet: `class McpSecurityAndIsolationTest {
    @Test
    fun testCrossSiteExecutionRejection() = runBlocking {
        mcpManager.switchActiveSite(siteA)
        val illicitRequest = ToolExecutionRequest(
            siteId = "site_alpha",
            mcpServerId = "mcp_beta_01", // Belongs to Site B!
            toolName = "read_security_logs"
        )
        val result = mcpManager.executeTool(illicitRequest)
        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull() is SecurityException)
    }
}`,
    },
    {
      path: 'android/app/src/main/java/ke/imperialenterprise/imperialai/data/db/McpDatabaseEntities.kt',
      name: 'McpDatabaseEntities.kt',
      category: 'Data & Repositories',
      description: 'Room/SQLite database entities for McpServerEntity, McpToolEntity, and SiteMcpCrossRef with v2 to v3 schema migration rules (no secrets stored).',
      codeSnippet: `package ke.imperialenterprise.imperialai.data.db

data class McpServerEntity(...)
data class McpToolEntity(...)
data class SiteMcpCrossRef(...)

object McpDatabaseMigrations {
    const val CURRENT_VERSION = 3
    val MIGRATION_2_3_SQL = """..."""
}`,
    },
    {
      path: 'android/app/src/main/java/ke/imperialenterprise/imperialai/data/agent/DefaultAgentEngine.kt',
      name: 'DefaultAgentEngine.kt',
      category: 'Agent Architecture',
      description: 'Phase 4 autonomous agent engine coordinating OpenRouter reasoning, MCP tool discovery, strict site isolation, operator approvals, and execution loops.',
      codeSnippet: `package ke.imperialenterprise.imperialai.data.agent

class DefaultAgentEngine(
    private val aiProvider: AIProvider,
    private val toolRegistry: ToolRegistry,
    private val permissionEngine: PermissionEngine,
    private val mcpManager: McpManager,
    private val siteRepository: SiteRepository,
    private val conversationRepository: ConversationRepository,
    private val mcpServerRepository: McpServerRepository,
    private val credentialStore: CredentialStore,
    private val auditLogger: AuditLogger,
    private val agentRunRepository: AgentRunRepository = InMemoryAgentRunRepository()
) : AgentEngine {
    // Flow: User -> Chat -> ChatViewModel -> AgentEngine -> AIProvider -> OpenRouter
    // -> Model decides tool -> ToolRegistry -> ActiveSiteContext check -> Approval check
    // -> MCP tool execution -> Tool result -> OpenRouter -> Final response.
}`,
    },
    {
      path: 'android/app/src/main/java/ke/imperialenterprise/imperialai/domain/agent/ToolSecurityValidator.kt',
      name: 'ToolSecurityValidator.kt',
      category: 'Security & Isolation',
      description: 'Strict 8-rule client isolation gate preventing cross-site tool execution, mismatched server IDs, or unauthenticated remote calls.',
      codeSnippet: `package ke.imperialenterprise.imperialai.domain.agent

class ToolSecurityValidator(
    private val siteRepository: SiteRepository,
    private val conversationRepository: ConversationRepository,
    private val mcpServerRepository: McpServerRepository,
    private val toolRegistry: ToolRegistry,
    private val credentialStore: CredentialStore
) {
    // 8 Rules: Active site exists, conversation belongs to site, server belongs to site,
    // tool belongs to server, tool belongs to site, server connected/enabled,
    // credentials match server, tool currently registered.
}`,
    },
    {
      path: 'android/app/src/main/java/ke/imperialenterprise/imperialai/domain/agent/ToolSchemaConverter.kt',
      name: 'ToolSchemaConverter.kt',
      category: 'Agent Architecture',
      description: 'MCP tool schema converter translating tool definitions into OpenRouter function calling schemas with graceful normalization.',
      codeSnippet: `package ke.imperialenterprise.imperialai.domain.agent

object ToolSchemaConverter {
    fun convert(tool: McpTool): ConversionResult { ... }
    fun convertAll(tools: List<McpTool>): Pair<List<AIToolDefinition>, List<String>> { ... }
}`,
    },
    {
      path: 'android/app/src/main/java/ke/imperialenterprise/imperialai/data/repository/DefaultPermissionEngine.kt',
      name: 'DefaultPermissionEngine.kt',
      category: 'Security & Isolation',
      description: 'Phase 5 permission engine enforcing default-deny, policy precedence (Global -> Site -> Tool -> Agent Mode -> Approval -> Execution), and bulk action protection.',
      codeSnippet: `package ke.imperialenterprise.imperialai.data.repository

class DefaultPermissionEngine(
    private val approvalEngine: ApprovalEngine,
    private val auditLogger: AuditLogger? = null,
    private val globalPolicy: GlobalPermissionPolicy = GlobalPermissionPolicy()
) : PermissionEngine {
    override fun evaluateToolExecution(...): PermissionDecision {
        // 1. Global Policy (blocked tools, run limits)
        // 2. Site Policy (allowlist, blocklist, run limits)
        // 3. Tool Policy (enabled, allowed modes)
        // 4. Bulk Action Protection
        // 5. Agent Mode (READ, PLAN, EXECUTE)
        // 6. Approval Requirement / Deny / Allow
    }
}`,
    },
    {
      path: 'android/app/src/main/java/ke/imperialenterprise/imperialai/data/security/DefaultApprovalEngine.kt',
      name: 'DefaultApprovalEngine.kt',
      category: 'Security & Isolation',
      description: 'Operator approval lifecycle engine enforcing deterministic SHA-256 argument binding, automatic expiration, and anti-replay token consumption.',
      codeSnippet: `package ke.imperialenterprise.imperialai.data.security

class DefaultApprovalEngine(
    private val auditLogger: AuditLogger? = null
) : ApprovalEngine {
    override fun createApprovalRequest(...): ApprovalRequest
    override fun resolveApproval(...): Boolean
    override fun consumeApprovalForExecution(...): Boolean
    override fun revalidatePendingRequests()
}`,
    },
    {
      path: 'android/app/src/main/java/ke/imperialenterprise/imperialai/domain/security/SensitiveDataRedactor.kt',
      name: 'SensitiveDataRedactor.kt',
      category: 'Security & Isolation',
      description: 'Universal credential and token redactor stripping Bearer tokens, API keys, and passwords before logging, auditing, or UI presentation.',
      codeSnippet: `package ke.imperialenterprise.imperialai.domain.security

object SensitiveDataRedactor {
    fun redact(input: String?): String
    fun redactMap(map: Map<String, Any?>): Map<String, Any?>
    fun summarizeArguments(args: Map<String, Any?>, maxChars: Int = 120): String
}`,
    },
    {
      path: 'android/app/src/test/java/ke/imperialenterprise/imperialai/SecurityEngineTestSuite.kt',
      name: 'SecurityEngineTestSuite.kt',
      category: 'Data & Repositories',
      description: 'Comprehensive 28-point security test suite and mock scenarios A-H validating default-deny, context isolation, anti-replay, and fail-closed behaviors.',
      codeSnippet: `package ke.imperialenterprise.imperialai

class SecurityEngineTestSuite {
    @Test fun \`test 1 - unknown tool never allows silent execution\`()
    @Test fun \`test 2 - globally blocked tool is categorically denied\`()
    @Test fun \`test 8 - modifying arguments invalidates approval hash\`()
    @Test fun \`test 12 - anti-replay prevents reusing approved token\`()
    @Test fun \`test 22 - prompt injection cannot override security policies\`()
    // 28 comprehensive test cases & scenarios A-H...
}`,
    },
    {
      path: 'android/app/src/main/java/ke/imperialenterprise/imperialai/domain/wordpress/WordPressAdapter.kt',
      name: 'WordPressAdapter.kt',
      category: 'Agent Architecture',
      description: 'Phase 6 Universal WordPress Intelligence Adapter interface orchestrating 20-stage read-only stack discovery, capability mapping, and the 7-stage operational workflow.',
      codeSnippet: `package ke.imperialenterprise.imperialai.domain.wordpress

interface WordPressAdapter {
    fun getSiteProfile(siteId: String): StateFlow<SiteStackProfile?>
    fun getSiteCapabilities(siteId: String): StateFlow<List<WordPressCapability>>
    fun getSiteFindings(siteId: String): StateFlow<List<AuditFinding>>
    fun getAvailableCommands(siteId: String): List<WordPressCommand>
    suspend fun inspectSite(context: ActiveSiteContext): Result<SiteStackProfile>
    suspend fun executeWorkflow(
        context: ActiveSiteContext,
        taskTitle: String,
        targetResource: String,
        auditToolName: String,
        auditArgs: Map<String, Any?>,
        mutationToolName: String,
        mutationArgs: Map<String, Any?>,
        expectedVerificationState: String,
        onStageUpdate: (WordPressTask) -> Unit = {}
    ): Result<WordPressTask>
}`,
    },
    {
      path: 'android/app/src/main/java/ke/imperialenterprise/imperialai/domain/wordpress/WordPressSiteInspector.kt',
      name: 'WordPressSiteInspector.kt',
      category: 'Agent Architecture',
      description: '100% Read-only discovery inspection engine analyzing WordPress core version, PHP runtime, active theme, page builder, SEO engine, and commerce platform without mutating the target site.',
      codeSnippet: `package ke.imperialenterprise.imperialai.domain.wordpress

class WordPressSiteInspector(
    private val toolRegistry: ToolRegistry,
    private val mcpManager: McpManager,
    private val siteRepository: SiteRepository,
    private val auditLogger: AuditLogger? = null
) {
    suspend fun inspectSite(context: ActiveSiteContext): Result<InspectionResult>
}`,
    },
    {
      path: 'android/app/src/test/java/ke/imperialenterprise/imperialai/WordPressIntelligenceTestSuite.kt',
      name: 'WordPressIntelligenceTestSuite.kt',
      category: 'Data & Repositories',
      description: 'Phase 6 test suite verifying heterogeneous stack detection, conservative capability resolution, preflight backup checks, live verification, and the 7-stage operational workflow.',
      codeSnippet: `package ke.imperialenterprise.imperialai

class WordPressIntelligenceTestSuite {
    @Test fun testHeterogeneousStackDetection()
    @Test fun testConservativeCapabilityResolution()
    @Test fun testReadOnlySiteInspectionGeneratesProfileAndFindings()
    @Test fun testBackupPreflightCheckPresenceAndAbsence()
    @Test fun test7StageOperationalWorkflowSuccess()
    @Test fun testVerificationFailureWhenSiteStateDoesNotReflectOutcome()
    @Test fun testStrictSiteProfileAndCapabilityIsolation()
    @Test fun testDynamicCommandRegistry()
    @Test fun testAiContextBuilderFormatAndInvariants()
}`,
    },
    {
      path: 'android/app/src/main/java/ke/imperialenterprise/imperialai/ui/tasks/TasksScreen.kt',
      name: 'TasksScreen.kt',
      category: 'Jetpack Compose UI',
      description: 'Jetpack Compose Tasks Pipeline grouping operations by TaskCategory (Security, Maintenance, Content, SEO, Performance) with filter chips, state badges, and execution inspector.',
      codeSnippet: `@Composable
fun TasksScreen(viewModel: TasksViewModel) {
    val uiState by viewModel.uiState.collectAsState()
    
    Scaffold(topBar = { ImperialTopBar(title = "Task Pipeline") }) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            CategoryChipsRow(
                selectedCategory = uiState.selectedFilterCategory,
                onCategorySelected = { viewModel.setFilterCategory(it) }
            )
            FilterChipsRow(
                selectedState = uiState.selectedFilterState,
                onStateSelected = { viewModel.setFilterState(it) }
            )
            LazyColumn {
                uiState.groupedTasks.forEach { (category, tasksInCategory) ->
                    item(key = "header_\${category.name}") {
                        CategoryGroupHeader(category = category, count = tasksInCategory.size)
                    }
                    items(tasksInCategory, key = { it.id }) { task ->
                        TaskCard(task = task, ...)
                    }
                }
            }
        }
    }
}`,
    },
  ];

  const categories = ['All', 'Build & Config', 'Domain Models', 'Security & Isolation', 'Agent Architecture', 'Data & Repositories', 'Jetpack Compose UI'];

  const filteredFiles = selectedCategory === 'All' 
    ? files 
    : files.filter((f) => f.category === selectedCategory);

  const copyToClipboard = (path: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="pb-2 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-neutral-100 uppercase tracking-wider font-mono">
              Android Kotlin Codebase Explorer
            </h1>
            <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-mono">
              52 Android Files Generated
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Production-grade Kotlin, Jetpack Compose, Material 3, MVVM, and Android Keystore security structure
          </p>
        </div>

        <div className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-950/30 border border-emerald-800/40 px-3 py-1.5 rounded-lg">
          <Check className="w-3.5 h-3.5" />
          <span>Android 10+ Ready (SDK 29 - 35)</span>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg border font-mono transition-colors shrink-0 ${
              selectedCategory === cat
                ? 'bg-amber-500 text-neutral-950 font-bold border-amber-500'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Files Grid */}
      <div className="space-y-4">
        {filteredFiles.map((file) => (
          <div
            key={file.path}
            className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm"
          >
            <div className="p-4 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-neutral-950/60">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold font-mono text-neutral-100">{file.name}</span>
                  <span className="text-[10px] font-mono text-neutral-500 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                    {file.category}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-neutral-500">{file.path}</div>
              </div>

              <button
                onClick={() => copyToClipboard(file.path, file.codeSnippet)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-mono rounded-lg transition-colors border border-neutral-700 self-start sm:self-auto"
              >
                {copiedPath === file.path ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Snippet</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs text-neutral-300 leading-relaxed">{file.description}</p>
              <pre className="bg-black/90 border border-neutral-800 rounded-lg p-3 text-[11px] font-mono text-neutral-300 overflow-x-auto leading-relaxed">
                <code>{file.codeSnippet}</code>
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
