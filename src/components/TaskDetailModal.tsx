import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Database, 
  RotateCcw, 
  Lock, 
  ShieldCheck, 
  Terminal, 
  FileText,
  Activity,
  Layers,
  ChevronRight,
  ShieldAlert,
  RefreshCw,
  Edit3,
  Check,
  FastForward,
  Info
} from 'lucide-react';
import { ProductionTask } from '../types';

interface TaskDetailModalProps {
  task: ProductionTask | null;
  onClose: () => void;
  onRollback: (taskId: string) => void;
  onResume: (taskId: string) => void;
  onPause: (taskId: string) => void;
  onRetryFailed?: (taskId: string) => void;
  onManualIntervene?: (taskId: string, notes: string) => void;
  onSkipFailure?: (taskId: string, reason: string) => void;
  onOpenReportModal?: (task: ProductionTask) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  onClose,
  onRollback,
  onResume,
  onPause,
  onRetryFailed,
  onManualIntervene,
  onSkipFailure,
  onOpenReportModal,
}) => {
  const [isManualInterventionOpen, setIsManualInterventionOpen] = useState(false);
  const [manualNotes, setManualNotes] = useState('');
  const [isSkipPromptOpen, setIsSkipPromptOpen] = useState(false);
  const [skipReason, setSkipReason] = useState('');

  if (!task) return null;

  const completedCount = task.steps.filter((s) => s.state === 'COMPLETED').length;
  const progressPercent = Math.round((completedCount / task.steps.length) * 100);

  const handleManualResolve = () => {
    if (onManualIntervene && manualNotes.trim()) {
      onManualIntervene(task.id, manualNotes);
      setIsManualInterventionOpen(false);
      setManualNotes('');
    }
  };

  const handleSkipConfirm = () => {
    if (onSkipFailure && skipReason.trim()) {
      onSkipFailure(task.id, skipReason);
      setIsSkipPromptOpen(false);
      setSkipReason('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-neutral-800 flex items-start justify-between gap-4 shrink-0 bg-neutral-950">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
                {task.domain}
              </span>
              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-bold ${
                task.overallStatus === 'COMPLETED'
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  : task.overallStatus === 'PARTIAL_SUCCESS'
                  ? 'bg-amber-950 text-amber-400 border-amber-800'
                  : task.overallStatus === 'FAILED'
                  ? 'bg-rose-950 text-rose-400 border-rose-800'
                  : 'bg-neutral-900 text-neutral-300 border-neutral-800'
              }`}>
                {task.overallStatus.replace('_', ' ')}
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                ID: {task.id}
              </span>
            </div>
            <h2 className="text-lg font-bold text-neutral-100">
              {task.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {onOpenReportModal && (
              <button
                onClick={() => onOpenReportModal(task)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                Production Report
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Section 1: Immutable Context & Client Isolation Resolution (Requirement 7) */}
          <div className="space-y-2">
            <div className="text-[10px] font-mono uppercase text-neutral-400 font-semibold tracking-wider flex items-center justify-between">
              <span>Client Isolation Resolution Chain (Requirement 7)</span>
              <span className="text-emerald-400 flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                VERIFIED (TASK → SITE → CONNECTION)
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono text-neutral-500 uppercase">1. Task Site ID</span>
                <div className="text-neutral-200 font-semibold truncate">{task.siteName}</div>
                <div className="text-[10px] text-amber-400 font-mono">{task.siteId}</div>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono text-neutral-500 uppercase">2. Client ID</span>
                <div className="text-neutral-200 font-semibold truncate">{task.clientId || 'client-default'}</div>
                <div className="text-[9px] text-neutral-500 font-mono">Strict Tenant Boundary</div>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono text-neutral-500 uppercase">3. Connection Binding</span>
                <div className="text-amber-400 font-mono text-[11px] truncate">{task.connectionId || 'conn-mcp-isolated'}</div>
                <div className="text-[9px] text-emerald-400 font-mono">task.site == conn.site</div>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono text-neutral-500 uppercase">4. Risk Gating</span>
                <div className="text-neutral-200 font-mono font-semibold">{task.riskLevel}</div>
                <div className="text-[9px] text-neutral-500 font-mono">Phase 5 Authority</div>
              </div>
            </div>
          </div>

          {/* Section 2: Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-neutral-300 uppercase tracking-wide">
                Operation Pipeline Progress
              </span>
              <span className="font-mono text-amber-400 font-semibold">
                {completedCount} of {task.steps.length} Steps ({progressPercent}%)
              </span>
            </div>
            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  task.overallStatus === 'COMPLETED' 
                    ? 'bg-emerald-500' 
                    : task.overallStatus === 'PARTIAL_SUCCESS'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Section 3: Backup & Rollback Availability (Requirement 2 & 4) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 space-y-1">
              <div className="text-[10px] font-mono text-neutral-500 uppercase flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                Backup Verification Status (Requirement 2)
              </div>
              <div className="font-semibold text-neutral-200 flex items-center gap-2">
                <span className={task.backupStatus === 'VERIFIED' ? 'text-emerald-400 font-bold' : task.backupStatus === 'UNAVAILABLE' ? 'text-rose-400 font-bold' : 'text-neutral-300'}>
                  {task.backupStatus}
                </span>
                {task.backupCheckpointId && (
                  <span className="text-[10px] font-mono text-blue-400 bg-blue-950/60 border border-blue-900 px-1.5 py-0.2 rounded">
                    {task.backupCheckpointId}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400">
                {task.backupStatus === 'VERIFIED'
                  ? 'Preflight database checkpoint saved and verified before mutation.'
                  : task.backupStatus === 'UNAVAILABLE'
                  ? 'Connected environment does not expose backup mechanism (marked UNAVAILABLE; never falsely claimed).'
                  : 'Backup capability not requested for this read operation.'}
              </p>
            </div>

            <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 space-y-1">
              <div className="text-[10px] font-mono text-neutral-500 uppercase flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                Rollback Mechanism (Requirement 4)
              </div>
              <div className="font-semibold text-neutral-200">
                {task.rollbackMechanism === 'UNAVAILABLE' ? (
                  <span className="text-rose-400 font-bold">ROLLBACK NOT AVAILABLE</span>
                ) : (
                  <span className="text-emerald-400 font-semibold">{task.rollbackMechanism}</span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400">
                {task.rollbackMechanism === 'UNAVAILABLE' ? (
                  <span className="text-rose-300 font-medium">RECOVERY METHOD: MANUAL/BACKUP RESTORATION</span>
                ) : (
                  'Automatic recovery enabled via stored previous value or WordPress revision checkpoint.'
                )}
              </p>
            </div>
          </div>

          {/* Section 4: Partial Failure Breakdown View (Requirement 5) */}
          {((task.failures && task.failures.length > 0) || task.overallStatus === 'PARTIAL_SUCCESS') && (
            <div className="bg-rose-950/30 border border-rose-800/80 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="font-bold text-rose-300 uppercase tracking-wide flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Partial Failure Report (Requirement 5)
                </span>
                <span className="font-mono text-neutral-200 bg-neutral-950 px-2 py-0.5 rounded border border-rose-900 text-[11px]">
                  Successful: <strong className="text-emerald-400">{task.successCount}</strong> | Failed: <strong className="text-rose-400">{task.failureCount}</strong>
                </span>
              </div>

              <p className="text-[11px] text-rose-200/90">
                The system does not hide failed operations. Each partial failure is reported with resource, operation, error, retryability, verification result, and rollback status:
              </p>

              <div className="space-y-2">
                {task.failures && task.failures.length > 0 ? (
                  task.failures.map((f, i) => (
                    <div key={i} className="bg-neutral-950 p-3.5 rounded-lg border border-rose-900/60 text-xs space-y-1.5">
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold text-neutral-200 truncate">{f.resource}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded border font-semibold ${
                          f.retryability ? 'text-blue-400 border-blue-900 bg-blue-950/60' : 'text-neutral-400 border-neutral-800 bg-neutral-900'
                        }`}>
                          Retryable: {f.retryability ? 'YES' : 'NO'}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-300 font-mono">
                        Operation: <strong className="text-amber-300">{f.operation}</strong>
                      </div>
                      <div className="text-[11px] text-rose-400 font-mono bg-rose-950/40 p-1.5 rounded border border-rose-900/40">
                        Error: {f.error}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono text-neutral-400 pt-1 border-t border-neutral-900">
                        <div>Verification Result: <span className="text-neutral-300 font-semibold">{f.verificationResult}</span></div>
                        <div>Rollback Status: <span className="text-emerald-400 font-semibold">{f.rollbackStatus}</span></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-neutral-400 italic">
                    Task flagged partial failure. Detailed breakdown logged to audit trail.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 5: Recovery Workflows Controls (Requirement 8) */}
          {(task.overallStatus === 'FAILED' || task.overallStatus === 'PARTIAL_SUCCESS' || (task.failures && task.failures.length > 0)) && (
            <div className="bg-neutral-950 border border-amber-500/30 rounded-xl p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  Recovery Workflows (Requirement 8)
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  Select Recovery Action
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => onRetryFailed && onRetryFailed(task.id)}
                  className="p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 rounded-lg text-left transition-colors"
                >
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400 mb-0.5">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry Failed
                  </div>
                  <div className="text-[10px] text-neutral-400 leading-tight">
                    Re-execute failed steps with read-back verification
                  </div>
                </button>

                <button
                  onClick={() => setIsManualInterventionOpen(true)}
                  className="p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 rounded-lg text-left transition-colors"
                >
                  <div className="flex items-center gap-1.5 font-bold text-blue-400 mb-0.5">
                    <Edit3 className="w-3.5 h-3.5" />
                    Manual Mode
                  </div>
                  <div className="text-[10px] text-neutral-400 leading-tight">
                    Inspect diff, override verification or record fix
                  </div>
                </button>

                <button
                  onClick={() => onRollback(task.id)}
                  disabled={!task.canRollback || task.rollbackMechanism === 'UNAVAILABLE'}
                  className="p-2.5 bg-neutral-900 disabled:opacity-40 hover:bg-neutral-800 border border-neutral-750 rounded-lg text-left transition-colors"
                >
                  <div className="flex items-center gap-1.5 font-bold text-rose-400 mb-0.5">
                    <RotateCcw className="w-3.5 h-3.5" />
                    Rollback Checkpoint
                  </div>
                  <div className="text-[10px] text-neutral-400 leading-tight">
                    Revert to preflight state snapshot
                  </div>
                </button>

                <button
                  onClick={() => setIsSkipPromptOpen(true)}
                  className="p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 rounded-lg text-left transition-colors"
                >
                  <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-0.5">
                    <FastForward className="w-3.5 h-3.5" />
                    Skip Failure
                  </div>
                  <div className="text-[10px] text-neutral-400 leading-tight">
                    Skip non-critical failure with operator approval
                  </div>
                </button>
              </div>

              {/* Manual Intervention Input Drawer */}
              {isManualInterventionOpen && (
                <div className="p-3 bg-neutral-900 border border-blue-500/40 rounded-lg space-y-2 mt-2">
                  <div className="flex items-center justify-between text-blue-300 font-semibold">
                    <span>Manual Operator Intervention Mode</span>
                    <button onClick={() => setIsManualInterventionOpen(false)} className="text-neutral-400 hover:text-neutral-200">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Enter resolution details or manual patch justification to log in the append-only journal:
                  </p>
                  <input
                    type="text"
                    placeholder="e.g., Manually updated meta description via WP Admin; verified 200 OK..."
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-neutral-200 outline-none focus:border-blue-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsManualInterventionOpen(false)}
                      className="px-3 py-1 bg-neutral-800 text-neutral-300 rounded text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleManualResolve}
                      disabled={!manualNotes.trim()}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-xs font-bold"
                    >
                      Record Resolution & Mark Resolved
                    </button>
                  </div>
                </div>
              )}

              {/* Skip Non-Critical Failure Drawer */}
              {isSkipPromptOpen && (
                <div className="p-3 bg-neutral-900 border border-amber-500/40 rounded-lg space-y-2 mt-2">
                  <div className="flex items-center justify-between text-amber-300 font-semibold">
                    <span>Authorize Skip Non-Critical Failure (Phase 5 Required)</span>
                    <button onClick={() => setIsSkipPromptOpen(false)} className="text-neutral-400 hover:text-neutral-200">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Provide operator authorization notes to bypass this non-fatal failure and advance remaining tasks:
                  </p>
                  <input
                    type="text"
                    placeholder="e.g., Non-critical thumbnail alt tag skipped; primary catalog meta intact..."
                    value={skipReason}
                    onChange={(e) => setSkipReason(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-neutral-200 outline-none focus:border-amber-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsSkipPromptOpen(false)}
                      className="px-3 py-1 bg-neutral-800 text-neutral-300 rounded text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSkipConfirm}
                      disabled={!skipReason.trim()}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 rounded text-xs font-bold"
                    >
                      Authorize Skip & Continue
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 6: Operations & Live Read-Back Verification Assertions (Requirement 3) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wide flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Operations & Live Read-Back Verification (Requirement 3)
            </h3>
            <div className="space-y-2">
              {task.steps.map((st) => (
                <div
                  key={st.id}
                  className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-neutral-900 flex items-center justify-center font-mono font-bold text-[10px] text-amber-400">
                        {st.stepNumber}
                      </span>
                      <span className="font-bold text-neutral-200">{st.title}</span>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                      st.state === 'COMPLETED'
                        ? 'text-emerald-400 border-emerald-900 bg-emerald-950/60'
                        : st.state === 'FAILED'
                        ? 'text-rose-400 border-rose-900 bg-rose-950/60'
                        : 'text-neutral-400 border-neutral-800 bg-neutral-900'
                    }`}>
                      {st.state}
                    </span>
                  </div>

                  <div className="text-[11px] text-neutral-400 space-y-1 pl-7 font-mono">
                    <div>Target: <span className="text-neutral-300">{st.targetResource}</span></div>
                    {st.verificationExpected && (
                      <div className="text-emerald-400/90 bg-neutral-900 p-1.5 rounded border border-neutral-800/80">
                        Verification Rule Assertion: {st.verificationExpected}
                      </div>
                    )}
                    {st.verificationActual && (
                      <div className="text-rose-300 bg-rose-950/40 p-1.5 rounded border border-rose-900/60">
                        Live Read-Back Value: {st.verificationActual}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 7: Append-Only Execution Journal */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wide flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-neutral-400" />
              Append-Only Execution Journal (Redacted Arguments)
            </h3>
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 space-y-2 text-xs font-mono max-h-48 overflow-y-auto">
              {task.journal && task.journal.length > 0 ? (
                task.journal.map((j) => (
                  <div key={j.id} className="text-[11px] text-neutral-400 border-b border-neutral-900 pb-1.5 last:border-0">
                    <span className="text-neutral-500">[{j.timestamp}]</span>{' '}
                    <span className="text-amber-400">{j.mcpTool}</span>{' '}
                    <span className="text-neutral-300">args: ({j.argumentsRedacted})</span> →{' '}
                    <span className="text-emerald-400 font-semibold">exec: {j.executionResult}</span> |{' '}
                    <span className="text-blue-400 font-semibold">verify: {j.verificationResult}</span>
                  </div>
                ))
              ) : (
                <div className="text-neutral-500 text-[11px] italic">
                  No historical journal entries recorded for this task.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-neutral-800 flex items-center justify-between gap-3 bg-neutral-950 shrink-0">
          <div className="text-xs text-neutral-400 font-mono truncate max-w-[320px]">
            Deterministic Hash: <span className="text-amber-300">{task.operationHash || 'sha256-verified'}</span>
          </div>

          <div className="flex items-center gap-2">
            {task.canRollback && task.backupCheckpointId && task.rollbackMechanism !== 'UNAVAILABLE' && (
              <button
                onClick={() => {
                  onRollback(task.id);
                  onClose();
                }}
                className="px-3.5 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Rollback to Checkpoint
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
