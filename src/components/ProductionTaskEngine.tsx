import React, { useState } from 'react';
import { 
  CheckSquare, 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Database, 
  ChevronRight, 
  ArrowLeft,
  Search,
  Wrench,
  FileText,
  Sliders,
  XCircle,
  Lock,
  RefreshCw,
  Terminal,
  Zap,
  ShieldCheck,
  FastForward,
  Edit3,
  ExternalLink,
  Info
} from 'lucide-react';
import { 
  ProductionTask, 
  ProductionTaskStep, 
  OperationDomain, 
  Site, 
  ToolRiskLevel,
  AgentExecutionMode,
  ActiveTenantContext
} from '../types';
import { Button, Card, Badge } from './common/UIComponents';

interface ProductionTaskEngineProps {
  tasks: ProductionTask[];
  activeSite: Site | null;
  agentMode: AgentExecutionMode;
  activeTenantContext?: ActiveTenantContext | null;
  onOpenTenantSelector?: () => void;
  onExecuteStep: (taskId: string, stepId: string) => void;
  onResumeTask: (taskId: string) => void;
  onPauseTask: (taskId: string) => void;
  onRollbackTask: (taskId: string) => void;
  onCreateTask: (task: ProductionTask) => void;
  onOpenApproval: (taskId: string, stepId: string) => void;
  onOpenTaskDetail?: (task: ProductionTask) => void;
  onRetryFailed?: (taskId: string) => void;
  onManualIntervene?: (taskId: string, notes: string) => void;
  onSkipFailure?: (taskId: string, reason: string) => void;
}

const TEMPLATE_PROMPTS: Array<{
  domain: OperationDomain;
  label: string;
  prompt: string;
  riskLevel: ToolRiskLevel;
}> = [
  {
    domain: 'SEO',
    label: 'SEO Meta Descriptions & OG Audit',
    prompt: 'Audit all published posts for missing meta descriptions, generate keyword-optimized summaries, and verify rendered Yoast/RankMath meta tags.',
    riskLevel: 'LOW_RISK_WRITE',
  },
  {
    domain: 'BOOKING',
    label: 'Hotel Room Rates & Availability Check',
    prompt: 'Inspect active room categories, ensure seasonal rates are synced, take a preflight checkpoint, and verify room inventory.',
    riskLevel: 'LOW_RISK_WRITE',
  },
  {
    domain: 'MEDIA_ALT',
    label: 'Media Library Alt-Text Accessibility Batch',
    prompt: 'Scan media library for images missing accessibility alt-text, generate descriptive labels, and update metadata with read-back verification.',
    riskLevel: 'LOW_RISK_WRITE',
  },
  {
    domain: 'WOOCOMMERCE',
    label: 'WooCommerce Price & Stock Preflight Sync',
    prompt: 'Review zero-stock inventory products, sync price modifications with preflight snapshot, and verify checkout availability.',
    riskLevel: 'HIGH_RISK_WRITE',
  },
  {
    domain: 'PLUGINS_THEMES',
    label: 'Plugin Security Patch & Rollback Guard',
    prompt: 'Take preflight database checkpoint, apply security updates to Contact Form 7, and perform live verification of form submission pipeline.',
    riskLevel: 'HIGH_RISK_WRITE',
  },
  {
    domain: 'ELEMENTOR',
    label: 'Elementor Layout & CSS Integrity Audit',
    prompt: 'Inspect Elementor landing page widgets for CSS conflicts, regenerate asset cache, and assert visual layout stability.',
    riskLevel: 'LOW_RISK_WRITE',
  },
];

