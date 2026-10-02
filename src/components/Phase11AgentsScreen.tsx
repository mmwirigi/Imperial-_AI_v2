import React, { useState } from 'react';
import {
  SpecialistAgent,
  MultiAgentObjectivePlan,
  AutonomyLevel
} from '../types';
import { AgentOrchestratorService } from '../services/agentOrchestratorService';
import {
  Bot,
  Cpu,
  Layers,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Play,
  Lock,
  Search,
  Sparkles,
  Zap,
  Activity,
  GitBranch
} from 'lucide-react';

interface Props {
  tenantId: string;
  clientId: string;
  siteId?: string;
  isPlatformAdmin: boolean;
}

export const Phase11AgentsScreen: React.FC<Props> = ({
  tenantId,
  clientId,
  siteId,
  isPlatformAdmin
}) => {
  const [agents] = useState<SpecialistAgent[]>(AgentOrchestratorService.getDefaultSpecialistAgents());
  const [selectedAgent, setSelectedAgent] = useState<SpecialistAgent>(agents[0]);
  const [objectiveInput, setObjectiveInput] = useState('');
  const [activePlan, setActivePlan] = useState<MultiAgentObjectivePlan | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);

  const handlePlanObjective = () => {
    if (!objectiveInput.trim()) return;
    setIsPlanning(true);

    setTimeout(() => {
      const plan = AgentOrchestratorService.planObjective({
        tenantId,
        clientId,
        siteId,
        objective: objectiveInput,
        userRole: 'OPERATOR',
        isPlatformAdmin
      });
      setActivePlan(plan);
      setIsPlanning(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Phase 11 Autonomous Multi-Agent
              </span>
              <span className="text-xs text-neutral-400">Policy-Bound Supervised Autonomy</span>
            </div>
            <h1 className="text-2xl font-bold text-neutral-100 mt-1">Specialist AI Agents & Orchestration</h1>
            <p className="text-sm text-neutral-400 mt-0.5">
              8 domain-specialized agents collaborating via structured messages with strict anti-self-approval security.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center gap-2 text-xs">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span className="text-neutral-300">Self-Approval: <strong className="text-rose-400">Strictly Blocked</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Autonomous Objective Planner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          Autonomous Objective Planner & DAG Decomposition
        </h2>
        <p className="text-xs text-neutral-400">
          Enter a high-level operational goal. The orchestrator will classify risk, decompose it into a dependency graph, assign specialist agents, and enforce Phase 5 human approval on sensitive actions.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="e.g. Audit high-traffic WooCommerce landing page, diagnose TTFB spike, and stage Redis caching patch"
            value={objectiveInput}
            onChange={e => setObjectiveInput(e.target.value)}
            className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={handlePlanObjective}
            disabled={!objectiveInput.trim() || isPlanning}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-sm"
          >
            <GitBranch className="w-4 h-4" />
            {isPlanning ? 'Planning DAG...' : 'Decompose Objective'}
          </button>
        </div>

        {/* Render Generated Plan */}
        {activePlan && (
          <div className="mt-4 p-5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
              <div>
                <span className="text-xs text-neutral-500 uppercase font-mono">Plan ID: {activePlan.id}</span>
                <h3 className="text-sm font-bold text-neutral-100 mt-0.5">{activePlan.userObjective}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    activePlan.riskLevel === 'HIGH' ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-emerald-950 text-emerald-400'
                  }`}
                >
                  Risk: {activePlan.riskLevel}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-400 border border-amber-800">
                  {activePlan.status}
                </span>
              </div>
            </div>

            {/* Task Decomposition Timeline */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Dependency-Aware Sub-Tasks</div>
              <div className="space-y-2">
                {activePlan.tasks.map((task, idx) => (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      task.status === 'BLOCKED_APPROVAL'
                        ? 'bg-amber-950/30 border-amber-800/80'
                        : 'bg-neutral-900/60 border-neutral-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-300 shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-neutral-100">{task.title}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800">
                            {task.agentRole}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5">{task.objective}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-neutral-400">Level: {task.autonomyLevel}</span>
                      {task.status === 'BLOCKED_APPROVAL' ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-400 border border-amber-700 flex items-center gap-1.5 animate-pulse">
                          <Lock className="w-3 h-3" />
                          Awaiting Phase 5 Approval
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Aggregated Findings */}
            {activePlan.aggregatedFindings.length > 0 && (
              <div className="mt-4 pt-3 border-t border-neutral-800 space-y-2">
                <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Aggregated Agent Findings</div>
                {activePlan.aggregatedFindings.map(find => (
                  <div key={find.id} className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-neutral-200">{find.title}</span>
                      <span className="text-neutral-500">{find.confidencePct}% confidence</span>
                    </div>
                    <p className="text-neutral-400">{find.evidence}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 8 Specialist Agents Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Agent List */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-2 lg:col-span-1">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 px-2 py-1">
            Registered Specialist Agents (8)
          </div>
          <div className="space-y-1">
            {agents.map(ag => (
              <button
                key={ag.id}
                onClick={() => setSelectedAgent(ag)}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between ${
                  selectedAgent.id === ag.id
                    ? 'bg-purple-950/60 border border-purple-800/80 text-white'
                    : 'bg-neutral-950/50 hover:bg-neutral-800 text-neutral-300 border border-transparent'
                }`}
              >
                <div>
                  <div className="font-bold text-xs">{ag.name}</div>
                  <div className="text-[10px] text-neutral-400 font-mono mt-0.5">{ag.role}</div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400">
                  {ag.evaluationScore}%
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Agent Detail */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 lg:col-span-2 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-neutral-100">{selectedAgent.name}</h3>
                <span className="px-2 py-0.5 rounded text-xs font-mono bg-neutral-800 text-neutral-300">
                  v{selectedAgent.version}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">{selectedAgent.description}</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
              {selectedAgent.status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-800 space-y-2">
              <div className="text-xs font-bold text-neutral-300">Permitted Tools (Allowlist)</div>
              <ul className="text-xs font-mono text-purple-400/90 space-y-1">
                {selectedAgent.permittedTools.map(t => (
                  <li key={t}>• {t}</li>
                ))}
              </ul>
            </div>
            <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-800 space-y-2">
              <div className="text-xs font-bold text-neutral-300">Required Permissions</div>
              <ul className="text-xs font-mono text-amber-400/90 space-y-1">
                {selectedAgent.requiredPermissions.map(p => (
                  <li key={p}>• {p}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-800 space-y-2 text-xs">
            <div className="font-bold text-neutral-300">Resource Limits & Guardrails</div>
            <div className="grid grid-cols-3 gap-3 text-neutral-400 pt-1">
              <div>Max Tokens: <strong className="text-neutral-200">{selectedAgent.resourceLimits.maxTokensPerRun}</strong></div>
              <div>Timeout: <strong className="text-neutral-200">{selectedAgent.resourceLimits.timeoutSeconds}s</strong></div>
              <div>Max Sub-steps: <strong className="text-neutral-200">{selectedAgent.resourceLimits.maxSubSteps}</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
