import React from 'react';
import {
  Building2,
  Briefcase,
  Globe,
  ChevronDown,
  Search,
  Bell,
  Sparkles,
  Smartphone,
  Monitor,
  Code,
  ShieldCheck,
  CheckCircle2,
  Menu
} from 'lucide-react';
import { Site, ActiveTenantContext } from '../types';
import { SyncStatusBadge } from './SyncStatusBadge';

interface AppHeaderProps {
  activeTenantContext?: ActiveTenantContext | null;
  activeSite: Site | null;
  onOpenTenantSelector: () => void;
  onOpenGlobalSearch: () => void;
  onOpenSyncModal: () => void;
  onOpenMasterCertification?: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
  viewMode: 'desktop' | 'mobile' | 'code';
  onSetViewMode: (mode: 'desktop' | 'mobile' | 'code') => void;
  onToggleMobileMenu?: () => void;
  currentAiModelName?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeTenantContext,
  activeSite,
  onOpenTenantSelector,
  onOpenGlobalSearch,
  onOpenSyncModal,
  onOpenMasterCertification,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  viewMode,
  onSetViewMode,
  onToggleMobileMenu,
  currentAiModelName = 'Gemini 2.0 Flash'
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0 z-20">
      {/* Left: Mobile Menu Trigger & Multi-Tier Hierarchy Breadcrumb Context */}
      <div className="flex items-center gap-3 min-w-0">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Visually Obvious Hierarchy Context Bar */}
        {activeTenantContext ? (
          <button
            onClick={onOpenTenantSelector}
            title="Switch Organization, Client or Site Scope"
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100/90 border border-slate-200 rounded-xl text-left transition-all group shadow-2xs max-w-full sm:max-w-md cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-xs">
              {/* Organization */}
              <span className="hidden lg:flex items-center gap-1 text-slate-500 font-semibold truncate max-w-[120px]">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{activeTenantContext.organization.name}</span>
              </span>
              <span className="hidden lg:inline text-slate-300 font-mono text-[10px]">↓</span>

              {/* Client */}
              <span className="flex items-center gap-1 text-slate-900 font-bold truncate max-w-[140px]">
                <Briefcase className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="truncate">{activeTenantContext.client.name}</span>
              </span>
              <span className="text-slate-300 font-mono text-[10px]">↓</span>

              {/* Site Domain & Connection */}
              <span className="flex items-center gap-1 text-emerald-700 font-medium truncate max-w-[130px]">
                <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">
                  {activeTenantContext.site ? activeTenantContext.site.siteName : 'Primary Site'}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-1 pl-2 border-l border-slate-200 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Connected" />
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors" />
            </div>
          </button>
        ) : (
          <div className="text-xs font-semibold text-slate-600">Enterprise AI Command Center</div>
        )}
      </div>

      {/* Middle: Global Search Trigger */}
      <div className="flex-1 max-w-md hidden md:block">
        <button
          onClick={onOpenGlobalSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-600 text-xs transition-all shadow-2xs group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-500 transition-colors" />
            <span>Search clients, sites, tasks, operations...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white text-slate-500 border border-slate-200 rounded shadow-2xs font-semibold">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Mobile Search Button */}
        <button
          onClick={onOpenGlobalSearch}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Two-Way Data Sync Status Pill */}
        <SyncStatusBadge onClick={onOpenSyncModal} />

        {/* Master Acceptance Suite Button */}
        {onOpenMasterCertification && (
          <button
            onClick={onOpenMasterCertification}
            title="Open Master Phases 10-16 Certification Suite"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-semibold transition-all shadow-2xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Phases 10–16</span>
          </button>
        )}

        {/* View Mode Switcher */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
          <button
            onClick={() => onSetViewMode('desktop')}
            title="Command Center Desktop Console"
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
              viewMode === 'desktop'
                ? 'bg-white text-slate-900 font-bold shadow-2xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Console</span>
          </button>
          <button
            onClick={() => onSetViewMode('mobile')}
            title="Android Device Viewport (Pixel 8 Preview)"
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
              viewMode === 'mobile'
                ? 'bg-white text-slate-900 font-bold shadow-2xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Android</span>
          </button>
          <button
            onClick={() => onSetViewMode('code')}
            title="Kotlin Codebase Architecture"
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
              viewMode === 'code'
                ? 'bg-white text-slate-900 font-bold shadow-2xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Kotlin</span>
          </button>
        </div>

        {/* Notifications */}
        {onOpenNotifications && (
          <button
            onClick={onOpenNotifications}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
            )}
          </button>
        )}
      </div>
    </header>
  );
};
