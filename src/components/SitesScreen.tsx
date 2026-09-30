import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Globe, 
  ExternalLink, 
  MessageSquare, 
  Edit3, 
  Trash2, 
  Power, 
  ChevronDown, 
  ChevronUp, 
  Shield, 
  Settings2,
  X,
  Check,
  Server,
  Key,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock,
  Layers,
  Terminal,
  Activity,
  Zap,
  Info
} from 'lucide-react';
import { 
  Site, 
  WordPressType, 
  SeoPlugin, 
  PageBuilder, 
  MCPServer, 
  McpTool, 
  McpAuthType, 
  ConnectionTestReport,
  ToolRiskLevel,
  McpConnectionStatus
} from '../types';

interface SitesScreenProps {
  sites: Site[];
  mcpServers: MCPServer[];
  mcpTools: Record<string, McpTool[]>;
  onToggleConnectSite: (site: Site) => void;
  onAddSite: (site: Site) => void;
  onUpdateSite: (site: Site) => void;
  onDeleteSite: (siteId: string) => void;
  onSelectSiteForChat: (site: Site) => void;
  onSaveMcpServer: (server: MCPServer, bearerToken?: string) => void;
  onTestMcpConnection: (server: MCPServer, bearerToken?: string) => Promise<ConnectionTestReport>;
  onConnectMcpServer: (server: MCPServer) => Promise<void>;
  onDisconnectMcpServer: (siteId: string, serverId: string) => void;
  onRefreshMcpTools: (siteId: string, serverId: string) => Promise<void>;
}

