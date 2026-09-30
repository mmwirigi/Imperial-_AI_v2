import React, { useState } from 'react';
import { 
  Activity, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Play, 
  Pause, 
  Layers, 
  ExternalLink,
  ChevronRight,
  Database,
  Search,
  Sparkles,
  Lock,
  ArrowUpRight,
  FileText,
  Sliders,
  CheckSquare,
  ShieldAlert,
  XCircle,
  FileCode,
  History,
  Eye,
  Server,
  Zap,
  Check
} from 'lucide-react';
import { 
  Site, 
  ProductionTask, 
  BackupCheckpoint, 
  BulkOperationBatch, 
  AdvancedApprovalItem, 
  ProductionMonitorMetrics,
  AgentExecutionMode,
  SecurityEventItem,
  ProductionReport
} from '../types';

interface OperationsDashboardProps {
  activeSite: Site | null;
  sites: Site[];
  tasks: ProductionTask[];
  checkpoints: BackupCheckpoint[];
  bulkBatches: BulkOperationBatch[];
  pendingApprovals: AdvancedApprovalItem[];
  securityEvents: SecurityEventItem[];
  metrics: ProductionMonitorMetrics;
  agentMode: AgentExecutionMode;
  onNavigateTab: (tab: string) => void;
  onOpenTaskDetails: (task: ProductionTask) => void;
  onOpenReportModal: (task: ProductionTask) => void;
  onLaunchNewTask: () => void;
  onLaunchBulkModal: () => void;
  onTriggerRollback: (checkpointId: string) => void;
  onOpenAgentControls: () => void;
  onOpenSiteSelector: () => void;
}

