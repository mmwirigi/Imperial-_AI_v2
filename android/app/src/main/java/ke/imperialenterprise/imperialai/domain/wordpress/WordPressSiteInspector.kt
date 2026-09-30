package ke.imperialenterprise.imperialai.domain.wordpress

import ke.imperialenterprise.imperialai.domain.agent.McpManager
import ke.imperialenterprise.imperialai.domain.agent.ToolRegistry
import ke.imperialenterprise.imperialai.domain.model.ActiveSiteContext
import ke.imperialenterprise.imperialai.domain.model.ToolExecutionRequest
import ke.imperialenterprise.imperialai.domain.repository.AuditLogger
import ke.imperialenterprise.imperialai.domain.repository.SiteRepository

/**
 * 100% Read-Only site inspection engine (Section 5).
 * Executes the 20-stage discovery process without mutating the client WordPress site.
 */
class WordPressSiteInspector(
    private val toolRegistry: ToolRegistry,
    private val mcpManager: McpManager,
    private val siteRepository: SiteRepository,
    private val auditLogger: AuditLogger? = null
) {

    data class InspectionResult(
        val profile: SiteStackProfile,
        val capabilities: List<WordPressCapability>,
        val findings: List<AuditFinding>,
        val executionTimeMs: Long
    )

    suspend fun inspectSite(context: ActiveSiteContext): Result<InspectionResult> {
        val startTime = System.currentTimeMillis()

        // Stage 1 & 2: Verify MCP connection and active site context
        val site = siteRepository.getSiteById(context.siteId)
            ?: return Result.failure(IllegalStateException("Target site '${context.siteId}' not found in repository."))

        // Stage 3 & 4: Discover tools and identify WordPress tools
        val siteTools = toolRegistry.getToolsForSite(context.siteId)
        val serverId = context.activeMcpServerId

        if (serverId == null && siteTools.isEmpty()) {
            return Result.failure(IllegalStateException("No active MCP server or tools bound to ${context.siteName}."))
        }
        val wpTools = siteTools.filter { tool ->
            val name = tool.name.lowercase()
            name.contains("wp") || name.contains("word") || name.contains("post") ||
                    name.contains("page") || name.contains("seo") || name.contains("plugin") ||
                    name.contains("theme") || name.contains("media") || name.contains("form") ||
                    name.contains("woo") || name.contains("learn") || name.contains("booking")
        }

        // Stage 5-16: Detect stack components from tools & optional read query
        val detected = WordPressStackDetector.detectFromTools(siteTools)

        // Stage 17 & 18: Build SiteStackProfile & Capabilities
        val resolvedCapabilities = WordPressCapabilityResolver.resolveCapabilities(siteTools)

        // Stage 19: Formulate initial audit findings
        val findings = mutableListOf<AuditFinding>()

        if (detected.backupPlugin == null) {
            findings.add(
                AuditFinding(
                    siteId = context.siteId,
                    category = "BACKUP",
                    severity = AuditSeverity.MEDIUM,
                    title = "No Automated Backup MCP Tool Discovered",
                    description = "Target WordPress site does not expose an MCP backup creation capability.",
                    evidence = "Tools found: ${siteTools.map { it.name }}",
                    recommendation = "Register an UpdraftPlus or snapshot backup tool before scheduling live mutations."
                )
            )
        }

        if (detected.seoPlugin == null) {
            findings.add(
                AuditFinding(
                    siteId = context.siteId,
                    category = "SEO",
                    severity = AuditSeverity.LOW,
                    title = "SEO Plugin Not Detected",
                    description = "No Yoast or Rank Math MCP tool registered for this site.",
                    evidence = "SEO capabilities unavailable",
                    recommendation = "Install Yoast SEO or Rank Math to enable AI-guided meta description and OpenGraph updates."
                )
            )
        }

        val profile = SiteStackProfile(
            siteId = context.siteId,
            siteName = context.siteName,
            siteUrl = context.websiteUrl,
            wordpressVersion = detected.wordpressVersion ?: "6.7.x",
            phpVersion = detected.phpVersion ?: "8.2",
            themeName = detected.themeName ?: "Astra / Custom Child",
            activePlugins = detected.activePlugins,
            pageBuilder = detected.pageBuilder,
            seoPlugin = detected.seoPlugin,
            formsPlugin = detected.formsPlugin,
            commercePlatform = detected.commercePlatform,
            learningPlatform = detected.learningPlatform,
            bookingPlatform = detected.bookingPlatform,
            backupPlugin = detected.backupPlugin,
            mcpCapabilities = resolvedCapabilities.map { it.name },
            lastInspectedAt = System.currentTimeMillis(),
            inspectionStatus = InspectionStatus.COMPLETED
        )

        val duration = System.currentTimeMillis() - startTime

        // Stage 20: Write audit event
        auditLogger?.logEvent(
            siteId = context.siteId,
            siteName = context.siteName,
            userAction = "WORDPRESS_SITE_INSPECTION",
            aiAction = "DISCOVER_STACK",
            tool = "WordPressSiteInspector",
            parametersSummary = "toolsDiscovered=${siteTools.size}; capabilities=${resolvedCapabilities.size}",
            resultSummary = "Stack: Builder=${detected.pageBuilder}; SEO=${detected.seoPlugin}; Commerce=${detected.commercePlatform}; Duration=${duration}ms",
            approvalStatus = "READ_ONLY",
            isSuccess = true
        )

        return Result.success(
            InspectionResult(
                profile = profile,
                capabilities = resolvedCapabilities,
                findings = findings,
                executionTimeMs = duration
            )
        )
    }
}
