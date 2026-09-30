import React, { useState } from 'react';
import { 
  X, 
  RefreshCw, 
  Layers, 
  ShieldAlert, 
  Terminal, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Database, 
  ExternalLink,
  Cpu,
  FileCode,
  ArrowRight,
  ShieldCheck,
  Archive
} from 'lucide-react';
import { 
  Site, 
  McpTool, 
  SiteStackProfile, 
  WordPressCapability, 
  AuditFinding, 
  WordPressCommand, 
  WordPressTask, 
  WorkflowStage 
} from '../types';

interface SiteIntelligenceModalProps {
  isOpen: boolean;
  site: Site;
  tools: McpTool[];
  onDismiss: () => void;
  onSendToChat?: (prompt: string) => void;
}

export const SiteIntelligenceModal: React.FC<SiteIntelligenceModalProps> = ({
  isOpen,
  site,
  tools,
  onDismiss,
  onSendToChat
}) => {
  const [activeTab, setActiveTab] = useState<'stack' | 'capabilities' | 'findings' | 'commands' | 'workflow'>('stack');
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectedAt, setInspectedAt] = useState<string>('Not inspected yet');

  // Simulated live inspection profile derived from site & tools
  const [profile, setProfile] = useState<SiteStackProfile>(() => {
    const isSite1 = site.id === 'demo-site-1';
    const isSite2 = site.id === 'demo-site-2';
    const isSite3 = site.id === 'demo-site-3';

    return {
      siteId: site.id,
      siteName: site.siteName,
      siteUrl: site.websiteUrl,
      wordpressVersion: '6.7.2 (Gutenberg Enabled)',
      phpVersion: '8.3.1 (OPcache Active)',
      themeName: isSite1 ? 'Astra Pro Child' : isSite2 ? 'GeneratePress Premium' : 'Hello Elementor',
      activePlugins: isSite1 
        ? ['Elementor Pro', 'Rank Math SEO', 'Fluent Forms Pro', 'UpdraftPlus Backup'] 
        : isSite2 
        ? ['WooCommerce', 'Yoast SEO Premium', 'Contact Form 7', 'Wordfence Security'] 
        : ['LearnPress LMS', 'The SEO Framework', 'WPForms Lite'],
      pageBuilder: isSite1 ? 'Elementor Pro' : isSite2 ? 'Gutenberg (Block Editor)' : 'Divi Builder',
      seoPlugin: isSite1 ? 'Rank Math SEO' : isSite2 ? 'Yoast SEO' : 'The SEO Framework',
      formsPlugin: isSite1 ? 'Fluent Forms Pro' : isSite2 ? 'Contact Form 7' : 'WPForms Lite',
      commercePlatform: isSite2 ? 'WooCommerce' : null,
      learningPlatform: isSite3 ? 'LearnPress LMS' : null,
      bookingPlatform: isSite1 ? 'MotoPress Hotel Booking Engine' : null,
      backupPlugin: isSite1 ? 'UpdraftPlus / MCP Snapshot' : null,
      mcpCapabilities: tools.map(t => t.name),
      lastInspectedAt: Date.now()
    };
  });

  // Derived capabilities
  const capabilities: WordPressCapability[] = [
    {
      id: 'SITE_HEALTH_READ',
      name: 'Site Health & Environment',
      category: 'SITE',
      description: 'Read-only telemetry for WordPress core, PHP, database and runtime variables.',
      available: true,
      mcpToolNames: ['wp_get_site_health'],
      riskLevel: 'READ',
      requiresApproval: false
    },
    {
      id: 'POST_READ',
      name: 'Query & Inspect Posts',
      category: 'POSTS',
      description: 'Fetch post archives, categories, author associations, and publishing states.',
      available: true,
      mcpToolNames: ['wp_list_posts', 'wp_get_post'],
      riskLevel: 'READ',
      requiresApproval: false
    },
    {
      id: 'POST_UPDATE',
      name: 'Modify Post Metadata & Body',
      category: 'POSTS',
      description: 'Update article headings, body content, excerpt, and publication status.',
      available: true,
      mcpToolNames: ['wp_update_post'],
      riskLevel: 'HIGH_RISK_WRITE',
      requiresApproval: true
    },
    {
      id: 'SEO_READ',
      name: 'Inspect SEO Metadata & Snippets',
      category: 'SEO',
      description: 'Audit meta titles, descriptions, canonical tags, and OpenGraph schemas.',
      available: true,
      mcpToolNames: profile.seoPlugin?.includes('Rank Math') ? ['rank_math_read_seo'] : ['yoast_read_seo'],
      riskLevel: 'READ',
      requiresApproval: false
    },
    {
      id: 'SEO_UPDATE',
      name: 'Update SEO Tags & Meta Descriptions',
      category: 'SEO',
      description: 'Modify title templates, meta descriptions, and social share cards.',
      available: true,
      mcpToolNames: profile.seoPlugin?.includes('Rank Math') ? ['rank_math_update_seo'] : ['yoast_update_seo'],
      riskLevel: 'HIGH_RISK_WRITE',
      requiresApproval: true
    },
    {
      id: 'BACKUP_CREATE',
      name: 'Preflight Snapshot Backup',
      category: 'BACKUPS',
      description: 'Generate on-demand transactional database and upload snapshots prior to mutation.',
      available: Boolean(profile.backupPlugin),
      mcpToolNames: profile.backupPlugin ? ['wp_backup_create_snapshot'] : [],
      riskLevel: 'HIGH_RISK_WRITE',
      requiresApproval: true
    },
    {
      id: 'WOOCOMMERCE_READ',
      name: 'WooCommerce Catalog & Orders',
      category: 'WOOCOMMERCE',
      description: 'Inspect product pricing, stock levels, categories, and customer orders.',
      available: Boolean(profile.commercePlatform),
      mcpToolNames: profile.commercePlatform ? ['woocommerce_list_products', 'woocommerce_get_orders'] : [],
      riskLevel: 'READ',
      requiresApproval: false
    },
    {
      id: 'ELEMENTOR_READ',
      name: 'Elementor Section & Widget Inspector',
      category: 'ELEMENTOR',
      description: 'Inspect container hierarchy, typography styles, and template kits.',
      available: profile.pageBuilder?.includes('Elementor') || false,
      mcpToolNames: profile.pageBuilder?.includes('Elementor') ? ['elementor_inspect_page'] : [],
      riskLevel: 'READ',
      requiresApproval: false
    }
  ];

  // Derived audit findings
  const findings: AuditFinding[] = [
    ...(profile.backupPlugin ? [] : [{
      id: 'find-1',
      siteId: site.id,
      category: 'BACKUP',
      severity: 'HIGH' as const,
      title: 'No Automated Backup Capability Detected',
      description: 'Target WordPress installation does not expose an MCP backup creation mechanism.',
      evidence: 'No backup tools registered on active MCP server.',
      recommendation: 'Configure an UpdraftPlus or snapshot backup tool before scheduling live write mutations.'
    }]),
    {
      id: 'find-2',
      siteId: site.id,
      category: 'SEO',
      severity: 'MEDIUM' as const,
      title: '4 Published Landing Pages Missing Meta Descriptions',
      description: 'Recent audit revealed published URLs without custom meta descriptions, impacting SERP CTR.',
      evidence: 'wp_list_posts query returned empty _yoast_wpseo_metadesc fields.',
      recommendation: 'Execute SEO Meta Description synthesis workflow to draft brand-aligned descriptions.'
    },
    {
      id: 'find-3',
      siteId: site.id,
      category: 'SECURITY',
      severity: 'INFO' as const,
      title: 'Strict Site Isolation Active',
      description: 'All operations strictly locked to site ID and isolated bearer credentials.',
      evidence: `Bound to ${site.siteName} (${site.id})`,
      recommendation: 'Operator approval required for all mutation tasks.'
    }
  ];

  // Available commands
  const commands: WordPressCommand[] = [
    {
      id: 'cmd-1',
      title: 'Audit Full Site Health',
      description: 'Run 20-stage read-only discovery inspection across core, plugins, and database.',
      category: 'SITE',
      requiredCapabilityId: 'SITE_HEALTH_READ',
      promptTemplate: `Perform a comprehensive read-only site health and stack audit for ${site.siteName}.`
    },
    {
      id: 'cmd-2',
      title: 'Find Pages Missing Meta Descriptions',
      description: 'Inspect published pages and identify SEO metadata gaps.',
      category: 'SEO',
      requiredCapabilityId: 'SEO_READ',
      promptTemplate: `Audit all published pages on ${site.siteName} and list any URLs missing meta descriptions or SEO focus keywords.`
    },
    {
      id: 'cmd-3',
      title: 'Inspect Media Library Alt-Text',
      description: 'Audit image attachments for accessibility compliance and SEO tags.',
      category: 'MEDIA',
      requiredCapabilityId: 'POST_READ',
      promptTemplate: `Audit the media library on ${site.siteName} and report images missing alt-text descriptions.`
    },
    ...(profile.commercePlatform ? [{
      id: 'cmd-4',
      title: 'Query Low-Stock Products',
      description: 'Fetch WooCommerce inventory items with stock level below threshold.',
      category: 'WOOCOMMERCE' as const,
      requiredCapabilityId: 'WOOCOMMERCE_READ',
      promptTemplate: `Query WooCommerce store inventory on ${site.siteName} and report products with low stock.`
    }] : [])
  ];

  // 7-Stage Workflow Simulator State
  const [workflowState, setWorkflowState] = useState<{
    isRunning: boolean;
    stage: WorkflowStage;
    logs: string[];
    task: WordPressTask | null;
  }>({
    isRunning: false,
    stage: 'AUDIT',
    logs: [],
    task: null
  });

  const handleRunInspection = async () => {
    setIsInspecting(true);
    await new Promise(r => setTimeout(r, 1200));
    setInspectedAt(new Date().toLocaleTimeString());
    setIsInspecting(false);
  };

  const handleRunWorkflowDemo = async () => {
    setWorkflowState({
      isRunning: true,
      stage: 'AUDIT',
      logs: ['Stage 1 (AUDIT): Reading current state of Post #101 via wp_list_posts...'],
      task: null
    });

    await new Promise(r => setTimeout(r, 700));
    setWorkflowState(prev => ({
      ...prev,
      stage: 'PROPOSE',
      logs: [...prev.logs, 'Stage 2 (PROPOSE): Formulated change proposal for Post #101 (Set status=publish).']
    }));

    await new Promise(r => setTimeout(r, 700));
    setWorkflowState(prev => ({
      ...prev,
      stage: 'APPROVAL_PENDING',
      logs: [...prev.logs, 'Stage 3 (APPROVE): Gatekeeper verified. Operator pre-authorized execution token.']
    }));

    await new Promise(r => setTimeout(r, 700));
    setWorkflowState(prev => ({
      ...prev,
      stage: 'BACKUP',
      logs: [...prev.logs, `Stage 4 (BACKUP): ${profile.backupPlugin ? 'Snapshot backup #snap_882 created.' : 'Preflight warning: No backup plugin detected. Snapshot skipped.'}`]
    }));

    await new Promise(r => setTimeout(r, 800));
    setWorkflowState(prev => ({
      ...prev,
      stage: 'IMPLEMENT',
      logs: [...prev.logs, 'Stage 5 (IMPLEMENT): Executed mutation wp_update_post with parameters {post_id: 101, status: "publish"}.']
    }));

    await new Promise(r => setTimeout(r, 800));
    setWorkflowState(prev => ({
      ...prev,
      stage: 'VERIFY',
      logs: [...prev.logs, 'Stage 6 (VERIFY): Live read query confirmed Post #101 state reflects "publish". Verification 100% matched.']
    }));

    await new Promise(r => setTimeout(r, 600));
    const finalReport = `=== OPERATIONAL REPORT ===
TASK: Publish Luxury Suite Offers
SITE: ${site.siteName} (${site.websiteUrl})
TARGET: Post #101
MUTATION TOOL: wp_update_post
PREVIOUS STATE: status="draft"
VERIFIED STATE: status="publish"
BACKUP CHECKPOINT: ${profile.backupPlugin ? "snap_882 (Verified)" : "None (Honest Warning Issued)"}
VERIFICATION STATUS: SUCCESS (Verified outcome matched)
=== END REPORT ===`;

    setWorkflowState(prev => ({
      isRunning: false,
      stage: 'COMPLETED',
      logs: [...prev.logs, 'Stage 7 (REPORT): Operational report generated and committed to audit ledger.'],
      task: {
        id: 'task-wf-101',
        siteId: site.id,
        title: 'Publish Luxury Suite Offers',
        description: '7-Stage Operational Mutation with Live Verification',
        category: 'CONTENT',
        status: 'COMPLETED',
        workflowStage: 'COMPLETED',
        riskLevel: 'HIGH_RISK_WRITE',
        affectedResources: ['Post #101'],
        report: finalReport,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#141517] border border-[#2A2B2F] rounded-xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2B2F] bg-[#18191C]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#F5A623]/10 text-[#F5A623] rounded-lg border border-[#F5A623]/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold tracking-wider text-[#F5A623] uppercase">
                  Phase 6: WordPress Intelligence
                </span>
                <span className="px-2 py-0.5 text-[10px] font-medium bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 rounded">
                  20-Stage Discovery Active
                </span>
              </div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {site.siteName}
                <span className="text-xs font-normal text-zinc-400 font-mono">({site.websiteUrl})</span>
              </h2>
            </div>
          </div>
          <button 
            onClick={onDismiss}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-6 border-b border-[#2A2B2F] bg-[#161719] text-xs font-medium gap-2">
          <button
            onClick={() => setActiveTab('stack')}
            className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'stack'
                ? 'border-[#F5A623] text-[#F5A623] font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Discovered Stack
          </button>
          <button
            onClick={() => setActiveTab('capabilities')}
            className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'capabilities'
                ? 'border-[#F5A623] text-[#F5A623] font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            Capabilities ({capabilities.length})
          </button>
          <button
            onClick={() => setActiveTab('findings')}
            className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'findings'
                ? 'border-[#F5A623] text-[#F5A623] font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Audit Findings ({findings.length})
          </button>
          <button
            onClick={() => setActiveTab('commands')}
            className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'commands'
                ? 'border-[#F5A623] text-[#F5A623] font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Command Palette ({commands.length})
          </button>
          <button
            onClick={() => setActiveTab('workflow')}
            className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'workflow'
                ? 'border-[#F5A623] text-[#F5A623] font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            7-Stage Workflow
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* TAB 1: DISCOVERED STACK */}
          {activeTab === 'stack' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#1A1B1E] border border-[#2A2B2F] rounded-lg">
                <div>
                  <h3 className="text-sm font-bold text-white">20-Stage Read-Only Site Stack Discovery</h3>
                  <p className="text-xs text-zinc-400">
                    Non-invasive inspection querying WordPress environment, active plugins, theme, builder, and backup tools.
                  </p>
                  <p className="text-[11px] font-mono text-zinc-500 mt-1">Last inspected: {inspectedAt}</p>
                </div>
                <button
                  onClick={handleRunInspection}
                  disabled={isInspecting}
                  className="px-4 py-2 bg-[#F5A623] hover:bg-[#D48806] disabled:opacity-50 text-black font-bold text-xs rounded-lg flex items-center gap-2 transition-colors shadow-md"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isInspecting ? 'animate-spin' : ''}`} />
                  {isInspecting ? 'Inspecting Stack...' : 'Run Read-Only Inspection'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#1A1B1E] border border-[#2A2B2F] rounded-lg space-y-3">
                  <div className="text-xs font-mono font-bold text-[#F5A623] uppercase tracking-wide flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5" />
                    Core WordPress Environment
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-zinc-800">
                      <span className="text-zinc-400">WordPress Core:</span>
                      <span className="font-semibold text-white font-mono">{profile.wordpressVersion}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-800">
                      <span className="text-zinc-400">PHP Environment:</span>
                      <span className="font-semibold text-white font-mono">{profile.phpVersion}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-800">
                      <span className="text-zinc-400">Active Theme:</span>
                      <span className="font-semibold text-white">{profile.themeName}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-800">
                      <span className="text-zinc-400">Page Builder:</span>
                      <span className="font-semibold text-[#10B981]">{profile.pageBuilder || 'None / Native Gutenberg'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[#1A1B1E] border border-[#2A2B2F] rounded-lg space-y-3">
                  <div className="text-xs font-mono font-bold text-[#10B981] uppercase tracking-wide flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    Specialized Subsystems
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-zinc-800">
                      <span className="text-zinc-400">SEO Engine:</span>
                      <span className="font-semibold text-white">{profile.seoPlugin || 'Native'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-800">
                      <span className="text-zinc-400">Forms System:</span>
                      <span className="font-semibold text-white">{profile.formsPlugin || 'None Detected'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-800">
                      <span className="text-zinc-400">Commerce Platform:</span>
                      <span className="font-semibold text-white">{profile.commercePlatform || 'None'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-800">
                      <span className="text-zinc-400">Backup Checkpoint:</span>
                      <span className={`font-semibold ${profile.backupPlugin ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                        {profile.backupPlugin || 'No Backup Tool Detected'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Plugins */}
              <div className="p-4 bg-[#1A1B1E] border border-[#2A2B2F] rounded-lg">
                <div className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wide mb-3">
                  Discovered Active Plugins ({profile.activePlugins.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.activePlugins.map((plugin, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-zinc-800/80 border border-zinc-700/60 rounded text-xs text-zinc-200">
                      {plugin}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DISCOVERED CAPABILITIES */}
          {activeTab === 'capabilities' && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-400 mb-2">
                Conservative capability resolution mapping verified remote MCP endpoints without speculation.
              </p>
              <div className="space-y-2">
                {capabilities.map(cap => (
                  <div key={cap.id} className="p-3.5 bg-[#1A1B1E] border border-[#2A2B2F] rounded-lg flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{cap.name}</span>
                        <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-zinc-800 text-zinc-400 rounded">
                          {cap.category}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">{cap.description}</p>
                      {cap.mcpToolNames.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 pt-1">
                          <span>Tools:</span>
                          {cap.mcpToolNames.map(t => (
                            <span key={t} className="px-1.5 py-0.5 bg-black/40 border border-zinc-800 text-zinc-300 rounded">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        !cap.available 
                          ? 'bg-zinc-800 text-zinc-500' 
                          : cap.riskLevel === 'READ' 
                          ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                          : 'bg-[#F5A623]/15 text-[#F5A623] border border-[#F5A623]/30'
                      }`}>
                        {!cap.available ? 'UNAVAILABLE' : cap.requiresApproval ? 'REQUIRES APPROVAL' : 'AVAILABLE'}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        Risk: {cap.riskLevel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT FINDINGS */}
          {activeTab === 'findings' && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-400 mb-2">
                Actionable operational findings discovered during read-only inspection.
              </p>
              <div className="space-y-3">
                {findings.map(finding => (
                  <div key={finding.id} className="p-4 bg-[#1A1B1E] border border-[#2A2B2F] rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {finding.severity === 'HIGH' ? (
                          <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
                        ) : finding.severity === 'MEDIUM' ? (
                          <AlertTriangle className="w-4 h-4 text-[#F5A623]" />
                        ) : (
                          <Info className="w-4 h-4 text-[#10B981]" />
                        )}
                        <h4 className="text-sm font-bold text-white">{finding.title}</h4>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        finding.severity === 'HIGH' 
                          ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40' 
                          : finding.severity === 'MEDIUM'
                          ? 'bg-[#F5A623]/20 text-[#F5A623] border border-[#F5A623]/40'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}>
                        {finding.severity} SEVERITY
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300">{finding.description}</p>
                    <div className="p-2.5 bg-black/40 border border-zinc-800 rounded text-xs space-y-1 font-mono">
                      <div className="text-zinc-500"><span className="text-zinc-400">Evidence:</span> {finding.evidence}</div>
                      <div className="text-[#F5A623]"><span className="text-zinc-400 font-sans">Recommendation:</span> {finding.recommendation}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: COMMAND PALETTE */}
          {activeTab === 'commands' && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-400 mb-2">
                Pre-authorized operational commands resolved dynamically for this site's stack.
              </p>
              <div className="grid grid-cols-1 gap-2.5">
                {commands.map(cmd => (
                  <div 
                    key={cmd.id}
                    className="p-3.5 bg-[#1A1B1E] border border-[#2A2B2F] hover:border-[#F5A623]/40 rounded-lg flex items-center justify-between transition-colors group cursor-pointer"
                    onClick={() => {
                      if (onSendToChat) {
                        onSendToChat(cmd.promptTemplate);
                        onDismiss();
                      }
                    }}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white group-hover:text-[#F5A623] transition-colors">
                          {cmd.title}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-400 rounded">
                          {cmd.category}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">{cmd.description}</p>
                    </div>
                    <button className="px-3 py-1.5 bg-zinc-800 group-hover:bg-[#F5A623] group-hover:text-black text-zinc-200 text-xs font-semibold rounded flex items-center gap-1.5 transition-colors">
                      <Play className="w-3 h-3" />
                      Run Command
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: 7-STAGE WORKFLOW SIMULATOR */}
          {activeTab === 'workflow' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#1A1B1E] border border-[#2A2B2F] rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">Imperial 7-Stage Operational Workflow</h3>
                    <p className="text-xs text-zinc-400">
                      AUDIT → PROPOSE → APPROVE → BACKUP → IMPLEMENT → VERIFY → REPORT
                    </p>
                  </div>
                  <button
                    onClick={handleRunWorkflowDemo}
                    disabled={workflowState.isRunning}
                    className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-black font-bold text-xs rounded-lg flex items-center gap-2 transition-colors shadow-md"
                  >
                    <Play className={`w-3.5 h-3.5 ${workflowState.isRunning ? 'animate-spin' : ''}`} />
                    {workflowState.isRunning ? 'Executing Workflow...' : 'Execute 7-Stage Mutation Task'}
                  </button>
                </div>

                {/* Workflow Stages Ribbon */}
                <div className="grid grid-cols-7 gap-1 pt-2">
                  {(['AUDIT', 'PROPOSE', 'APPROVAL_PENDING', 'BACKUP', 'IMPLEMENT', 'VERIFY', 'REPORT'] as WorkflowStage[]).map((stg, i) => {
                    const isActive = workflowState.stage === stg;
                    const isPassed = workflowState.logs.some(l => l.includes(`Stage ${i + 1}`));
                    return (
                      <div 
                        key={stg} 
                        className={`p-2 text-center rounded border transition-all ${
                          isActive 
                            ? 'bg-[#F5A623]/20 border-[#F5A623] text-[#F5A623] font-bold' 
                            : isPassed 
                            ? 'bg-[#10B981]/15 border-[#10B981]/40 text-[#10B981]' 
                            : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                        }`}
                      >
                        <div className="text-[10px] font-mono">{i + 1}</div>
                        <div className="text-[10px] uppercase truncate">{stg.replace('_PENDING', '')}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Execution Logs */}
              {workflowState.logs.length > 0 && (
                <div className="p-4 bg-black/60 border border-zinc-800 rounded-lg space-y-2 font-mono text-xs">
                  <div className="text-[11px] font-bold text-zinc-400 uppercase">Live Pipeline Execution Logs</div>
                  <div className="space-y-1">
                    {workflowState.logs.map((log, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-[#10B981]">✓</span>
                        <span className="text-zinc-300">{log}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Final Operational Report */}
              {workflowState.task?.report && (
                <div className="p-4 bg-[#1A1B1E] border border-[#10B981]/40 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#10B981]">
                    <CheckCircle2 className="w-4 h-4" />
                    Verified Operational Report
                  </div>
                  <pre className="p-3 bg-black/50 border border-zinc-800 rounded font-mono text-xs text-zinc-200 whitespace-pre-wrap">
                    {workflowState.task.report}
                  </pre>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-[#2A2B2F] bg-[#18191C] text-xs text-zinc-400">
          <span>Active Context: <strong className="text-white font-mono">{site.siteName}</strong></span>
          <button
            onClick={onDismiss}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded font-medium transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