export const SitesScreen: React.FC<SitesScreenProps> = ({
  sites,
  mcpServers,
  mcpTools,
  onToggleConnectSite,
  onAddSite,
  onUpdateSite,
  onDeleteSite,
  onSelectSiteForChat,
  onSaveMcpServer,
  onTestMcpConnection,
  onConnectMcpServer,
  onDisconnectMcpServer,
  onRefreshMcpTools,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSiteId, setExpandedSiteId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingSite, setEditingSite] = useState<Site | null>(null);

  // MCP Connection Modal State
  const [mcpModalSite, setMcpModalSite] = useState<Site | null>(null);
  const [mcpServerName, setMcpServerName] = useState('');
  const [mcpEndpoint, setMcpEndpoint] = useState('');
  const [mcpAuthType, setMcpAuthType] = useState<McpAuthType>('NONE');
  const [mcpBearerToken, setMcpBearerToken] = useState('');
  const [isTestingMcp, setIsTestingMcp] = useState(false);
  const [mcpTestReport, setMcpTestReport] = useState<ConnectionTestReport | null>(null);
  const [isConnectingMcp, setIsConnectingMcp] = useState(false);
  const [isRefreshingTools, setIsRefreshingTools] = useState(false);
  const [mcpStatusMessage, setMcpStatusMessage] = useState<string | null>(null);

  // Form State for Site Edit
  const [formData, setFormData] = useState({
    siteName: '',
    websiteUrl: 'https://',
    clientCompanyName: '',
    mcpEndpoint: '',
    wordPressType: 'SELF_HOSTED' as WordPressType,
    seoPlugin: 'YOAST' as SeoPlugin,
    pageBuilder: 'GUTENBERG' as PageBuilder,
    notes: '',
    aiInstructions: '',
  });

  const filteredSites = sites.filter((site) => {
    const q = searchQuery.toLowerCase();
    return (
      site.siteName.toLowerCase().includes(q) ||
      site.clientCompanyName.toLowerCase().includes(q) ||
      site.websiteUrl.toLowerCase().includes(q)
    );
  });

  const openAddModal = () => {
    setModalMode('create');
    setEditingSite(null);
    setFormData({
      siteName: '',
      websiteUrl: 'https://',
      clientCompanyName: '',
      mcpEndpoint: '',
      wordPressType: 'SELF_HOSTED',
      seoPlugin: 'YOAST',
      pageBuilder: 'GUTENBERG',
      notes: '',
      aiInstructions: '',
    });
  };

  const openEditModal = (site: Site) => {
    setModalMode('edit');
    setEditingSite(site);
    setFormData({
      siteName: site.siteName,
      websiteUrl: site.websiteUrl,
      clientCompanyName: site.clientCompanyName,
      mcpEndpoint: site.mcpEndpoint,
      wordPressType: site.wordPressType,
      seoPlugin: site.seoPlugin,
      pageBuilder: site.pageBuilder,
      notes: site.notes,
      aiInstructions: site.aiInstructions,
    });
  };

  const handleSaveSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.siteName.trim()) return;

    if (modalMode === 'create') {
      const newSite: Site = {
        id: `site-${Date.now()}`,
        siteName: formData.siteName,
        websiteUrl: formData.websiteUrl,
        clientCompanyName: formData.clientCompanyName,
        mcpEndpoint: formData.mcpEndpoint,
        mcpStatus: 'DISCONNECTED',
        wordPressType: formData.wordPressType,
        seoPlugin: formData.seoPlugin,
        pageBuilder: formData.pageBuilder,
        notes: formData.notes,
        aiInstructions: formData.aiInstructions,
        permissionPolicy: {
          siteId: `site-${Date.now()}`,
          requireApprovalForDeletePages: true,
          requireApprovalForDeletePosts: true,
          requireApprovalForSiteSettings: true,
          requireApprovalForPublishing: true,
          requireApprovalForPlugins: true,
          requireApprovalForThemes: true,
          requireApprovalForUsers: true,
          requireApprovalForDns: true,
          requireApprovalForBulkEdit: true,
        },
        lastConnection: 'Manual configuration required',
        lastActivity: 'Awaiting MCP endpoint setup',
        isDemo: false,
      };
      onAddSite(newSite);
    } else if (modalMode === 'edit' && editingSite) {
      onUpdateSite({
        ...editingSite,
        ...formData,
      });
    }

    setModalMode(null);
    setEditingSite(null);
  };

  // Open MCP Connection Dialog for a site
  const openMcpModal = (site: Site) => {
    const existingServer = mcpServers.find((s) => s.siteId === site.id);
    setMcpModalSite(site);
    setMcpServerName(existingServer?.name || `${site.siteName} MCP`);
    setMcpEndpoint(existingServer?.endpoint || site.mcpEndpoint || '');
    setMcpAuthType(existingServer?.authenticationType || 'NONE');
    setMcpBearerToken('');
    setMcpTestReport(null);
    setMcpStatusMessage(null);
  };

  const closeMcpModal = () => {
    setMcpModalSite(null);
    setMcpTestReport(null);
    setMcpStatusMessage(null);
  };

  const activeMcpServer = mcpModalSite 
    ? mcpServers.find((s) => s.siteId === mcpModalSite.id) 
    : null;

  const currentSiteTools = activeMcpServer 
    ? (mcpTools[activeMcpServer.id] || [])
    : [];

  const handleTestMcp = async () => {
    if (!mcpModalSite) return;
    if (!mcpEndpoint.trim()) {
      setMcpStatusMessage('Please enter an MCP endpoint URL to test.');
      return;
    }
    setIsTestingMcp(true);
    setMcpTestReport(null);
    setMcpStatusMessage(null);

    const tempServer: MCPServer = {
      id: activeMcpServer?.id || `mcp_${mcpModalSite.id}`,
      name: mcpServerName || `${mcpModalSite.siteName} MCP`,
      endpoint: mcpEndpoint.trim(),
      description: `MCP Server for ${mcpModalSite.siteName}`,
      siteId: mcpModalSite.id,
      enabled: true,
      connectionStatus: 'CONNECTING',
      transport: 'STREAMABLE_HTTP',
      authenticationType: mcpAuthType,
      discoveredToolsCount: 0,
      isDemo: mcpModalSite.isDemo || false,
    };

    try {
      const report = await onTestMcpConnection(tempServer, mcpBearerToken);
      setMcpTestReport(report);
    } catch (err: any) {
      setMcpTestReport({
        success: false,
        latencyMs: 0,
        errorMessage: err.message || 'Connection test failed',
        discoveredToolsCount: 0,
      });
    } finally {
      setIsTestingMcp(false);
    }
  };

  const handleConnectMcp = async () => {
    if (!mcpModalSite) return;
    if (!mcpEndpoint.trim()) {
      setMcpStatusMessage('Please enter an MCP endpoint URL.');
      return;
    }

    setIsConnectingMcp(true);
    setMcpStatusMessage(null);

    const serverToSave: MCPServer = {
      id: activeMcpServer?.id || `mcp_${mcpModalSite.id}`,
      name: mcpServerName || `${mcpModalSite.siteName} MCP`,
      endpoint: mcpEndpoint.trim(),
      description: `MCP Server for ${mcpModalSite.siteName}`,
      siteId: mcpModalSite.id,
      enabled: true,
      connectionStatus: 'CONNECTING',
      transport: 'STREAMABLE_HTTP',
      authenticationType: mcpAuthType,
      discoveredToolsCount: activeMcpServer?.discoveredToolsCount || 0,
      isDemo: mcpModalSite.isDemo || false,
    };

    try {
      onSaveMcpServer(serverToSave, mcpBearerToken);
      await onConnectMcpServer(serverToSave);
      setMcpStatusMessage('MCP server connected and tools discovered successfully.');
    } catch (err: any) {
      setMcpStatusMessage(`Connection failed: ${err.message || 'Handshake rejected'}`);
    } finally {
      setIsConnectingMcp(false);
    }
  };

  const handleDisconnectMcp = () => {
    if (!mcpModalSite || !activeMcpServer) return;
    onDisconnectMcpServer(mcpModalSite.id, activeMcpServer.id);
    setMcpStatusMessage('MCP server disconnected gracefully.');
  };

  const handleRefreshTools = async () => {
    if (!mcpModalSite || !activeMcpServer) return;
    setIsRefreshingTools(true);
    setMcpStatusMessage(null);
    try {
      await onRefreshMcpTools(mcpModalSite.id, activeMcpServer.id);
      setMcpStatusMessage('Dynamic tool catalog refreshed successfully.');
    } catch (err: any) {
      setMcpStatusMessage(`Failed to refresh tools: ${err.message}`);
    } finally {
      setIsRefreshingTools(false);
    }
  };

  const getRiskBadgeColor = (risk: ToolRiskLevel) => {
    switch (risk) {
      case 'READ':
        return 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60';
      case 'LOW_RISK_WRITE':
        return 'bg-sky-950/40 text-sky-400 border-sky-800/60';
      case 'HIGH_RISK_WRITE':
        return 'bg-amber-950/40 text-amber-400 border-amber-800/60';
      case 'DESTRUCTIVE':
        return 'bg-rose-950/40 text-rose-400 border-rose-800/60';
      default:
        return 'bg-neutral-800 text-neutral-400 border-neutral-700';
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-800">
        <div>
          <h1 className="text-lg font-bold text-neutral-100 uppercase tracking-wider font-mono">
            Client Sites & Remote MCP Engines
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manage per-site MCP endpoints, Streamable HTTP transports, and strictly isolated WordPress environments
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>Add WordPress Site</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by site name, client company, or domain URL..."
          className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-100 placeholder:text-neutral-500 outline-none transition-colors"
        />
      </div>

      {/* Sites Cards List */}
      <div className="space-y-3">
        {filteredSites.map((site) => {
          const isExpanded = expandedSiteId === site.id;
          const server = mcpServers.find((s) => s.siteId === site.id);
          const isConnected = server?.connectionStatus === 'CONNECTED' || site.mcpStatus === 'CONNECTED';
          const tools = server ? (mcpTools[server.id] || []) : [];

          return (
            <div
              key={site.id}
              className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700/80 rounded-xl transition-all overflow-hidden"
            >
              <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left: Site Info */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-sm font-bold text-neutral-100">{site.siteName}</h3>
                    {site.isDemo && (
                      <span className="text-[9px] font-mono uppercase bg-neutral-950 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded">
                        DEMO
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1.5 ${
                        isConnected
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : server?.connectionStatus === 'ERROR'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isConnected 
                            ? 'bg-emerald-400' 
                            : server?.connectionStatus === 'ERROR' 
                            ? 'bg-rose-400' 
                            : 'bg-neutral-500'
                        }`}
                      />
                      {isConnected ? 'MCP Connected' : (server?.connectionStatus || 'Not Configured')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-neutral-400 flex-wrap">
                    <a
                      href={site.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-400/90 hover:underline flex items-center gap-1 font-mono text-[11px]"
                    >
                      {site.websiteUrl}
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    <span>·</span>
                    <span className="text-neutral-300 font-medium">{site.clientCompanyName}</span>
                    <span>·</span>
                    <span className="text-neutral-500">{site.wordPressType}</span>
                  </div>

                  {/* Tech stack & MCP tools count */}
                  <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400 pt-1 flex-wrap">
                    <span className="bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                      SEO: {site.seoPlugin}
                    </span>
                    <span className="bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                      Builder: {site.pageBuilder}
                    </span>
                    {tools.length > 0 && (
                      <span className="bg-amber-950/30 text-amber-400 px-2 py-0.5 rounded border border-amber-800/40">
                        {tools.length} Tools Discovered
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {/* MCP Connection Button */}
                  <button
                    onClick={() => openMcpModal(site)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-colors"
                  >
                    <Server className="w-3.5 h-3.5" />
                    <span>MCP Connection</span>
                  </button>

                  {/* Open Chat in site context */}
                  <button
                    onClick={() => onSelectSiteForChat(site)}
                    title="Open Isolated AI Chat for this site"
                    className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-neutral-700 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>

                  {/* Edit site */}
                  <button
                    onClick={() => openEditModal(site)}
                    title="Edit site details"
                    className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete site */}
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete configuration for ${site.siteName}?`)) {
                        onDeleteSite(site.id);
                      }
                    }}
                    title="Delete site"
                    className="p-2 rounded-lg bg-neutral-800 hover:bg-rose-950/40 text-neutral-400 hover:text-rose-400 border border-neutral-700 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Expand Details */}
                  <button
                    onClick={() => setExpandedSiteId(isExpanded ? null : site.id)}
                    className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 border border-neutral-700 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Expandable Technical Specs & Directives */}
              {isExpanded && (
                <div className="bg-neutral-950 border-t border-neutral-800 p-4 space-y-3 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-neutral-500 block">
                          Remote MCP Endpoint
                        </span>
                        <span className="font-mono text-neutral-300 break-all">
                          {server?.endpoint || site.mcpEndpoint || 'Not configured (Configure via MCP Connection button)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase text-neutral-500 block">
                          Last Connection & Activity
                        </span>
                        <span className="text-neutral-300">
                          {server?.lastConnected || site.lastConnection} · {site.lastActivity}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-neutral-500 block">
                          AI System Instructions
                        </span>
                        <p className="text-neutral-300 italic text-[11px] leading-relaxed">
                          "{site.aiInstructions || 'Default brand safety guidelines active.'}"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Discovered Tools List Preview */}
                  {tools.length > 0 && (
                    <div className="pt-2 border-t border-neutral-800/60">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold">
                          Discovered MCP Tools ({tools.length})
                        </span>
                        <button
                          onClick={() => openMcpModal(site)}
                          className="text-[10px] font-mono text-amber-400 hover:underline"
                        >
                          Manage Tools →
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {tools.map((t) => (
                          <span
                            key={t.name}
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getRiskBadgeColor(t.riskLevel)}`}
                          >
                            ✓ {t.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MCP Connection Modal (Phase 3 Engine) */}
      {mcpModalSite && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
            <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-amber-400" />
                  <h2 className="text-sm font-bold text-neutral-100 uppercase tracking-wider font-mono">
                    MCP Connection: {mcpModalSite.siteName}
                  </h2>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Streamable HTTP transport bound strictly to Site ID <span className="font-mono text-amber-400">{mcpModalSite.id}</span>
                </p>
              </div>
              <button onClick={closeMcpModal} className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Status Message */}
              {mcpStatusMessage && (
                <div className="p-3 bg-neutral-950 border border-amber-500/30 rounded-xl text-amber-300 flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <span>{mcpStatusMessage}</span>
                </div>
              )}

              {/* Status Indicator */}
              <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono uppercase text-neutral-500">Connection Status</div>
                  <div className="font-bold text-neutral-200 mt-0.5 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      activeMcpServer?.connectionStatus === 'CONNECTED' ? 'bg-emerald-400' : 'bg-neutral-500'
                    }`} />
                    <span>{activeMcpServer?.connectionStatus || 'NOT_CONFIGURED'}</span>
                    {activeMcpServer?.protocolVersion && (
                      <span className="text-[10px] font-mono text-neutral-400 font-normal">
                        (Protocol: {activeMcpServer.protocolVersion})
                      </span>
                    )}
                  </div>
                </div>

                {activeMcpServer?.serverInfo && (
                  <div className="text-right">
                    <div className="text-[10px] font-mono uppercase text-neutral-500">Server Info</div>
                    <div className="text-neutral-300 font-mono text-[11px]">
                      {activeMcpServer.serverInfo.name} v{activeMcpServer.serverInfo.version}
                    </div>
                  </div>
                )}
              </div>

              {/* Server Name */}
              <div className="space-y-1">
                <label className="text-[11px] text-neutral-400 font-medium">MCP Server Name</label>
                <input
                  type="text"
                  value={mcpServerName}
                  onChange={(e) => setMcpServerName(e.target.value)}
                  placeholder="e.g., Juba Raha WordPress MCP Gateway"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-neutral-100 outline-none"
                />
              </div>

              {/* MCP Endpoint */}
              <div className="space-y-1">
                <label className="text-[11px] text-neutral-400 font-medium">
                  MCP Endpoint (Streamable HTTP)
                </label>
                <input
                  type="text"
                  value={mcpEndpoint}
                  onChange={(e) => setMcpEndpoint(e.target.value)}
                  placeholder="https://example.com/wp-json/mcp/v1 or mcp://sandbox.local/demo"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-neutral-100 font-mono outline-none"
                />
                <p className="text-[10px] text-neutral-500">
                  Enter your client site's actual MCP gateway endpoint. For safe local tests, use <code className="text-amber-400">mcp://sandbox.local/demo</code>.
                </p>
              </div>

              {/* Authentication Type */}
              <div className="space-y-1">
                <label className="text-[11px] text-neutral-400 font-medium">Authentication Mechanism</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'NONE' as McpAuthType, label: 'No Auth (Open/LAN)' },
                    { id: 'BEARER_TOKEN' as McpAuthType, label: 'Bearer Token' },
                    { id: 'OAUTH2' as McpAuthType, label: 'OAuth 2.0 PKCE' },
                  ].map((auth) => (
                    <button
                      key={auth.id}
                      type="button"
                      onClick={() => setMcpAuthType(auth.id)}
                      className={`p-2 rounded-xl text-left border transition-all text-[11px] ${
                        mcpAuthType === auth.id
                          ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-bold'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      {auth.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bearer Token Input (if selected) */}
              {mcpAuthType === 'BEARER_TOKEN' && (
                <div className="space-y-1 p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                  <div className="flex items-center gap-1.5 text-neutral-300 font-medium text-[11px]">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Bearer Token (Isolated to this site & server)</span>
                  </div>
                  <input
                    type="password"
                    value={mcpBearerToken}
                    onChange={(e) => setMcpBearerToken(e.target.value)}
                    placeholder="Enter Bearer token (stored in Keystore securely)"
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 rounded-lg px-3 py-1.5 text-xs text-neutral-100 font-mono outline-none"
                  />
                  <p className="text-[10px] text-neutral-500">
                    Token is dual-keyed to <span className="text-amber-400">siteId + serverId</span>. Never logged, never printed, never stored in plain text.
                  </p>
                </div>
              )}

              {/* Action Buttons: TEST CONNECTION, CONNECT, DISCONNECT, REFRESH TOOLS */}
              <div className="flex items-center gap-2 pt-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleTestMcp}
                  disabled={isTestingMcp}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs border border-neutral-700 disabled:opacity-50"
                >
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isTestingMcp ? 'Testing Handshake...' : 'Test Connection'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleConnectMcp}
                  disabled={isConnectingMcp}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/10 disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{isConnectingMcp ? 'Connecting & Discovering...' : 'Connect'}</span>
                </button>

                {activeMcpServer?.connectionStatus === 'CONNECTED' && (
                  <>
                    <button
                      type="button"
                      onClick={handleRefreshTools}
                      disabled={isRefreshingTools}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs border border-neutral-700 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRefreshingTools ? 'animate-spin' : ''}`} />
                      <span>Refresh Tools</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDisconnectMcp}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-rose-950/40 text-neutral-400 hover:text-rose-400 font-semibold text-xs border border-neutral-700"
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>Disconnect</span>
                    </button>
                  </>
                )}
              </div>

              {/* Test Connection Report Box */}
              {mcpTestReport && (
                <div
                  className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                    mcpTestReport.success
                      ? 'bg-emerald-950/20 border-emerald-800/60 text-emerald-300'
                      : 'bg-rose-950/20 border-rose-800/60 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {mcpTestReport.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    )}
                    <span>{mcpTestReport.success ? 'Handshake Succeeded' : 'Handshake Failed'}</span>
                    <span className="text-[10px] font-mono text-neutral-400 ml-auto">
                      {mcpTestReport.latencyMs}ms latency
                    </span>
                  </div>

                  {mcpTestReport.success ? (
                    <div className="text-[11px] text-neutral-300 space-y-0.5">
                      <div>Server: <span className="font-semibold text-neutral-100">{mcpTestReport.serverName}</span> v{mcpTestReport.serverVersion}</div>
                      <div>Protocol Version: <span className="font-mono text-amber-400">{mcpTestReport.protocolVersion}</span></div>
                      <div>Advertised Tools: <span className="font-bold text-emerald-400">{mcpTestReport.discoveredToolsCount} tools discovered</span></div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-rose-200">
                      Error: {mcpTestReport.errorMessage || 'Unable to establish HTTP JSON-RPC 2.0 session'}
                    </div>
                  )}
                </div>
              )}

              {/* Discovered MCP Tools Section (Requirement 12) */}
              <div className="pt-2 border-t border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-neutral-200 font-mono uppercase text-xs">
                      Discovered MCP Tools ({currentSiteTools.length})
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500">
                    Unknown tools default to HIGH_RISK_WRITE
                  </span>
                </div>

                {currentSiteTools.length === 0 ? (
                  <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 text-center text-neutral-500">
                    No tools currently discovered. Connect or refresh to synchronize tool schema from remote server.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentSiteTools.map((tool) => (
                      <div
                        key={tool.name}
                        className="p-3 bg-neutral-950 rounded-xl border border-neutral-800/80 hover:border-neutral-700/80 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-amber-400 text-xs">{tool.name}</span>
                            {tool.title && (
                              <span className="text-[11px] text-neutral-400">· {tool.title}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase ${getRiskBadgeColor(tool.riskLevel)}`}>
                              {tool.riskLevel.replace('_', ' ')}
                            </span>
                            {tool.requiresApproval && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">
                                Approval Required
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-[11px] text-neutral-400 leading-relaxed">
                          {tool.description || 'No description provided by remote server.'}
                        </p>

                        {tool.inputSchema && (
                          <div className="text-[10px] font-mono text-neutral-500 bg-neutral-900/60 px-2 py-1 rounded">
                            Schema: {JSON.stringify(tool.inputSchema.properties ? Object.keys(tool.inputSchema.properties) : tool.inputSchema)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={closeMcpModal}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Site Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl my-8">
            <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-neutral-100 uppercase tracking-wider font-mono">
                {modalMode === 'create' ? 'Add WordPress Client Site' : 'Edit Site Configuration'}
              </h2>
              <button
                onClick={() => setModalMode(null)}
                className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSite} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="space-y-1">
                <label className="text-[11px] text-neutral-400 font-medium">Site Name</label>
                <input
                  type="text"
                  required
                  value={formData.siteName}
                  onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                  placeholder="e.g., Juba Raha Paradise Hotel"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-neutral-100 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-neutral-400 font-medium">Client Company</label>
                <input
                  type="text"
                  required
                  value={formData.clientCompanyName}
                  onChange={(e) => setFormData({ ...formData, clientCompanyName: e.target.value })}
                  placeholder="e.g., Juba Raha Hospitality Group"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-neutral-100 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-neutral-400 font-medium">Domain URL</label>
                <input
                  type="url"
                  required
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-neutral-100 font-mono outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-neutral-400 font-medium">WordPress Type</label>
                  <select
                    value={formData.wordPressType}
                    onChange={(e) => setFormData({ ...formData, wordPressType: e.target.value as WordPressType })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 outline-none"
                  >
                    <option value="SELF_HOSTED">Self-Hosted</option>
                    <option value="WORDPRESS_COM">WordPress.com</option>
                    <option value="HEADLESS">Headless WP</option>
                    <option value="MULTISITE">Multisite</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-neutral-400 font-medium">SEO Plugin</label>
                  <select
                    value={formData.seoPlugin}
                    onChange={(e) => setFormData({ ...formData, seoPlugin: e.target.value as SeoPlugin })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 outline-none"
                  >
                    <option value="YOAST">Yoast SEO</option>
                    <option value="RANK_MATH">Rank Math</option>
                    <option value="AIO_SEO">All in One SEO</option>
                    <option value="THE_SEO_FRAMEWORK">The SEO Framework</option>
                    <option value="NONE">None</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-neutral-400 font-medium">Page Builder</label>
                  <select
                    value={formData.pageBuilder}
                    onChange={(e) => setFormData({ ...formData, pageBuilder: e.target.value as PageBuilder })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 outline-none"
                  >
                    <option value="GUTENBERG">Block Editor</option>
                    <option value="ELEMENTOR">Elementor</option>
                    <option value="DIVI">Divi</option>
                    <option value="BEAVER_BUILDER">Beaver Builder</option>
                    <option value="BRICKS">Bricks</option>
                    <option value="NONE">None</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-neutral-400 font-medium">AI Directives & Guardrails</label>
                <textarea
                  rows={3}
                  value={formData.aiInstructions}
                  onChange={(e) => setFormData({ ...formData, aiInstructions: e.target.value })}
                  placeholder="Brand tone, prohibited topics, key CTAs..."
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-neutral-100 outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold"
                >
                  {modalMode === 'create' ? 'Add Site' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
