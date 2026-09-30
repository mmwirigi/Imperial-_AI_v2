import React from 'react';
import { 
  Sliders, 
  X, 
  ShieldCheck, 
  Eye, 
  FileCode, 
  Play, 
  AlertTriangle, 
  RotateCcw,
  Zap,
  Lock,
  StopCircle,
  Clock,
  Layers,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Info
} from 'lucide-react';
import { AgentExecutionMode, AgentCircuitBreakers, ToolRiskLevel } from '../types';

interface AgentControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentMode: AgentExecutionMode;
  circuitBreakers: AgentCircuitBreakers;
  onUpdateAgentMode: (mode: AgentExecutionMode) => void;
  onUpdateCircuitBreakers: (breakers: AgentCircuitBreakers) => void;
}

export const AgentControlsModal: React.FC<AgentControlsModalProps> = ({
  isOpen,
  onClose,
  agentMode,
  circuitBreakers,
  onUpdateAgentMode,
  onUpdateCircuitBreakers,
}) => {
  if (!isOpen) return null;

  const handleStopConditionToggle = (key: keyof AgentCircuitBreakers['automaticStopConditions']) => {
    onUpdateCircuitBreakers({
      ...circuitBreakers,
      automaticStopConditions: {
        ...circuitBreakers.automaticStopConditions,
        [key]: !circuitBreakers.automaticStopConditions[key],
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-100">
                Advanced AI Agent Controls & Safety Engine
              </h2>
              <p className="text-xs text-neutral-400">
                Phase 7 Section 3: Controlled operational execution under Phase 5 & 6 authority.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Authority Banner */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-neutral-300 space-y-1">
              <div className="font-semibold text-neutral-100 flex items-center gap-2">
                <span>Architecture Authority: Phase 5 &gt; Phase 6 &gt; Phase 7</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                The AI model itself is <strong>NEVER</strong> the final authority. Phase 5 enforces security & permissions, Phase 6 enforces WordPress intelligence & stack capabilities, and Phase 7 orchestrates controlled execution.
              </p>
            </div>
          </div>

          {/* Section 1: Operating Modes (Requirement 1) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-200 uppercase tracking-wide">
                1. Agent Operating Modes
              </label>
              <span className="text-[10px] font-mono text-amber-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                Current: {agentMode}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* READ-ONLY */}
              <div
                onClick={() => onUpdateAgentMode('READ_ONLY')}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all space-y-2 flex flex-col justify-between ${
                  agentMode === 'READ_ONLY'
                    ? 'bg-blue-950/40 border-blue-500 shadow-md ring-1 ring-blue-500/30'
                    : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                      <Eye className="w-4 h-4" />
                      READ-ONLY
                    </span>
                    {agentMode === 'READ_ONLY' && (
                      <span className="text-[9px] font-bold bg-blue-500 text-neutral-950 px-1.5 py-0.2 rounded font-mono">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-300 font-medium leading-snug">
                    Zero write capability. Total observational safety.
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-neutral-850 text-[10px]">
                  <div>
                    <span className="text-emerald-400 font-semibold">ALLOWED:</span>
                    <p className="text-neutral-400">inspect, audit, search, analyse, report</p>
                  </div>
                  <div>
                    <span className="text-rose-400 font-semibold">FORBIDDEN:</span>
                    <p className="text-neutral-400">mutations, plugin activation/deactivation, content modification, settings, deletion</p>
                  </div>
                </div>
              </div>

              {/* PLAN MODE */}
              <div
                onClick={() => onUpdateAgentMode('PLAN')}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all space-y-2 flex flex-col justify-between ${
                  agentMode === 'PLAN'
                    ? 'bg-purple-950/40 border-purple-500 shadow-md ring-1 ring-purple-500/30'
                    : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                      <FileCode className="w-4 h-4" />
                      PLAN MODE
                    </span>
                    {agentMode === 'PLAN' && (
                      <span className="text-[9px] font-bold bg-purple-500 text-neutral-950 px-1.5 py-0.2 rounded font-mono">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-300 font-medium leading-snug">
                    Dry-run proposals. Calculate impact and queue diffs.
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-neutral-850 text-[10px]">
                  <div>
                    <span className="text-emerald-400 font-semibold">ALLOWED:</span>
                    <p className="text-neutral-400">inspect, audit, analyse, generate proposals, calculate impact, bulk plans</p>
                  </div>
                  <div>
                    <span className="text-rose-400 font-semibold">FORBIDDEN:</span>
                    <p className="text-neutral-400">production mutations against live WordPress databases</p>
                  </div>
                </div>
              </div>

              {/* EXECUTE MODE */}
              <div
                onClick={() => onUpdateAgentMode('EXECUTE')}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all space-y-2 flex flex-col justify-between ${
                  agentMode === 'EXECUTE'
                    ? 'bg-amber-950/40 border-amber-500 shadow-md ring-1 ring-amber-500/30'
                    : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Play className="w-4 h-4" />
                      EXECUTE MODE
                    </span>
                    {agentMode === 'EXECUTE' && (
                      <span className="text-[9px] font-bold bg-amber-500 text-neutral-950 px-1.5 py-0.2 rounded font-mono">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-300 font-medium leading-snug">
                    Controlled execution under Phase 5 & 6 gates.
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-neutral-850 text-[10px]">
                  <div>
                    <span className="text-emerald-400 font-semibold">ALLOWED:</span>
                    <p className="text-neutral-400">approved operations within configured limits after site/connection validation</p>
                  </div>
                  <div>
                    <span className="text-amber-400 font-semibold">CONSTRAINT:</span>
                    <p className="text-neutral-400">Execute mode does NOT mean unrestricted autonomy.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Execution Limit Controls (Requirement 2) */}
          <div className="space-y-4 pt-2 border-t border-neutral-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-200 uppercase tracking-wide flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                2. Execution Limit Controls
              </label>
              <span className="text-[10px] text-neutral-400 font-mono">
                Hard Boundary Enforcement
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Max Operations per Task */}
              <div className="space-y-1.5 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-neutral-300 font-medium">
                    Max Operations per Task
                  </label>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {circuitBreakers.maxOperationsPerTask}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={circuitBreakers.maxOperationsPerTask}
                  onChange={(e) =>
                    onUpdateCircuitBreakers({
                      ...circuitBreakers,
                      maxOperationsPerTask: parseInt(e.target.value) || 20,
                    })
                  }
                  className="w-full accent-amber-500"
                />
                <span className="text-[10px] text-neutral-500 block">
                  Tasks exceeding this limit require chunked execution approval.
                </span>
              </div>

              {/* Max Affected Objects */}
              <div className="space-y-1.5 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-neutral-300 font-medium">
                    Max Affected Objects
                  </label>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {circuitBreakers.maxAffectedObjects}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={circuitBreakers.maxAffectedObjects}
                  onChange={(e) =>
                    onUpdateCircuitBreakers({
                      ...circuitBreakers,
                      maxAffectedObjects: parseInt(e.target.value) || 20,
                    })
                  }
                  className="w-full accent-amber-500"
                />
                <span className="text-[10px] text-neutral-500 block">
                  Prevents bulk requests from mutating more than {circuitBreakers.maxAffectedObjects} pages at once.
                </span>
              </div>

              {/* Max Retries */}
              <div className="space-y-1.5 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-neutral-300 font-medium">
                    Max Retries
                  </label>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {circuitBreakers.maxRetries}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={5}
                  value={circuitBreakers.maxRetries}
                  onChange={(e) =>
                    onUpdateCircuitBreakers({
                      ...circuitBreakers,
                      maxRetries: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full accent-amber-500"
                />
                <span className="text-[10px] text-neutral-500 block">
                  Controlled retry cap. Never blind retry without verification.
                </span>
              </div>

              {/* Max Failures */}
              <div className="space-y-1.5 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-neutral-300 font-medium">
                    Max Failures Allowed
                  </label>
                  <span className="text-xs font-mono font-bold text-rose-400">
                    {circuitBreakers.maxFailures}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={circuitBreakers.maxFailures}
                  onChange={(e) =>
                    onUpdateCircuitBreakers({
                      ...circuitBreakers,
                      maxFailures: parseInt(e.target.value) || 3,
                    })
                  }
                  className="w-full accent-rose-500"
                />
                <span className="text-[10px] text-neutral-500 block">
                  Exceeding {circuitBreakers.maxFailures} consecutive failures auto-halts task.
                </span>
              </div>

              {/* Max Execution Duration */}
              <div className="space-y-1.5 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-neutral-300 font-medium">
                    Max Execution Duration
                  </label>
                  <span className="text-xs font-mono font-bold text-neutral-200">
                    {circuitBreakers.maxExecutionDurationSeconds}s
                  </span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={600}
                  step={30}
                  value={circuitBreakers.maxExecutionDurationSeconds}
                  onChange={(e) =>
                    onUpdateCircuitBreakers({
                      ...circuitBreakers,
                      maxExecutionDurationSeconds: parseInt(e.target.value) || 180,
                    })
                  }
                  className="w-full accent-neutral-400"
                />
                <span className="text-[10px] text-neutral-500 block">
                  Timeout watchdog stops runaway asynchronous tasks.
                </span>
              </div>

              {/* Max Permitted Risk Level */}
              <div className="space-y-1.5 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-neutral-300 font-medium">
                    Max Permitted Risk Level
                  </label>
                  <span className="text-[10px] font-mono font-bold text-amber-400">
                    {circuitBreakers.maxRiskLevel}
                  </span>
                </div>
                <select
                  value={circuitBreakers.maxRiskLevel}
                  onChange={(e) =>
                    onUpdateCircuitBreakers({
                      ...circuitBreakers,
                      maxRiskLevel: e.target.value as ToolRiskLevel,
                    })
                  }
                  className="w-full bg-neutral-900 border border-neutral-750 text-neutral-200 rounded-lg p-2 text-xs font-mono"
                >
                  <option value="READ">READ (Read Only)</option>
                  <option value="LOW_RISK_WRITE">LOW_RISK_WRITE (Metadata / Alt)</option>
                  <option value="MEDIUM_RISK_WRITE">MEDIUM_RISK_WRITE (Content / Drafts)</option>
                  <option value="HIGH_RISK_WRITE">HIGH_RISK_WRITE (Publish / WooCommerce)</option>
                  <option value="CRITICAL_OPERATION">CRITICAL_OPERATION (Settings / Core)</option>
                </select>
                <span className="text-[10px] text-neutral-500 block">
                  Operations above this risk level are blocked at planning.
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Automatic Stop Conditions (Requirement 3) */}
          <div className="space-y-3 pt-2 border-t border-neutral-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-200 uppercase tracking-wide flex items-center gap-1.5">
                <StopCircle className="w-3.5 h-3.5 text-rose-400" />
                3. Automatic Stop Conditions
              </label>
              <span className="text-[10px] font-mono text-rose-400">
                DO NOT CONTINUE SILENTLY
              </span>
            </div>

            <div className="p-3 bg-neutral-950 rounded-xl border border-rose-950/60 space-y-1">
              <p className="text-xs text-neutral-300 font-medium">
                When any enabled condition triggers:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono text-rose-300 pt-1">
                <span className="bg-rose-950/40 px-2 py-1 rounded border border-rose-900/60 text-center">
                  PRESERVE STATE
                </span>
                <span className="bg-rose-950/40 px-2 py-1 rounded border border-rose-900/60 text-center">
                  MARK PAUSED/FAILED
                </span>
                <span className="bg-rose-950/40 px-2 py-1 rounded border border-rose-900/60 text-center">
                  RECORD REASON
                </span>
                <span className="bg-rose-950/40 px-2 py-1 rounded border border-rose-900/60 text-center">
                  BLOCK MUTATION
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                { key: 'siteChange', label: 'Site changes during execution' },
                { key: 'mcpDisconnect', label: 'MCP connection terminates/drops' },
                { key: 'authChange', label: 'Authentication credentials expire' },
                { key: 'capabilityChange', label: 'Stack capability changes unexpectedly' },
                { key: 'approvalInvalid', label: 'Approval becomes invalid or tampered' },
                { key: 'operationLimitExceeded', label: 'Task exceeds configured limits' },
                { key: 'verificationFailure', label: 'Post-mutation verification fails' },
                { key: 'rollbackNecessary', label: 'Rollback becomes necessary' },
                { key: 'unexpectedToolResponse', label: 'Unexpected tool error occurs' },
                { key: 'taskContextInconsistent', label: 'Task context becomes inconsistent' },
                { key: 'wrongSiteDetected', label: 'Cross-site mismatch detected' },
              ].map((cond) => {
                const isEnabled = circuitBreakers.automaticStopConditions[cond.key as keyof typeof circuitBreakers.automaticStopConditions];
                return (
                  <div
                    key={cond.key}
                    onClick={() => handleStopConditionToggle(cond.key as any)}
                    className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                      isEnabled
                        ? 'bg-neutral-950 border-neutral-750 text-neutral-200'
                        : 'bg-neutral-950/40 border-neutral-850 text-neutral-500'
                    }`}
                  >
                    <span className="text-[11px] font-medium">{cond.label}</span>
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => {}}
                      className="accent-rose-500 w-4 h-4 cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/70 flex items-center justify-between shrink-0">
          <span className="text-xs text-neutral-400">
            Phase 5 Security Authority locks limits into audit ledger.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded-lg transition-colors"
          >
            Apply Controls
          </button>
        </div>
      </div>
    </div>
  );
};
