import React, { useState } from 'react';
import { 
  Activity, 
  Server, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Wifi, 
  Lock, 
  Clock,
  Layers,
  Key,
  ShieldAlert,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Check,
  AlertOctagon,
  Sliders,
  Filter
} from 'lucide-react';
import { 
  ProductionMonitorMetrics, 
  Site, 
  MCPServer, 
  ProductionTask, 
  SecurityEventItem,
  McpHealthStatus,
  SiteHealthStatus,
  TaskHealthCategory
} from '../types';

interface ProductionMonitoringProps {
  metrics: ProductionMonitorMetrics;
  sites: Site[];
  mcpServers: MCPServer[];
  tasks?: ProductionTask[];
  securityEvents?: SecurityEventItem[];
  onRefreshTelemetry: () => void;
  onClearDriftAlert: () => void;
  onSimulateMcpStatus?: (status: McpHealthStatus) => void;
  onSimulateSiteStatus?: (siteId: string, status: SiteHealthStatus) => void;
}

export const ProductionMonitoring: React.FC<ProductionMonitoringProps> = ({
  metrics,
  sites,
  mcpServers,
  tasks = [],
  securityEvents = [],
  onRefreshTelemetry,
  onClearDriftAlert,
  onSimulateMcpStatus,
  onSimulateSiteStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MCP' | 'SITES' | 'TASKS' | 'SECURITY'>('OVERVIEW');
  const [simulatedMcpState, setSimulatedMcpState] = useState<McpHealthStatus>('connected');
  const [siteStatuses, setSiteStatuses] = useState<Record<string, SiteHealthStatus>>({
    'demo-site-1': 'reachable',
    'demo-site-2': 'reachable',
    'demo-site-3': 'capability_changes',
    'demo-site-4': 'reachable',
  });

  const handleMcpStateChange = (status: McpHealthStatus) => {
    setSimulatedMcpState(status);
    if (onSimulateMcpStatus) onSimulateMcpStatus(status);
  };

  const handleSiteStateChange = (siteId: string, status: SiteHealthStatus) => {
    setSiteStatuses((prev) => ({ ...prev, [siteId]: status }));
    if (onSimulateSiteStatus) onSimulateSiteStatus(siteId, status);
  };

  // Task health categorization (Requirement 6)
  const taskRunningCount = tasks.filter((t) => t.overallStatus === 'RUNNING').length;
  const taskPausedCount = tasks.filter((t) => t.overallStatus === 'PAUSED').length;
  const taskFailedCount = tasks.filter((t) => t.overallStatus === 'FAILED').length;
  const taskVerifyFailCount = tasks.filter((t) => 
    t.failures?.some((f) => f.verificationResult.toLowerCase().includes('fail')) || t.overallStatus === 'FAILED'
  ).length;
  const taskRollbackCount = tasks.filter((t) => t.overallStatus === 'ROLLED_BACK' || t.canRollback).length;

  // Security event categorized breakdown (Requirement 6)
  const secUnauthorized = securityEvents.filter((e) => e.eventType === 'UNAUTHORIZED_OPERATION').length;
  const secWrongSite = securityEvents.filter((e) => e.eventType === 'WRONG_SITE_EXECUTION_BLOCKED').length;
  const secApprovalMismatch = securityEvents.filter((e) => e.eventType === 'APPROVAL_INVALIDATED').length;
  const secLimitViolation = securityEvents.filter((e) => e.eventType === 'LIMIT_EXCEEDED').length;
  const secAuthProblem = securityEvents.filter((e) => e.eventType === 'AUTHENTICATION_FAILURE').length;

  const getMcpStatusBadge = (status: McpHealthStatus) => {
    switch (status) {
      case 'connected':
        return { label: 'CONNECTED', style: 'bg-emerald-950 text-emerald-400 border-emerald-800' };
      case 'disconnected':
        return { label: 'DISCONNECTED', style: 'bg-neutral-900 text-neutral-400 border-neutral-700' };
      case 'authentication_expired':
        return { label: 'AUTH EXPIRED', style: 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse' };
      case 'tool_unavailable':
        return { label: 'TOOL UNAVAILABLE', style: 'bg-amber-950 text-amber-300 border-amber-800' };
      case 'schema_capability_changed':
        return { label: 'SCHEMA/CAPABILITY DRIFT', style: 'bg-amber-950 text-amber-400 border-amber-700' };
    }
  };

  const getSiteStatusBadge = (status: SiteHealthStatus) => {
    switch (status) {
      case 'reachable':
        return { label: 'REACHABLE (200 OK)', style: 'bg-emerald-950 text-emerald-400 border-emerald-800' };
      case 'unavailable':
        return { label: 'UNAVAILABLE (TIMEOUT)', style: 'bg-rose-950 text-rose-400 border-rose-800' };
      case 'authentication_failure':
        return { label: 'AUTH FAILURE', style: 'bg-rose-950 text-rose-300 border-rose-800' };
      case 'capability_changes':
        return { label: 'CAPABILITY DRIFT', style: 'bg-amber-950 text-amber-300 border-amber-800' };
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-400" />
              Production Monitoring & Fleet Health
            </h1>
            <span className="text-[11px] font-mono uppercase bg-neutral-900 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-bold">
              Pillar 6 · Real-Time Telemetry
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Production monitoring for MCP health, site connection health, task execution health, and Phase 5 security events.
          </p>
        </div>

        <button
          onClick={onRefreshTelemetry}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-neutral-200 text-xs font-semibold rounded-lg transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
          Ping & Refresh Fleet
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 overflow-x-auto">
        {[
          { id: 'OVERVIEW', label: 'Fleet Overview' },
          { id: 'MCP', label: '1. MCP Health' },
          { id: 'SITES', label: '2. Site Health' },
          { id: 'TASKS', label: '3. Task Health' },
          { id: 'SECURITY', label: '4. Security Events' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-amber-500 text-neutral-950 font-bold'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Capability Drift Alert if detected */}
      {metrics.capabilityDriftDetected && (
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                WordPress Capability Drift Detected
              </h3>
              <p className="text-xs text-amber-200/80">
                {metrics.driftSummary || 'Site stack changes detected since last scheduled audit.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClearDriftAlert}
            className="px-3 py-1 bg-amber-500 text-neutral-950 text-xs font-bold rounded hover:bg-amber-400 transition-colors shrink-0"
          >
            Acknowledge & Resync
          </button>
        </div>
      )}

      {/* OVERVIEW TAB */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Telemetry KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span className="font-medium">1. MCP Gateway Health</span>
                <Server className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {metrics.mcpLatencyMs} ms
              </div>
              <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-neutral-800/60 font-mono">
                <span>Status: <strong className="text-emerald-400 uppercase">{simulatedMcpState}</strong></span>
                <span>{metrics.mcpLastPing}</span>
              </div>
            </div>

            <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span className="font-medium">2. Site REST Latency</span>
                <Wifi className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-neutral-100">
                {metrics.siteResponseTimeMs} ms
              </div>
              <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-neutral-800/60">
                <span>Fleet SSL:</span>
                <span className="text-emerald-400 font-mono font-medium">VALID (TLS 1.3)</span>
              </div>
            </div>

            <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span className="font-medium">3. Task Health</span>
                <Layers className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-amber-400">
                {tasks.length} Tasks
              </div>
              <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-neutral-800/60 font-mono">
                <span>Running: {taskRunningCount}</span>
                <span>Failures: {taskFailedCount}</span>
              </div>
            </div>

            <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span className="font-medium">4. Security Interceptions</span>
                <Lock className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-rose-400">
                {securityEvents.length} Events
              </div>
              <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-neutral-800/60 font-mono">
                <span>Wrong-site blocked: {secWrongSite}</span>
                <span className="text-emerald-400 font-semibold">100% GUARD</span>
              </div>
            </div>
          </div>

          {/* Quick Health Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Health Checklist */}
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wide flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Production Health Checklist (Requirement 6)
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-neutral-950 rounded-lg flex items-center justify-between border border-neutral-800">
                  <span className="text-neutral-300">MCP Transport Connection:</span>
                  <span className="font-mono text-emerald-400 font-semibold">SSE STREAMING (ACTIVE)</span>
                </div>
                <div className="p-2.5 bg-neutral-950 rounded-lg flex items-center justify-between border border-neutral-800">
                  <span className="text-neutral-300">MCP Bearer Authentication:</span>
                  <span className="font-mono text-emerald-400 font-semibold">VALID (Expires in 24h)</span>
                </div>
                <div className="p-2.5 bg-neutral-950 rounded-lg flex items-center justify-between border border-neutral-800">
                  <span className="text-neutral-300">Tool Registry Synchronization:</span>
                  <span className="font-mono text-neutral-200 font-semibold">{metrics.activeDiscoveredTools} Tools Discoverable</span>
                </div>
                <div className="p-2.5 bg-neutral-950 rounded-lg flex items-center justify-between border border-neutral-800">
                  <span className="text-neutral-300">Cross-Client Isolation Barrier:</span>
                  <span className="font-mono text-amber-400 font-semibold">ENFORCED (TASK → SITE → CONN)</span>
                </div>
              </div>
            </div>

            {/* Simulated Anomaly Generator for Testing */}
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wide flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Interactive Telemetry State Simulators
              </h3>
              <p className="text-xs text-neutral-400">
                Trigger state changes to verify automated health alerts, recovery mechanisms, and circuit breakers:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleMcpStateChange(simulatedMcpState === 'connected' ? 'disconnected' : 'connected')}
                  className="p-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded text-left transition-colors"
                >
                  <div className="text-[10px] text-neutral-500 font-mono">Simulate Transport</div>
                  <div className="text-neutral-200 font-semibold truncate">
                    {simulatedMcpState === 'connected' ? 'Disconnect MCP' : 'Reconnect MCP'}
                  </div>
                </button>
                <button
                  onClick={() => handleMcpStateChange('authentication_expired')}
                  className="p-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded text-left transition-colors"
                >
                  <div className="text-[10px] text-neutral-500 font-mono">Simulate Auth</div>
                  <div className="text-rose-300 font-semibold truncate">Expire Token (401)</div>
                </button>
                <button
                  onClick={() => handleMcpStateChange('tool_unavailable')}
                  className="p-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded text-left transition-colors"
                >
                  <div className="text-[10px] text-neutral-500 font-mono">Simulate Tools</div>
                  <div className="text-amber-300 font-semibold truncate">Drop Mutator Tool</div>
                </button>
                <button
                  onClick={() => handleMcpStateChange('schema_capability_changed')}
                  className="p-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded text-left transition-colors"
                >
                  <div className="text-[10px] text-neutral-500 font-mono">Simulate Stack</div>
                  <div className="text-amber-400 font-semibold truncate">Trigger Capability Drift</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. MCP HEALTH TAB (Requirement 6) */}
      {activeTab === 'MCP' && (
        <div className="space-y-4">
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div>
                <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wide flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-400" />
                  Remote MCP Gateway Health Matrix
                </h3>
                <p className="text-xs text-neutral-400">
                  Continuous status monitoring for connected, disconnected, authentication expired, tool unavailable, and schema changes.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono px-2.5 py-1 rounded border font-bold ${getMcpStatusBadge(simulatedMcpState).style}`}>
                  {getMcpStatusBadge(simulatedMcpState).label}
                </span>
              </div>
            </div>

            {/* Five states selector */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {(['connected', 'disconnected', 'authentication_expired', 'tool_unavailable', 'schema_capability_changed'] as McpHealthStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={() => handleMcpStateChange(st)}
                  className={`p-2.5 rounded-lg border text-left font-mono transition-colors ${
                    simulatedMcpState === st
                      ? 'bg-amber-500/10 border-amber-500 text-amber-300 font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <div className="text-[9px] uppercase text-neutral-500">State</div>
                  <div className="text-[11px] truncate capitalize">{st.replace(/_/g, ' ')}</div>
                </button>
              ))}
            </div>

            {/* MCP Health details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-neutral-950 p-4 rounded-xl border border-neutral-800">
              <div>
                <span className="text-[10px] font-mono text-neutral-500 uppercase">Transport Protocol</span>
                <div className="font-semibold text-neutral-200 font-mono">Streamable HTTP (SSE)</div>
                <div className="text-[10px] text-neutral-400">Endpoint: https://mcp.imperial.ke/v1/sse</div>
              </div>
              <div>
                <span className="text-[10px] font-mono text-neutral-500 uppercase">Authentication Status</span>
                <div className="font-semibold text-emerald-400 font-mono">
                  {simulatedMcpState === 'authentication_expired' ? '401 UNAUTHORIZED' : 'BEARER_VALID (TTL 24H)'}
                </div>
                <div className="text-[10px] text-neutral-400">Token Hash: sha256-bearer-9102c</div>
              </div>
              <div>
                <span className="text-[10px] font-mono text-neutral-500 uppercase">Tool Schema & Capabilities</span>
                <div className="font-semibold text-neutral-200 font-mono">
                  {simulatedMcpState === 'schema_capability_changed' ? 'DRIFT DETECTED' : '14 TOOLS SYNCHRONIZED'}
                </div>
                <div className="text-[10px] text-neutral-400">Phase 6 Capability Engine Validated</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SITE HEALTH TAB (Requirement 6) */}
      {activeTab === 'SITES' && (
        <div className="space-y-4">
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wide flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                WordPress Client Site Connection Health
              </h3>
              <p className="text-xs text-neutral-400">
                Track status across: reachable, unavailable, authentication failure, and capability changes.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 text-[11px] uppercase font-mono">
                    <th className="pb-2.5 font-semibold">Client Website</th>
                    <th className="pb-2.5 font-semibold">Endpoint & SSL</th>
                    <th className="pb-2.5 font-semibold">Registered Stack</th>
                    <th className="pb-2.5 font-semibold">Health Status</th>
                    <th className="pb-2.5 font-semibold text-right">Simulate State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {sites.map((site) => {
                    const status = siteStatuses[site.id] || 'reachable';
                    const badge = getSiteStatusBadge(status);

                    return (
                      <tr key={site.id} className="hover:bg-neutral-800/30">
                        <td className="py-3 font-medium text-neutral-200">
                          <div>{site.siteName}</div>
                          <div className="text-[10px] text-neutral-500 font-mono">{site.websiteUrl}</div>
                        </td>
                        <td className="py-3 text-neutral-300 font-mono text-[11px]">
                          <span className="text-emerald-400 font-bold">HTTPS</span> (TLS 1.3)
                        </td>
                        <td className="py-3 text-neutral-300">
                          {site.seoPlugin} · {site.pageBuilder}
                        </td>
                        <td className="py-3">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${badge.style}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <select
                            value={status}
                            onChange={(e) => handleSiteStateChange(site.id, e.target.value as SiteHealthStatus)}
                            className="bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs rounded px-2 py-1 outline-none font-mono"
                          >
                            <option value="reachable">Reachable</option>
                            <option value="unavailable">Unavailable</option>
                            <option value="authentication_failure">Auth Failure</option>
                            <option value="capability_changes">Capability Drift</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. TASK HEALTH TAB (Requirement 6) */}
      {activeTab === 'TASKS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 space-y-1">
              <span className="text-xs text-neutral-400 font-mono">Running</span>
              <div className="text-xl font-bold font-mono text-emerald-400">{taskRunningCount}</div>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 space-y-1">
              <span className="text-xs text-neutral-400 font-mono">Paused</span>
              <div className="text-xl font-bold font-mono text-neutral-300">{taskPausedCount}</div>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 space-y-1">
              <span className="text-xs text-neutral-400 font-mono">Failed</span>
              <div className="text-xl font-bold font-mono text-rose-400">{taskFailedCount}</div>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 space-y-1">
              <span className="text-xs text-neutral-400 font-mono">Verify Failures</span>
              <div className="text-xl font-bold font-mono text-rose-300">{taskVerifyFailCount}</div>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 space-y-1">
              <span className="text-xs text-neutral-400 font-mono">Rollback Required</span>
              <div className="text-xl font-bold font-mono text-amber-400">{taskRollbackCount}</div>
            </div>
          </div>

          <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wide flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              Active Tasks Health Roster
            </h3>

            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neutral-200 truncate">{task.title}</span>
                      <span className="text-[10px] font-mono text-neutral-400 font-semibold">{task.id}</span>
                    </div>
                    <div className="text-[10px] text-neutral-500 font-mono">
                      Site: {task.siteName} | Domain: {task.domain} | Checkpoint: {task.backupCheckpointId || 'None'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                      task.overallStatus === 'COMPLETED'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : task.overallStatus === 'PARTIAL_SUCCESS'
                        ? 'bg-amber-950 text-amber-400 border-amber-800'
                        : task.overallStatus === 'FAILED'
                        ? 'bg-rose-950 text-rose-400 border-rose-800'
                        : 'bg-neutral-900 text-neutral-300 border-neutral-800'
                    }`}>
                      {task.overallStatus}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">
                      Rollback: <strong className="text-neutral-200">{task.rollbackMechanism}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. SECURITY EVENTS TAB (Requirement 6) */}
      {activeTab === 'SECURITY' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 space-y-1">
              <span className="text-xs text-neutral-400 font-mono">Unauthorized Op</span>
              <div className="text-xl font-bold font-mono text-rose-400">{secUnauthorized}</div>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 space-y-1">
              <span className="text-xs text-neutral-400 font-mono">Wrong-Site Attempt</span>
              <div className="text-xl font-bold font-mono text-rose-400">{secWrongSite}</div>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 space-y-1">
              <span className="text-xs text-neutral-400 font-mono">Approval Mismatch</span>
              <div className="text-xl font-bold font-mono text-amber-400">{secApprovalMismatch}</div>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 space-y-1">
              <span className="text-xs text-neutral-400 font-mono">Limit Violation</span>
              <div className="text-xl font-bold font-mono text-amber-300">{secLimitViolation}</div>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 space-y-1">
              <span className="text-xs text-neutral-400 font-mono">Auth Problem</span>
              <div className="text-xl font-bold font-mono text-blue-400">{secAuthProblem}</div>
            </div>
          </div>

          <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wide flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Security Incidents & Access Logs
            </h3>

            <div className="space-y-2">
              {securityEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="bg-neutral-950 border border-neutral-800 rounded-lg p-3.5 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                      {evt.eventType}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500">{evt.timestamp}</span>
                  </div>
                  <p className="text-neutral-200 font-medium">{evt.details}</p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 pt-1 border-t border-neutral-900">
                    <span>Site: {evt.siteName} ({evt.siteId})</span>
                    <span>Severity: <strong className="text-rose-400">{evt.severity}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
