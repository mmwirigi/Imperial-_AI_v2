import React, { useState } from 'react';
import {
  Users,
  Globe,
  CheckSquare,
  ShieldCheck,
  Activity,
  Layers,
  ExternalLink,
  ArrowLeft,
  Server,
  Sparkles,
  ShieldAlert,
  Clock,
  Plus,
  Settings,
  Mail,
  UserCheck
} from 'lucide-react';
import {
  ClientCompany,
  Site,
  ProductionTask,
  AdvancedApprovalItem,
  SecurityEventItem,
  AuditEvent
} from '../types';
import { Button, Card, Badge, MetricCard } from './common/UIComponents';
import { getIndustryBadge } from '../styles/tokens';

interface ClientDetailViewProps {
  client: ClientCompany;
  sites: Site[];
  tasks: ProductionTask[];
  approvals: AdvancedApprovalItem[];
  securityEvents: SecurityEventItem[];
  auditEvents: AuditEvent[];
  onBack: () => void;
  onSelectSite: (siteId: string) => void;
  onSetAsActiveScope: (clientId: string) => void;
  isActiveScope: boolean;
}

export const ClientDetailView: React.FC<ClientDetailViewProps> = ({
  client,
  sites,
  tasks,
  approvals,
  securityEvents,
  auditEvents,
  onBack,
  onSelectSite,
  onSetAsActiveScope,
  isActiveScope
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SITES' | 'TASKS' | 'APPROVALS' | 'ACTIVITY'>('OVERVIEW');

  const clientSites = sites.filter((s) => s.clientId === client.id);
  const clientTasks = tasks.filter((t) => t.clientId === client.id);
  const clientApprovals = approvals.filter(
    (a) => clientSites.some((s) => s.siteName === a.siteName)
  );
  const clientSecurity = securityEvents.filter((e) => e.siteId && clientSites.some(s => s.id === e.siteId));
  const clientAudits = auditEvents.filter((a) => clientSites.some((s) => s.id === a.siteId));

  const industryBadge = getIndustryBadge(client.industry);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Top Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Clients</span>
        </button>

        {!isActiveScope && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSetAsActiveScope(client.id)}
            icon={UserCheck}
          >
            Set as Active Operating Scope
          </Button>
        )}
      </div>

      {/* Client Header Hero Card */}
      <Card className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-amber-400 font-extrabold flex items-center justify-center text-xl shadow-xs shrink-0">
              {client.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {client.name}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${industryBadge.badge}`}>
                  {client.industry}
                </span>
                {isActiveScope && (
                  <Badge variant="amber" size="sm" dot>
                    ACTIVE SCOPE
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Assigned Manager: <span className="text-slate-700 font-semibold">{client.assignedManager}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {clientSites[0]?.websiteUrl && (
              <a
                href={clientSites[0].websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-all shadow-2xs"
              >
                <span>Visit Production Site</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            )}
          </div>
        </div>

        {/* Client Metadata Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs font-mono">
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Contact Person</span>
            <span className="text-slate-800 font-semibold">{client.contactPerson}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Contact Email</span>
            <span className="text-slate-800 font-semibold truncate block">{client.contactEmail}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold block">MCP Status</span>
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              CONNECTED (18ms)
            </span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Client Created</span>
            <span className="text-slate-800">{client.createdAt.substring(0, 10)}</span>
          </div>
        </div>
      </Card>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Connected Sites"
          value={clientSites.length}
          subtitle="WordPress MCP Hosts"
          icon={Globe}
          accentColor="emerald"
        />
        <MetricCard
          title="Active Tasks"
          value={clientTasks.filter(t => t.overallStatus === 'RUNNING').length}
          subtitle={`${clientTasks.length} Total tasks`}
          icon={CheckSquare}
          accentColor="amber"
        />
        <MetricCard
          title="Pending Approvals"
          value={clientApprovals.filter(a => a.status === 'PENDING').length}
          subtitle="Safe gate checks"
          icon={ShieldCheck}
          accentColor={clientApprovals.length > 0 ? 'rose' : 'emerald'}
        />
        <MetricCard
          title="Security Status"
          value={clientSecurity.length === 0 ? 'Optimal' : `${clientSecurity.length} Flags`}
          subtitle="No boundary leaks"
          icon={ShieldAlert}
          accentColor={clientSecurity.length === 0 ? 'emerald' : 'rose'}
        />
      </div>

      {/* Tabs Filter Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs">
        {(['OVERVIEW', 'SITES', 'TASKS', 'APPROVALS', 'ACTIVITY'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === tab
                ? 'bg-amber-500 text-slate-950 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Connected Sites Section */}
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-500" />
              Connected WordPress Sites ({clientSites.length})
            </h3>
            <div className="space-y-2">
              {clientSites.map((site) => (
                <div
                  key={site.id}
                  onClick={() => onSelectSite(site.id)}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div>
                    <div className="font-bold text-slate-900 text-xs">{site.siteName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{site.websiteUrl}</div>
                  </div>
                  <Badge variant="success" size="sm" dot>
                    {site.mcpStatus}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* AI Custom Instructions */}
          <Card className="p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Client AI Governance Instructions
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed p-4 rounded-xl bg-slate-50 border border-slate-100 font-mono">
              {client.customAiInstructions || 'Standard autonomous WordPress operations policy.'}
            </p>
          </Card>
        </div>
      )}

      {activeTab === 'SITES' && (
        <div className="space-y-3">
          {clientSites.map((site) => (
            <Card key={site.id} className="p-4 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">{site.siteName}</h4>
                <div className="text-xs text-slate-500 font-mono">{site.websiteUrl}</div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono pt-1">
                  <span>Plugin: {site.seoPlugin}</span>
                  <span>•</span>
                  <span>Builder: {site.pageBuilder}</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectSite(site.id)}
              >
                Open Site Center
              </Button>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'TASKS' && (
        <div className="space-y-3">
          {clientTasks.length > 0 ? (
            clientTasks.map((task) => (
              <Card key={task.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">{task.title}</h4>
                  <Badge variant="neutral" size="sm">
                    {task.overallStatus}
                  </Badge>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Site: {task.siteName} • Steps: {task.steps.length}
                </div>
              </Card>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              No tasks currently created for this client.
            </div>
          )}
        </div>
      )}

      {activeTab === 'APPROVALS' && (
        <div className="space-y-3">
          {clientApprovals.length > 0 ? (
            clientApprovals.map((appr) => (
              <Card key={appr.id} className="p-4 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{appr.title}</h4>
                  <div className="text-[11px] text-slate-500">{appr.siteName} • {appr.actionSummary}</div>
                </div>
                <Badge variant={appr.riskLevel === 'DESTRUCTIVE' || appr.riskLevel === 'HIGH_RISK_WRITE' ? 'error' : 'warning'} size="sm">
                  {appr.riskLevel.replace(/_/g, ' ')}
                </Badge>
              </Card>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              Zero pending approvals for this client.
            </div>
          )}
        </div>
      )}

      {activeTab === 'ACTIVITY' && (
        <Card className="p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            Audit &amp; Operations Activity Timeline
          </h3>
          <div className="space-y-2">
            {clientAudits.slice(0, 10).map((audit) => (
              <div key={audit.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{audit.userAction}</span>
                  <span className="text-[10px] font-mono text-slate-400">{audit.timestamp}</span>
                </div>
                <p className="text-slate-600 text-[11px]">{audit.resultSummary}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
