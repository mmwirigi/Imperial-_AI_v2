import React from 'react';
import { 
  Layers, 
  CheckSquare, 
  Search, 
  Plus, 
  MessageSquare, 
  Server, 
  Cpu, 
  Activity, 
  ShieldCheck, 
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { AuditEvent, Site, Task } from '../types';

interface HomeScreenProps {
  sites: Site[];
  tasks: Task[];
  auditEvents: AuditEvent[];
  currentAiModelName: string;
  isOpenRouterConnected?: boolean;
  onNavigateToTab: (tab: string) => void;
  onTriggerQuickAudit: () => void;
  onResetDemoData?: () => void;
  onClearAllSitesForEmptyState?: () => void;
  onOpenModelCenter?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  sites,
  tasks,
  auditEvents,
  currentAiModelName,
  isOpenRouterConnected = false,
  onNavigateToTab,
  onTriggerQuickAudit,
  onResetDemoData,
  onClearAllSitesForEmptyState,
  onOpenModelCenter,
}) => {
  const connectedSitesCount = sites.filter((s) => s.mcpStatus === 'CONNECTED').length;
  const activeTasksCount = tasks.filter(
    (t) => t.status === 'RUNNING' || t.status === 'AWAITING_APPROVAL'
  ).length;

  if (sites.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-xl p-8 space-y-4">
          <div className="w-14 h-14 bg-neutral-800 border border-neutral-700 rounded-full flex items-center justify-center mx-auto text-neutral-400">
            <Layers className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-neutral-100">No Sites Configured</h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              No WordPress client sites are registered in this instance. Add your first site or load the demo client foundation.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
            {onResetDemoData && (
              <button
                onClick={onResetDemoData}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded-lg transition-colors shadow"
              >
                Load Demo Sites (Phase 1)
              </button>
            )}
            <button
              onClick={() => onNavigateToTab('sites')}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition-colors border border-neutral-700"
            >
              Configure Site Manually
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto w-full">
      {/* Top Banner with Agency Mission */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-neutral-100 uppercase tracking-wider font-mono">
              Operations Command Center
            </h1>
            <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-mono">
              Imperial Enterprise Kenya
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            WordPress client fleet telemetry, task pipeline, and AI orchestration foundation
          </p>
        </div>

        {/* Empty state test toggle helper */}
        <div className="flex items-center gap-2">
          {onClearAllSitesForEmptyState && (
            <button
              onClick={onClearAllSitesForEmptyState}
              className="text-[10px] font-mono text-neutral-500 hover:text-neutral-300 underline"
              title="Test empty dashboard view"
            >
              Simulate Empty Fleet
            </button>
          )}
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-mono uppercase tracking-wider">Connected Sites</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-neutral-100">
              {connectedSitesCount}
            </span>
            <span className="text-xs text-neutral-500 font-mono">/ {sites.length} Active</span>
          </div>
          <p className="text-[10px] text-neutral-400">
            {connectedSitesCount === sites.length ? '100% online' : `${sites.length - connectedSitesCount} disconnected`}
          </p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-mono uppercase tracking-wider">Active Tasks</span>
            <CheckSquare className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-neutral-100">
              {activeTasksCount}
            </span>
            <span className="text-xs text-neutral-500 font-mono">Running / Awaiting</span>
          </div>
          <p className="text-[10px] text-neutral-400">
            {tasks.filter((t) => t.status === 'AWAITING_APPROVAL').length} awaiting approval
          </p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-mono uppercase tracking-wider">AI Provider & Model</span>
            <Cpu className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-neutral-300">OpenRouter</span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                isOpenRouterConnected
                  ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/60'
                  : 'bg-amber-950/50 text-amber-400 border-amber-800/60'
              }`}
            >
              {isOpenRouterConnected ? 'Connected' : 'Not Connected'}
            </span>
          </div>

          {isOpenRouterConnected ? (
            <div className="pt-1 flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-100 truncate max-w-[140px]" title={currentAiModelName}>
                {currentAiModelName}
              </span>
              {onOpenModelCenter && (
                <button
                  onClick={onOpenModelCenter}
                  className="text-[10px] font-mono text-amber-400 hover:text-amber-300 underline cursor-pointer"
                >
                  Change
                </button>
              )}
            </div>
          ) : (
            <div className="pt-1 flex items-center justify-between">
              <span className="text-[11px] text-neutral-400">OpenRouter not configured</span>
              <button
                onClick={() => onNavigateToTab('settings')}
                className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-[10px] font-mono font-bold rounded cursor-pointer transition-colors"
              >
                CONFIGURE
              </button>
            </div>
          )}
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-mono uppercase tracking-wider">MCP Protocol</span>
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400 font-mono">
              SSE Stream Ready
            </span>
          </div>
          <p className="text-[10px] text-neutral-400">Strict client isolation</p>
        </div>
      </div>

      {/* Quick Actions (Mandatory: AUDIT SITE, NEW TASK, OPEN CHAT, MANAGE SITES) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
            Quick Actions
          </span>
          <span className="text-[11px] text-neutral-400">Single-click operational triggers</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={onTriggerQuickAudit}
            className="flex items-center gap-3 p-3.5 bg-neutral-900 hover:bg-neutral-800/90 border border-neutral-800 hover:border-amber-500/40 rounded-xl text-left transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-neutral-100 uppercase tracking-tight">
                Audit Site
              </div>
              <div className="text-[10px] text-neutral-400">SEO & Core Vitals</div>
            </div>
          </button>

          <button
            onClick={() => onNavigateToTab('tasks')}
            className="flex items-center gap-3 p-3.5 bg-neutral-900 hover:bg-neutral-800/90 border border-neutral-800 hover:border-amber-500/40 rounded-xl text-left transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-neutral-100 uppercase tracking-tight">
                New Task
              </div>
              <div className="text-[10px] text-neutral-400">Queue operation</div>
            </div>
          </button>

          <button
            onClick={() => onNavigateToTab('chat')}
            className="flex items-center gap-3 p-3.5 bg-neutral-900 hover:bg-neutral-800/90 border border-neutral-800 hover:border-amber-500/40 rounded-xl text-left transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-neutral-100 uppercase tracking-tight">
                Open Chat
              </div>
              <div className="text-[10px] text-neutral-400">Target active site</div>
            </div>
          </button>

          <button
            onClick={() => onNavigateToTab('sites')}
            className="flex items-center gap-3 p-3.5 bg-neutral-900 hover:bg-neutral-800/90 border border-neutral-800 hover:border-amber-500/40 rounded-xl text-left transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-neutral-100 uppercase tracking-tight">
                Manage Sites
              </div>
              <div className="text-[10px] text-neutral-400">Fleet credentials</div>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity / Audit Log Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
              Recent Activity & Security Audit Trail
            </span>
          </div>
          <span className="text-[10px] font-mono text-neutral-500">
            Non-secret logs verified
          </span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl divide-y divide-neutral-800 overflow-hidden">
          {auditEvents.slice(0, 5).map((event) => (
            <div key={event.id} className="p-3.5 hover:bg-neutral-850/50 transition-colors flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-100">{event.siteName}</span>
                  <span className="text-[10px] font-mono text-amber-400/80">·</span>
                  <span className="text-[10px] font-mono text-neutral-400">{event.tool}</span>
                </div>
                <p className="text-xs text-neutral-300">{event.resultSummary}</p>
                <div className="text-[10px] font-mono text-neutral-500">
                  Params: {event.parametersSummary}
                </div>
              </div>
              <div className="text-right shrink-0 space-y-1">
                <span className="text-[10px] font-mono text-neutral-500 block">
                  {event.timestamp}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-300 inline-block">
                  {event.approvalStatus}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
