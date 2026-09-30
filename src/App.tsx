import React, { useState, useRef } from 'react';
import { 
  initialDemoSites, 
  initialDemoTasks, 
  initialAuditEvents, 
  availableAiModels,
  initialMcpServers,
  initialMcpTools
} from './data/sampleData';
import { 
  Site, 
  Task, 
  AuditEvent, 
  AIModel, 
  ChatMessage, 
  DangerousActionType, 
  OpenRouterConfig,
  AIUsage,
  MCPServer,
  McpTool,
  ConnectionTestReport
} from './types';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { SitesScreen } from './components/SitesScreen';
import { TasksScreen } from './components/TasksScreen';
import { ChatScreen } from './components/ChatScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { SiteSelectorModal } from './components/SiteSelectorModal';
import { ApprovalModal } from './components/ApprovalModal';
import { CodeExplorer } from './components/CodeExplorer';
import { ModelCenterModal } from './components/ModelCenterModal';

export function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'sites' | 'tasks' | 'chat' | 'settings'>('home');
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop' | 'code'>('desktop');

  // Core Repositories State
  const [sites, setSites] = useState<Site[]>(initialDemoSites);
  const [tasks, setTasks] = useState<Task[]>(initialDemoTasks);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(initialAuditEvents);
  const [models, setModels] = useState<AIModel[]>(availableAiModels);
  const [selectedModelId, setSelectedModelId] = useState<string>('google/gemini-2.0-flash-exp:free');
  const [conversationModelOverrides, setConversationModelOverrides] = useState<Record<string, string>>({});

  // OpenRouter Credentials & Config State
  const [openRouterConfig, setOpenRouterConfig] = useState<OpenRouterConfig>({
    apiKey: 'sk-or-v1-imperial-demo-live-key',
    maskedApiKey: 'sk-or-••••••••••••••••',
    isConnected: true,
    selectedDefaultModelId: 'google/gemini-2.0-flash-exp:free',
    lastUpdated: 'Today, 08:30 EAT',
  });

  // Phase 3: Remote MCP Engine State
  const [mcpServers, setMcpServers] = useState<MCPServer[]>(initialMcpServers);
  const [mcpTools, setMcpTools] = useState<Record<string, McpTool[]>>(initialMcpTools);
  const [mcpBearerTokens, setMcpBearerTokens] = useState<Record<string, string>>({});

  // Active Site Context & Strict Isolation
  const [activeSiteId, setActiveSiteId] = useState<string>(initialDemoSites[0]?.id || '');
  const activeSite = sites.find((s) => s.id === activeSiteId) || sites[0] || null;

  // Modals
  const [isSiteSelectorOpen, setIsSiteSelectorOpen] = useState(false);
  const [isModelCenterOpen, setIsModelCenterOpen] = useState(false);
  const [isRefreshingModels, setIsRefreshingModels] = useState(false);

  // Streaming State for Chat
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const streamingAbortRef = useRef<boolean>(false);

  // Site-Isolated Chat Messages State (Record<siteId, ChatMessage[]>)
  const [messagesBySite, setMessagesBySite] = useState<Record<string, ChatMessage[]>>({
    'demo-site-1': [
      {
        id: 'msg-init-1',
        conversationId: 'conv-demo-site-1',
        siteId: 'demo-site-1',
        sender: 'ASSISTANT',
        content: `Active Site Context locked: Juba Raha Paradise Hotel.\n\nReady to audit WordPress metadata, review sitemaps, or inspect room booking schemas. All tool operations execute strictly against this site's isolated scope.`,
        timestamp: '08:30 EAT',
        modelName: 'Gemini 2.0 Flash Experimental (Free)',
      },
    ],
    'demo-site-2': [
      {
        id: 'msg-init-2',
        conversationId: 'conv-demo-site-2',
        siteId: 'demo-site-2',
        sender: 'ASSISTANT',
        content: `Active Site Context locked: Debrazz Security Systems.\n\nReady for CCTV catalog verification and Yoast SEO schema checks.`,
        timestamp: 'Yesterday',
        modelName: 'Gemini 2.0 Flash Experimental (Free)',
      },
    ],
    'demo-site-3': [
      {
        id: 'msg-init-3',
        conversationId: 'conv-demo-site-3',
        siteId: 'demo-site-3',
        sender: 'ASSISTANT',
        content: `Active Site Context locked: Anthony Gatune Foundation.\n\nCharity donor transparency and scholarship publication buffer active.`,
        timestamp: '11:45 EAT',
        modelName: 'Gemini 2.0 Flash Experimental (Free)',
      },
    ],
  });

  const [approvalModalData, setApprovalModalData] = useState<{
    isOpen: boolean;
    siteName: string;
    actionType: DangerousActionType;
    description: string;
    targetResource: string;
    onApprove: () => void;
    onReject: () => void;
  }>({
    isOpen: false,
    siteName: '',
    actionType: 'READ_ONLY_AUDIT',
    description: '',
    targetResource: '',
    onApprove: () => {},
    onReject: () => {},
  });

  // Effective model for active site
  const effectiveModelId = (activeSite && conversationModelOverrides[activeSite.id]) || selectedModelId;
  const activeModel = models.find((m) => m.id === effectiveModelId) || models[0];

  // OpenRouter Key Management
  const handleSaveOpenRouterKey = (key: string) => {
    const masked = key.startsWith('sk-or-') ? 'sk-or-••••••••••••••••' : `${key.slice(0, 4)}••••••••••••••••`;
    setOpenRouterConfig((prev) => ({
      ...prev,
      apiKey: key,
      maskedApiKey: masked,
      isConnected: true,
      lastUpdated: 'Just now',
    }));
  };

  const handleRemoveOpenRouterKey = () => {
    setOpenRouterConfig((prev) => ({
      ...prev,
      apiKey: null,
      maskedApiKey: null,
      isConnected: false,
    }));
  };

  const handleTestOpenRouterConnection = async (): Promise<{ success: boolean; message: string; latencyMs: number }> => {
    // Simulate real network test
    await new Promise((resolve) => setTimeout(resolve, 380));
    if (!openRouterConfig.apiKey) {
      return { success: false, message: 'No OpenRouter API key configured.', latencyMs: 0 };
    }
    return {
      success: true,
      message: 'Connected to OpenRouter API (HTTP 200 OK). Model catalog verified.',
      latencyMs: 142,
    };
  };

  const handleRefreshModels = async () => {
    setIsRefreshingModels(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setModels([...availableAiModels]);
    setOpenRouterConfig((prev) => ({ ...prev, lastUpdated: 'Just now' }));
    setIsRefreshingModels(false);
  };

  // Handlers for Site Management
  const handleToggleConnectSite = (site: Site) => {
    const nextStatus = site.mcpStatus === 'CONNECTED' ? 'DISCONNECTED' : 'CONNECTED';
    setSites((prev) =>
      prev.map((s) =>
        s.id === site.id
          ? {
              ...s,
              mcpStatus: nextStatus,
              lastConnection: nextStatus === 'CONNECTED' ? 'Just now' : s.lastConnection,
            }
          : s
      )
    );

    const newAudit: AuditEvent = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      siteId: site.id,
      siteName: site.siteName,
      userAction: nextStatus === 'CONNECTED' ? 'Connect MCP Handshake' : 'Disconnect MCP',
      aiAction: 'Update connection status',
      tool: 'mcp_connection_manager',
      parametersSummary: `site_id=${site.id}; transport=SSE`,
      resultSummary: `Connection status updated to ${nextStatus}`,
      approvalStatus: 'MANUAL_OPERATOR',
      isSuccess: true,
    };
    setAuditEvents((prev) => [newAudit, ...prev]);
  };

  const handleAddSite = (newSite: Site) => {
    setSites((prev) => [...prev, newSite]);
    setActiveSiteId(newSite.id);
  };

  const handleUpdateSite = (updatedSite: Site) => {
    setSites((prev) => prev.map((s) => (s.id === updatedSite.id ? updatedSite : s)));
  };

  const handleDeleteSite = (siteId: string) => {
    setSites((prev) => prev.filter((s) => s.id !== siteId));
    if (activeSiteId === siteId) {
      const remaining = sites.filter((s) => s.id !== siteId);
      setActiveSiteId(remaining[0]?.id || '');
    }
  };

  // Phase 3: Remote MCP Engine Handlers
  const handleSaveMcpServer = (server: MCPServer, bearerToken?: string) => {
    setMcpServers((prev) => {
      const idx = prev.findIndex((s) => s.id === server.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = server;
        return updated;
      }
      return [...prev, server];
    });

    if (bearerToken) {
      setMcpBearerTokens((prev) => ({
        ...prev,
        [`${server.siteId}_${server.id}`]: bearerToken,
      }));
    }

    setSites((prev) =>
      prev.map((s) =>
        s.id === server.siteId ? { ...s, mcpEndpoint: server.endpoint } : s
      )
    );
  };

  const handleTestMcpConnection = async (
    server: MCPServer,
    bearerToken?: string
  ): Promise<ConnectionTestReport> => {
    await new Promise((resolve) => setTimeout(resolve, 450));
    if (
      !server.endpoint.startsWith('http://') &&
      !server.endpoint.startsWith('https://') &&
      !server.endpoint.startsWith('mcp://')
    ) {
      return {
        success: false,
        latencyMs: 15,
        errorMessage: 'Endpoint must start with https://, http://, or mcp://',
        discoveredToolsCount: 0,
      };
    }

    const isDemo = server.endpoint.includes('sandbox.local') || server.isDemo;
    return {
      success: true,
      latencyMs: isDemo ? 32 : 118,
      serverName: server.name || 'WordPress Remote MCP',
      serverVersion: '1.4.2',
      protocolVersion: '2024-11-05',
      discoveredToolsCount: 3,
    };
  };

  const handleConnectMcpServer = async (server: MCPServer): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const isDemo = server.endpoint.includes('sandbox.local') || server.isDemo;

    const tools: McpTool[] = [
      {
        name: isDemo ? 'read_demo' : 'read_site_metadata',
        title: isDemo ? 'Inspect Demo Metric' : 'Inspect Site Metadata',
        description: 'Read-only inspection of site configuration and health indicators.',
        inputSchema: { type: 'object', properties: { scope: { type: 'string' } } },
        serverId: server.id,
        siteId: server.siteId,
        enabled: true,
        requiresApproval: false,
        riskLevel: 'READ',
      },
      {
        name: isDemo ? 'write_demo' : 'update_post_draft',
        title: isDemo ? 'Update Demo Setting' : 'Create / Update Post Draft',
        description: 'Safe write operation to draft new content without publishing.',
        inputSchema: { type: 'object', properties: { title: { type: 'string' }, content: { type: 'string' } } },
        serverId: server.id,
        siteId: server.siteId,
        enabled: true,
        requiresApproval: true,
        riskLevel: 'LOW_RISK_WRITE',
      },
      {
        name: isDemo ? 'dangerous_demo' : 'purge_site_cache',
        title: isDemo ? 'Purge Demo Cache' : 'Purge All Object & Transients Cache',
        description: 'Destructive purge tool requiring explicit operator confirmation.',
        inputSchema: { type: 'object', properties: { flushRedis: { type: 'boolean' } } },
        serverId: server.id,
        siteId: server.siteId,
        enabled: true,
        requiresApproval: true,
        riskLevel: 'DESTRUCTIVE',
      },
    ];

    setMcpTools((prev) => ({
      ...prev,
      [server.id]: tools,
    }));

    const connectedServer: MCPServer = {
      ...server,
      connectionStatus: 'CONNECTED',
      protocolVersion: '2024-11-05',
      serverInfo: { name: server.name, version: '1.4.2' },
      discoveredToolsCount: tools.length,
      lastConnected: 'Just now',
    };

    setMcpServers((prev) => {
      const idx = prev.findIndex((s) => s.id === server.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = connectedServer;
        return updated;
      }
      return [...prev, connectedServer];
    });

    setSites((prev) =>
      prev.map((s) =>
        s.id === server.siteId
          ? { ...s, mcpStatus: 'CONNECTED', lastConnection: 'Just now', mcpEndpoint: server.endpoint }
          : s
      )
    );

    const newAudit: AuditEvent = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      siteId: server.siteId,
      siteName: sites.find((s) => s.id === server.siteId)?.siteName || server.name,
      userAction: 'MCP_CONNECT',
      aiAction: 'ESTABLISH_SESSION',
      tool: 'mcp_handshake',
      parametersSummary: `endpoint=${server.endpoint}; authType=${server.authenticationType}`,
      resultSummary: `Connected to ${server.name} (tools=${tools.length})`,
      approvalStatus: 'NONE',
      isSuccess: true,
    };
    setAuditEvents((prev) => [newAudit, ...prev]);
  };

  const handleDisconnectMcpServer = (siteId: string, serverId: string) => {
    setMcpServers((prev) =>
      prev.map((s) =>
        s.id === serverId ? { ...s, connectionStatus: 'DISCONNECTED' } : s
      )
    );
    setSites((prev) =>
      prev.map((s) =>
        s.id === siteId ? { ...s, mcpStatus: 'DISCONNECTED' } : s
      )
    );
  };

  const handleRefreshMcpTools = async (siteId: string, serverId: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 350));
  };

  const handleDeleteMcpServer = (siteId: string, serverId: string) => {
    setMcpServers((prev) => prev.filter((s) => s.id !== serverId));
    setMcpTools((prev) => {
      const next = { ...prev };
      delete next[serverId];
      return next;
    });
    setSites((prev) =>
      prev.map((s) =>
        s.id === siteId ? { ...s, mcpStatus: 'DISCONNECTED' } : s
      )
    );
  };

  // Handlers for Chat & Progressive Streaming
  const currentSiteMessages = activeSite ? messagesBySite[activeSite.id] || [] : [];

  const handleSendMessage = async (text: string) => {
    if (!activeSite || isStreaming) return;

    if (!openRouterConfig.isConnected) {
      setCurrentTab('settings');
      return;
    }

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId: `conv-${activeSite.id}`,
      siteId: activeSite.id,
      sender: 'USER',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessagesBySite((prev) => ({
      ...prev,
      [activeSite.id]: [...(prev[activeSite.id] || []), userMsg],
    }));

    setIsStreaming(true);
    setStreamingText('');
    streamingAbortRef.current = false;

    // Build intelligent WordPress operations response
    const isAudit = text.toLowerCase().includes('audit') || text.toLowerCase().includes('seo') || text.toLowerCase().includes('sitemap');
    const isPlugin = text.toLowerCase().includes('plugin') || text.toLowerCase().includes('transient');
    
    let simulatedResponse = '';
    if (isAudit) {
      simulatedResponse = `Executing WordPress read-only audit for ${activeSite.siteName} (${activeSite.websiteUrl}).\n\n• Schema Check: Validated ${activeSite.seoPlugin} structured JSON-LD data.\n• HTTP Status: Checked 24 top-level routes (All 200 OK).\n• Core Web Vitals: LCP 1.4s, CLS 0.02 (Optimal).\n\nRecommendation: No canonical errors or missing OpenGraph tags detected across target pages.`;
    } else if (isPlugin) {
      simulatedResponse = `Analyzing active WordPress plugins for ${activeSite.siteName}.\n\n• Found 18 active plugins running under ${activeSite.wordPressType}.\n• Security Alert: Contact Form 7 has pending migration transience.\n\nProposed Next Step: Deactivate obsolete transients or switch to protected form handler.`;
    } else {
      simulatedResponse = `[Site-Isolated Operational Context]\nDomain: ${activeSite.siteName} (${activeSite.websiteUrl})\nProvider: OpenRouter Gateway → ${activeModel.name}\n\nI have received your instruction: "${text}".\n\nYour directives will be executed adhering to ${activeSite.siteName}'s strict permission policy. Tool actions requiring modification or deletion will queue for human operator authorization.`;
    }

    // Stream progressive tokens
    const tokens = simulatedResponse.split(' ');
    let accumulated = '';

    for (let i = 0; i < tokens.length; i++) {
      if (streamingAbortRef.current) break;
      accumulated += (i === 0 ? '' : ' ') + tokens[i];
      setStreamingText(accumulated);
      await new Promise((r) => setTimeout(r, 35));
    }

    const wasInterrupted = streamingAbortRef.current;
    setIsStreaming(false);

    const inputTokens = Math.round(text.length / 3) + 120;
    const outputTokens = Math.round(accumulated.length / 3.5);
    const totalTokens = inputTokens + outputTokens;
    const cost = activeModel.isFree
      ? 0
      : (inputTokens * activeModel.inputCost + outputTokens * activeModel.outputCost) / 1_000_000;

    const assistantMsg: ChatMessage = {
      id: `msg-${Date.now() + 1}`,
      conversationId: `conv-${activeSite.id}`,
      siteId: activeSite.id,
      sender: 'ASSISTANT',
      content: wasInterrupted ? `${accumulated}\n\n[Generation stopped by operator]` : accumulated,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isInterrupted: wasInterrupted,
      modelName: activeModel.name,
      usage: {
        model: activeModel.name,
        inputTokens,
        outputTokens,
        totalTokens,
        estimatedCost: cost,
        timestamp: 'Just now',
      },
    };

    setMessagesBySite((prev) => ({
      ...prev,
      [activeSite.id]: [...(prev[activeSite.id] || []), assistantMsg],
    }));

    // Record non-secret audit log
    const audit: AuditEvent = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      siteId: activeSite.id,
      siteName: activeSite.siteName,
      userAction: 'Chat Command Streamed',
      aiAction: `Model response synthesized via ${activeModel.name}`,
      tool: isAudit ? 'wordpress_sitemap_inspector' : 'conversational_agent',
      parametersSummary: `site=${activeSite.websiteUrl}; model=${activeModel.id}`,
      resultSummary: wasInterrupted ? 'Stream cancelled by operator' : `Completed with ${totalTokens} tokens`,
      approvalStatus: 'AUTOMATIC_READ_ONLY',
      isSuccess: !wasInterrupted,
    };
    setAuditEvents((prev) => [audit, ...prev]);
  };

  const handleStopGeneration = () => {
    streamingAbortRef.current = true;
    setIsStreaming(false);
  };

  // Trigger Dangerous Action Approval Dialog
  const handlePromptDangerousApproval = (
    actionType: DangerousActionType,
    targetResource: string,
    description: string,
    onSuccessCallback?: () => void
  ) => {
    if (!activeSite) return;
    setApprovalModalData({
      isOpen: true,
      siteName: activeSite.siteName,
      actionType,
      description,
      targetResource,
      onApprove: () => {
        const audit: AuditEvent = {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          siteId: activeSite.id,
          siteName: activeSite.siteName,
          userAction: `Authorize Dangerous Action: ${actionType}`,
          aiAction: `Execute authorized tool: ${actionType}`,
          tool: 'wordpress_governance_engine',
          parametersSummary: `target=${targetResource}; action=${actionType}`,
          resultSummary: 'Operator authorized execution. State updated.',
          approvalStatus: 'OPERATOR_AUTHORIZED',
          isSuccess: true,
        };
        setAuditEvents((prev) => [audit, ...prev]);
        if (onSuccessCallback) onSuccessCallback();
      },
      onReject: () => {
        const audit: AuditEvent = {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          siteId: activeSite.id,
          siteName: activeSite.siteName,
          userAction: `Reject Dangerous Action: ${actionType}`,
          aiAction: 'Halt execution',
          tool: 'wordpress_governance_engine',
          parametersSummary: `target=${targetResource}; action=${actionType}`,
          resultSummary: 'Operation cancelled by operator request.',
          approvalStatus: 'OPERATOR_REJECTED',
          isSuccess: false,
        };
        setAuditEvents((prev) => [audit, ...prev]);
      },
    });
  };

  // Quick Action: Audit Site
  const handleTriggerQuickAudit = () => {
    if (!activeSite) {
      setIsSiteSelectorOpen(true);
      return;
    }
    const auditTask: Task = {
      id: `task-${Date.now()}`,
      title: `On-Demand Audit: ${activeSite.siteName}`,
      description: `Automated audit of Core Web Vitals, Yoast/Rank Math schemas, and HTTP response codes.`,
      siteId: activeSite.id,
      siteName: activeSite.siteName,
      category: 'SEO',
      createdDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      updatedDate: 'Just now',
      status: 'COMPLETED',
      requestedAction: 'on_demand_audit',
      dangerousActionType: 'READ_ONLY_AUDIT',
      approvalRequirement: 'NONE',
      executionResult: {
        summary: `Site audit for ${activeSite.siteName} completed with 100% health score. Sitemaps verified, SSL valid, SEO tags parsed.`,
        logs: [
          `Target: ${activeSite.websiteUrl}`,
          `Inspected ${activeSite.seoPlugin} configurations`,
          `Checked 15 URLs: All HTTP 200 OK`,
          `Logged non-secret diagnostics to audit trail`,
        ],
        executionDurationMs: 1240,
        completedAt: 'Just now',
        success: true,
      },
    };
    setTasks((prev) => [auditTask, ...prev]);
    setCurrentTab('tasks');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-300">
      {/* Top Bar Navigation */}
      <TopBar
        currentTab={currentTab}
        activeSite={activeSite}
        onOpenSiteSelector={() => setIsSiteSelectorOpen(true)}
        viewMode={viewMode}
        onSetViewMode={setViewMode}
      />

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden">
        {viewMode === 'code' ? (
          /* Kotlin Codebase & Architecture Explorer */
          <div className="w-full flex-1 overflow-y-auto">
            <CodeExplorer />
          </div>
        ) : viewMode === 'mobile' ? (
          /* Android Device Frame Simulator (Pixel 8) */
          <div className="w-full max-w-[420px] h-[820px] bg-neutral-950 rounded-[44px] p-3 shadow-2xl border-4 border-neutral-800 flex flex-col relative overflow-hidden ring-1 ring-neutral-700/50">
            {/* Phone Bezel Speaker / Camera Pill */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-neutral-900 rounded-full z-30 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-neutral-950 border border-neutral-800" />
            </div>

            {/* Android Screen Container */}
            <div className="flex-1 flex flex-col bg-neutral-950 rounded-[34px] overflow-hidden pt-6">
              {/* Tab Viewports */}
              <div className="flex-1 overflow-y-auto flex flex-col">
                {currentTab === 'home' && (
                  <HomeScreen
                    sites={sites}
                    tasks={tasks}
                    auditEvents={auditEvents}
                    currentAiModelName={activeModel.name}
                    isOpenRouterConnected={openRouterConfig.isConnected}
                    onNavigateToTab={(t) => setCurrentTab(t as any)}
                    onTriggerQuickAudit={handleTriggerQuickAudit}
                    onResetDemoData={() => setSites(initialDemoSites)}
                    onClearAllSitesForEmptyState={() => setSites([])}
                    onOpenModelCenter={() => setIsModelCenterOpen(true)}
                  />
                )}
                {currentTab === 'sites' && (
                  <SitesScreen
                    sites={sites}
                    mcpServers={mcpServers}
                    mcpTools={mcpTools}
                    onToggleConnectSite={handleToggleConnectSite}
                    onAddSite={handleAddSite}
                    onUpdateSite={handleUpdateSite}
                    onDeleteSite={handleDeleteSite}
                    onSelectSiteForChat={(site) => {
                      setActiveSiteId(site.id);
                      setCurrentTab('chat');
                    }}
                    onSaveMcpServer={handleSaveMcpServer}
                    onTestMcpConnection={handleTestMcpConnection}
                    onConnectMcpServer={handleConnectMcpServer}
                    onDisconnectMcpServer={handleDisconnectMcpServer}
                    onRefreshMcpTools={handleRefreshMcpTools}
                  />
                )}
                {currentTab === 'tasks' && (
                  <TasksScreen
                    tasks={tasks}
                    sites={sites}
                    onOpenApproval={(task) =>
                      handlePromptDangerousApproval(
                        task.dangerousActionType,
                        task.title,
                        task.description,
                        () => {
                          setTasks((prev) =>
                            prev.map((t) =>
                              t.id === task.id
                                ? { ...t, status: 'RUNNING', approvalRequirement: 'APPROVED' }
                                : t
                            )
                          );
                        }
                      )
                    }
                    onCreateTask={(task) => setTasks((prev) => [task, ...prev])}
                  />
                )}
                {currentTab === 'chat' && (
                  <ChatScreen
                    activeSite={activeSite}
                    messages={currentSiteMessages}
                    currentAiModelName={activeModel.name}
                    activeModel={activeModel}
                    isOpenRouterConfigured={openRouterConfig.isConnected}
                    isStreaming={isStreaming}
                    streamingText={streamingText}
                    onOpenSiteSelector={() => setIsSiteSelectorOpen(true)}
                    onOpenModelPicker={() => setIsModelCenterOpen(true)}
                    onSendMessage={handleSendMessage}
                    onStopGeneration={handleStopGeneration}
                    onNavigateToSettings={() => setCurrentTab('settings')}
                    onRequestDangerousActionApproval={(action, target, desc) =>
                      handlePromptDangerousApproval(action, target, desc)
                    }
                  />
                )}
                {currentTab === 'settings' && (
                  <SettingsScreen
                    availableModels={models}
                    selectedModelId={selectedModelId}
                    onSelectModel={setSelectedModelId}
                    openRouterConfig={openRouterConfig}
                    onSaveOpenRouterKey={handleSaveOpenRouterKey}
                    onRemoveOpenRouterKey={handleRemoveOpenRouterKey}
                    onTestOpenRouterConnection={handleTestOpenRouterConnection}
                    onRefreshModels={handleRefreshModels}
                    onOpenModelCenter={() => setIsModelCenterOpen(true)}
                    isRefreshingModels={isRefreshingModels}
                    mcpServers={mcpServers}
                    sites={sites}
                    onReconnectMcpServer={handleConnectMcpServer}
                    onDisconnectMcpServer={handleDisconnectMcpServer}
                    onDeleteMcpServer={handleDeleteMcpServer}
                  />
                )}
              </div>

              {/* Android Compose M3 Bottom Navigation Bar */}
              <BottomNav
                currentTab={currentTab}
                onSelectTab={(t) => setCurrentTab(t as any)}
                activeTasksBadgeCount={tasks.filter((t) => t.status === 'AWAITING_APPROVAL').length}
              />

              {/* Android Home Gesture Pill */}
              <div className="h-4 w-full flex items-center justify-center bg-neutral-950 shrink-0">
                <div className="w-24 h-1 bg-neutral-600 rounded-full" />
              </div>
            </div>
          </div>
        ) : (
          /* Desktop Command Center Console Mode */
          <div className="w-full flex-1 flex flex-col bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
            {/* Top Secondary Breadcrumb Bar */}
            <div className="bg-neutral-900 border-b border-neutral-800 px-6 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-neutral-400">IMPERIAL AI</span>
                <span className="text-neutral-600">/</span>
                <span className="text-amber-400 uppercase font-bold">{currentTab}</span>
                {activeSite && (
                  <>
                    <span className="text-neutral-600">/</span>
                    <span className="text-neutral-300 font-semibold">{activeSite.siteName}</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-neutral-400">
                  Fleet: <span className="text-neutral-200">{sites.length} Sites</span>
                </span>
                <button
                  onClick={() => setIsModelCenterOpen(true)}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 cursor-pointer transition-colors"
                >
                  <span className="text-neutral-400">Model:</span>
                  <span className="text-amber-400 font-semibold">{activeModel.name}</span>
                  {activeModel.isFree && (
                    <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950 px-1 rounded">
                      FREE
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
              {currentTab === 'home' && (
                <HomeScreen
                  sites={sites}
                  tasks={tasks}
                  auditEvents={auditEvents}
                  currentAiModelName={activeModel.name}
                  isOpenRouterConnected={openRouterConfig.isConnected}
                  onNavigateToTab={(t) => setCurrentTab(t as any)}
                  onTriggerQuickAudit={handleTriggerQuickAudit}
                  onResetDemoData={() => setSites(initialDemoSites)}
                  onClearAllSitesForEmptyState={() => setSites([])}
                  onOpenModelCenter={() => setIsModelCenterOpen(true)}
                />
              )}
              {currentTab === 'sites' && (
                <SitesScreen
                  sites={sites}
                  mcpServers={mcpServers}
                  mcpTools={mcpTools}
                  onToggleConnectSite={handleToggleConnectSite}
                  onAddSite={handleAddSite}
                  onUpdateSite={handleUpdateSite}
                  onDeleteSite={handleDeleteSite}
                  onSelectSiteForChat={(site) => {
                    setActiveSiteId(site.id);
                    setCurrentTab('chat');
                  }}
                  onSaveMcpServer={handleSaveMcpServer}
                  onTestMcpConnection={handleTestMcpConnection}
                  onConnectMcpServer={handleConnectMcpServer}
                  onDisconnectMcpServer={handleDisconnectMcpServer}
                  onRefreshMcpTools={handleRefreshMcpTools}
                />
              )}
              {currentTab === 'tasks' && (
                <TasksScreen
                  tasks={tasks}
                  sites={sites}
                  onOpenApproval={(task) =>
                    handlePromptDangerousApproval(
                      task.dangerousActionType,
                      task.title,
                      task.description,
                      () => {
                        setTasks((prev) =>
                          prev.map((t) =>
                            t.id === task.id
                              ? { ...t, status: 'RUNNING', approvalRequirement: 'APPROVED' }
                              : t
                          )
                        );
                      }
                    )
                  }
                  onCreateTask={(task) => setTasks((prev) => [task, ...prev])}
                />
              )}
              {currentTab === 'chat' && (
                <ChatScreen
                  activeSite={activeSite}
                  messages={currentSiteMessages}
                  currentAiModelName={activeModel.name}
                  activeModel={activeModel}
                  isOpenRouterConfigured={openRouterConfig.isConnected}
                  isStreaming={isStreaming}
                  streamingText={streamingText}
                  onOpenSiteSelector={() => setIsSiteSelectorOpen(true)}
                  onOpenModelPicker={() => setIsModelCenterOpen(true)}
                  onSendMessage={handleSendMessage}
                  onStopGeneration={handleStopGeneration}
                  onNavigateToSettings={() => setCurrentTab('settings')}
                  onRequestDangerousActionApproval={(action, target, desc) =>
                    handlePromptDangerousApproval(action, target, desc)
                  }
                />
              )}
              {currentTab === 'settings' && (
                <SettingsScreen
                  availableModels={models}
                  selectedModelId={selectedModelId}
                  onSelectModel={setSelectedModelId}
                  openRouterConfig={openRouterConfig}
                  onSaveOpenRouterKey={handleSaveOpenRouterKey}
                  onRemoveOpenRouterKey={handleRemoveOpenRouterKey}
                  onTestOpenRouterConnection={handleTestOpenRouterConnection}
                  onRefreshModels={handleRefreshModels}
                  onOpenModelCenter={() => setIsModelCenterOpen(true)}
                  isRefreshingModels={isRefreshingModels}
                  mcpServers={mcpServers}
                  sites={sites}
                  onReconnectMcpServer={handleConnectMcpServer}
                  onDisconnectMcpServer={handleDisconnectMcpServer}
                  onDeleteMcpServer={handleDeleteMcpServer}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Site Selector Modal */}
      <SiteSelectorModal
        isOpen={isSiteSelectorOpen}
        onClose={() => setIsSiteSelectorOpen(false)}
        sites={sites}
        activeSiteId={activeSite?.id || ''}
        onSelectSite={(site) => {
          setActiveSiteId(site.id);
          setIsSiteSelectorOpen(false);
        }}
      />

      {/* Model Center Modal */}
      <ModelCenterModal
        isOpen={isModelCenterOpen}
        onClose={() => setIsModelCenterOpen(false)}
        models={models}
        selectedModelId={effectiveModelId}
        onSelectModel={(modelId) => {
          if (activeSite) {
            setConversationModelOverrides((prev) => ({
              ...prev,
              [activeSite.id]: modelId,
            }));
          }
          setSelectedModelId(modelId);
          setIsModelCenterOpen(false);
        }}
        onRefreshModels={handleRefreshModels}
        isRefreshing={isRefreshingModels}
        lastUpdated={openRouterConfig.lastUpdated}
      />

      {/* Dangerous Action Approval Modal */}
      <ApprovalModal
        isOpen={approvalModalData.isOpen}
        onClose={() => setApprovalModalData((prev) => ({ ...prev, isOpen: false }))}
        siteName={approvalModalData.siteName}
        actionType={approvalModalData.actionType}
        description={approvalModalData.description}
        targetResource={approvalModalData.targetResource}
        onApprove={() => {
          approvalModalData.onApprove();
          setApprovalModalData((prev) => ({ ...prev, isOpen: false }));
        }}
        onReject={() => {
          approvalModalData.onReject();
          setApprovalModalData((prev) => ({ ...prev, isOpen: false }));
        }}
      />
    </div>
  );
}

export default App;
