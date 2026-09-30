package ke.imperialenterprise.imperialai.data.sample

import ke.imperialenterprise.imperialai.domain.model.*

/**
 * Sample Demo Data for Phase 1 UI and architecture testing.
 * DEMO records only - no network connections are initiated.
 */
object SampleData {

    val demoSites: List<Site> = listOf(
        Site(
            id = "demo-site-1",
            siteName = "Juba Raha Paradise Hotel",
            websiteUrl = "https://jrparadisehotel.com",
            clientCompanyName = "Juba Raha Hospitality Group",
            mcpEndpoint = "https://mcp.jrparadisehotel.com/v1/sse",
            mcpStatus = McpStatus.CONNECTED,
            wordPressType = WordPressType.SELF_HOSTED,
            seoPlugin = SeoPlugin.RANK_MATH,
            pageBuilder = PageBuilder.ELEMENTOR,
            notes = "Luxury boutique hotel portal with room booking engine and dining reservation integration.",
            aiInstructions = "Maintain hospitable, brand-aligned luxury tone. Check room booking CTA integrity on all landing pages.",
            permissionPolicy = PermissionPolicy(
                siteId = "demo-site-1",
                requireApprovalForDeletePages = true,
                requireApprovalForPublishing = true,
                requireApprovalForPlugins = true
            ),
            lastConnection = "Today, 08:30 EAT",
            lastActivity = "Sitemap verification completed",
            isDemo = true
        ),
        Site(
            id = "demo-site-2",
            siteName = "Debrazz Security Systems",
            websiteUrl = "https://debrazzsecuritysystems.co.ke",
            clientCompanyName = "Debrazz Security Ltd",
            mcpEndpoint = "https://mcp.debrazzsecuritysystems.co.ke/agent",
            mcpStatus = McpStatus.DISCONNECTED,
            wordPressType = WordPressType.SELF_HOSTED,
            seoPlugin = SeoPlugin.YOAST,
            pageBuilder = PageBuilder.GUTENBERG,
            notes = "CCTV, biometric access control, and alarm response system product catalog.",
            aiInstructions = "Prioritize commercial security product specifications and schema markup.",
            permissionPolicy = PermissionPolicy(
                siteId = "demo-site-2",
                requireApprovalForDeletePages = true,
                requireApprovalForSiteSettings = true
            ),
            lastConnection = "Yesterday, 17:15 EAT",
            lastActivity = "Product schema structured data updated",
            isDemo = true
        ),
        Site(
            id = "demo-site-3",
            siteName = "Anthony Gatune Foundation",
            websiteUrl = "https://anthonygatunefoundation.org",
            clientCompanyName = "Anthony Gatune Non-Profit Initiative",
            mcpEndpoint = "https://api.anthonygatunefoundation.org/mcp",
            mcpStatus = McpStatus.CONNECTED,
            wordPressType = WordPressType.SELF_HOSTED,
            seoPlugin = SeoPlugin.THE_SEO_FRAMEWORK,
            pageBuilder = PageBuilder.DIVI,
            notes = "Charity education and youth empowerment foundation in East Africa.",
            aiInstructions = "Empathetic, transparent storytelling highlighting community scholarships and donor stewardship.",
            permissionPolicy = PermissionPolicy(
                siteId = "demo-site-3",
                requireApprovalForDeletePages = true,
                requireApprovalForPublishing = true
            ),
            lastConnection = "Today, 11:45 EAT",
            lastActivity = "Annual report 2025 published",
            isDemo = true
        ),
        Site(
            id = "demo-site-4",
            siteName = "Resource Management International Africa",
            websiteUrl = "https://resourcekenya.com",
            clientCompanyName = "RMIA Advisory Group",
            mcpEndpoint = "https://rmia.resourcekenya.com/mcp-endpoint",
            mcpStatus = McpStatus.DISCONNECTED,
            wordPressType = WordPressType.SELF_HOSTED,
            seoPlugin = SeoPlugin.YOAST,
            pageBuilder = PageBuilder.GUTENBERG,
            notes = "Environmental impact assessments and corporate governance consulting.",
            aiInstructions = "Adhere to professional consultancy tone and regulatory environmental standards.",
            permissionPolicy = PermissionPolicy(
                siteId = "demo-site-4",
                requireApprovalForPlugins = true,
                requireApprovalForDns = true
            ),
            lastConnection = "3 days ago",
            lastActivity = "Security audit performed",
            isDemo = true
        ),
        Site(
            id = "demo-site-5",
            siteName = "CHICHI EXIM Engineering",
            websiteUrl = "https://chichiexim.com",
            clientCompanyName = "CHICHI EXIM Kenya Ltd",
            mcpEndpoint = "https://mcp.chichiexim.com/v1",
            mcpStatus = McpStatus.CONNECTED,
            wordPressType = WordPressType.SELF_HOSTED,
            seoPlugin = SeoPlugin.RANK_MATH,
            pageBuilder = PageBuilder.ELEMENTOR,
            notes = "Heavy machinery, industrial imports, and mechanical engineering spares distribution.",
            aiInstructions = "Industrial B2B procurement focus. Optimize technical specifications and catalog PDF links.",
            permissionPolicy = PermissionPolicy(
                siteId = "demo-site-5",
                requireApprovalForDeletePosts = true,
                requireApprovalForBulkEdit = true
            ),
            lastConnection = "Today, 14:02 EAT",
            lastActivity = "Core Web Vitals health check executed",
            isDemo = true
        )
    )

