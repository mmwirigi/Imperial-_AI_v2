import React from 'react';
import { ShieldCheck, Check, X, Globe, Lock } from 'lucide-react';
import { Site } from '../types';

interface SiteSelectorModalProps {
  isOpen: boolean;
  sites: Site[];
  activeSiteId: string;
  onSelectSite: (site: Site) => void;
  onClose: () => void;
}

export const SiteSelectorModal: React.FC<SiteSelectorModalProps> = ({
  isOpen,
  sites,
  activeSiteId,
  onSelectSite,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wider font-mono">
                Select Active Site Scope
              </h3>
              <p className="text-[11px] text-neutral-400">
                Client Isolation: Chat history, tasks, and MCP tools are locked to selected site
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 p-1 rounded-lg hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Site List */}
        <div className="space-y-2 overflow-y-auto flex-1 pr-1">
          {sites.map((site) => {
            const isSelected = site.id === activeSiteId;
            return (
              <button
                key={site.id}
                onClick={() => {
                  onSelectSite(site);
                  onClose();
                }}
                className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/60 shadow-sm'
                    : 'bg-neutral-950 hover:bg-neutral-800/80 border-neutral-800 text-neutral-300'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${isSelected ? 'text-amber-400' : 'text-neutral-100'}`}>
                      {site.siteName}
                    </span>
                    {site.isDemo && (
                      <span className="text-[9px] font-mono uppercase bg-neutral-900 text-amber-400/80 border border-amber-500/20 px-1 rounded">
                        Demo
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                    <Globe className="w-3 h-3 text-neutral-500" />
                    <span>{site.websiteUrl}</span>
                    <span>·</span>
                    <span className="text-neutral-500">{site.clientCompanyName}</span>
                  </div>
                  <div className="text-[10px] text-neutral-500">
                    {site.wordPressType} · {site.seoPlugin} · {site.pageBuilder}
                  </div>
                </div>

                <div className="flex items-center gap-2 pl-3">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      site.mcpStatus === 'CONNECTED' ? 'bg-emerald-500' : 'bg-neutral-600'
                    }`}
                  />
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            Cross-site execution impossible by design
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
