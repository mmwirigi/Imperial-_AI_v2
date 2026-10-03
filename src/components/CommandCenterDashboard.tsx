import React from 'react';
import {
  Shield,
  Activity,
  Users,
  Globe,
  CheckSquare,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
  Plus,
  RefreshCw,
  Sparkles,
  Cpu,
  Layers,
  CheckCircle2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import {
  Site,
  ProductionTask,
  AdvancedApprovalItem,
  ClientCompany,
  SecurityEventItem,
  AuditEvent,
  ActiveTenantContext
} from '../types';
import { Button, Card, Badge, MetricCard } from './common/UIComponents';
import { getIndustryBadge } from '../styles/tokens';

interface CommandCenterDashboardProps {
  clients: ClientCompany[];
  sites: Site[];
  tasks: ProductionTask[];
  approvals: AdvancedApprovalItem[];
  securityEvents: SecurityEventItem[];
  auditEvents: AuditEvent[];
  activeTenantContext?: ActiveTenantContext | null;
  onNavigateToTab: (tab: string, meta?: any) => void;
  onSwitchClient: (clientId: string) => void;
  onOpenAddClientModal: () => void;
  onOpenApprovalModal: (approvalId: string) => void;
  onOpenTaskDetail: (task: ProductionTask) => void;
  onRefreshData?: () => void;
}

export const CommandCenterDashboard: React.FC<CommandCenterDashboardProps> = ({
  clients,
  sites,
  tasks,
  approvals,
  securityEvents,
  auditEvents,
  activeTenantContext,
  onNavigateToTab,
  onSwitchClient,
  onOpenAddClientModal,
  onOpenApprovalModal,
  onOpenTaskDetail,
  onRefreshData
}) => {
  const activeTasks = tasks.filter(
    (t) => t.overallStatus === 'RUNNING' || t.overallStatus === 'QUEUED'
  );
  const pendingApprovals = approvals.filter((a) => a.status === 'PENDING');
  const connectedSites = sites.filter((s) => s.mcpStatus === 'CONNECTED');
  const activeSecurityAlerts = securityEvents.filter((e) => !e.resolved);

  // Initial 5 seeded clients (and any added ones)
  const displayClients = clients.slice(0, 6);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Welcome / Command Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <Badge variant="amber" size="sm" dot>
              OPERATIONS ONLINE
            </Badge>
            <span className="text-xs text-slate-400 font-mono">
              MCP Daemon: 100% HEALTHY
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Imperial AI Command Center
          </h1>
          <p className="text-sm text-slate-500 max-w-xl leading-relaxed">
            Multi-client autonomous WordPress orchestration platform. Real-time fleet health,
            policy-bound automation, and safe production mutations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshData}
            icon={RefreshCw}
          >
            Refresh Fleet
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenAddClientModal}
            icon={Plus}
          >
            Add Client
          </Button>
        </div>

        {/* Subtle decorative background graphic */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none" />
      </div>

      {/* 2. System Readiness Metric Cards (Answers: What is happening?) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Tasks"
          value={activeTasks.length}
          subtitle={`${tasks.length} total tasks`}
          icon={CheckSquare}
          accentColor="amber"
          onClick={() => onNavigateToTab('tasks')}
        />
        <MetricCard
          title="Pending Approvals"
          value={pendingApprovals.length}
          subtitle="Awaiting human gate"
          icon={ShieldCheck}
          accentColor={pendingApprovals.length > 0 ? 'rose' : 'emerald'}
          onClick={() => onNavigateToTab('approvals')}
        />
        <MetricCard
          title="Connected Sites"
          value={`${connectedSites.length}/${sites.length}`}
          subtitle="WordPress MCP Fleet"
          icon={Globe}
          accentColor="emerald"
          onClick={() => onNavigateToTab('sites')}
        />
        <MetricCard
          title="Security Invariants"
          value={activeSecurityAlerts.length === 0 ? 'Optimal' : `${activeSecurityAlerts.length} Alerts`}
          subtitle="Zero unauthorized leaks"
          icon={Shield}
          accentColor={activeSecurityAlerts.length === 0 ? 'emerald' : 'rose'}
          onClick={() => onNavigateToTab('security')}
        />
      </div>

      {/* 3. Attention Grid: Urgent Approvals & Active Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals Card (Answers: What requires my attention?) */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Approvals Awaiting Authorization
                  </h3>
                  <p className="text-xs text-slate-500">
                    Phase 5 &amp; 7 safety gate protecting production WordPress environments
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigateToTab('approvals')}
              >
                View all ({pendingApprovals.length})
              </Button>
            </div>

            {pendingApprovals.length > 0 ? (
              <div className="space-y-2.5">
                {pendingApprovals.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {item.title}
                        </span>
                        <Badge
                          variant={item.riskLevel === 'DESTRUCTIVE' || item.riskLevel === 'HIGH_RISK_WRITE' ? 'error' : 'warning'}
                          size="sm"
                        >
                          {item.riskLevel.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">{item.siteName}</span>
                        <span>•</span>
                        <span>{item.affectedObjects?.length || item.operationIds?.length || 1} changes planned</span>
                        <span>•</span>
                        <span className="text-emerald-600 font-medium">{item.backupStatus || 'Backup Ready'}</span>
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onOpenApprovalModal(item.id)}
                    >
                      Review
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                <div className="text-xs font-bold text-slate-800">
                  Zero Pending Authorizations
                </div>
                <div className="text-[11px] text-slate-500">
                  All production WordPress mutations are in compliance.
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Active Production Tasks (Answers: Which tasks are running?) */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Live Production Tasks
                  </h3>
                  <p className="text-xs text-slate-500">
                    Deterministic step execution with live journal verification
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigateToTab('tasks')}
              >
                View all ({tasks.length})
              </Button>
            </div>

            {tasks.length > 0 ? (
              <div className="space-y-2.5">
                {tasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onOpenTaskDetail(task)}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/70 cursor-pointer transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {task.title}
                      </span>
                      <Badge
                        variant={
                          task.overallStatus === 'RUNNING'
                            ? 'warning'
                            : task.overallStatus === 'COMPLETED'
                            ? 'success'
                            : task.overallStatus === 'FAILED'
                            ? 'error'
                            : 'neutral'
                        }
                        size="sm"
                        dot={task.overallStatus === 'RUNNING'}
                      >
                        {task.overallStatus}
                      </Badge>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                        <span>{task.siteName}</span>
                        <span>
                          Step {task.currentStepIndex + 1} of {task.steps.length}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 transition-all duration-300"
                          style={{
                            width: `${Math.round(
                              ((task.currentStepIndex + 1) / task.steps.length) * 100
                            )}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-2">
                <CheckSquare className="w-6 h-6 text-amber-500 mx-auto" />
                <div className="text-xs font-bold text-slate-800">
                  Task Queue Ready
                </div>
                <div className="text-[11px] text-slate-500">
                  No active or queued tasks. Create a new operational task in the Task Engine.
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigateToTab('tasks')}
                  icon={Plus}
                >
                  Create Task
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 4. Client Overview (Answers: Which clients need attention?) */}
      <Card className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900">
                Managed Client Organizations
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live multi-tenant scope isolation with individual industry configurations
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateToTab('clients')}
            icon={ArrowRight}
            iconPosition="right"
          >
            All Clients ({clients.length})
          </Button>
        </div>

        {displayClients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayClients.map((client) => {
              const industryBadge = getIndustryBadge(client.industry);
              const clientSites = sites.filter((s) => s.clientId === client.id);
              const clientTasks = tasks.filter((t) => t.clientId === client.id);
              const isCurrentActive =
                activeTenantContext?.client.id === client.id;

              return (
                <div
                  key={client.id}
                  onClick={() => onSwitchClient(client.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 group ${
                    isCurrentActive
                      ? 'border-amber-400 bg-amber-50/30 shadow-xs'
                      : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-xs shadow-2xs">
                          {client.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                            {client.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {client.slug}
                          </span>
                        </div>
                      </div>
                      {isCurrentActive && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          Active Scope
                        </span>
                      )}
                    </div>

                    <div className="mt-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${industryBadge.badge}`}
                      >
                        {client.industry}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
                    <span>{clientSites.length} Sites</span>
                    <span>{clientTasks.length} Tasks</span>
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      MCP Online
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50/80 rounded-2xl border border-dashed border-slate-300 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">No Client Organizations Registered</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Onboard your first WordPress client to start monitoring health, running autonomous tasks, and managing permissions.
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={onOpenAddClientModal} icon={Plus}>
              Onboard First Client
            </Button>
          </div>
        )}
      </Card>

      {/* 5. Site Health & AI Activity (Answers: Are any sites unhealthy? What is AI doing?) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WordPress Fleet Matrix */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-900">
                WordPress Fleet Status
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateToTab('sites')}
            >
              Manage Fleet
            </Button>
          </div>

          {sites.length > 0 ? (
            <div className="space-y-2">
              {sites.slice(0, 4).map((site) => (
                <div
                  key={site.id}
                  className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-bold text-slate-800 truncate">{site.siteName}</div>
                    <div className="text-[11px] text-slate-400 font-mono truncate">
                      {site.websiteUrl}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono font-semibold">
                      {site.seoPlugin || 'RANK_MATH'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                      {site.mcpStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center bg-slate-50/80 rounded-2xl border border-dashed border-slate-300 space-y-2">
              <Globe className="w-6 h-6 text-slate-400 mx-auto" />
              <div className="text-xs font-bold text-slate-700">No WordPress Sites Connected</div>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Connect a self-hosted WordPress site or WP Engine instance via the Fleet tab.
              </p>
              <Button variant="outline" size="sm" onClick={() => onNavigateToTab('sites')} icon={Plus}>
                Add WordPress Site
              </Button>
            </div>
          )}
        </Card>

        {/* AI & Operations Chronological Activity */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">
                Recent AI &amp; Operation Events
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateToTab('audit')}
            >
              Full Audit Trail
            </Button>
          </div>

          <div className="space-y-3">
            {auditEvents.slice(0, 4).map((audit) => (
              <div
                key={audit.id}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span className="font-bold text-slate-800">{audit.userAction}</span>
                  <span className="font-mono text-[10px]">{audit.timestamp}</span>
                </div>
                <div className="text-slate-600 text-[11px]">{audit.resultSummary}</div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                  <span>{audit.siteName}</span>
                  <span>•</span>
                  <span className="text-emerald-600 font-semibold">{audit.approvalStatus}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
