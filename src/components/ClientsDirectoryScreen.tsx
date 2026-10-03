import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Globe,
  CheckSquare,
  ShieldCheck,
  Activity,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { ClientCompany, Site, ProductionTask, AdvancedApprovalItem } from '../types';
import { Button, Card, Badge } from './common/UIComponents';
import { getIndustryBadge } from '../styles/tokens';

interface ClientsDirectoryScreenProps {
  clients: ClientCompany[];
  sites: Site[];
  tasks: ProductionTask[];
  approvals: AdvancedApprovalItem[];
  activeClientId?: string;
  onSelectClient: (clientId: string) => void;
  onOpenAddClientModal: () => void;
  onOpenClientDetail: (client: ClientCompany) => void;
}

export const ClientsDirectoryScreen: React.FC<ClientsDirectoryScreenProps> = ({
  clients,
  sites,
  tasks,
  approvals,
  activeClientId,
  onSelectClient,
  onOpenAddClientModal,
  onOpenClientDetail
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('ALL');

  // Filter clients
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.slug.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesIndustry =
      selectedIndustry === 'ALL' || client.industry.toLowerCase().includes(selectedIndustry.toLowerCase());

    return matchesSearch && matchesIndustry;
  });

  const industriesList = ['ALL', 'Engineering', 'Security', 'Hospitality', 'Resources', 'Foundation'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="amber" size="sm">
              MULTI-TENANT DIRECTORY
            </Badge>
            <span className="text-xs text-slate-400 font-mono">
              Total Clients: {clients.length}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Client Organizations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Enterprise boundary isolation. Dedicated WordPress site contexts and capability policies.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={onOpenAddClientModal}
          icon={Plus}
        >
          Add Client
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by client name, industry, or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 text-slate-900"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs px-1">
          {industriesList.map((ind) => (
            <button
              key={ind}
              onClick={() => setSelectedIndustry(ind)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap ${
                selectedIndustry === ind
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {ind}
            </button>
          ))}
        </div>
      </div>

      {/* Client Cards Grid */}
      {filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredClients.map((client) => {
          const clientSites = sites.filter((s) => s.clientId === client.id);
          const clientTasks = tasks.filter((t) => t.clientId === client.id);
          const activeTasksCount = clientTasks.filter(
            (t) => t.overallStatus === 'RUNNING' || t.overallStatus === 'QUEUED'
          ).length;
          const clientApprovals = approvals.filter((a) =>
            clientSites.some((s) => s.siteName === a.siteName)
          );
          const pendingApprovalsCount = clientApprovals.filter(
            (a) => a.status === 'PENDING'
          ).length;

          const industryBadge = getIndustryBadge(client.industry);
          const isActiveScope = activeClientId === client.id;
          const primarySite = clientSites[0];

          return (
            <Card
              key={client.id}
              hoverable
              className={`p-6 flex flex-col justify-between space-y-4 transition-all ${
                isActiveScope
                  ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
                  : 'border-slate-200/90'
              }`}
            >
              <div className="space-y-3">
                {/* Card Top Row: Initials Avatar + Name + Active Scope Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-slate-900 text-amber-400 font-extrabold flex items-center justify-center text-sm shadow-xs shrink-0">
                      {client.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {client.name}
                      </h3>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {client.slug}
                      </div>
                    </div>
                  </div>

                  {isActiveScope && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                      Active Scope
                    </span>
                  )}
                </div>

                {/* Industry Badge */}
                <div>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${industryBadge.badge}`}
                  >
                    {client.industry}
                  </span>
                </div>

                {/* Website Link */}
                {primarySite?.websiteUrl && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                    <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{primarySite.websiteUrl.replace('https://', '')}</span>
                  </div>
                )}
              </div>

              {/* Status & Counts Matrix */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Sites</span>
                    <span className="font-bold text-slate-800">{clientSites.length}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Active</span>
                    <span className={`font-bold ${activeTasksCount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                      {activeTasksCount}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Approvals</span>
                    <span className={`font-bold ${pendingApprovalsCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                      {pendingApprovalsCount}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  {!isActiveScope ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => onSelectClient(client.id)}
                    >
                      Set Scope
                    </Button>
                  ) : (
                    <div className="flex-1 text-center text-[11px] font-bold text-emerald-700 py-1.5 bg-emerald-50 rounded-xl border border-emerald-200">
                      Currently Operating
                    </div>
                  )}

                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => onOpenClientDetail(client)}
                    icon={ChevronRight}
                    iconPosition="right"
                  >
                    View Center
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
            <Users className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              {clients.length === 0 ? 'No Client Organizations Registered' : 'No Clients Found'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {clients.length === 0
                ? 'Get started by onboarding your first client organization. Configure their industry profile, WordPress fleet, and security isolation.'
                : 'No client organizations matched your search and filter criteria.'}
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={onOpenAddClientModal} icon={Plus}>
            Add Client
          </Button>
        </div>
      )}
    </div>
  );
};
