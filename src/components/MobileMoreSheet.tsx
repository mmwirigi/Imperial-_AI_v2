import React from 'react';
import {
  Globe,
  Layers,
  Plug,
  TrendingUp,
  Cpu,
  ShieldAlert,
  FileCheck2,
  Settings,
  ShieldCheck,
  X,
  ArrowRight
} from 'lucide-react';

interface MobileMoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: string) => void;
  onOpenMasterCertification?: () => void;
}

export const MobileMoreSheet: React.FC<MobileMoreSheetProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onOpenMasterCertification
}) => {
  if (!isOpen) return null;

  const moreItems = [
    { id: 'sites', label: 'WordPress Sites', desc: 'Health, capabilities & plugins', icon: Globe, color: 'text-emerald-600' },
    { id: 'operations', label: 'Operations & Bulk', desc: 'Active execution & batch runs', icon: Layers, color: 'text-blue-600' },
    { id: 'integrations', label: 'API & Integrations', desc: 'Connected tools & webhooks', icon: Plug, color: 'text-amber-600' },
    { id: 'analytics', label: 'Predictive Analytics', desc: 'Forecasting & anomaly charts', icon: TrendingUp, color: 'text-purple-600' },
    { id: 'monitoring', label: 'Monitoring & Health', desc: 'MCP status & reliability center', icon: Cpu, color: 'text-slate-600' },
    { id: 'security', label: 'Security Center', desc: 'Blocked threats & invariants', icon: ShieldAlert, color: 'text-rose-600' },
    { id: 'audit', label: 'Audit Trail', desc: 'Cryptographic hash chain', icon: FileCheck2, color: 'text-indigo-600' },
    { id: 'settings', label: 'Settings & White-Label', desc: 'SaaS plans & preferences', icon: Settings, color: 'text-slate-600' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-xs md:hidden animate-in fade-in">
      <div className="bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-amber-500 rounded-full" />
            <h3 className="text-sm font-bold text-slate-900">All Modules &amp; Tools</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-1.5 flex-1">
          {moreItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-slate-100/80 active:bg-slate-100 text-left min-h-[52px]"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl bg-slate-100 ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{item.label}</div>
                    <div className="text-[11px] text-slate-500">{item.desc}</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300" />
              </button>
            );
          })}

          {onOpenMasterCertification && (
            <div className="pt-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenMasterCertification();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 font-bold text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                  <span>Phases 10–16 Acceptance Suite</span>
                </div>
                <span className="text-[10px] bg-amber-200/80 px-2 py-0.5 rounded-md font-mono">26/26 PASS</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
