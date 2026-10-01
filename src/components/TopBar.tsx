import React from 'react';
import { Shield, ChevronDown, Smartphone, Monitor, Code, Building2, Briefcase, Globe, UserCheck, Sliders } from 'lucide-react';
import { Site, ActiveTenantContext } from '../types';

interface TopBarProps {
  currentTab: string;
  activeSite: Site | null;
  activeTenantContext?: ActiveTenantContext | null;
  onOpenSiteSelector: () => void;
  onOpenTenantContextModal?: () => void;
  viewMode: 'mobile' | 'desktop' | 'code';
  onSetViewMode: (mode: 'mobile' | 'desktop' | 'code') => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  activeSite,
  activeTenantContext,
  onOpenSiteSelector,
  onOpenTenantContextModal,
  viewMode,
  onSetViewMode,
}) => {
  return (
    <header className="bg-neutral-950 border-b border-neutral-800 px-4 py-2.5 shrink-0">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Zone 1: Brand title & Company */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-neutral-100 tracking-tight text-sm md:text-base">
                IMPERIAL AI
              </span>
              <span className="text-[10px] font-mono uppercase bg-neutral-900 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold">
                Phase 9 Multi-Tenant
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 hidden sm:block">
              Multi-Tenant SaaS Platform &amp; Autonomous WordPress Operations
            </p>
          </div>
        </div>

        {/* Zone 2: Multi-Tier Operational Hierarchy Context Bar */}
        {activeTenantContext ? (
          <button
            onClick={onOpenTenantContextModal || onOpenSiteSelector}
            title="Click to switch Organization, Client or WordPress Site Scope"
            className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900/90 hover:bg-neutral-850 border border-amber-500/40 rounded-xl transition-all shadow-sm group text-left max-w-md"
          >
            <div className="flex items-center gap-1.5 text-xs">
              {/* Organization */}
              <span className="flex items-center gap-1 text-neutral-400 font-medium truncate max-w-[110px]">
                <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{activeTenantContext.organization.name}</span>
              </span>
              <span className="text-neutral-600 font-mono text-[10px]">↓</span>
              {/* Client */}
              <span className="flex items-center gap-1 text-amber-300 font-bold truncate max-w-[120px]">
                <Briefcase className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">{activeTenantContext.client.name}</span>
              </span>
              <span className="text-neutral-600 font-mono text-[10px]">↓</span>
              {/* Site */}
              <span className="flex items-center gap-1 text-emerald-400 font-medium truncate max-w-[110px]">
                <Globe className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">{activeTenantContext.site ? activeTenantContext.site.siteName : 'Default Site'}</span>
              </span>
            </div>

            <div className="flex items-center gap-1 pl-2 border-l border-neutral-800 shrink-0">
              <span className={`w-2 h-2 rounded-full ${activeTenantContext.connectionStatus === 'CONNECTED' ? 'bg-emerald-400' : 'bg-neutral-500'}`} />
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 group-hover:text-amber-400 transition-colors" />
            </div>
          </button>
        ) : activeSite ? (
          <button
            onClick={onOpenSiteSelector}
            className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 px-3 py-1.5 rounded-lg transition-colors text-left"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <div className="hidden md:block">
              <div className="text-[10px] uppercase font-mono tracking-wider text-amber-400">
                Active Site Scope
              </div>
              <div className="text-xs font-medium text-neutral-200 max-w-[160px] truncate">
                {activeSite.siteName}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
          </button>
        ) : null}

        {/* Zone 3: View Mode Switcher & User Role */}
        <div className="flex items-center gap-2">
          {activeTenantContext && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-mono">
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-neutral-300 font-medium truncate max-w-[100px]">{activeTenantContext.user.displayName.split(' ')[0]}</span>
              <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-400 rounded text-[9px] font-bold">
                {activeTenantContext.membership.role}
              </span>
            </div>
          )}

          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5">
            <button
              onClick={() => onSetViewMode('mobile')}
              title="Android Device Viewport (Pixel 8 Preview)"
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'mobile'
                  ? 'bg-amber-500 text-neutral-950 font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Android</span>
            </button>
            <button
              onClick={() => onSetViewMode('desktop')}
              title="Command Center Desktop Console"
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'desktop'
                  ? 'bg-amber-500 text-neutral-950 font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Console</span>
            </button>
            <button
              onClick={() => onSetViewMode('code')}
              title="Android Kotlin Codebase & Architecture Explorer"
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'code'
                  ? 'bg-amber-500 text-neutral-950 font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kotlin</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
