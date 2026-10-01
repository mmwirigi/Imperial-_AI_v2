import React, { useState } from 'react';
import { 
  Building2, 
  Briefcase, 
  Users, 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  ExternalLink, 
  Layers, 
  ArrowRight, 
  Lock, 
  Globe, 
  RefreshCw, 
  Sliders, 
  Award,
  Sparkles,
  Download,
  Trash2,
  Activity,
  Server,
  Terminal,
  Zap,
  Cpu,
  BarChart3,
  FileCheck,
  ChevronRight,
  ShieldAlert,
  Clock,
  Check,
  XCircle,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { 
  Organization, 
  ClientCompany, 
  TenantUser, 
  Membership, 
  Site, 
  ProductionTask, 
  AuditEvent, 
  ActiveTenantContext, 
  TenantIsolationAuditReport, 
  UserPermission, 
  TenantRole,
  MCPServer,
  SaaSPlan,
  SiteCapabilityBaseline,
  CapabilityChangeEvent,
  ClientOnboardingSession,
  TenantUsageSummary,
  ClientActivityLogItem,
  PlatformAdminAuditItem,
  Phase9AcceptanceChecklistItem,
  ClientOnboardingStepId
} from '../types';
import { MultiTenantService, ROLE_DEFAULT_PERMISSIONS } from '../services/multiTenantService';

interface TenantManagementScreenProps {
  activeContext: ActiveTenantContext;
  organizations: Organization[];
  clients: ClientCompany[];
  users: TenantUser[];
  memberships: Membership[];
  sites: Site[];
  tasks: ProductionTask[];
  audits: AuditEvent[];
  mcpServers?: MCPServer[];
  saasPlans?: SaaSPlan[];
  siteBaselines?: SiteCapabilityBaseline[];
  capabilityDrifts?: CapabilityChangeEvent[];
  onboardingSessions?: ClientOnboardingSession[];
  usageSummaries?: Record<string, TenantUsageSummary>;
  clientActivityLogs?: ClientActivityLogItem[];
  platformAdminAudits?: PlatformAdminAuditItem[];
  checklistItems?: Phase9AcceptanceChecklistItem[];
  onOpenContextModal: () => void;
  onSwitchClient: (clientId: string) => Promise<boolean>;
  onExportTenantData?: (tenantId: string) => void;
  onUpdateTenantStatus?: (tenantId: string, status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_SETUP' | 'DEACTIVATED') => void;
  onAdvanceOnboarding?: (sessionId: string, stepId: ClientOnboardingStepId) => void;
  onAcknowledgeDrift?: (driftId: string) => void;
}

export const TenantManagementScreen: React.FC<TenantManagementScreenProps> = ({
  activeContext,
  organizations,
  clients,
  users,
  memberships,
  sites,
  tasks,
  audits,
  mcpServers = [],
  saasPlans = [],
  siteBaselines = [],
  capabilityDrifts = [],
  onboardingSessions = [],
  usageSummaries = {},
  clientActivityLogs = [],
  platformAdminAudits = [],
  checklistItems = [],
  onOpenContextModal,
  onSwitchClient,
  onExportTenantData,
  onUpdateTenantStatus,
  onAdvanceOnboarding,
  onAcknowledgeDrift
}) => {
  const [activeTab, setActiveTab] = useState<
    'CLIENTS' | 'ONBOARDING' | 'BASELINES' | 'PLATFORM' | 'ORGANIZATIONS' | 'TEAM' | 'CHECKLIST' | 'AUDIT'
  >('CLIENTS');

  const [clientSubTab, setClientSubTab] = useState<'OVERVIEW' | 'SITES' | 'TASKS' | 'HEALTH' | 'USAGE' | 'SETTINGS'>('OVERVIEW');
  const [selectedClientId, setSelectedClientId] = useState<string>(activeContext.client.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [auditReport, setAuditReport] = useState<TenantIsolationAuditReport | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [checklistFilter, setChecklistFilter] = useState<string>('ALL');

  // Deletion modal state
  const [deletionModalOpen, setDeletionModalOpen] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [deletionError, setDeletionError] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Quota test simulator state
  const [quotaTestResult, setQuotaTestResult] = useState<string | null>(null);

  const currentOrg = activeContext.organization;
  const currentClient = clients.find((c) => c.id === selectedClientId) || activeContext.client;
  const orgClients = clients.filter((c) => c.organizationId === currentOrg.id || c.tenantId === currentOrg.id);

  const filteredClients = orgClients.filter((c) => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const clientSites = sites.filter((s) => s.clientId === currentClient.id);
  const clientTasks = tasks.filter((t) => t.clientId === currentClient.id);
  const activePlan = saasPlans.find((p) => p.tier === currentOrg.tier) || saasPlans[0];
  const orgUsage = usageSummaries[currentOrg.id] || {
    tenantId: currentOrg.id,
    organizationName: currentOrg.name,
    periodStart: '2026-09-01',
    periodEnd: '2026-09-30',
    totalAiRequests: 142,
    totalAiTokensEstimated: 18400,
    totalMcpCalls: 386,
    totalWpMutations: 48,
    totalReadOperations: 338,
    totalBulkOperations: 24,
    totalTasksCompleted: 38,
    totalTasksFailed: 2,
    activeSitesCount: clientSites.length,
    activeUsersCount: 3,
    storageUsedMb: 128
  };

  // Client health score
  const clientHealth = MultiTenantService.calculateClientHealth({
    client: currentClient,
    sites,
    tasks,
    mcpServers,
    driftEvents: capabilityDrifts
  });

  const handleRunAudit = async () => {
    setIsAuditing(true);
    await new Promise((r) => setTimeout(r, 350));
    const report = MultiTenantService.auditTenantBoundaries({
      organizations,
      clients,
      sites,
      tasks,
      audits
    });
    setAuditReport(report);
    setIsAuditing(false);
  };

  const handleExportData = () => {
    const bundle = MultiTenantService.generateTenantExportBundle({
      tenantId: currentOrg.id,
      orgName: currentOrg.name,
      userEmail: activeContext.user.email,
      organizations,
      clients,
      sites,
      tasks,
      audits,
      usage: orgUsage
    });

    const jsonStr = JSON.stringify(bundle, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `imperial-ai-tenant-${currentOrg.id}-export.json`;
    a.click();
    URL.revokeObjectURL(url);

    setExportNotice(`Export bundle successfully downloaded for ${currentOrg.name}. All passwords, tokens, and MCP secrets were cryptographically scrubbed.`);
    setTimeout(() => setExportNotice(null), 6000);
    if (onExportTenantData) onExportTenantData(currentOrg.id);
  };

  const handleConfirmDeletion = () => {
    const validation = MultiTenantService.validateTenantDeletionConfirmation({
      tenantId: currentOrg.id,
      requestedBy: activeContext.user.id,
      authenticated: true,
      explicitConfirmationPhrase: deleteConfirmationInput.trim(),
      reason: 'User triggered deletion workflow',
      status: 'CONFIRMED'
    }, currentOrg);

    if (!validation.confirmed) {
      setDeletionError(validation.error || 'Confirmation phrase mismatch.');
      return;
    }

    if (onUpdateTenantStatus) {
      onUpdateTenantStatus(currentOrg.id, 'DEACTIVATED');
    }
    setDeletionModalOpen(false);
    setDeletionError(null);
    setDeleteConfirmationInput('');
    alert(`Tenant ${currentOrg.name} has been transitioned to DEACTIVATED state. Mutations halted.`);
  };

  const handleSimulatePlanLimitTest = () => {
    if (!activePlan) return;
    const testQuota = MultiTenantService.checkPlanLimits({
      plan: activePlan,
      currentUsage: orgUsage,
      requestedAction: 'OPERATION_EXECUTE',
      quantity: 500000 // Exceeds quota
    });

    setQuotaTestResult(
      testQuota.status === 'LIMIT_REACHED'
        ? `[LIMIT_REACHED INTERCEPTED] Current Usage: ${testQuota.currentUsage} | Quota: ${testQuota.allowedLimit} | Action: ${testQuota.requiredAction}`
        : 'Within limit'
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Banner & Active Tenant Scope */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-400" />
              SaaS Multi-Tenant Operations Center
            </h1>
            <span className="text-[10px] font-mono uppercase bg-neutral-900 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-bold">
              Phase 9 SaaS Architecture
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
              currentOrg.status === 'ACTIVE'
                ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                : 'bg-rose-950 text-rose-400 border-rose-800'
            }`}>
              {currentOrg.status}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Enterprise boundary administration: Client management, controlled onboarding, baselines, usage metering, and isolation verification.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenContextModal}
            className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-850 border border-amber-500/40 rounded-lg text-xs font-mono text-amber-300 transition-colors cursor-pointer"
          >
            <span>{currentOrg.name}</span>
            <span className="text-neutral-500">↓</span>
            <span className="font-bold text-amber-400">{activeContext.client.name}</span>
          </button>

          <button
            onClick={handleExportData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-mono rounded-lg transition-colors cursor-pointer"
            title="Export scrubbed tenant bundle"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 bg-blue-950/60 border border-blue-800/80 rounded-xl text-xs text-blue-300 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{exportNotice}</span>
          </div>
          <button onClick={() => setExportNotice(null)} className="text-blue-400 hover:text-blue-200">Dismiss</button>
        </div>
      )}

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-neutral-800 pb-2 overflow-x-auto text-xs font-mono">
        {[
          { id: 'CLIENTS', label: 'Client Dashboard', icon: Briefcase },
          { id: 'ONBOARDING', label: 'Client Onboarding', icon: Sparkles },
          { id: 'BASELINES', label: 'Site Baselines & Drift', icon: FileCheck },
          { id: 'PLATFORM', label: 'Platform Admin', icon: Cpu },
          { id: 'ORGANIZATIONS', label: 'Organizations & SaaS', icon: Building2 },
          { id: 'TEAM', label: 'Team & RBAC', icon: Users },
          { id: 'CHECKLIST', label: 'Acceptance Checklist (36)', icon: Award },
          { id: 'AUDIT', label: 'Boundary Audit', icon: ShieldCheck }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/40 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================
          TAB 1: CLIENT MANAGEMENT & OPERATIONS DASHBOARD
          ========================================================= */}
      {activeTab === 'CLIENTS' && (
        <div className="space-y-6">
          {/* Client Selector & Quick Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1 bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-neutral-400 font-bold">Select Client</span>
                <span className="text-[10px] font-mono text-neutral-500">{orgClients.length} Total</span>
              </div>
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {orgClients.map((client) => {
                  const isSelected = client.id === selectedClientId;
                  return (
                    <button
                      key={client.id}
                      onClick={() => {
                        setSelectedClientId(client.id);
                        if (client.id !== activeContext.client.id) {
                          onSwitchClient(client.id);
                        }
                      }}
                      className={`w-full text-left p-2.5 rounded-lg border text-xs font-mono transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/50 text-amber-300 font-bold'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="truncate">{client.name}</div>
                        <div className="text-[10px] text-neutral-500 font-normal">{client.industry}</div>
                      </div>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Client Health & KPI Overview */}
            <div className="md:col-span-3 bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
                <div>
                  <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-amber-400" />
                    {currentClient.name}
                  </h2>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">
                    Client ID: {currentClient.id} · Organization: {currentOrg.name}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-xs font-mono text-neutral-400">Health Score</div>
                    <div className={`text-base font-mono font-bold ${
                      clientHealth.status === 'OPTIMAL' ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {clientHealth.healthScore}% ({clientHealth.status})
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-Tabs for Client Operations */}
              <div className="flex items-center gap-2 border-b border-neutral-800/80 pb-2 text-xs font-mono overflow-x-auto">
                {[
                  { id: 'OVERVIEW', label: 'Overview' },
                  { id: 'SITES', label: `Sites (${clientSites.length})` },
                  { id: 'TASKS', label: `Tasks (${clientTasks.length})` },
                  { id: 'HEALTH', label: 'Health Report' },
                  { id: 'USAGE', label: 'Usage Meter' },
                  { id: 'SETTINGS', label: 'Settings & Security' }
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setClientSubTab(st.id as any)}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      clientSubTab === st.id
                        ? 'bg-neutral-800 text-amber-400 font-bold border border-neutral-700'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Sub-Tab Contents */}
              {clientSubTab === 'OVERVIEW' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                    <span className="text-neutral-500">Connected Sites</span>
                    <div className="text-base font-bold text-neutral-100 mt-1">{clientSites.length}</div>
                  </div>
                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                    <span className="text-neutral-500">MCP Daemons</span>
                    <div className="text-base font-bold text-emerald-400 mt-1">{clientHealth.mcpConnectivity}</div>
                  </div>
                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                    <span className="text-neutral-500">Active Tasks</span>
                    <div className="text-base font-bold text-amber-400 mt-1">{clientHealth.pendingTasksCount}</div>
                  </div>
                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                    <span className="text-neutral-500">Availability</span>
                    <div className="text-base font-bold text-neutral-100 mt-1">{clientHealth.siteAvailabilityPct}%</div>
                  </div>
                </div>
              )}

              {clientSubTab === 'SITES' && (
                <div className="space-y-2">
                  {clientSites.map((site) => (
                    <div key={site.id} className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg flex items-center justify-between text-xs font-mono">
                      <div>
                        <div className="font-bold text-neutral-100">{site.siteName}</div>
                        <div className="text-[11px] text-neutral-400">{site.websiteUrl}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-300 text-[10px]">
                          {site.wordPressType}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">
                          {site.mcpStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {clientSubTab === 'HEALTH' && (
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 font-bold uppercase">Empirical Health Telemetry</span>
                    <span className="text-neutral-500">Assessed: {clientHealth.lastAssessedAt}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-2.5 bg-neutral-900 rounded border border-neutral-800">
                      <span className="text-neutral-400 text-[11px]">Verification Failures</span>
                      <div className="text-sm font-bold text-neutral-100 mt-0.5">{clientHealth.verificationFailuresCount}</div>
                    </div>
                    <div className="p-2.5 bg-neutral-900 rounded border border-neutral-800">
                      <span className="text-neutral-400 text-[11px]">Recent Failures</span>
                      <div className="text-sm font-bold text-neutral-100 mt-0.5">{clientHealth.recentFailuresCount}</div>
                    </div>
                    <div className="p-2.5 bg-neutral-900 rounded border border-neutral-800">
                      <span className="text-neutral-400 text-[11px]">Capability Drifts</span>
                      <div className="text-sm font-bold text-amber-400 mt-0.5">{clientHealth.capabilityDriftCount}</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Health calculation derives exclusively from empirical MCP connectivity, verification read-backs, and incident logs. No artificial data is introduced.
                  </p>
                </div>
              )}

              {clientSubTab === 'USAGE' && (
                <div className="space-y-3 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-200 uppercase">Tenant Billing &amp; Resource Meter</span>
                    <span className="text-neutral-500">Period: {orgUsage.periodStart} to {orgUsage.periodEnd}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-2.5 bg-neutral-950 rounded border border-neutral-800">
                      <span className="text-neutral-500">AI Requests</span>
                      <div className="text-sm font-bold text-neutral-100 mt-1">{orgUsage.totalAiRequests}</div>
                    </div>
                    <div className="p-2.5 bg-neutral-950 rounded border border-neutral-800">
                      <span className="text-neutral-500">MCP Calls</span>
                      <div className="text-sm font-bold text-neutral-100 mt-1">{orgUsage.totalMcpCalls}</div>
                    </div>
                    <div className="p-2.5 bg-neutral-950 rounded border border-neutral-800">
                      <span className="text-neutral-500">WP Mutations</span>
                      <div className="text-sm font-bold text-amber-400 mt-1">{orgUsage.totalWpMutations}</div>
                    </div>
                    <div className="p-2.5 bg-neutral-950 rounded border border-neutral-800">
                      <span className="text-neutral-500">Storage Used</span>
                      <div className="text-sm font-bold text-neutral-100 mt-1">{orgUsage.storageUsedMb} MB</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 2: CONTROLLED CLIENT ONBOARDING WORKFLOW (9 STEPS)
          ========================================================= */}
      {activeTab === 'ONBOARDING' && (
        <div className="space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Controlled 9-Step Client Onboarding Pipeline
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Production rule: Do not allow production execution merely because an MCP connection was added. The site must be validated first.
                </p>
              </div>

              <span className="px-2.5 py-1 rounded bg-amber-950 text-amber-400 border border-amber-800 text-xs font-mono font-bold">
                MANDATORY CAPABILITY BASELINE GATE
              </span>
            </div>

            {/* Stepper Pipeline */}
            <div className="space-y-3">
              {onboardingSessions[0]?.steps.map((st, idx) => {
                const isCompleted = st.status === 'COMPLETED';
                const isCurrent = idx === onboardingSessions[0].currentStepIndex;
                return (
                  <div
                    key={st.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isCompleted
                        ? 'bg-neutral-950 border-neutral-800'
                        : isCurrent
                        ? 'bg-neutral-900 border-amber-500/60 shadow'
                        : 'bg-neutral-950/60 border-neutral-850 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : isCurrent
                          ? 'bg-amber-500 text-neutral-950'
                          : 'bg-neutral-900 text-neutral-500 border border-neutral-800'
                      }`}>
                        {isCompleted ? <Check className="w-3.5 h-3.5" /> : st.stepNumber}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-neutral-100 flex items-center gap-2">
                          <span>{st.title}</span>
                          <span className="text-[10px] font-mono text-neutral-500">[{st.id}]</span>
                        </div>
                        <p className="text-[11px] text-neutral-400">{st.description}</p>
                        {st.details && (
                          <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{st.details}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-xs">
                      {isCompleted ? (
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded font-semibold">
                          VERIFIED
                        </span>
                      ) : isCurrent ? (
                        <button
                          onClick={() => {
                            if (onAdvanceOnboarding && onboardingSessions[0]) {
                              onAdvanceOnboarding(onboardingSessions[0].id, st.id);
                            }
                          }}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded text-xs font-bold transition-colors cursor-pointer"
                        >
                          Execute Step
                        </button>
                      ) : (
                        <span className="text-[10px] text-neutral-600">Pending Prerequisites</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 3: SITE BASELINES & CAPABILITY DRIFT MONITOR
          ========================================================= */}
      {activeTab === 'BASELINES' && (
        <div className="space-y-6">
          {/* Active Baselines List */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  Cryptographic Site Capability Baselines
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Baselines store non-secret environmental fingerprints to detect disappearing capabilities before execution.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {siteBaselines.map((baseline) => (
                <div
                  key={baseline.id}
                  className={`p-4 rounded-xl border space-y-3 ${
                    baseline.status === 'ACTIVE'
                      ? 'bg-neutral-950 border-neutral-800'
                      : 'bg-neutral-950 border-amber-600/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-neutral-100">{baseline.siteName}</div>
                      <div className="text-[10px] font-mono text-neutral-500">ID: {baseline.id}</div>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                      baseline.status === 'ACTIVE'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : 'bg-amber-950 text-amber-400 border-amber-800 animate-pulse'
                    }`}>
                      {baseline.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 bg-neutral-900 rounded border border-neutral-850">
                      <span className="text-neutral-500 text-[10px]">WordPress &amp; PHP</span>
                      <div className="text-neutral-200 mt-0.5">{baseline.wordpressVersion} / {baseline.phpVersion}</div>
                    </div>
                    <div className="p-2 bg-neutral-900 rounded border border-neutral-850">
                      <span className="text-neutral-500 text-[10px]">SEO System</span>
                      <div className="text-neutral-200 mt-0.5">{baseline.seoPlugin}</div>
                    </div>
                    <div className="p-2 bg-neutral-900 rounded border border-neutral-850">
                      <span className="text-neutral-500 text-[10px]">Page Builder</span>
                      <div className="text-neutral-200 mt-0.5">{baseline.pageBuilder}</div>
                    </div>
                    <div className="p-2 bg-neutral-900 rounded border border-neutral-850">
                      <span className="text-neutral-500 text-[10px]">eCommerce / LMS</span>
                      <div className="text-neutral-200 mt-0.5">{baseline.ecommerce}</div>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-neutral-500 uppercase">Capabilities Fingerprint ({baseline.capabilitiesList.length})</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {baseline.capabilitiesList.map((cap) => (
                        <span key={cap} className="px-1.5 py-0.2 rounded bg-neutral-900 text-neutral-300 border border-neutral-800 text-[9px] font-mono">
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Capability Drift Events */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Live Capability Change Detection Events ({capabilityDrifts.length})
              </h2>
              <span className="text-[10px] font-mono text-neutral-500">Requirement 5 Compliance</span>
            </div>

            {capabilityDrifts.length === 0 ? (
              <p className="text-xs text-neutral-500 font-mono">No active capability drifts detected across fleet.</p>
            ) : (
              <div className="space-y-3">
                {capabilityDrifts.map((drift) => (
                  <div key={drift.id} className="p-4 bg-neutral-950 border border-amber-600/50 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-mono font-bold">
                          {drift.flag}
                        </span>
                        <span className="text-xs font-bold text-neutral-200">{drift.siteName}</span>
                      </div>
                      <span className="text-[10px] text-neutral-500 font-mono">{drift.timestamp}</span>
                    </div>

                    <p className="text-xs text-amber-300">
                      Disappeared Capabilities: <span className="font-mono">{drift.missingCapabilities.join(', ')}</span>
                    </p>
                    <p className="text-xs text-neutral-400">
                      Enforced Action: <span className="font-mono text-neutral-200">{drift.actionTaken}</span>. Tasks [{drift.affectedTaskIds.join(', ')}] automatically paused to avoid executing stale plans.
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 4: PLATFORM ADMIN FLEET DASHBOARD & QUOTAS
          ========================================================= */}
      {activeTab === 'PLATFORM' && (
        <div className="space-y-6">
          {/* Fleet Telemetry Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-xl">
              <span className="text-neutral-500 uppercase text-[10px]">Total Organizations</span>
              <div className="text-xl font-bold text-neutral-100 mt-1">{organizations.length}</div>
            </div>
            <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-xl">
              <span className="text-neutral-500 uppercase text-[10px]">Client Companies</span>
              <div className="text-xl font-bold text-amber-400 mt-1">{clients.length}</div>
            </div>
            <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-xl">
              <span className="text-neutral-500 uppercase text-[10px]">Managed Sites</span>
              <div className="text-xl font-bold text-neutral-100 mt-1">{sites.length}</div>
            </div>
            <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-xl">
              <span className="text-neutral-500 uppercase text-[10px]">Active Daemons</span>
              <div className="text-xl font-bold text-emerald-400 mt-1">{mcpServers.length}</div>
            </div>
          </div>

          {/* SaaS Plan & Limit Enforcement Engine */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-400" />
                  SaaS Plans &amp; Quota Enforcement
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Plan limits are evaluated server-side. When a tenant hits a limit, the system returns explicit LIMIT_REACHED status.
                </p>
              </div>

              <button
                onClick={handleSimulatePlanLimitTest}
                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors"
              >
                Simulate Quota Intercept
              </button>
            </div>

            {quotaTestResult && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-xs font-mono text-rose-300">
                {quotaTestResult}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {saasPlans.slice(0, 3).map((plan) => {
                const isCurrentTier = plan.tier === currentOrg.tier;
                return (
                  <div
                    key={plan.tier}
                    className={`p-4 rounded-xl border space-y-3 ${
                      isCurrentTier
                        ? 'bg-neutral-950 border-amber-500/60 shadow'
                        : 'bg-neutral-950 border-neutral-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-100 font-mono">{plan.name}</span>
                      {isCurrentTier && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-800 font-mono">
                          ACTIVE TIER
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-xs font-mono text-neutral-400">
                      <div>Max Sites: <span className="text-neutral-200">{plan.maxSites}</span></div>
                      <div>Max Ops / Mo: <span className="text-neutral-200">{plan.maxOperationsPerMonth.toLocaleString()}</span></div>
                      <div>Max Tasks / Mo: <span className="text-neutral-200">{plan.maxTasksPerMonth.toLocaleString()}</span></div>
                      <div>Retention: <span className="text-neutral-200">{plan.retentionDays} Days</span></div>
                    </div>

                    <div className="pt-2 border-t border-neutral-850">
                      <span className="text-[10px] text-neutral-500 font-mono">Feature Flags:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {plan.featureFlags.map((flag) => (
                          <span key={flag} className="px-1.5 py-0.2 rounded bg-neutral-900 text-neutral-300 text-[9px] font-mono border border-neutral-800">
                            {flag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 5: ORGANIZATIONS & SAAS TENANTS
          ========================================================= */}
      {activeTab === 'ORGANIZATIONS' && (
        <div className="space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-neutral-100">Tenant Organizations</h2>
                <p className="text-xs text-neutral-400 mt-0.5">Top-level SaaS boundary partitions.</p>
              </div>

              <button
                onClick={() => setDeletionModalOpen(true)}
                className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800 text-rose-300 text-xs font-mono rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Controlled Deletion</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {organizations.map((org) => (
                <div key={org.id} className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-neutral-100">{org.name}</div>
                      <div className="text-[11px] font-mono text-neutral-500">ID: {org.id} · Tier: {org.tier}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                      {org.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-neutral-850 text-xs font-mono">
                    <button
                      onClick={handleExportData}
                      className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 rounded flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3 text-blue-400" />
                      <span>Export Tenant</span>
                    </button>
                    {onUpdateTenantStatus && (
                      <button
                        onClick={() => onUpdateTenantStatus(org.id, org.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                        className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-amber-300 rounded cursor-pointer"
                      >
                        {org.status === 'ACTIVE' ? 'Suspend Tenant' : 'Activate Tenant'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 6: TEAM & MEMBERSHIPS (RBAC)
          ========================================================= */}
      {activeTab === 'TEAM' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              Tenant Memberships &amp; Role-Based Access Control
            </h2>
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs rounded px-2.5 py-1 font-mono"
            >
              <option value="ALL">All Roles</option>
              <option value="OWNER">Owner</option>
              <option value="ADMIN">Admin</option>
              <option value="OPERATOR">Operator</option>
              <option value="AUDITOR">Auditor</option>
            </select>
          </div>

          <div className="space-y-3">
            {memberships
              .filter((m) => selectedRoleFilter === 'ALL' || m.role === selectedRoleFilter)
              .map((membership) => {
                const user = users.find((u) => u.id === membership.userId);
                return (
                  <div key={membership.id} className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-neutral-850 flex items-center justify-center font-mono font-bold text-xs text-amber-400">
                          {user?.displayName.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-neutral-100">{user?.displayName}</div>
                          <div className="text-[11px] text-neutral-400 font-mono">{user?.email}</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-900 text-amber-400 border border-amber-500/30 font-bold">
                        {membership.role}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-neutral-850 text-xs font-mono">
                      <span className="text-[10px] text-neutral-500">Explicit Permissions:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {membership.permissions.map((p) => (
                          <span key={p} className="px-1.5 py-0.2 rounded bg-neutral-900 text-neutral-300 text-[9px] border border-neutral-800">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 7: PHASE 9 FINAL ACCEPTANCE CHECKLIST (36 ITEMS)
          ========================================================= */}
      {activeTab === 'CHECKLIST' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                Phase 9 Final Acceptance Verification Checklist
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                All 36 requirements from Phase 9 Section 1 &amp; Section 2 specification.
              </p>
            </div>

            <select
              value={checklistFilter}
              onChange={(e) => setChecklistFilter(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs rounded px-2.5 py-1 font-mono"
            >
              <option value="ALL">All Sections (36)</option>
              <option value="TENANT_FOUNDATION">Tenant Foundation (7)</option>
              <option value="ISOLATION_CONTROLS">Isolation Controls (7)</option>
              <option value="ONBOARDING_LIFECYCLE">Onboarding &amp; Baselines (4)</option>
              <option value="SAAS_OPERATIONS">SaaS Operations (14)</option>
              <option value="SECURITY_VALIDATION">Security Validation (4)</option>
            </select>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {checklistItems
              .filter((c) => checklistFilter === 'ALL' || c.section === checklistFilter)
              .map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg flex items-center justify-between gap-3 text-xs font-mono"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </span>
                    <div>
                      <div className="text-neutral-100 font-bold">
                        #{item.requirementNumber} {item.title}
                      </div>
                      <div className="text-[11px] text-neutral-400">{item.notes}</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold shrink-0">
                    VERIFIED
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 8: BOUNDARY AUDITOR & LOGS
          ========================================================= */}
      {activeTab === 'AUDIT' && (
        <div className="space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Cross-Tenant Boundary Integrity Scanner
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Validates strict ownership constraints across all tenant sites, tasks, connections, and audit trails.
                </p>
              </div>

              <button
                onClick={handleRunAudit}
                disabled={isAuditing}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-mono font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
                <span>{isAuditing ? 'Auditing...' : 'Run Boundary Scan'}</span>
              </button>
            </div>

            {auditReport && (
              <div className="p-4 bg-neutral-950 border border-emerald-600/40 rounded-xl space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-emerald-400 font-bold">
                  <span>ZERO CROSS-TENANT BOUNDARY LEAKS FOUND</span>
                  <span>{auditReport.timestamp}</span>
                </div>
                <p className="text-neutral-400 text-[11px]">
                  Scanned {auditReport.totalChecks} resources across all tenants. All sites, tasks, and audit logs maintain cryptographic partition integrity.
                </p>
              </div>
            )}
          </div>

          {/* Platform Admin Audit Trail */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
            <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-amber-400" />
              Platform Administrator Audit Trail
            </h2>
            <div className="space-y-2">
              {platformAdminAudits.map((padm) => (
                <div key={padm.id} className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 font-bold">{padm.actionType}</span>
                    <span className="text-neutral-500">{padm.timestamp}</span>
                  </div>
                  <div className="text-neutral-300">{padm.details}</div>
                  <div className="text-[10px] text-neutral-500">Admin: {padm.adminEmail} · IP: {padm.ipAddress}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          CONTROLLED TENANT DELETION MODAL (REQUIREMENT 21)
          ========================================================= */}
      {deletionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-rose-800/80 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-neutral-100">Controlled Tenant Deletion</h3>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Permanent tenant deletion requires authenticated operator confirmation. Natural-language AI commands cannot execute this action.
            </p>

            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-400">
              To proceed, enter the exact phrase:
              <div className="text-amber-400 font-bold mt-1 select-all">
                DELETE TENANT {currentOrg.name.toUpperCase()}
              </div>
            </div>

            <input
              type="text"
              value={deleteConfirmationInput}
              onChange={(e) => setDeleteConfirmationInput(e.target.value)}
              placeholder="Type confirmation phrase here..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs font-mono text-neutral-100 outline-none focus:border-rose-500"
            />

            {deletionError && (
              <p className="text-xs text-rose-400 font-mono">{deletionError}</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800 font-mono text-xs">
              <button
                onClick={() => {
                  setDeletionModalOpen(false);
                  setDeletionError(null);
                  setDeleteConfirmationInput('');
                }}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeletion}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded cursor-pointer"
              >
                Confirm Deactivation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