    val demoTasks: List<Task> = listOf(
        Task(
            id = "task-101",
            title = "Comprehensive SEO Meta Audit",
            description = "Audit meta titles, descriptions, and OpenGraph tags across top 20 hotel rooms and dining pages.",
            siteId = "demo-site-1",
            siteName = "Juba Raha Paradise Hotel",
            category = TaskCategory.SEO,
            createdDate = "2026-09-26 14:20",
            updatedDate = "2026-09-27 08:35",
            status = TaskState.COMPLETED,
            requestedAction = "audit_seo_metadata",
            dangerousActionType = DangerousActionType.READ_ONLY_AUDIT,
            approvalRequirement = ApprovalRequirement.NONE,
            executionResult = ExecutionResult(
                summary = "Audit finished with 100% score across 20 URLs. Found 2 missing og:image tags and corrected preview dimensions.",
                logs = listOf(
                    "Connecting to site context: Juba Raha Paradise Hotel",
                    "Retrieving Rank Math schema tables...",
                    "Checked 20 URLs: 18 Valid, 2 Warnings",
                    "Report logged to Audit Trail"
                ),
                executionDurationMs = 1420L,
                completedAt = "2026-09-27 08:35 EAT",
                success = true
            )
        ),
        Task(
            id = "task-102",
            title = "Bulk Deactivate Deprecated Contact Form Plugin",
            description = "Deactivate legacy Contact Form 7 in favor of WPForms and purge orphaned transients.",
            siteId = "demo-site-2",
            siteName = "Debrazz Security Systems",
            category = TaskCategory.SECURITY,
            createdDate = "2026-09-27 06:10",
            updatedDate = "2026-09-27 06:15",
            status = TaskState.AWAITING_APPROVAL,
            requestedAction = "deactivate_plugin",
            dangerousActionType = DangerousActionType.MODIFY_PLUGIN,
            approvalRequirement = ApprovalRequirement.REQUIRED,
            executionResult = null
        ),
        Task(
            id = "task-103",
            title = "Quarterly Impact Donor Report Draft",
            description = "Compile new scholarship milestones and prepare draft publication post for trustee review.",
            siteId = "demo-site-3",
            siteName = "Anthony Gatune Foundation",
            category = TaskCategory.CONTENT,
            createdDate = "2026-09-27 09:00",
            updatedDate = "2026-09-27 09:30",
            status = TaskState.RUNNING,
            requestedAction = "draft_post_content",
            dangerousActionType = DangerousActionType.PUBLISH_CONTENT,
            approvalRequirement = ApprovalRequirement.REQUIRED,
            executionResult = null
        ),
        Task(
            id = "task-104",
            title = "Broken Link Checker & Sitemap Health",
            description = "Crawl 140 resource advisory PDF links and identify 404 redirections.",
            siteId = "demo-site-4",
            siteName = "Resource Management International Africa",
            category = TaskCategory.MAINTENANCE,
            createdDate = "2026-09-25 10:00",
            updatedDate = "2026-09-25 10:45",
            status = TaskState.COMPLETED,
            requestedAction = "crawl_broken_links",
            dangerousActionType = DangerousActionType.READ_ONLY_AUDIT,
            approvalRequirement = ApprovalRequirement.NONE,
            executionResult = ExecutionResult(
                summary = "140 URLs evaluated. Zero 404 broken links detected. All sitemap XML entries responding with HTTP 200.",
                logs = listOf(
                    "Initializing crawler with rate-limit: 2 req/sec",
                    "Completed crawl of https://resourcekenya.com/sitemap.xml",
                    "0 dead links found"
                ),
                executionDurationMs = 4500L,
                completedAt = "2026-09-25 10:45 EAT",
                success = true
            )
        ),
        Task(
            id = "task-105",
            title = "Bulk Re-index Industrial Machinery Catalog",
            description = "Regenerate WooCommerce thumbnail sizes and flush Redis object cache.",
            siteId = "demo-site-5",
            siteName = "CHICHI EXIM Engineering",
            category = TaskCategory.PERFORMANCE,
            createdDate = "2026-09-27 12:00",
            updatedDate = "2026-09-27 12:05",
            status = TaskState.PLANNED,
            requestedAction = "regenerate_thumbnails",
            dangerousActionType = DangerousActionType.BULK_EDIT_CONTENT,
            approvalRequirement = ApprovalRequirement.REQUIRED,
            executionResult = null
        )
    )

