import React, { useState } from 'react';
import { 
  Building2, 
  Briefcase, 
  Globe, 
  Shield, 
  Check, 
  AlertTriangle, 
  X, 
  ArrowRight,
  Layers,
  RefreshCw,
  Lock,
  UserCheck
} from 'lucide-react';
import { Organization, ClientCompany, Site, ActiveTenantContext } from '../types';

interface TenantContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeContext: ActiveTenantContext;
  organizations: Organization[];
  clients: ClientCompany[];
  sites: Site[];
  onSwitchContext: (targetClientId: string) => Promise<boolean>;
  activeRunningTasksCount?: number;
}

export const TenantContextModal: React.FC<TenantContextModalProps> = ({
  isOpen,
  onClose,
  activeContext,
  organizations,
  clients,
  sites,
  onSwitchContext,
  activeRunningTasksCount = 0,
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string>(activeContext.client.id);
  const [isSwitching, setIsSwitching] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentOrg = activeContext.organization;
  const orgClients = clients.filter((c) => c.organizationId === currentOrg.id && c.status === 'ACTIVE');
  const targetClient = clients.find((c) => c.id === selectedClientId) || activeContext.client;
  const targetClientSites = sites.filter((s) => s.clientId === targetClient.id);

  const isChanging = selectedClientId !== activeContext.client.id;

  const handleConfirmSwitch = async () => {
    if (!isChanging) {
      onClose();
      return;
    }

    setIsSwitching(true);
    setErrorNotice(null);
    try {
      const success = await onSwitchContext(selectedClientId);
      if (success) {
        onClose();
      } else {
        setErrorNotice('Failed to switch client context. Permission or tenant verification rejected.');
      }
    } catch (err: any) {
      setErrorNotice(err?.message || 'Context switch error');
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                Operational Context &amp; Client Selector
              </h2>
              <p className="text-[11px] text-neutral-400">
                Phase 9 Multi-Tenant Isolation: Select client scope to target sites and MCP daemons.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Current Active Context Breadcrumbs */}
          <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-3.5 space-y-2">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
              Active Resolved Hierarchy
            </span>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded text-neutral-200 font-semibold">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                {activeContext.organization.name}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-600" />
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded text-amber-400 font-bold">
                <Briefcase className="w-3.5 h-3.5" />
                {activeContext.client.name}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-neutral-600" />
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded text-emerald-400 font-medium">
                <Globe className="w-3.5 h-3.5" />
                {activeContext.site ? activeContext.site.siteName : 'Default Site'}
              </span>
            </div>
          </div>

          {/* User Role & Permission Scope */}
          <div className="flex items-center justify-between text-xs px-3 py-2 bg-neutral-950 rounded-lg border border-neutral-800/60 font-mono">
            <span className="text-neutral-400 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              Operator: <strong className="text-neutral-200">{activeContext.user.displayName}</strong>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
              ROLE: {activeContext.membership.role} ({activeContext.permissions.length} PERMISSIONS)
            </span>
          </div>

          {/* Client Selection List */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-300 block">
              Select Client Scope within {currentOrg.name}:
            </label>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {orgClients.map((client) => {
                const isSelected = selectedClientId === client.id;
                const clientSiteCount = sites.filter((s) => s.clientId === client.id).length;
                return (
                  <div
                    key={client.id}
                    onClick={() => setSelectedClientId(client.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/80 shadow-sm'
                        : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                      }`}>
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-neutral-200">{client.name}</h4>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
                            {client.id}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5">{client.industry}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-neutral-900 text-neutral-400 border border-neutral-800 rounded">
                        {clientSiteCount} {clientSiteCount === 1 ? 'Site' : 'Sites'}
                      </span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Target Client Site Preview */}
          <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-800 text-xs space-y-1.5">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
              Associated Sites for {targetClient.name}:
            </span>
            <div className="flex flex-wrap gap-2">
              {targetClientSites.map((site) => (
                <div key={site.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded text-neutral-300 text-[11px]">
                  <span className={`w-2 h-2 rounded-full ${site.mcpStatus === 'CONNECTED' ? 'bg-emerald-400' : 'bg-neutral-600'}`} />
                  <span className="font-semibold">{site.siteName}</span>
                  <span className="text-neutral-500 text-[10px]">({site.websiteUrl.replace('https://', '')})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Context Switch Warning if Active Tasks exist */}
          {isChanging && (
            <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-3 text-xs space-y-1.5 text-amber-200">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Phase 9 Context Switch Safety Protocol:</span>
              </div>
              <ul className="text-[11px] text-amber-300/80 list-disc pl-5 space-y-0.5">
                <li>Transient AI chat memory and uncommitted drafts will be securely purged.</li>
                <li>{activeRunningTasksCount > 0 ? `${activeRunningTasksCount} in-flight tasks will be cleanly paused before handoff.` : 'No tasks currently running.'}</li>
                <li>Tenant permissions and site locks will be cryptographically revalidated for {targetClient.name}.</li>
              </ul>
            </div>
          )}

          {errorNotice && (
            <div className="p-3 bg-rose-950/50 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorNotice}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirmSwitch}
            disabled={isSwitching}
            className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 text-xs font-bold rounded-xl transition-all shadow-md"
          >
            {isSwitching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
            {isChanging ? `Switch to ${targetClient.name}` : 'Confirm Active Context'}
          </button>
        </div>

      </div>
    </div>
  );
};
