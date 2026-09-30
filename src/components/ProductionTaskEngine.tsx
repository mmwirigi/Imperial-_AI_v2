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
  AgentExecutionMode
} from '../types';

interface ProductionTaskEngineProps {
  tasks: ProductionTask[];
  activeSite: Site | null;
  agentMode: AgentExecutionMode;
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
    domain: 'BOOKING',
    label: 'Room Booking & SEO Meta Sync',
    prompt: 'Audit room booking pages for Juba Raha Paradise Hotel, verify Rank Math schema, update missing meta descriptions, and verify booking CTA integrity.',
    riskLevel: 'LOW_RISK_WRITE',
  },
  {
    domain: 'SEO',
    label: 'Yoast Product Schema Bulk Audit',
    prompt: 'Scan all CCTV catalog products in Debrazz Security Systems, generate optimized Yoast focus keywords & meta descriptions, and verify against live schema.',
    riskLevel: 'HIGH_RISK_WRITE',
  },
  {
    domain: 'MEDIA_ALT',
    label: 'Media Library Alt-Text Missing Tags Fix',
    prompt: 'Query all images in media library without alt attributes, generate descriptive hospitality/product alt tags, and verify image accessibility scores.',
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

  const siteTasks = activeSite 
    ? tasks.filter((t) => t.siteId === activeSite.id) 
    : tasks;

  const filteredTasks = filterDomain === 'ALL'
    ? siteTasks
    : siteTasks.filter((t) => t.domain === filterDomain);

  const current = selectedTask || filteredTasks[0] || tasks[0] || null;

  const handleCreateFromPrompt = (promptText: string, domain: OperationDomain, risk: ToolRiskLevel) => {
    if (!activeSite) return;

    const newTask: ProductionTask = {
      id: `ptask-${Date.now().toString().slice(-4)}`,
      clientId: `client-${activeSite.id}`,
      siteId: activeSite.id,
      siteName: activeSite.siteName,
      connectionId: `conn-mcp-${activeSite.id}`,
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
          id: `step-${Date.now()}-1`,
          stepNumber: 1,
          title: 'Create Preflight Database Checkpoint',
          domain: 'BACKUPS',
          targetResource: `${activeSite.websiteUrl}/wp-content/*`,
          action: 'preflight_snapshot',
          state: 'PENDING',
          riskLevel: 'READ',
          requiresApproval: false,
          durationMs: 250,
        },
        {
          id: `step-${Date.now()}-2`,
          stepNumber: 2,
          title: `Read-Back Verification of Backup Checkpoint`,
          domain: 'BACKUPS',
          targetResource: 'Checkpoint Snapshot Checksum',
          action: 'verify_backup_integrity',
          state: 'PENDING',
          riskLevel: 'READ',
          requiresApproval: false,
          durationMs: 180,
          verificationExpected: 'SHA-256 snapshot checksum valid; size > 0 KB'
        },
        {
          id: `step-${Date.now()}-3`,
          stepNumber: 3,
          title: `Execute Approved ${domain} Changes`,
          domain,
          targetResource: `${activeSite.websiteUrl} target entities`,
          action: 'mutate_resources',
          state: 'PENDING',
          riskLevel: risk,
          requiresApproval: risk !== 'READ',
          preState: 'Current metadata / schema values',
          proposedState: 'Updated and validated operational values'
        },
        {
          id: `step-${Date.now()}-4`,
          stepNumber: 4,
          title: 'Live Endpoint Read-Back & Assertion Verification',
          domain,
          targetResource: activeSite.websiteUrl,
          action: 'verify_readback_assertion',
          state: 'PENDING',
          riskLevel: 'READ',
          requiresApproval: false,
          verificationExpected: 'actual metadata == expected metadata (HTTP 200 OK)'
        }
      ]
    };

    onCreateTask(newTask);
    setSelectedTask(newTask);
    setIsCreating(false);
    setCustomPrompt('');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-amber-400" />
              Production Task Engine
            </h1>
            <span className="text-[11px] font-mono uppercase bg-neutral-900 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-bold">
              Pillars 1 & 2 · Production Execution
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Controlled execution engine: Turn natural language instructions into structured multi-step tasks across all WordPress operational domains.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded-lg transition-colors shadow"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {isCreating ? 'Cancel Task Builder' : 'New Natural-Language Task'}
        </button>
      </div>

      {/* Production Workflow Lifecycle Diagram (Requirement 2) */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[10px] font-mono uppercase text-amber-400 font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Production Operational Workflow Pipeline (Requirement 2)
          </span>
          <span className="text-[10px] font-mono text-neutral-500">
            Phase 5 Security Authority Guard
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs font-mono">
          <div className="p-2 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
            <div className="text-[9px] text-amber-400 font-bold">STEP 1</div>
            <div>APPROVAL</div>
          </div>
          <div className="p-2 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
            <div className="text-[9px] text-blue-400 font-bold">STEP 2</div>
            <div>BACKUP</div>
          </div>
          <div className="p-2 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
            <div className="text-[9px] text-blue-400 font-bold">STEP 3</div>
            <div>VERIFY BACKUP</div>
          </div>
          <div className="p-2 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
            <div className="text-[9px] text-amber-400 font-bold">STEP 4</div>
            <div>CHANGE</div>
          </div>
          <div className="p-2 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
            <div className="text-[9px] text-emerald-400 font-bold">STEP 5</div>
            <div>READ-BACK / VERIFY</div>
          </div>
          <div className="p-2 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
            <div className="text-[9px] text-emerald-400 font-bold">STEP 6</div>
            <div>NEXT OP</div>
          </div>
        </div>
      </div>

      {/* Natural Language Task Creator Panel */}
      {isCreating && (
        <div className="bg-neutral-900 border border-amber-500/30 rounded-xl p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-neutral-100 uppercase tracking-wide">
                Natural-Language Task Generator
              </h2>
            </div>
            {activeSite && (
              <span className="text-xs font-mono text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded font-bold">
                Target Scope: {activeSite.siteName}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-300">
              Enter Natural-Language Operational Prompt
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g. Find all pages missing meta descriptions, generate SEO-friendly descriptions, and verify that Yoast rendered tags match..."
              rows={3}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-lg p-3 text-xs text-neutral-200 outline-none transition-colors"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">Operational Domain:</span>
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value as OperationDomain)}
                className="bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs rounded-lg px-2.5 py-1 outline-none"
              >
                <option value="SEO">SEO (Yoast / Rank Math)</option>
                <option value="PAGES_POSTS">Pages & Posts</option>
                <option value="MEDIA_ALT">Media & Alt-Text</option>
                <option value="ELEMENTOR">Elementor & Widgets</option>
                <option value="FORMS">Forms (WPForms / CF7)</option>
                <option value="PLUGINS_THEMES">Plugins & Themes</option>
                <option value="WOOCOMMERCE">WooCommerce Products</option>
                <option value="LEARNPRESS">LearnPress LMS</option>
                <option value="BOOKING">Room Bookings</option>
                <option value="BACKUPS">Backups & Snapshots</option>
              </select>
            </div>

            <button
              onClick={() => handleCreateFromPrompt(customPrompt || 'Inspect and optimize WordPress resources', selectedDomain, 'LOW_RISK_WRITE')}
              disabled={!customPrompt.trim()}
              className="px-4 py-2 bg-amber-500 disabled:opacity-50 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded-lg transition-colors shadow"
            >
              Compile & Queue Structured Task
            </button>
          </div>

          {/* Quick Pre-made Templates */}
          <div className="pt-2 border-t border-neutral-800/80 space-y-2">
            <div className="text-[11px] font-mono text-neutral-400 uppercase">
              Or pick an Imperial Enterprise operational recipe:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {TEMPLATE_PROMPTS.map((t, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCreateFromPrompt(t.prompt, t.domain, t.riskLevel)}
                  className="p-2.5 bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 text-left rounded-lg transition-colors group space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-200 group-hover:text-amber-400">
                      {t.label}
                    </span>
                    <span className="text-[9px] font-mono text-neutral-400 bg-neutral-900 px-1.5 py-0.5 rounded">
                      {t.domain}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 line-clamp-2">
                    {t.prompt}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Split View: Tasks List (Left) & Active Stepper Execution Details (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Task Queue */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-bold text-neutral-200 uppercase tracking-wide">
              Task Queue ({filteredTasks.length})
            </span>
            <select
              value={filterDomain}
              onChange={(e) => setFilterDomain(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs rounded px-2 py-0.5"
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
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-neutral-900 border-amber-500/50 shadow'
                      : 'bg-neutral-900/60 hover:bg-neutral-900 border-neutral-800/80 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-950 text-neutral-300 border border-neutral-800">
                      {t.domain}
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-semibold ${
                      t.overallStatus === 'COMPLETED'
                        ? 'text-emerald-400 border-emerald-900 bg-emerald-950/60'
                        : t.overallStatus === 'PARTIAL_SUCCESS'
                        ? 'text-amber-400 border-amber-900 bg-amber-950/60'
                        : t.overallStatus === 'FAILED'
                        ? 'text-rose-400 border-rose-900 bg-rose-950/60'
                        : 'text-neutral-400 border-neutral-800 bg-neutral-950'
                    }`}>
                      {t.overallStatus}
                    </span>
                  </div>
                  <h3 className="text-xs font-semibold text-neutral-200 line-clamp-2">
                    {t.title}
                  </h3>
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-neutral-800/40">
                    <span className="truncate max-w-[120px]">{t.siteName}</span>
                    <span className="font-mono text-amber-400 font-medium">
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
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-5 space-y-5">
              {/* Task Header & Execution Controls */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-neutral-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
                      {current.domain}
                    </span>
                    <span className="text-xs text-neutral-400 font-medium">
                      {current.siteName}
                    </span>
                    {current.backupCheckpointId && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-blue-950 text-blue-400 border border-blue-900 rounded flex items-center gap-1">
                        <Database className="w-3 h-3" />
                        Checkpoint: {current.backupCheckpointId}
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-bold text-neutral-100">
                    {current.title}
                  </h2>
                  <p className="text-xs text-neutral-400">
                    {current.naturalLanguagePrompt}
                  </p>
                </div>

                {/* Control Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {onOpenTaskDetail && (
                    <button
                      onClick={() => onOpenTaskDetail(current)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-neutral-200 text-xs font-semibold rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                      Full Audit Detail
                    </button>
                  )}

                  {current.overallStatus === 'PAUSED' ? (
                    <button
                      onClick={() => onResumeTask(current.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-neutral-100 text-xs font-semibold rounded-lg transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Resume
                    </button>
                  ) : current.overallStatus === 'RUNNING' ? (
                    <button
                      onClick={() => onPauseTask(current.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg transition-colors border border-neutral-700"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      Pause
                    </button>
                  ) : null}

                  {current.canRollback && current.backupCheckpointId && current.rollbackMechanism !== 'UNAVAILABLE' && (
                    <button
                      onClick={() => onRollbackTask(current.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-semibold rounded-lg transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Rollback Checkpoint
                    </button>
                  )}
                </div>
              </div>

              {/* Immutable Context & Client Isolation Resolution Card (Requirement 7) */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs space-y-1">
                <div className="flex items-center justify-between text-neutral-400 font-mono text-[11px]">
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <Lock className="w-3 h-3 text-amber-400" />
                    Strict Execution Resolution: TASK → SITE → CONNECTION
                  </span>
                  <span>Isolation Gate: <strong className="text-emerald-400">PASSED</strong></span>
                </div>
                <div className="grid grid-cols-3 gap-2 font-mono text-[10px] text-neutral-400 pt-1 border-t border-neutral-900">
                  <div>Task: <span className="text-neutral-200">{current.id}</span></div>
                  <div>Site Scope: <span className="text-amber-400">{current.siteId}</span></div>
                  <div>Connection: <span className="text-neutral-200">{current.connectionId}</span></div>
                </div>
              </div>

              {/* Partial Failure Alert Banner if applicable */}
              {current.overallStatus === 'PARTIAL_SUCCESS' && (
                <div className="p-3 bg-amber-950/40 border border-amber-600/60 rounded-lg text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      PARTIAL SUCCESS BREAKDOWN (Requirement 5)
                    </span>
                    <span className="font-mono text-neutral-200">
                      8 Succeeded | 2 Failed
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-200/90">
                    Operations completed with partial failures. Inspect the failure breakdown or trigger recovery workflows below.
                  </p>
                </div>
              )}

              {/* Multi-Step Pipeline Visual Stepper */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-neutral-200 uppercase tracking-wide flex items-center justify-between">
                  <span>Execution Pipeline Stepper</span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    Step {current.currentStepIndex + 1} of {current.steps.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {current.steps.map((step, idx) => {
                    const isCurrent = idx === current.currentStepIndex;
                    const stepIcon = {
                      COMPLETED: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
                      EXECUTING: <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />,
                      AWAITING_APPROVAL: <ShieldAlert className="w-4 h-4 text-rose-400" />,
                      FAILED: <XCircle className="w-4 h-4 text-rose-500" />,
                      PENDING: <Clock className="w-4 h-4 text-neutral-500" />,
                      PREFLIGHT_CHECKPOINT: <Database className="w-4 h-4 text-blue-400" />,
                      VERIFYING: <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />,
                      ROLLED_BACK: <RotateCcw className="w-4 h-4 text-purple-400" />,
                      SKIPPED: <Clock className="w-4 h-4 text-neutral-600" />,
                    }[step.state];

                    const stepBorder = isCurrent 
                      ? 'border-amber-500/60 bg-neutral-950' 
                      : 'border-neutral-800/80 bg-neutral-950/60';

                    return (
                      <div
                        key={step.id}
                        className={`border rounded-xl p-3.5 space-y-2.5 transition-all ${stepBorder}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            {stepIcon}
                            <span className="text-xs font-bold text-neutral-200">
                              Step {step.stepNumber}: {step.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
                              {step.state}
                            </span>
                            {step.durationMs && (
                              <span className="text-[10px] font-mono text-neutral-500">
                                {step.durationMs}ms
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Resource target & action details */}
                        <div className="text-xs text-neutral-400 space-y-1 pl-6">
                          <div className="flex items-center gap-2">
                            <span className="text-neutral-500">Target:</span>
                            <span className="text-neutral-300 font-mono">{step.targetResource}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-neutral-500">Action:</span>
                            <span className="text-neutral-300 font-mono">{step.action}</span>
                          </div>
                          {step.verificationExpected && (
                            <div className="text-emerald-400/90 font-mono text-[11px] pt-0.5">
                              Assertion: {step.verificationExpected}
                            </div>
                          )}
                        </div>

                        {/* Before/After Diff viewer if present */}
                        {step.preState && step.proposedState && (
                          <div className="pl-6 pt-1 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            <div className="bg-neutral-900 border border-neutral-800 rounded p-2 space-y-0.5">
                              <span className="text-[10px] font-mono text-neutral-500 uppercase">Current (Before)</span>
                              <p className="text-neutral-300 font-mono text-[11px] break-words">{step.preState}</p>
                            </div>
                            <div className="bg-neutral-900 border border-amber-500/20 rounded p-2 space-y-0.5">
                              <span className="text-[10px] font-mono text-amber-400 uppercase">Proposed (After)</span>
                              <p className="text-amber-200 font-mono text-[11px] break-words">{step.proposedState}</p>
                            </div>
                          </div>
                        )}

                        {/* Interactive Step Actions */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800/60 pl-6">
                          {step.state === 'AWAITING_APPROVAL' && (
                            <button
                              onClick={() => onOpenApproval(current.id, step.id)}
                              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded transition-colors flex items-center gap-1.5"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                              Review & Authorize
                            </button>
                          )}

                          {step.state === 'PENDING' && (
                            <button
                              onClick={() => onExecuteStep(current.id, step.id)}
                              className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded transition-colors flex items-center gap-1"
                            >
                              <Play className="w-3 h-3 text-amber-400" />
                              Execute Step Now
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Execution Console Logs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span className="font-bold text-neutral-200 uppercase tracking-wide flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-neutral-400" />
                    Task Execution Telemetry Log
                  </span>
                  <span className="font-mono text-[10px] text-emerald-400">
                    Live Channel
                  </span>
                </div>
                <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 font-mono text-xs text-neutral-300 space-y-1 max-h-36 overflow-y-auto">
                  {current.executionLogs.map((log, i) => (
                    <div key={i} className="text-neutral-400">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-12 text-center text-neutral-400 space-y-2">
              <CheckSquare className="w-8 h-8 mx-auto text-neutral-600" />
              <p className="text-xs">Select a task from the queue to view its execution pipeline.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
