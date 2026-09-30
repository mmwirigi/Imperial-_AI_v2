package ke.imperialenterprise.imperialai

import android.app.Application
import ke.imperialenterprise.imperialai.data.mcp.DefaultMcpManager
import ke.imperialenterprise.imperialai.data.mcp.DefaultToolRegistry
import ke.imperialenterprise.imperialai.data.mcp.McpCredentialManager
import ke.imperialenterprise.imperialai.data.openrouter.OpenRouterProvider
import ke.imperialenterprise.imperialai.data.repository.*
import ke.imperialenterprise.imperialai.data.security.DefaultAppLockManager
import ke.imperialenterprise.imperialai.data.security.DefaultApprovalEngine
import ke.imperialenterprise.imperialai.domain.agent.AIProvider
import ke.imperialenterprise.imperialai.domain.agent.McpManager
import ke.imperialenterprise.imperialai.domain.agent.ToolRegistry
import ke.imperialenterprise.imperialai.domain.repository.*
import ke.imperialenterprise.imperialai.domain.security.AppLockManager
import ke.imperialenterprise.imperialai.domain.security.ApprovalEngine

/**
 * Imperial AI Application root.
 * Manages service locator dependency graph across all phases:
 * - Phase 1: Core site, task, conversation, and security models
 * - Phase 2: OpenRouter AI Provider and dynamic model repository
 * - Phase 3: Remote MCP Engine with Streamable HTTP transport and strict site isolation
 * - Phase 4: AI + MCP Agent Engine
 * - Phase 5: Permission & Security Engine with ApprovalEngine and AppLockManager
 */
class ImperialAiApplication : Application() {

    lateinit var siteRepository: SiteRepository
        private set
    lateinit var taskRepository: TaskRepository
        private set
    lateinit var conversationRepository: ConversationRepository
        private set
    lateinit var auditLogger: AuditLogger
        private set
    lateinit var credentialStore: CredentialStore
        private set
    lateinit var aiProvider: AIProvider
        private set
    lateinit var modelRepository: ModelRepository
        private set

    // Phase 3: Remote MCP Engine components
    lateinit var mcpServerRepository: McpServerRepository
        private set
    lateinit var mcpCredentialManager: McpCredentialManager
        private set
    lateinit var toolRegistry: ToolRegistry
        private set
    lateinit var mcpManager: McpManager
        private set

    // Phase 4 & 5: AI + MCP Agent Engine and Security Engine
    lateinit var agentRunRepository: AgentRunRepository
        private set
    lateinit var approvalEngine: ApprovalEngine
        private set
    lateinit var permissionEngine: PermissionEngine
        private set
    lateinit var appLockManager: AppLockManager
        private set
    lateinit var agentEngine: ke.imperialenterprise.imperialai.domain.agent.AgentEngine
        private set

    override fun onCreate() {
        super.onCreate()

        // Initialize core security and repositories
        credentialStore = AndroidKeystoreCredentialStore(this)
        auditLogger = InMemoryAuditLogger()
        siteRepository = InMemorySiteRepository()
        taskRepository = InMemoryTaskRepository()
        conversationRepository = InMemoryConversationRepository()

        // Phase 5: Security Engine components
        approvalEngine = DefaultApprovalEngine(auditLogger)
        permissionEngine = DefaultPermissionEngine(approvalEngine, auditLogger)
        appLockManager = DefaultAppLockManager()

        // Phase 2: OpenRouter AI Provider and Model Repository
        aiProvider = OpenRouterProvider(credentialStore)
        modelRepository = OpenRouterModelRepository(aiProvider)

        // Phase 3: Remote MCP Engine
        mcpServerRepository = InMemoryMcpServerRepository()
        mcpCredentialManager = McpCredentialManager(credentialStore)
        toolRegistry = DefaultToolRegistry()
        mcpManager = DefaultMcpManager(
            mcpServerRepository = mcpServerRepository,
            siteRepository = siteRepository,
            toolRegistry = toolRegistry,
            credentialManager = mcpCredentialManager,
            auditLogger = auditLogger
        )

        // Phase 4: AI + MCP Agent Engine
        agentRunRepository = InMemoryAgentRunRepository()
        agentEngine = ke.imperialenterprise.imperialai.data.agent.DefaultAgentEngine(
            aiProvider = aiProvider,
            toolRegistry = toolRegistry,
            permissionEngine = permissionEngine,
            mcpManager = mcpManager,
            siteRepository = siteRepository,
            conversationRepository = conversationRepository,
            mcpServerRepository = mcpServerRepository,
            credentialStore = credentialStore,
            auditLogger = auditLogger,
            agentRunRepository = agentRunRepository,
            approvalEngine = approvalEngine
        )
    }
}