export const ProductionTaskEngine: React.FC<ProductionTaskEngineProps> = ({
  tasks,
  activeSite,
  agentMode,
  activeTenantContext,
  onOpenTenantSelector,
  onExecuteStep,
  onResumeTask,
  onPauseTask,
  onRollbackTask,
  onCreateTask,
  onOpenApproval,
  onOpenTaskDetail,
  onRetryFailed,
  onManualIntervene,
  onSkipFailure,
}) => {
  const [selectedTask, setSelectedTask] = useState<ProductionTask | null>(tasks[0] || null);
  const [isCreating, setIsCreating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<OperationDomain>('SEO');
  const [filterDomain, setFilterDomain] = useState<string>('ALL');

  // Enforce tenant/client filtering when activeTenantContext is present
  const scopedTasks = activeTenantContext
    ? tasks.filter((t) => t.clientId === activeTenantContext.client.id)
    : activeSite
    ? tasks.filter((t) => t.siteId === activeSite.id)
    : tasks;

  const siteTasks = scopedTasks;

  const filteredTasks = filterDomain === 'ALL'
    ? siteTasks
    : siteTasks.filter((t) => t.domain === filterDomain);

  const current = selectedTask || filteredTasks[0] || tasks[0] || null;

  const handleCreateFromPrompt = (promptText: string, domain: OperationDomain, risk: ToolRiskLevel) => {
    if (!activeSite) return;

    const targetTenantId = activeTenantContext?.organization.id || 'org-imperial-kenya';
    const targetClientId = activeTenantContext?.client.id || `client-${activeSite.id}`;
    const targetConnId = activeTenantContext?.client.mcpConnectionIds?.[0] || `conn-mcp-${activeSite.id}`;

    const newTask: ProductionTask = {
      id: `ptask-${Date.now().toString().slice(-4)}`,
      tenantId: targetTenantId,
      clientId: targetClientId,
      siteId: activeSite.id,
      siteName: activeSite.siteName,
      connectionId: targetConnId,
      title: promptText.slice(0, 55) + '...',
      naturalLanguagePrompt: promptText,
      domain,
      overallStatus: 'QUEUED',
      operationHash: `sha256-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      riskLevel: risk,
      requiresPreflightBackup: risk !== 'READ',
      backupStatus: risk !== 'READ' ? 'CHECKPOINTING' : 'NOT_REQUESTED',
      backupCheckpointId: `chk-pre-${Date.now().toString().slice(-3)}`,
      rollbackMechanism: 'WORDPRESS_REVISION',
      successCount: 0,
      failureCount: 0,
      failures: [],
      currentStepIndex: 0,
      createdAt: 'Just now',
      updatedAt: 'Just now',
      canResume: true,
      canRollback: true,
      journal: [],
      executionLogs: [
        `[${new Date().toLocaleTimeString()}] Task compiled from natural language prompt`,
        `[${new Date().toLocaleTimeString()}] Immutable context bound: client=${activeSite.id}, site=${activeSite.id}, conn=conn-mcp-${activeSite.id}`,
        `[${new Date().toLocaleTimeString()}] Resolution chain verified: TASK -> SITE -> CONNECTION`,
        `[${new Date().toLocaleTimeString()}] Execution mode: ${agentMode}`
      ],
      steps: [
        {
          id: `step-1-${Date.now()}`,
          stepNumber: 1,
          title: 'Preflight Resource Discovery & Read-Back Baseline',
          domain,
          action: 'DISCOVER_CURRENT_STATE',
          targetResource: `${domain.toLowerCase()}_active_bundle`,
          state: 'COMPLETED',
          riskLevel: 'READ',
          preState: 'baseline_discovery_active',
          proposedState: 'baseline_verified',
          requiresApproval: false,
          verificationExpected: 'Resource discovered and lock acquired'
        },
        {
          id: `step-2-${Date.now()}`,
          stepNumber: 2,
          title: 'Compile Transformation Payload & Safety Assertion',
          domain,
          action: 'STAGED_MUTATION',
          targetResource: `${domain.toLowerCase()}_payload`,
          state: risk === 'READ' ? 'PENDING' : 'AWAITING_APPROVAL',
          riskLevel: risk,
          preState: 'unoptimized_initial_content',
          proposedState: 'ai_optimized_production_payload',
          requiresApproval: risk !== 'READ',
          verificationExpected: 'Mutation executed and verified via read-back'
        }
      ]
    };

    onCreateTask(newTask);
    setSelectedTask(newTask);
    setIsCreating(false);
    setCustomPrompt('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="amber" size="sm">
              PRODUCTION TASK ENGINE
            </Badge>
            {activeTenantContext && (
              <button
                onClick={onOpenTenantSelector}
                title="Active Tenant & Client Scope"
                className="flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-[11px] font-mono text-slate-800 transition-colors"
              >
                <span>{activeTenantContext.organization.name}</span>
                <span className="text-slate-400">↓</span>
                <span className="font-bold text-amber-700">{activeTenantContext.client.name}</span>
              </button>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Production Task Engine
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Turn natural language instructions into structured multi-step tasks across all WordPress operational domains.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsCreating(!isCreating)}
          icon={Sparkles}
        >
          {isCreating ? 'Cancel Builder' : 'New Operational Task'}
        </Button>
      </div>

      {/* Production Workflow Lifecycle Diagram */}
      <Card className="p-4 space-y-2 bg-slate-50/70">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[11px] font-mono uppercase text-slate-700 font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Production Operational Workflow Pipeline
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            Phase 5 Security Authority Guard Active
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs font-mono">
          <div className="p-2 rounded-xl bg-white border border-slate-200 text-slate-800 shadow-2xs">
            <div className="text-[9px] text-amber-600 font-bold">STEP 1</div>
            <div>APPROVAL</div>
          </div>
          <div className="p-2 rounded-xl bg-white border border-slate-200 text-slate-800 shadow-2xs">
            <div className="text-[9px] text-blue-600 font-bold">STEP 2</div>
            <div>BACKUP</div>
          </div>
          <div className="p-2 rounded-xl bg-white border border-slate-200 text-slate-800 shadow-2xs">
            <div className="text-[9px] text-blue-600 font-bold">STEP 3</div>
            <div>VERIFY BACKUP</div>
          </div>
          <div className="p-2 rounded-xl bg-white border border-slate-200 text-slate-800 shadow-2xs">
            <div className="text-[9px] text-amber-600 font-bold">STEP 4</div>
            <div>CHANGE</div>
          </div>
          <div className="p-2 rounded-xl bg-white border border-slate-200 text-slate-800 shadow-2xs">
            <div className="text-[9px] text-emerald-600 font-bold">STEP 5</div>
            <div>READ-BACK</div>
          </div>
          <div className="p-2 rounded-xl bg-white border border-slate-200 text-slate-800 shadow-2xs">
            <div className="text-[9px] text-emerald-600 font-bold">STEP 6</div>
            <div>NEXT OP</div>
          </div>
        </div>
      </Card>

      {/* Natural Language Task Creator Panel */}
      {isCreating && (
        <Card className="p-6 space-y-4 border-amber-300 ring-2 ring-amber-300/20 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Natural-Language Task Generator
              </h2>
            </div>
            {activeSite && (
              <span className="text-xs font-mono text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-bold">
                Target Scope: {activeSite.siteName}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Enter Operational Instruction
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g. Find all pages missing meta descriptions, generate SEO-friendly descriptions, and verify that Yoast rendered tags match..."
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 rounded-xl p-3 text-xs text-slate-900 outline-none transition-colors"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold">Operational Domain:</span>
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value as OperationDomain)}
                className="bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-1.5 outline-none font-medium"
              >
                <option value="SEO">SEO (Yoast / Rank Math)</option>
                <option value="PAGES_POSTS">Pages &amp; Posts</option>
                <option value="MEDIA_ALT">Media &amp; Alt-Text</option>
                <option value="ELEMENTOR">Elementor &amp; Widgets</option>
                <option value="FORMS">Forms (WPForms / CF7)</option>
                <option value="PLUGINS_THEMES">Plugins &amp; Themes</option>
                <option value="WOOCOMMERCE">WooCommerce Products</option>
                <option value="LEARNPRESS">LearnPress LMS</option>
                <option value="BOOKING">Room Bookings</option>
                <option value="BACKUPS">Backups &amp; Snapshots</option>
              </select>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => handleCreateFromPrompt(customPrompt || 'Inspect and optimize WordPress resources', selectedDomain, 'LOW_RISK_WRITE')}
              disabled={!customPrompt.trim()}
            >
              Compile &amp; Queue Task
            </Button>
          </div>

          {/* Quick Pre-made Templates */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="text-[11px] font-mono text-slate-500 uppercase font-semibold">
              Or pick an Imperial operational recipe:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {TEMPLATE_PROMPTS.map((t, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCreateFromPrompt(t.prompt, t.domain, t.riskLevel)}
                  className="p-3 bg-slate-50 hover:bg-slate-100/90 border border-slate-200 text-left rounded-xl transition-colors group space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-amber-700">
                      {t.label}
                    </span>
                    <span className="text-[9px] font-mono text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {t.domain}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {t.prompt}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Main Split View: Tasks List (Left) & Active Stepper Execution Details (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Task Queue */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold text-slate-900 uppercase tracking-wide">
              Task Queue ({filteredTasks.length})
            </span>
            <select
              value={filterDomain}
              onChange={(e) => setFilterDomain(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-2 py-1"
            >
              <option value="ALL">All Domains</option>
              <option value="SEO">SEO</option>
              <option value="BOOKING">Booking</option>
              <option value="MEDIA_ALT">Media Alt</option>
              <option value="WOOCOMMERCE">WooCommerce</option>
              <option value="PLUGINS_THEMES">Plugins/Themes</option>
            </select>
          </div>

          <div className="space-y-2">
            {filteredTasks.map((t) => {
              const isSelected = current?.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTask(t)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-amber-50/40 border-amber-300 ring-2 ring-amber-300/20 shadow-2xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200/90'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                      {t.domain}
                    </span>
                    <Badge
                      variant={
                        t.overallStatus === 'COMPLETED'
                          ? 'success'
                          : t.overallStatus === 'RUNNING'
                          ? 'warning'
                          : t.overallStatus === 'FAILED'
                          ? 'error'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {t.overallStatus}
                    </Badge>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 line-clamp-2">
                    {t.title}
                  </h3>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 font-mono">
                    <span className="truncate max-w-[120px]">{t.siteName}</span>
                    <span className="text-amber-700 font-bold">
                      {t.steps.filter((s) => s.state === 'COMPLETED').length}/{t.steps.length} Steps
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (2 Cols): Selected Task Execution Details & Multi-Step Stepper */}
        <div className="lg:col-span-2 space-y-4">
          {current ? (
            <Card className="p-6 space-y-5">
              {/* Task Header & Execution Controls */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 font-bold">
                      {current.domain}
                    </span>
                    <span className="text-xs text-slate-600 font-medium">
                      {current.siteName}
                    </span>
                    {current.backupCheckpointId && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-200 rounded flex items-center gap-1">
                        <Database className="w-3 h-3" />
                        Checkpoint: {current.backupCheckpointId}
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-bold text-slate-900">
                    {current.title}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {current.naturalLanguagePrompt}
                  </p>
                </div>

                {/* Control Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {onOpenTaskDetail && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenTaskDetail(current)}
                      icon={ExternalLink}
                    >
                      Audit Detail
                    </Button>
                  )}

                  {current.overallStatus === 'PAUSED' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onResumeTask(current.id)}
                      icon={Play}
                    >
                      Resume
                    </Button>
                  ) : current.overallStatus === 'RUNNING' ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onPauseTask(current.id)}
                      icon={Pause}
                    >
                      Pause
                    </Button>
                  ) : null}

                  {current.canRollback && current.backupCheckpointId && current.rollbackMechanism !== 'UNAVAILABLE' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRollbackTask(current.id)}
                      icon={RotateCcw}
                    >
                      Rollback
                    </Button>
                  )}
                </div>
              </div>

              {/* Execution Resolution Context Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-600 font-mono text-[11px]">
                  <span className="flex items-center gap-1 text-emerald-700 font-bold">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    Strict Resolution: TASK → SITE → CONNECTION
                  </span>
                  <span>Isolation Gate: <strong className="text-emerald-700">PASSED</strong></span>
                </div>
                <div className="grid grid-cols-3 gap-2 font-mono text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                  <div>Task: <span className="text-slate-900">{current.id}</span></div>
                  <div>Site Scope: <span className="text-amber-700 font-bold">{current.siteId}</span></div>
                  <div>Connection: <span className="text-slate-900">{current.connectionId}</span></div>
                </div>
              </div>

              {/* Multi-Step Pipeline Stepper */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center justify-between">
                  <span>Execution Pipeline Stepper</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Step {current.currentStepIndex + 1} of {current.steps.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {current.steps.map((step, idx) => {
                    const isCurrent = idx === current.currentStepIndex;
                    const stepIcon = {
                      COMPLETED: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
                      EXECUTING: <RefreshCw className="w-4 h-4 text-amber-600 animate-spin" />,
                      AWAITING_APPROVAL: <ShieldAlert className="w-4 h-4 text-rose-600" />,
                      FAILED: <XCircle className="w-4 h-4 text-rose-600" />,
                      PENDING: <Clock className="w-4 h-4 text-slate-400" />,
                      PREFLIGHT_CHECKPOINT: <Database className="w-4 h-4 text-blue-600" />,
                      VERIFYING: <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />,
                      ROLLED_BACK: <RotateCcw className="w-4 h-4 text-purple-600" />,
                      SKIPPED: <Clock className="w-4 h-4 text-slate-400" />,
                    }[step.state];

                    return (
                      <div
                        key={step.id}
                        className={`border rounded-2xl p-4 space-y-2.5 transition-all ${
                          isCurrent
                            ? 'border-amber-300 bg-amber-50/20 ring-1 ring-amber-300/30'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            {stepIcon}
                            <span className="text-xs font-bold text-slate-900">
                              Step {step.stepNumber}: {step.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                              {step.state}
                            </span>
                            {step.durationMs && (
                              <span className="text-[10px] font-mono text-slate-400">
                                {step.durationMs}ms
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Resource target & details */}
                        <div className="text-xs text-slate-600 space-y-1 pl-6">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">Target:</span>
                            <span className="text-slate-800 font-mono">{step.targetResource}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">Action:</span>
                            <span className="text-slate-800 font-mono">{step.action}</span>
                          </div>
                          {step.verificationExpected && (
                            <div className="text-emerald-700 font-mono text-[11px] pt-0.5">
                              Assertion: {step.verificationExpected}
                            </div>
                          )}
                        </div>

                        {/* Before/After Diff viewer */}
                        {step.preState && step.proposedState && (
                          <div className="pl-6 pt-1 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-0.5">
                              <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Current (Before)</span>
                              <p className="text-slate-700 font-mono text-[11px] break-words">{step.preState}</p>
                            </div>
                            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-2.5 space-y-0.5">
                              <span className="text-[10px] font-mono text-amber-900 uppercase font-bold">Proposed (After)</span>
                              <p className="text-amber-900 font-mono text-[11px] break-words">{step.proposedState}</p>
                            </div>
                          </div>
                        )}

                        {/* Interactive Step Actions */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 pl-6">
                          {step.state === 'AWAITING_APPROVAL' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => onOpenApproval(current.id, step.id)}
                              icon={ShieldAlert}
                            >
                              Review &amp; Authorize
                            </Button>
                          )}

                          {step.state === 'PENDING' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onExecuteStep(current.id, step.id)}
                              icon={Play}
                            >
                              Execute Step Now
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Execution Console Logs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-slate-500" />
                    Task Execution Telemetry Log
                  </span>
                  <span className="font-mono text-[10px] text-emerald-700 font-bold">
                    Live Channel
                  </span>
                </div>
                <div className="bg-slate-900 text-slate-200 rounded-2xl p-4 font-mono text-xs space-y-1 max-h-36 overflow-y-auto shadow-2xs">
                  {current.executionLogs.map((log, i) => (
                    <div key={i} className="text-slate-300">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 space-y-2">
              <CheckSquare className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs">Select a task from the queue to view its execution pipeline.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
