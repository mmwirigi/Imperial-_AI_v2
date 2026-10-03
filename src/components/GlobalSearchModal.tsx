import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Users,
  Globe,
  CheckSquare,
  ShieldCheck,
  Layers,
  Plug,
  FileText,
  X,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { ClientCompany, Site, ProductionTask, AdvancedApprovalItem } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: ClientCompany[];
  sites: Site[];
  tasks: ProductionTask[];
  approvals: AdvancedApprovalItem[];
  onNavigateToTab: (tab: string, meta?: any) => void;
  onSelectClient?: (clientId: string) => void;
  onSelectSite?: (siteId: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  clients,
  sites,
  tasks,
  approvals,
  onNavigateToTab,
  onSelectClient,
  onSelectSite
}) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'CLIENTS' | 'SITES' | 'TASKS' | 'APPROVALS'>('ALL');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  // Search results
  const matchingClients = clients.filter(
    (c) => c.name.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q) || (c.contactEmail && c.contactEmail.toLowerCase().includes(q))
  );

  const matchingSites = sites.filter(
    (s) => s.siteName.toLowerCase().includes(q) || s.websiteUrl.toLowerCase().includes(q) || s.clientCompanyName.toLowerCase().includes(q)
  );

  const matchingTasks = tasks.filter(
    (t) => t.title.toLowerCase().includes(q) || t.siteName.toLowerCase().includes(q) || t.overallStatus.toLowerCase().includes(q)
  );

  const matchingApprovals = approvals.filter(
    (a) => a.title.toLowerCase().includes(q) || a.siteName.toLowerCase().includes(q) || a.riskLevel.toLowerCase().includes(q)
  );

  const totalResults =
    (activeCategory === 'ALL' || activeCategory === 'CLIENTS' ? matchingClients.length : 0) +
    (activeCategory === 'ALL' || activeCategory === 'SITES' ? matchingSites.length : 0) +
    (activeCategory === 'ALL' || activeCategory === 'TASKS' ? matchingTasks.length : 0) +
    (activeCategory === 'ALL' || activeCategory === 'APPROVALS' ? matchingApprovals.length : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-amber-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search clients, WordPress sites, production tasks, approvals..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white text-slate-500 border border-slate-200 rounded shadow-2xs">
            ESC
          </kbd>
        </div>

        {/* Category Filters */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto text-xs">
          {(['ALL', 'CLIENTS', 'SITES', 'TASKS', 'APPROVALS'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results Container */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {totalResults === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">No matching resources found</p>
              <p className="text-xs text-slate-400 mt-1">Try querying a client name, domain, or task keyword.</p>
            </div>
          ) : (
            <>
              {/* Clients Section */}
              {(activeCategory === 'ALL' || activeCategory === 'CLIENTS') && matchingClients.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 px-2">
                    <Users className="w-3.5 h-3.5 text-amber-500" />
                    Clients ({matchingClients.length})
                  </div>
                  {matchingClients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => {
                        if (onSelectClient) onSelectClient(client.id);
                        onNavigateToTab('clients');
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-left transition-colors border border-transparent hover:border-slate-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 font-bold flex items-center justify-center text-xs border border-amber-200">
                          {client.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 group-hover:text-amber-600">
                            {client.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">{client.industry}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                    </button>
                  ))}
                </div>
              )}

              {/* Sites Section */}
              {(activeCategory === 'ALL' || activeCategory === 'SITES') && matchingSites.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 px-2">
                    <Globe className="w-3.5 h-3.5 text-emerald-500" />
                    WordPress Sites ({matchingSites.length})
                  </div>
                  {matchingSites.map((site) => (
                    <button
                      key={site.id}
                      onClick={() => {
                        if (onSelectSite) onSelectSite(site.id);
                        onNavigateToTab('sites');
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-left transition-colors border border-transparent hover:border-slate-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-xs border border-emerald-200">
                          WP
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                            {site.siteName}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">{site.websiteUrl}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {site.mcpStatus}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Tasks Section */}
              {(activeCategory === 'ALL' || activeCategory === 'TASKS') && matchingTasks.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 px-2">
                    <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                    Production Tasks ({matchingTasks.length})
                  </div>
                  {matchingTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => {
                        onNavigateToTab('tasks');
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-left transition-colors border border-transparent hover:border-slate-200 group"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600">
                          {task.title}
                        </div>
                        <div className="text-[10px] text-slate-500">{task.siteName}</div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                        {task.overallStatus}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Approvals Section */}
              {(activeCategory === 'ALL' || activeCategory === 'APPROVALS') && matchingApprovals.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 px-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
                    Pending Approvals ({matchingApprovals.length})
                  </div>
                  {matchingApprovals.map((approval) => (
                    <button
                      key={approval.id}
                      onClick={() => {
                        onNavigateToTab('approvals');
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-left transition-colors border border-transparent hover:border-slate-200 group"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-800 group-hover:text-rose-600">
                          {approval.title}
                        </div>
                        <div className="text-[10px] text-slate-500">{approval.siteName} • {approval.actionSummary}</div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        {approval.riskLevel} RISK
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