    val availableModels: List<AIModel> = listOf(
        AIModel(
            id = "google/gemini-2.0-flash-exp:free",
            name = "Gemini 2.0 Flash Experimental (Free)",
            provider = "Google",
            description = "High-speed multimodal flagship experimental model with 1M context window and rapid inference.",
            contextLength = 1048576,
            inputCost = 0.0,
            outputCost = 0.0,
            supportsVision = true,
            supportsTools = true,
            supportsReasoning = false,
            supportsStreaming = true,
            isFree = true,
            modality = "text+image->text",
            isDefault = true
        ),
        AIModel(
            id = "deepseek/deepseek-r1:free",
            name = "DeepSeek R1 (Free)",
            provider = "DeepSeek",
            description = "Open reasoning model with chain-of-thought tokens for complex architectural code inspection and mathematical logic.",
            contextLength = 65536,
            inputCost = 0.0,
            outputCost = 0.0,
            supportsVision = false,
            supportsTools = false,
            supportsReasoning = true,
            supportsStreaming = true,
            isFree = true,
            modality = "text->text",
            isDefault = false
        ),
        AIModel(
            id = "meta-llama/llama-3.3-70b-instruct:free",
            name = "Llama 3.3 70B Instruct (Free)",
            provider = "Meta",
            description = "State-of-the-art open-weights 70B parameter model optimized for versatile instruction-following and tool planning.",
            contextLength = 131072,
            inputCost = 0.0,
            outputCost = 0.0,
            supportsVision = false,
            supportsTools = true,
            supportsReasoning = false,
            supportsStreaming = true,
            isFree = true,
            modality = "text->text",
            isDefault = false
        ),
        AIModel(
            id = "anthropic/claude-3.5-sonnet",
            name = "Claude 3.5 Sonnet",
            provider = "Anthropic",
            description = "Industry standard for code synthesis, nuanced agent workflows, and technical writing.",
            contextLength = 200000,
            inputCost = 3.00,
            outputCost = 15.00,
            supportsVision = true,
            supportsTools = true,
            supportsReasoning = false,
            supportsStreaming = true,
            isFree = false,
            modality = "text+image->text",
            isDefault = false
        ),
        AIModel(
            id = "openai/gpt-4o",
            name = "GPT-4o",
            provider = "OpenAI",
            description = "Flagship omni model combining fast multimodal intelligence, vision inspection, and tool calling.",
            contextLength = 128000,
            inputCost = 2.50,
            outputCost = 10.00,
            supportsVision = true,
            supportsTools = true,
            supportsReasoning = false,
            supportsStreaming = true,
            isFree = false,
            modality = "text+image->text",
            isDefault = false
        ),
        AIModel(
            id = "deepseek/deepseek-chat",
            name = "DeepSeek V3",
            provider = "DeepSeek",
            description = "High-efficiency general purpose MoE model with extreme token cost efficiency.",
            contextLength = 65536,
            inputCost = 0.14,
            outputCost = 0.28,
            supportsVision = false,
            supportsTools = true,
            supportsReasoning = false,
            supportsStreaming = true,
            isFree = false,
            modality = "text->text",
            isDefault = false
        )
    )

    val demoAuditEvents: List<AuditEvent> = listOf(
        AuditEvent(
            id = "audit-1",
            timestamp = "2026-09-27 08:35:10",
            siteId = "demo-site-1",
            siteName = "Juba Raha Paradise Hotel",
            userAction = "Initiate Site Audit",
            aiAction = "Execute read_site_metadata",
            tool = "wordpress_meta_inspector",
            parametersSummary = "scope=homepage,rooms; maxDepth=2",
            resultSummary = "Inspection completed: 20 pages scanned, 0 errors",
            approvalStatus = "AUTOMATIC_READ_ONLY",
            isSuccess = true
        ),
        AuditEvent(
            id = "audit-2",
            timestamp = "2026-09-27 06:15:22",
            siteId = "demo-site-2",
            siteName = "Debrazz Security Systems",
            userAction = "Deactivate Plugin Request",
            aiAction = "Request operator approval for plugin modification",
            tool = "wordpress_plugin_manager",
            parametersSummary = "plugin_slug=contact-form-7; state=inactive",
            resultSummary = "Gated: Awaiting Operator Approval Dialog",
            approvalStatus = "AWAITING_APPROVAL",
            isSuccess = true
        ),
        AuditEvent(
            id = "audit-3",
            timestamp = "2026-09-25 10:45:00",
            siteId = "demo-site-4",
            siteName = "Resource Management International Africa",
            userAction = "Crawl Sitemap",
            aiAction = "Execute http_link_verification",
            tool = "wordpress_sitemap_checker",
            parametersSummary = "target_url=https://resourcekenya.com/sitemap.xml",
            resultSummary = "140 links validated successfully",
            approvalStatus = "AUTOMATIC_READ_ONLY",
            isSuccess = true
        )
    )
}
