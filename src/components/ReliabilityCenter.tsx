/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Phase 8: Production Reliability, Recovery & Self-Healing Center
 * Android-First Operations Dashboard for:
 * - Durable task reconciliation & cold-start scanning
 * - Dead-Letter Queue (DLQ) inspection & operator replay
 * - Distributed resource & site-level concurrency locks
 * - Remote MCP 7-state machine & auto-reconnect engine
 * - Read-only site health audits
 * - Recovery checkpoints & idempotent execution guards
 * - Inviolable security boundaries (Never Self-Heal Security)
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  RotateCcw, 
  AlertTriangle, 
  Lock, 
  Unlock, 
  Terminal, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Database, 
  Layers, 
  Server, 
  Activity, 
  Zap, 
  Sliders, 
  FileText, 
  ArrowRight, 
  Search, 
  ChevronRight, 
  AlertOctagon, 
  Flame, 
  ShieldAlert, 
  HelpCircle,
  Play,
  Pause,
  Key,
  Eye
} from 'lucide-react';
import { 
  ReconciledTaskRecord, 
  DeadLetterItem, 
  ResourceLock, 
  McpConnectionHealth, 
  SiteHealthReport, 
  TaskRecoveryCheckpoint, 
  Site, 
  ProductionTask,
  DeadLetterStatus
} from '../types';

interface ReliabilityCenterProps {
  reconciledTasks: ReconciledTaskRecord[];
  deadLetterItems: DeadLetterItem[];
  resourceLocks: ResourceLock[];
  mcpHealthList: McpConnectionHealth[];
  siteHealthReports: SiteHealthReport[];
  recoveryCheckpoints: TaskRecoveryCheckpoint[];
  productionTasks: ProductionTask[];
  sites: Site[];
  activeSite: Site | null;
  onTriggerReconciliationScan: () => void;
  onReplayDeadLetterItem: (itemId: string) => void;
  onDiscardDeadLetterItem: (itemId: string) => void;
  onEscalateDeadLetterItem: (itemId: string) => void;
  onReleaseLock: (resourceKey: string) => void;
  onSimulateLockConflict: (resourceKey: string) => void;
  onSimulateMcpDisconnect: (serverId: string) => void;
  onSimulateMcpReconnect: (serverId: string, simulateSchemaChange?: boolean) => void;
  onSimulateTokenExpired: (serverId: string) => void;
  onResumeReconciledTask: (taskId: string) => void;
}

