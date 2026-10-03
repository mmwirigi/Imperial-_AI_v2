import React, { useState } from 'react';
import { 
  Cpu, 
  Server, 
  ShieldCheck, 
  Palette, 
  Bell, 
  Info, 
  Check, 
  Lock, 
  Key, 
  Fingerprint,
  RefreshCw,
  ExternalLink,
  Eye,
  EyeOff,
  AlertTriangle,
  Layers,
  Sparkles,
  Unlink,
  Trash2,
  Power,
  Activity,
  Terminal,
  X
} from 'lucide-react';
import { AIModel, OpenRouterConfig, MCPServer, Site, McpConnectionStatus } from '../types';

interface SettingsScreenProps {
  availableModels: AIModel[];
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  openRouterConfig: OpenRouterConfig;
  onSaveOpenRouterKey: (key: string) => void;
  onRemoveOpenRouterKey: () => void;
  onTestOpenRouterConnection: () => Promise<{ success: boolean; message: string; latencyMs: number }>;
  onRefreshModels: () => void;
  onOpenModelCenter: () => void;
  isRefreshingModels?: boolean;
  // Phase 3 MCP Management Props
  mcpServers: MCPServer[];
  sites: Site[];
  onReconnectMcpServer: (server: MCPServer) => void;
  onDisconnectMcpServer: (siteId: string, serverId: string) => void;
  onDeleteMcpServer: (siteId: string, serverId: string) => void;
  // Brand New App & Demo Management Props
  onResetAllData?: () => void;
  onSeedDemoData?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  availableModels,
  selectedModelId,
  onSelectModel,
  openRouterConfig,
  onSaveOpenRouterKey,
  onRemoveOpenRouterKey,
  onTestOpenRouterConnection,
  onRefreshModels,
  onOpenModelCenter,
  isRefreshingModels = false,
  mcpServers,
  sites,
  onReconnectMcpServer,
  onDisconnectMcpServer,
  onDeleteMcpServer,
  onResetAllData,
  onSeedDemoData,
}) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  
  // API key modal state
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [showKeyText, setShowKeyText] = useState(false);

  // Connection test state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs: number } | null>(null);

  // Phase 3: MCP Delete Protection State
  const [serverToDelete, setServerToDelete] = useState<{ server: MCPServer; siteName: string } | null>(null);

  const selectedModel = availableModels.find((m) => m.id === selectedModelId) || availableModels[0];

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;
    onSaveOpenRouterKey(keyInput.trim());
    setKeyInput('');
    setIsKeyModalOpen(false);
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await onTestOpenRouterConnection();
      setTestResult(res);
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusBadge = (status: McpConnectionStatus) => {
    switch (status) {
      case 'CONNECTED':
        return 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60';
      case 'CONNECTING':
      case 'AUTHENTICATING':
        return 'bg-amber-950/40 text-amber-400 border-amber-800/60';
      case 'ERROR':
        return 'bg-rose-950/40 text-rose-400 border-rose-800/60';
      default:
        return 'bg-neutral-800 text-neutral-400 border-neutral-700';
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto w-full">
      {/* Title */}
      <div className="pb-2 border-b border-neutral-800">
        <h1 className="text-lg font-bold text-neutral-100 uppercase tracking-wider font-mono">
          System & Security Settings
        </h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          Configure OpenRouter AI provider, Keystore parameters, MCP endpoints, and operator policies
        </p>
      </div>

      {/* 1. AI Models & OpenRouter Gateway */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
            <Cpu className="w-4 h-4" />
            <span>AI Models & OpenRouter Gateway</span>
          </div>

          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded border self-start sm:self-auto ${
              openRouterConfig.isConnected
                ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/60'
                : 'bg-amber-950/50 text-amber-400 border-amber-800/60'
            }`}
          >
            {openRouterConfig.isConnected ? '● OpenRouter Connected' : '○ Not Configured'}
          </span>
        </div>

        <p className="text-xs text-neutral-400">
          Universal model gateway routing to frontier and free models. Keystore hardware envelope encryption is strictly enforced.
        </p>

        {/* API Key Management Box */}
        <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-neutral-200">OpenRouter API Key</div>
              <div className="text-[11px] text-neutral-400 mt-0.5">
                {openRouterConfig.isConnected && openRouterConfig.maskedApiKey ? (
                  <span className="font-mono text-amber-400 font-semibold">
                    {openRouterConfig.maskedApiKey}
                  </span>
                ) : (
                  <span className="text-neutral-500">No secret key currently configured</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {openRouterConfig.isConnected ? (
                <>
                  <button
                    onClick={() => {
                      setKeyInput('');
                      setIsKeyModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 transition-colors"
                  >
                    Change Key
                  </button>
                  <button
                    onClick={onRemoveOpenRouterKey}
                    title="Remove API Key"
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-rose-950/40 text-neutral-400 hover:text-rose-400 border border-neutral-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setKeyInput('');
                    setIsKeyModalOpen(true);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-colors"
                >
                  Enter API Key
                </button>
              )}
            </div>
          </div>

          {/* Test Connection Button & Indicator */}
          {openRouterConfig.isConnected && (
            <div className="pt-2 border-t border-neutral-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <button
                onClick={handleTestConnection}
                disabled={isTesting}
                className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium disabled:opacity-50"
              >
                <Activity className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Testing OpenRouter API...' : 'Test Connection Latency'}</span>
              </button>

              {testResult && (
                <div
                  className={`text-[11px] font-mono flex items-center gap-1.5 ${
                    testResult.success ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  <span>{testResult.success ? '✓' : '✗'}</span>
                  <span>{testResult.message}</span>
                  {testResult.latencyMs > 0 && <span>({testResult.latencyMs}ms)</span>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Global Default Model Box */}
        <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-[10px] font-mono uppercase text-neutral-500">Global Default Model</div>
            <div className="text-xs font-bold text-neutral-100 flex items-center gap-2">
              <span>{selectedModel?.name || selectedModelId}</span>
              {selectedModel?.isFree && (
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                  Free
                </span>
              )}
            </div>
            <div className="text-[11px] text-neutral-400 font-mono">
              Provider: {selectedModel?.provider} · Context: {(selectedModel?.contextLength || 0).toLocaleString()} tokens
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenModelCenter}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Model Center</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Phase 3: MCP Connections Management (Requirement 25) */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
            <Server className="w-4 h-4" />
            <span>MCP Connections (Site-Bound Isolation)</span>
          </div>

          <span className="text-[10px] font-mono text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
            {mcpServers.length} Configured
          </span>
        </div>

        <p className="text-xs text-neutral-400">
          Configured remote Model Context Protocol servers. Each connection is strictly bound to its client site to guarantee zero cross-site token or data leakage.
        </p>

        {mcpServers.length === 0 ? (
          <div className="p-6 bg-neutral-950 rounded-xl border border-neutral-800 text-center space-y-2">
            <Unlink className="w-6 h-6 text-neutral-600 mx-auto" />
            <div className="text-xs font-bold text-neutral-300">No Remote MCP Servers Configured</div>
            <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
              Go to Sites → Site Details and click "MCP CONNECTION" to configure an endpoint for any client site.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {mcpServers.map((srv) => {
              const boundSite = sites.find((s) => s.id === srv.siteId);
              const isConnected = srv.connectionStatus === 'CONNECTED';

              return (
                <div
                  key={srv.id}
                  className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 hover:border-neutral-700 space-y-3 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-100">{srv.name}</span>
                        {srv.isDemo && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">
                            DEMO
                          </span>
                        )}
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getStatusBadge(srv.connectionStatus)}`}>
                          {srv.connectionStatus}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                        Site: <span className="text-amber-400 font-semibold">{boundSite?.siteName || srv.siteId}</span>
                        <span className="text-neutral-600"> ({srv.siteId})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isConnected ? (
                        <button
                          onClick={() => onDisconnectMcpServer(srv.siteId, srv.id)}
                          className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium border border-neutral-700 transition-colors"
                        >
                          Disconnect
                        </button>
                      ) : (
                        <button
                          onClick={() => onReconnectMcpServer(srv)}
                          className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-colors"
                        >
                          Connect
                        </button>
                      )}

                      <button
                        onClick={() => setServerToDelete({ server: srv, siteName: boundSite?.siteName || srv.siteId })}
                        title="Remove MCP Connection"
                        className="p-1.5 rounded-lg bg-neutral-800 hover:bg-rose-950/40 text-neutral-400 hover:text-rose-400 border border-neutral-700 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800/60 font-mono">
                    <div>
                      <span className="text-neutral-500 block text-[9px] uppercase">Endpoint</span>
                      <span className="text-neutral-300 break-all">{srv.endpoint}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[9px] uppercase">Transport & Auth</span>
                      <span className="text-neutral-300">Streamable HTTP · {srv.authenticationType}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[9px] uppercase">Tools Discovered</span>
                      <span className="text-amber-400 font-bold">{srv.discoveredToolsCount} tools available</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Hardware Security & Keystore */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Security, Keystore & Dual-Keyed Isolation</span>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="font-bold text-neutral-200">Hardware-Backed Android Keystore</div>
              <div className="text-[11px] text-neutral-400">
                MasterKey AES-256-GCM hardware enclave. Secrets are never saved in SQLite, logs, or plain files.
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 shrink-0">
              Active TEE
            </span>
          </div>

          <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="font-bold text-neutral-200">Biometric / PIN Gating</div>
              <div className="text-[11px] text-neutral-400">
                Prompt biometric confirmation before executing destructive tools (drop database, purge cache, bulk delete).
              </div>
            </div>
            <input
              type="checkbox"
              checked={biometricsEnabled}
              onChange={(e) => setBiometricsEnabled(e.target.checked)}
              className="accent-amber-500 w-4 h-4 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 4. Production Environment & Data Slate */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
          <Layers className="w-4 h-4" />
          <span>Environment &amp; Workspace Data Slate</span>
        </div>

        <p className="text-xs text-neutral-400">
          Imperial AI operates as a clean slate for your actual client organizations and WordPress fleet. All added clients, sites, and tasks persist durably in your local browser storage.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          {onResetAllData && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset all clients, sites, and tasks back to a clean empty state?')) {
                  onResetAllData();
                }
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-rose-400 hover:text-rose-300 border border-neutral-750 font-bold text-xs transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Reset to Clean Slate (Wipe All)</span>
            </button>
          )}

          {onSeedDemoData && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Populate showcase demo clients and WordPress test sites?')) {
                  onSeedDemoData();
                }
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-xs transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Load Showcase Demo Data</span>
            </button>
          )}
        </div>
      </div>

      {/* 5. Delete Protection Confirmation Dialog (Requirement 26) */}
      {serverToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Remove MCP Connection?</span>
              </div>
              <button onClick={() => setServerToDelete(null)} className="text-neutral-400 hover:text-neutral-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-neutral-300">
              <p>
                Server: <strong className="text-neutral-100">{serverToDelete.server.name}</strong>
              </p>
              <p>
                Bound Site: <strong className="text-amber-400">{serverToDelete.siteName}</strong> ({serverToDelete.server.siteId})
              </p>

              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-neutral-400 text-[11px] leading-relaxed">
                This removes the MCP connection from Imperial AI. It does not delete anything from the remote server.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setServerToDelete(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteMcpServer(serverToDelete.server.siteId, serverToDelete.server.id);
                  setServerToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-neutral-100 text-xs font-bold"
              >
                Remove Connection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OpenRouter Key Entry Modal */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Key className="w-4 h-4" />
                <span>Enter OpenRouter API Key</span>
              </div>
              <button onClick={() => setIsKeyModalOpen(false)} className="text-neutral-400 hover:text-neutral-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              Keys are encrypted in Keystore and masked immediately. They are never sent to third parties or logged.
            </p>

            <form onSubmit={handleSaveKey} className="space-y-4 text-xs">
              <div className="relative">
                <input
                  type={showKeyText ? 'text' : 'password'}
                  required
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="sk-or-v1-..."
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-neutral-100 font-mono outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowKeyText(!showKeyText)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                >
                  {showKeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsKeyModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold"
                >
                  Save Encrypted Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