export const OperationsDashboard: React.FC<OperationsDashboardProps> = ({
  activeSite,
  sites,
  tasks,
  checkpoints,
  bulkBatches,
  pendingApprovals,
  securityEvents,
  metrics,
  agentMode,
  onNavigateTab,
  onOpenTaskDetails,
  onOpenReportModal,
  onLaunchNewTask,
  onLaunchBulkModal,
  onTriggerRollback,
  onOpenAgentControls,
  onOpenSiteSelector,
}) => {
  const [dashboardSubTab, setDashboardSubTab] = useState<'OVERVIEW' | 'SITES' | 'TASKS' | 'INVARIANTS'>('OVERVIEW');

  const activeTasks = tasks.filter((t) => t.overallStatus === 'RUNNING' || t.overallStatus === 'AWAITING_APPROVAL');
  const failedTasks = tasks.filter((t) => t.overallStatus === 'FAILED' || t.overallStatus === 'PARTIAL_SUCCESS');
  const rolledBackTasks = tasks.filter((t) => t.overallStatus === 'ROLLED_BACK');
  
  const siteScopedTasks = activeSite 
    ? tasks.filter((t) => t.siteId === activeSite.id) 
    : tasks;

  const modeBadge = {
    READ_ONLY: { label: 'READ-ONLY MODE', color: 'bg-blue-950/60 text-blue-400 border-blue-800/60' },
    PLAN: { label: 'PLAN MODE (DRY-RUN)', color: 'bg-purple-950/60 text-purple-400 border-purple-800/60' },
    EXECUTE: { label: 'EXECUTE MODE (CONTROLLED)', color: 'bg-amber-950/60 text-amber-400 border-amber-800/60' },
  }[agentMode];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Banner: Operations Command Center & Active Scope */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-neutral-100 tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-400" />
              Phase 7 Operations Command Center
            </h1>
            <span className="text-[11px] font-mono uppercase bg-neutral-900 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
              Section 3: Production Validation
            </span>
            <button
              onClick={onOpenAgentControls}
              className={`text-xs px-2.5 py-0.5 rounded-full border font-mono font-bold flex items-center gap-1.5 transition-colors hover:brightness-110 ${modeBadge.color}`}
            >
              <Sliders className="w-3 h-3" />
              {modeBadge.label}
            </button>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Autonomous task orchestration governed by Phase 5 Security and Phase 6 WordPress capability authority.
          </p>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onLaunchBulkModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-neutral-200 text-xs font-semibold rounded-lg transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            Bulk Operations
          </button>
          <button
            onClick={() => onNavigateTab('testing')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-neutral-200 text-xs font-semibold rounded-lg transition-colors"
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
            Test Suite & Invariants
          </button>
          <button
            onClick={onLaunchNewTask}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded-lg transition-colors shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            New Structured Task
          </button>
        </div>
      </div>

      {/* Strict Client Isolation Scope Card */}
      {activeSite && (
        <div className="bg-neutral-900/70 border border-amber-500/20 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-200 uppercase tracking-wide">
                  Active Site Context Lock (Client Isolation)
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">
                  TASK SCOPE BOUND
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Active Client: <strong className="text-neutral-200">{activeSite.clientCompanyName}</strong> · Target Site: <strong className="text-neutral-200">{activeSite.siteName}</strong> ({activeSite.websiteUrl}). Cross-site mutations strictly rejected.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenSiteSelector}
            className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 shrink-0 self-start sm:self-center"
          >
            Switch Client Scope
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Requirement 4: The 9 Overview KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2.5">
        {/* 1. SITES */}
        <div 
          onClick={() => setDashboardSubTab('SITES')}
          className={`border rounded-xl p-3 space-y-1 cursor-pointer transition-colors ${
            dashboardSubTab === 'SITES' ? 'bg-neutral-850 border-amber-500/60' : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between text-neutral-400 text-[10px] font-mono">
            <span>SITES</span>
            <Layers className="w-3 h-3 text-neutral-400" />
          </div>
          <div className="text-lg font-bold text-neutral-100 font-mono">
            {sites.length}
          </div>
          <p className="text-[9px] text-emerald-400 truncate">
            {sites.filter((s) => s.mcpStatus === 'CONNECTED').length} Connected
          </p>
        </div>

        {/* 2. ACTIVE TASKS */}
        <div 
          onClick={() => setDashboardSubTab('TASKS')}
          className={`border rounded-xl p-3 space-y-1 cursor-pointer transition-colors ${
            dashboardSubTab === 'TASKS' ? 'bg-neutral-850 border-amber-500/60' : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between text-neutral-400 text-[10px] font-mono">
            <span>ACTIVE TASKS</span>
            <Activity className="w-3 h-3 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-amber-400 font-mono">
            {activeTasks.length}
          </div>
          <p className="text-[9px] text-neutral-400 truncate">
            {tasks.filter((t) => t.overallStatus === 'COMPLETED').length} Complete
          </p>
        </div>

        {/* 3. PENDING APPROVALS */}
        <div 
          onClick={() => onNavigateTab('approvals')}
          className="bg-neutral-900/90 border border-neutral-800 hover:border-amber-500/40 rounded-xl p-3 space-y-1 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-neutral-400 text-[10px] font-mono">
            <span>APPROVALS</span>
            <ShieldCheck className="w-3 h-3 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-neutral-100 font-mono">
            {pendingApprovals.length}
          </div>
          <p className="text-[9px] text-amber-400 truncate">
            Phase 5 Gated
          </p>
        </div>

        {/* 4. FAILED TASKS */}
        <div 
          onClick={() => setDashboardSubTab('TASKS')}
          className="bg-neutral-900/90 border border-neutral-800 hover:border-rose-900/40 rounded-xl p-3 space-y-1 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-neutral-400 text-[10px] font-mono">
            <span>FAILED TASKS</span>
            <XCircle className="w-3 h-3 text-rose-400" />
          </div>
          <div className={`text-lg font-bold font-mono ${failedTasks.length > 0 ? 'text-rose-400' : 'text-neutral-300'}`}>
            {failedTasks.length}
          </div>
          <p className="text-[9px] text-rose-400 truncate">
            Visible Traps
          </p>
        </div>

        {/* 5. VERIFICATION FAILURES */}
        <div 
          onClick={() => onNavigateTab('monitoring')}
          className="bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 rounded-xl p-3 space-y-1 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-neutral-400 text-[10px] font-mono">
            <span>VERIFY FAIL</span>
            <AlertTriangle className="w-3 h-3 text-neutral-400" />
          </div>
          <div className="text-lg font-bold text-neutral-200 font-mono">
            {metrics.verificationsFailedCount}
          </div>
          <p className="text-[9px] text-emerald-400 truncate">
            Read-Back Trap
          </p>
        </div>

        {/* 6. RECENT CHANGES */}
        <div 
          onClick={() => setDashboardSubTab('TASKS')}
          className="bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 rounded-xl p-3 space-y-1 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-neutral-400 text-[10px] font-mono">
            <span>CHANGES</span>
            <FileText className="w-3 h-3 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-neutral-100 font-mono">
            18
          </div>
          <p className="text-[9px] text-neutral-400 truncate">
            Audit Journal
          </p>
        </div>

        {/* 7. BACKUPS */}
        <div 
          className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 space-y-1"
        >
          <div className="flex items-center justify-between text-neutral-400 text-[10px] font-mono">
            <span>BACKUPS</span>
            <Database className="w-3 h-3 text-blue-400" />
          </div>
          <div className="text-lg font-bold text-neutral-100 font-mono">
            {checkpoints.length}
          </div>
          <p className="text-[9px] text-blue-400 truncate">
            Preflight Check
          </p>
        </div>

        {/* 8. SECURITY EVENTS */}
        <div 
          onClick={() => onNavigateTab('security')}
          className="bg-neutral-900/90 border border-neutral-800 hover:border-rose-900/50 rounded-xl p-3 space-y-1 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-neutral-400 text-[10px] font-mono">
            <span>SECURITY</span>
            <ShieldAlert className="w-3 h-3 text-rose-400" />
          </div>
          <div className="text-lg font-bold text-rose-400 font-mono">
            {securityEvents.length}
          </div>
          <p className="text-[9px] text-rose-400 truncate">
            {securityEvents.filter((s) => !s.resolved).length} Unresolved
          </p>
        </div>

        {/* 9. MCP HEALTH */}
        <div 
          onClick={() => onNavigateTab('monitoring')}
          className="bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 rounded-xl p-3 space-y-1 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-neutral-400 text-[10px] font-mono">
            <span>MCP HEALTH</span>
            <Server className="w-3 h-3 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-emerald-400 font-mono">
            {metrics.mcpLatencyMs}ms
          </div>
          <p className="text-[9px] text-neutral-400 truncate">
            {metrics.mcpUptimePercent}% Uptime
          </p>
        </div>
      </div>

      {/* Sub-Tabs: Overview vs Site Cards vs Task Cards */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
        <button
          onClick={() => setDashboardSubTab('OVERVIEW')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            dashboardSubTab === 'OVERVIEW'
              ? 'bg-neutral-800 text-amber-400 border border-neutral-700'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Execution Overview
        </button>
        <button
          onClick={() => setDashboardSubTab('SITES')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            dashboardSubTab === 'SITES'
              ? 'bg-neutral-800 text-amber-400 border border-neutral-700'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Site Fleet Cards ({sites.length})
        </button>
        <button
          onClick={() => setDashboardSubTab('TASKS')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            dashboardSubTab === 'TASKS'
              ? 'bg-neutral-800 text-amber-400 border border-neutral-700'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Task Cards & Progress ({tasks.length})
        </button>
      </div>

      {/* VIEW: SITES FLEET CARDS (Requirement 4: Site Card) */}
      {dashboardSubTab === 'SITES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-100 uppercase tracking-wider">
              Connected Client WordPress Fleet ({sites.length} Sites)
            </h2>
            <button
              onClick={() => onNavigateTab('sites')}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
            >
              Manage Fleet &amp; MCP Credentials
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sites.map((site) => {
              const siteTasks = tasks.filter((t) => t.siteId === site.id);
              const activeCount = siteTasks.filter((t) => t.overallStatus === 'RUNNING' || t.overallStatus === 'AWAITING_APPROVAL').length;
              
              return (
                <div
                  key={site.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3 shadow-md"
                >
                  {/* Top Bar: Site Name & Client */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                        {site.siteName}
                        {site.id === activeSite?.id && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            ACTIVE SCOPE
                          </span>
                        )}
                      </h3>
                      <div className="text-xs text-neutral-400 font-medium">
                        Client: <strong className="text-neutral-200">{site.clientCompanyName}</strong>
                      </div>
                      <a
                        href={site.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-neutral-500 hover:text-amber-400 font-mono flex items-center gap-1 mt-0.5"
                      >
                        {site.websiteUrl}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded border uppercase bg-neutral-950 border-neutral-800 text-neutral-300">
                        {site.wordPressType}
                      </span>
                    </div>
                  </div>

                  {/* Status Pillars: Connection, WordPress, MCP, Capability */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono pt-2 border-t border-neutral-800">
                    {/* Connection Status */}
                    <div className="bg-neutral-950 p-2 rounded-lg border border-neutral-850">
                      <span className="text-[9px] text-neutral-500 block">CONNECTION</span>
                      <span className={`font-semibold ${site.mcpStatus === 'CONNECTED' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {site.mcpStatus === 'CONNECTED' ? 'REACHABLE' : 'UNREACHABLE'}
                      </span>
                    </div>

                    {/* WordPress Status */}
                    <div className="bg-neutral-950 p-2 rounded-lg border border-neutral-850">
                      <span className="text-[9px] text-neutral-500 block">WORDPRESS</span>
                      <span className="font-semibold text-neutral-200">
                        WP 6.7.1 REST
                      </span>
                    </div>

                    {/* MCP Status */}
                    <div className="bg-neutral-950 p-2 rounded-lg border border-neutral-850">
                      <span className="text-[9px] text-neutral-500 block">MCP STATUS</span>
                      <span className={`font-semibold ${site.mcpStatus === 'CONNECTED' ? 'text-emerald-400' : 'text-neutral-400'}`}>
                        {site.mcpStatus}
                      </span>
                    </div>

                    {/* Capability Status */}
                    <div className="bg-neutral-950 p-2 rounded-lg border border-neutral-850">
                      <span className="text-[9px] text-neutral-500 block">CAPABILITIES</span>
                      <span className="font-semibold text-amber-400 truncate block">
                        {site.seoPlugin} / {site.pageBuilder}
                      </span>
                    </div>
                  </div>

                  {/* Last Audit & Active Tasks */}
                  <div className="flex items-center justify-between text-xs pt-1 text-neutral-400">
                    <div>
                      <span>Last Audit: </span>
                      <span className="text-neutral-300 font-mono">{site.lastActivity}</span>
                    </div>
                    <div>
                      <span>Active Tasks: </span>
                      <strong className="text-amber-400 font-mono">{activeCount}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: TASK CARDS & PROGRESS (Requirement 4 & 5: Task Card & Progress) */}
      {(dashboardSubTab === 'TASKS' || dashboardSubTab === 'OVERVIEW') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-100 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Production Task Cards &amp; Operations Progress ({siteScopedTasks.length})
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-neutral-400">
                Click any task to inspect read-back verification or export report.
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {siteScopedTasks.map((task) => {
              const currentStep = task.steps[task.currentStepIndex] || task.steps[task.steps.length - 1];
              const completedCount = task.steps.filter((s) => s.state === 'COMPLETED').length;
              const failedCount = task.steps.filter((s) => s.state === 'FAILED').length;
              const pendingCount = task.steps.filter((s) => s.state === 'PENDING' || s.state === 'AWAITING_APPROVAL' || s.state === 'EXECUTING').length;
              const totalOps = task.steps.length;

              const statusColor = {
                RUNNING: 'text-amber-400 bg-amber-950/40 border-amber-800/60',
                AWAITING_APPROVAL: 'text-rose-400 bg-rose-950/40 border-rose-800/60',
                COMPLETED: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60',
                QUEUED: 'text-blue-400 bg-blue-950/40 border-blue-800/60',
                PAUSED: 'text-neutral-400 bg-neutral-900 border-neutral-700',
                PARTIAL_SUCCESS: 'text-amber-300 bg-amber-950/60 border-amber-800',
                FAILED: 'text-rose-500 bg-rose-950/60 border-rose-800',
                ROLLED_BACK: 'text-purple-400 bg-purple-950/40 border-purple-800/60',
              }[task.overallStatus];

              return (
                <div
                  key={task.id}
                  className="bg-neutral-900/90 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl p-4 transition-all space-y-3 shadow-md"
                >
                  {/* Task Header: Task ID, Site, Risk, Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-neutral-300 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                          {task.id}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${statusColor}`}>
                          {task.overallStatus.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-amber-300 border border-neutral-700">
                          RISK: {task.riskLevel}
                        </span>
                        <span className="text-xs text-neutral-400">
                          Site: <strong className="text-neutral-200">{task.siteName}</strong>
                        </span>
                      </div>
                      <h3 
                        onClick={() => onOpenTaskDetails(task)}
                        className="text-sm font-semibold text-neutral-100 hover:text-amber-400 cursor-pointer pt-1"
                      >
                        {task.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                      <button
                        onClick={() => onOpenReportModal(task)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        Production Report
                      </button>
                      <button
                        onClick={() => onOpenTaskDetails(task)}
                        className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Requirement 5: Task Progress Breakdown */}
                  <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-850 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-neutral-300 font-semibold">
                        Progress: {completedCount + failedCount} / {totalOps} operations complete
                      </span>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="text-emerald-400 font-bold">{completedCount} successful</span>
                        <span className={failedCount > 0 ? 'text-rose-400 font-bold' : 'text-neutral-500'}>
                          {failedCount} failed
                        </span>
                        <span className="text-neutral-400">{pendingCount} pending</span>
                      </div>
                    </div>

                    {/* Multi-segment Progress Bar */}
                    <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${(completedCount / totalOps) * 100}%` }}
                        title={`${completedCount} successful`}
                      />
                      <div 
                        className="bg-rose-500 h-full transition-all duration-300"
                        style={{ width: `${(failedCount / totalOps) * 100}%` }}
                        title={`${failedCount} failed`}
                      />
                    </div>
                  </div>

                  {/* Requirement 4: Exact Task Card Attributes */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono pt-1 text-neutral-400">
                    <div>
                      <span className="text-[10px] text-neutral-500 block">APPROVAL</span>
                      <span className="text-neutral-200">
                        {task.steps.some((s) => s.requiresApproval) ? 'Phase 5 Gated' : 'Pre-cleared'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 block">BACKUP</span>
                      <span className="text-blue-400">
                        {task.backupStatus} ({task.backupCheckpointId || 'None'})
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 block">EXECUTION</span>
                      <span className="text-neutral-200">
                        Step {task.currentStepIndex + 1} of {task.steps.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 block">VERIFICATION</span>
                      <span className={failedCount > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                        {failedCount > 0 ? 'Anomaly Caught' : 'Read-Back Valid'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