export const ReliabilityCenter: React.FC<ReliabilityCenterProps> = ({
  reconciledTasks,
  deadLetterItems,
  resourceLocks,
  mcpHealthList,
  siteHealthReports,
  recoveryCheckpoints,
  productionTasks,
  sites,
  activeSite,
  onTriggerReconciliationScan,
  onReplayDeadLetterItem,
  onDiscardDeadLetterItem,
  onEscalateDeadLetterItem,
  onReleaseLock,
  onSimulateLockConflict,
  onSimulateMcpDisconnect,
  onSimulateMcpReconnect,
  onSimulateTokenExpired,
  onResumeReconciledTask,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'RECONCILIATION' | 'DLQ' | 'LOCKS' | 'MCP_HEALTH' | 'SITE_HEALTH' | 'CHECKPOINTS' | 'RETRY_TESTER'
  >('RECONCILIATION');

  const [selectedDlqItem, setSelectedDlqItem] = useState<DeadLetterItem | null>(deadLetterItems[0] || null);
  const [testErrorInput, setTestErrorInput] = useState('Connection closed abruptly by host (502 Bad Gateway)');
  const [reconcilingNow, setReconcilingNow] = useState(false);

  const pendingDlqCount = deadLetterItems.filter((i) => i.status === 'PENDING_REVIEW').length;
  const activeLockCount = resourceLocks.filter((l) => l.status === 'ACQUIRED').length;
  const degradedMcpCount = mcpHealthList.filter((m) => m.state !== 'CONNECTED').length;

  const handleRunScan = () => {
    setReconcilingNow(true);
    setTimeout(() => {
      onTriggerReconciliationScan();
      setReconcilingNow(false);
    }, 600);
  };

  // Helper for test error classification
  const classifyTestError = (text: string) => {
    const t = text.toLowerCase();
    if (t.includes('permission') || t.includes('unauthorized') || t.includes('security') || t.includes('wrong site')) {
      return { type: 'SECURITY_BLOCK', color: 'text-rose-400 bg-rose-950/60 border-rose-800/40', retryable: false, action: 'Never Retry - Immediate Security Halt' };
    }
    if (t.includes('schema') || t.includes('invalid argument') || t.includes('not supported')) {
      return { type: 'NON_RETRYABLE', color: 'text-amber-400 bg-amber-950/60 border-amber-800/40', retryable: false, action: 'Do Not Retry - Requires Re-Planning' };
    }
    if (t.includes('mismatch') || t.includes('verification') || t.includes('unknown')) {
      return { type: 'VERIFICATION_REQUIRED', color: 'text-blue-400 bg-blue-950/60 border-blue-800/40', retryable: false, action: 'Read-Back Live WordPress State First' };
    }
    return { type: 'RETRYABLE', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40', retryable: true, action: 'Exponential Backoff (1s -> 2s -> 4s with Jitter)' };
  };

  const testClassification = classifyTestError(testErrorInput);

  return (
    <div className="p-3 sm:p-5 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-100 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
              Phase 8 Reliability &amp; Self-Healing Center
            </h1>
            <span className="text-[10px] sm:text-[11px] font-mono uppercase bg-neutral-900 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-semibold">
              Resilience Authority
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Task durability, crash reconciliation, Dead-Letter Queue (DLQ), resource locking, 7-state MCP reconnect, and non-mutating site health.
          </p>
        </div>

        {/* Global Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunScan}
            disabled={reconcilingNow}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 text-xs font-bold rounded-lg transition-all shadow-sm active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reconcilingNow ? 'animate-spin' : ''}`} />
            {reconcilingNow ? 'Reconciling Tasks...' : 'Scan Interrupted Tasks'}
          </button>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-neutral-900/80 border border-neutral-800 p-3 sm:p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Reconciliation Engine</span>
            <RotateCcw className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-neutral-100">
              {reconciledTasks.filter((r) => r.reconciledStatus === 'SAFE_TO_RESUME' || r.reconciledStatus === 'SUCCESS').length}
            </span>
            <span className="text-[11px] text-emerald-400">Durable &amp; Verified</span>
          </div>
          <p className="text-[10px] text-neutral-500 mt-1">Idempotent read-backs</p>
        </div>

        <div className="bg-neutral-900/80 border border-neutral-800 p-3 sm:p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Dead-Letter Queue</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-rose-400">{pendingDlqCount}</span>
            <span className="text-[11px] text-neutral-400">Needs Operator Review</span>
          </div>
          <p className="text-[10px] text-neutral-500 mt-1">Bounded retry exhausts</p>
        </div>

        <div className="bg-neutral-900/80 border border-neutral-800 p-3 sm:p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Resource Locks</span>
            <Lock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-neutral-100">{activeLockCount}</span>
            <span className="text-[11px] text-cyan-400">Active TTL</span>
          </div>
          <p className="text-[10px] text-neutral-500 mt-1">Site &amp; Resource Gate</p>
        </div>

        <div className="bg-neutral-900/80 border border-neutral-800 p-3 sm:p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[11px] uppercase tracking-wider font-semibold">MCP Connection</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-emerald-400">
              {mcpHealthList.filter((m) => m.state === 'CONNECTED').length}/{mcpHealthList.length}
            </span>
            <span className="text-[11px] text-neutral-400">7-State Watchdog</span>
          </div>
          <p className="text-[10px] text-neutral-500 mt-1">Automatic Revalidation</p>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-1.5 border-b border-neutral-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('RECONCILIATION')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeSubTab === 'RECONCILIATION'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Task Reconciliation ({reconciledTasks.length})
        </button>

        <button
          onClick={() => setActiveSubTab('DLQ')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeSubTab === 'DLQ'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-rose-400" />
          Dead-Letter Queue ({deadLetterItems.length})
          {pendingDlqCount > 0 && (
            <span className="bg-rose-500 text-neutral-950 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {pendingDlqCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('LOCKS')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeSubTab === 'LOCKS'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-cyan-400" />
          Resource &amp; Site Locks ({resourceLocks.length})
        </button>

        <button
          onClick={() => setActiveSubTab('MCP_HEALTH')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeSubTab === 'MCP_HEALTH'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
          }`}
        >
          <Server className="w-3.5 h-3.5 text-emerald-400" />
          MCP Connection Resilience
        </button>

        <button
          onClick={() => setActiveSubTab('SITE_HEALTH')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeSubTab === 'SITE_HEALTH'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-blue-400" />
          Site Health (Read-Only)
        </button>

        <button
          onClick={() => setActiveSubTab('CHECKPOINTS')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeSubTab === 'CHECKPOINTS'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-purple-400" />
          Recovery Checkpoints ({recoveryCheckpoints.length})
        </button>

        <button
          onClick={() => setActiveSubTab('RETRY_TESTER')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeSubTab === 'RETRY_TESTER'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-yellow-400" />
          Retry Policy &amp; Security Guard
        </button>
      </div>

      {/* SUB-TAB 1: TASK RECONCILIATION */}
      {activeSubTab === 'RECONCILIATION' && (
        <div className="space-y-4">
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  Interrupted Task Reconciliation
                </h3>
                <p className="text-xs text-neutral-400">
                  When Imperial AI boots or reconnects, it scans interrupted tasks, queries actual WordPress live state, and prevents blind mutation repetition.
                </p>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                Durable Local Storage Sync Active
              </span>
            </div>

            <div className="space-y-3">
              {reconciledTasks.map((rec) => {
                const isSafe = rec.reconciledStatus === 'SAFE_TO_RESUME' || rec.reconciledStatus === 'SUCCESS';
                return (
                  <div
                    key={rec.taskId}
                    className="p-3.5 bg-neutral-950/60 border border-neutral-800/80 rounded-lg space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          rec.reconciledStatus === 'SAFE_TO_RESUME'
                            ? 'text-emerald-300 bg-emerald-950/60 border-emerald-800/40'
                            : rec.reconciledStatus === 'SUCCESS'
                            ? 'text-cyan-300 bg-cyan-950/60 border-cyan-800/40'
                            : 'text-amber-300 bg-amber-950/60 border-amber-800/40'
                        }`}>
                          {rec.reconciledStatus}
                        </span>
                        <h4 className="text-xs sm:text-sm font-semibold text-neutral-200">
                          {rec.taskTitle}
                        </h4>
                        <span className="text-[10px] text-neutral-500 font-mono">({rec.taskId})</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                        <span>Site: <strong className="text-neutral-300">{rec.siteName}</strong></span>
                        <span>•</span>
                        <span>{rec.timestamp}</span>
                      </div>
                    </div>

                    {/* Diff & Live State */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs bg-neutral-900/50 p-2.5 rounded border border-neutral-800">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">Live WordPress State (Read-Back)</span>
                        <p className="font-mono text-emerald-400 text-[11px] break-words">
                          {rec.actualWordPressState}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">Expected Mutation Target</span>
                        <p className="font-mono text-neutral-300 text-[11px] break-words">
                          {rec.expectedWordPressState}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-neutral-800/60">
                      <p className="text-xs text-neutral-400 italic">
                        <strong>Action Taken:</strong> {rec.actionTaken}
                      </p>

                      {rec.canSafelyResume && (
                        <button
                          onClick={() => onResumeReconciledTask(rec.taskId)}
                          className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-neutral-950 text-xs font-bold rounded transition-colors self-start sm:self-auto shrink-0"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          Resume Task Safely
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: DEAD-LETTER QUEUE (DLQ) */}
      {activeSubTab === 'DLQ' && (
        <div className="space-y-4">
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-400" />
                  Dead-Letter Queue (DLQ)
                </h3>
                <p className="text-xs text-neutral-400">
                  Operations that repeatedly fail, exceed retry limits, or encounter unexpected verification mismatches enter this queue. Never silently discarded.
                </p>
              </div>
              <span className="text-[11px] font-mono text-rose-400 bg-rose-950/60 border border-rose-800/40 px-2 py-0.5 rounded">
                Bounded Retries Enforced
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* List of DLQ items */}
              <div className="lg:col-span-1 space-y-2">
                {deadLetterItems.map((item) => {
                  const isSelected = selectedDlqItem?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedDlqItem(item)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-neutral-800/90 border-rose-500/60 shadow-sm'
                          : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                          item.status === 'PENDING_REVIEW'
                            ? 'text-rose-400 bg-rose-950/50 border-rose-800/40'
                            : item.status === 'REPLAYED'
                            ? 'text-emerald-400 bg-emerald-950/50 border-emerald-800/40'
                            : item.status === 'ESCALATED'
                            ? 'text-amber-400 bg-amber-950/50 border-amber-800/40'
                            : 'text-neutral-400 bg-neutral-900 border-neutral-700'
                        }`}>
                          {item.status}
                        </span>
                        <span className="text-[10px] text-neutral-500">{item.timestamps.enteredQueue}</span>
                      </div>
                      <h4 className="text-xs font-semibold text-neutral-200 line-clamp-1">{item.operationTitle}</h4>
                      <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">{item.siteName}</p>
                      <div className="flex items-center justify-between text-[10px] text-neutral-500 mt-2 pt-1 border-t border-neutral-800/60">
                        <span>Retries: {item.retryCount}/3</span>
                        <span className="font-mono text-rose-400/90">{item.failureCategory}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DLQ Item Details Panel */}
              <div className="lg:col-span-2 bg-neutral-950/80 border border-neutral-800 rounded-lg p-4 space-y-4">
                {selectedDlqItem ? (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono bg-rose-950 text-rose-400 px-2 py-0.5 rounded border border-rose-800/40 font-bold">
                            {selectedDlqItem.failureCategory}
                          </span>
                          <span className="text-xs text-neutral-400 font-mono">{selectedDlqItem.id}</span>
                        </div>
                        <h3 className="text-sm font-bold text-neutral-100 mt-1">
                          {selectedDlqItem.operationTitle}
                        </h3>
                        <p className="text-xs text-neutral-400">
                          Task: <span className="text-neutral-200">{selectedDlqItem.taskTitle}</span> ({selectedDlqItem.siteName})
                        </p>
                      </div>

                      {/* Operator Action Buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => onReplayDeadLetterItem(selectedDlqItem.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-neutral-950 text-xs font-bold rounded transition-colors shadow-sm"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Replay Operation
                        </button>
                        <button
                          onClick={() => onEscalateDeadLetterItem(selectedDlqItem.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-neutral-950 text-xs font-bold rounded transition-colors shadow-sm"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Escalate to Security
                        </button>
                        <button
                          onClick={() => onDiscardDeadLetterItem(selectedDlqItem.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Discard
                        </button>
                      </div>
                    </div>

                    {/* Failure Reason & Recommendation */}
                    <div className="space-y-2">
                      <div className="p-3 bg-rose-950/30 border border-rose-800/30 rounded-lg">
                        <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block mb-0.5">Failure Reason</span>
                        <p className="text-xs text-rose-200">{selectedDlqItem.failureReason}</p>
                      </div>

                      <div className="p-3 bg-amber-950/30 border border-amber-800/30 rounded-lg">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-0.5">Operator Recovery Recommendation</span>
                        <p className="text-xs text-amber-200">{selectedDlqItem.recoveryRecommendation}</p>
                      </div>
                    </div>

                    {/* Last Known State */}
                    <div className="bg-neutral-900/60 p-3 rounded-lg border border-neutral-800 space-y-2">
                      <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider block">
                        Last Known State Snapshot
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="p-2 bg-neutral-950 rounded border border-neutral-800/80">
                          <span className="text-[10px] text-neutral-500 block">Pre-State:</span>
                          <span className="font-mono text-neutral-300 text-[11px] break-words">{selectedDlqItem.lastKnownState.preState || '[EMPTY]'}</span>
                        </div>
                        <div className="p-2 bg-neutral-950 rounded border border-neutral-800/80">
                          <span className="text-[10px] text-neutral-500 block">Attempted Payload:</span>
                          <span className="font-mono text-amber-300 text-[11px] break-words">{selectedDlqItem.lastKnownState.attemptedPayload || '[EMPTY]'}</span>
                        </div>
                      </div>
                      <div className="p-2 bg-neutral-950 rounded border border-neutral-800/80 text-xs">
                        <span className="text-[10px] text-neutral-500 block">Actual Live State:</span>
                        <span className="font-mono text-emerald-300 text-[11px] break-words">{selectedDlqItem.lastKnownState.actualLiveState || 'Unchanged / Preserved'}</span>
                      </div>
                    </div>

                    {/* Retry History */}
                    <div>
                      <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider block mb-2">
                        Retry History ({selectedDlqItem.retryHistory.length} attempts)
                      </span>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {selectedDlqItem.retryHistory.map((h, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-neutral-900/40 rounded border border-neutral-800 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded">
                                Attempt #{h.attemptNumber}
                              </span>
                              <span className="text-neutral-400">{h.errorMessage}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 text-[10px] text-neutral-500">
                              <span>Delay: {h.delayMs}ms</span>
                              <span>{h.timestamp}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-center text-neutral-500 text-xs">
                    Select a dead-letter operation from the list to inspect details and recovery actions.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: RESOURCE & SITE LOCKS */}
      {activeSubTab === 'LOCKS' && (
        <div className="space-y-4">
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  Distributed &amp; Resource Locking Engine
                </h3>
                <p className="text-xs text-neutral-400">
                  Prevents two workers or tasks from simultaneously modifying the same site or resource. Independent sites run concurrently; same-site mutations serialize.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSimulateLockConflict('resource:page:412:booking-calendar')}
                  className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 text-xs font-semibold rounded border border-neutral-700 transition-colors"
                >
                  Simulate Conflicting Mutation
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {resourceLocks.map((lock) => (
                <div
                  key={lock.id}
                  className="p-3.5 bg-neutral-950/70 border border-neutral-800 rounded-lg space-y-2.5 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800/40 font-bold">
                      {lock.targetType} LOCK
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                      {lock.status}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-neutral-500 font-mono block">RESOURCE KEY</span>
                    <h4 className="text-xs font-mono font-bold text-neutral-200 break-all">{lock.resourceKey}</h4>
                  </div>

                  <div className="text-xs text-neutral-400 space-y-1 pt-1 border-t border-neutral-800/60">
                    <div>Site: <strong className="text-neutral-300">{lock.siteName}</strong></div>
                    <div>Holding Task: <span className="text-neutral-300">{lock.taskTitle}</span></div>
                    <div className="text-[11px] text-neutral-500 font-mono">Owner Token: {lock.ownerToken}</div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1 border-t border-neutral-800/60">
                    <span>Expires: {lock.expiresAt}</span>
                    <button
                      onClick={() => onReleaseLock(lock.resourceKey)}
                      className="text-xs text-rose-400 hover:text-rose-300 underline font-semibold"
                    >
                      Release Lock
                    </button>
                  </div>

                  {lock.waitingTasks.length > 0 && (
                    <div className="p-1.5 bg-amber-950/40 border border-amber-800/40 rounded text-[10px] text-amber-300">
                      Waiting in queue: {lock.waitingTasks.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Site-Level Concurrency Rule Card */}
            <div className="mt-4 p-3 bg-neutral-950/60 border border-neutral-800 rounded-lg flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="text-xs">
                  <strong className="text-neutral-200 block">Site-Level Concurrency Policy</strong>
                  <span className="text-neutral-400">
                    Site A Task &amp; Site B Task may execute concurrently. Site A Task 1 &amp; Site A Task 2 serialize via mutation gate (maxConcurrency = 1).
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-1 rounded shrink-0">
                Cross-Site Isolated
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: MCP CONNECTION RESILIENCE */}
      {activeSubTab === 'MCP_HEALTH' && (
        <div className="space-y-4">
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-400" />
                  Remote MCP 7-State Connection Engine
                </h3>
                <p className="text-xs text-neutral-400">
                  DISCONNECTED • CONNECTING • CONNECTED • DEGRADED • AUTHENTICATION_REQUIRED • RECONNECTING • FAILED
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => onSimulateMcpDisconnect('mcp-server-1')}
                  className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-rose-300 text-xs font-semibold rounded border border-neutral-700 transition-colors"
                >
                  Simulate Disconnect
                </button>
                <button
                  onClick={() => onSimulateMcpReconnect('mcp-server-1', false)}
                  className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-emerald-300 text-xs font-semibold rounded border border-neutral-700 transition-colors"
                >
                  Simulate Auto-Reconnect
                </button>
                <button
                  onClick={() => onSimulateMcpReconnect('mcp-server-1', true)}
                  className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-300 text-xs font-semibold rounded border border-neutral-700 transition-colors"
                >
                  Simulate Schema Drift
                </button>
                <button
                  onClick={() => onSimulateTokenExpired('mcp-server-1')}
                  className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-yellow-300 text-xs font-semibold rounded border border-neutral-700 transition-colors"
                >
                  Simulate Token Expiry
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {mcpHealthList.map((mcp) => {
                const isHealthy = mcp.state === 'CONNECTED';
                const isDegraded = mcp.state === 'DEGRADED';
                const isAuthReq = mcp.state === 'AUTHENTICATION_REQUIRED';
                return (
                  <div
                    key={mcp.serverId}
                    className="p-4 bg-neutral-950/70 border border-neutral-800 rounded-lg space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          isHealthy
                            ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40'
                            : isDegraded
                            ? 'text-amber-400 bg-amber-950/60 border-amber-800/40'
                            : isAuthReq
                            ? 'text-yellow-400 bg-yellow-950/60 border-yellow-800/40'
                            : 'text-rose-400 bg-rose-950/60 border-rose-800/40'
                        }`}>
                          {mcp.state}
                        </span>
                        <h4 className="text-sm font-bold text-neutral-100">{mcp.serverName}</h4>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-neutral-400">
                        <span>Latency: <strong className="text-neutral-200">{mcp.responseTimeMs}ms</strong></span>
                        <span>•</span>
                        <span>Tools: <strong className="text-neutral-200">{mcp.toolAvailabilityCount}</strong></span>
                        <span>•</span>
                        <span>Auth: <strong className={mcp.authStatus === 'VALID' ? 'text-emerald-400' : 'text-rose-400'}>{mcp.authStatus}</strong></span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-neutral-900/50 p-2.5 rounded border border-neutral-800">
                      <div>
                        <span className="text-[10px] text-neutral-500 uppercase block">Schema Fingerprint</span>
                        <span className="font-mono text-cyan-300 text-[11px] truncate block">{mcp.schemaFingerprint}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-500 uppercase block">Last Successful Request</span>
                        <span className="text-neutral-300 text-[11px]">{mcp.lastSuccessfulRequest}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-500 uppercase block">Last Reconnected</span>
                        <span className="text-neutral-300 text-[11px]">{mcp.lastReconnectedAt || 'Initial Session'}</span>
                      </div>
                    </div>

                    {mcp.lastFailure && (
                      <p className="text-xs text-rose-300 bg-rose-950/30 p-2 rounded border border-rose-800/30">
                        <strong>Watchdog Note:</strong> {mcp.lastFailure}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: SITE HEALTH */}
      {activeSubTab === 'SITE_HEALTH' && (
        <div className="space-y-4">
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  Site Availability &amp; Non-Mutating Health Check
                </h3>
                <p className="text-xs text-neutral-400">
                  HEALTHY • DEGRADED • UNAVAILABLE • AUTHENTICATION_ERROR • CAPABILITY_ERROR. Guarantees zero mutations during telemetry checks.
                </p>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                Non-Mutating Audits Only
              </span>
            </div>

            <div className="space-y-3">
              {siteHealthReports.map((site) => (
                <div key={site.siteId} className="p-4 bg-neutral-950/70 border border-neutral-800 rounded-lg space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        site.status === 'HEALTHY'
                          ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40'
                          : site.status === 'DEGRADED'
                          ? 'text-amber-400 bg-amber-950/60 border-amber-800/40'
                          : 'text-rose-400 bg-rose-950/60 border-rose-800/40'
                      }`}>
                        {site.status}
                      </span>
                      <h4 className="text-sm font-bold text-neutral-100">{site.siteName}</h4>
                      <span className="text-[11px] text-neutral-500 font-mono">({site.websiteUrl})</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-neutral-400">
                      <span>HTTP: <strong className="text-emerald-400">{site.httpStatus}</strong></span>
                      <span>•</span>
                      <span>WP: <strong className="text-neutral-200">{site.wpVersion}</strong></span>
                      <span>•</span>
                      <span>Response: <strong className="text-neutral-200">{site.responseTimeMs}ms</strong></span>
                      <span>•</span>
                      <span>SSL: <strong className="text-emerald-400">{site.sslValid ? 'Valid' : 'Expired'}</strong></span>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-400 bg-neutral-900/40 p-2.5 rounded border border-neutral-800">
                    {site.notes}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: RECOVERY CHECKPOINTS */}
      {activeSubTab === 'CHECKPOINTS' && (
        <div className="space-y-4">
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-400" />
                  Task Recovery Checkpoints
                </h3>
                <p className="text-xs text-neutral-400">
                  Meaningful execution boundaries: PRE_BULK • BATCH_CHUNK • POST_VERIFICATION. Enables resuming from last confirmed checkpoint.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {recoveryCheckpoints.map((chk) => (
                <div key={chk.id} className="p-3.5 bg-neutral-950/70 border border-neutral-800 rounded-lg space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800/40 font-bold">
                        {chk.boundary}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-neutral-200">{chk.taskTitle}</h4>
                      <span className="text-[10px] text-neutral-500 font-mono">({chk.id})</span>
                    </div>
                    <span className="text-[11px] text-neutral-500">{chk.timestamp}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-neutral-900/40 rounded border border-neutral-800">
                      <span className="text-[10px] text-neutral-500 block">Completed Steps:</span>
                      <span className="font-mono text-emerald-400 text-[11px]">{chk.completedStepIds.join(', ') || 'None (Preflight)'}</span>
                    </div>
                    <div className="p-2 bg-neutral-900/40 rounded border border-neutral-800">
                      <span className="text-[10px] text-neutral-500 block">Pending Steps:</span>
                      <span className="font-mono text-neutral-300 text-[11px]">{chk.pendingStepIds.join(', ')}</span>
                    </div>
                  </div>

                  <div className="p-2 bg-neutral-900/60 rounded border border-neutral-800 text-[11px] font-mono text-neutral-400">
                    <span className="text-[10px] text-neutral-500 uppercase block font-sans font-bold">Snapshot Data</span>
                    {JSON.stringify(chk.liveStateSnapshot)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 7: RETRY POLICY & SECURITY INVIOLABLE GUARD */}
      {activeSubTab === 'RETRY_TESTER' && (
        <div className="space-y-4">
          {/* Inviolable Security Warning */}
          <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              INVIOLABLE AUTHORITY HIERARCHY: NEVER SELF-HEAL SECURITY
            </div>
            <p className="text-xs text-rose-200/90 leading-relaxed">
              Phase 8 reliability, recovery, and self-healing mechanisms must <strong>NEVER</strong> bypass Phase 5 permissions, grant clearance, approve tasks, change client identity, switch sites, invent capabilities, or disable security controls. Reliability automation repairs infrastructure, not authorization.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-mono">
              <div className="bg-rose-950/80 p-2 rounded border border-rose-800/40 text-rose-300">Phase 5: Security Immutable</div>
              <div className="bg-rose-950/80 p-2 rounded border border-rose-800/40 text-rose-300">Zero Security Bypass</div>
              <div className="bg-rose-950/80 p-2 rounded border border-rose-800/40 text-rose-300">No Auto-Approval</div>
              <div className="bg-rose-950/80 p-2 rounded border border-rose-800/40 text-rose-300">Strict Site Isolation</div>
            </div>
          </div>

          {/* Interactive Error Classification Tester */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              Controlled Retry Classifier &amp; Backoff Simulator
            </h3>
            <p className="text-xs text-neutral-400">
              Only errors classified as RETRYABLE (temporary network errors, 502/503/504) are retried with bounded exponential backoff.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-300 block">
                Test Error String / HTTP Exception:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testErrorInput}
                  onChange={(e) => setTestErrorInput(e.target.value)}
                  className="flex-1 bg-neutral-950 border border-neutral-800 px-3 py-2 rounded-lg text-xs text-neutral-200 font-mono focus:border-amber-500/50 outline-none"
                  placeholder="e.g. Permission denied, Socket timeout, Verification mismatch..."
                />
              </div>

              {/* Sample Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-neutral-500 uppercase font-bold mr-1">Presets:</span>
                <button
                  onClick={() => setTestErrorInput('Remote host socket timeout (ECONNRESET)')}
                  className="text-[10px] px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded hover:bg-neutral-700"
                >
                  Network Timeout
                </button>
                <button
                  onClick={() => setTestErrorInput('Phase 5 Permission Denied: requireApprovalForPlugins is true')}
                  className="text-[10px] px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded hover:bg-neutral-700"
                >
                  Permission Denied
                </button>
                <button
                  onClick={() => setTestErrorInput('Verification mismatch: Live page title does not match expected title')}
                  className="text-[10px] px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded hover:bg-neutral-700"
                >
                  Verification Mismatch
                </button>
                <button
                  onClick={() => setTestErrorInput('Remote MCP tool schema changed: parameter schema mismatch')}
                  className="text-[10px] px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded hover:bg-neutral-700"
                >
                  Schema Drift
                </button>
              </div>

              {/* Classifier Output Card */}
              <div className="mt-3 p-3.5 bg-neutral-950 rounded-lg border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-400 font-semibold">Classification Result:</span>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${testClassification.color}`}>
                    {testClassification.type}
                  </span>
                </div>
                <div className="text-xs text-neutral-300">
                  <strong>Action:</strong> {testClassification.action}
                </div>
                <div className="text-[11px] text-neutral-500 font-mono pt-1 border-t border-neutral-800">
                  {testClassification.retryable
                    ? 'Exponential Schedule: Attempt 1 = 1,000ms ± jitter | Attempt 2 = 2,000ms ± jitter | Attempt 3 = 4,000ms ± jitter -> Dead-Letter Queue'
                    : 'MUTATION HALTED: Zero retries dispatched. Requires re-plan, verification, or operator clearance.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
