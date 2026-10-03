import React from 'react';
import {
  Briefcase,
  ChevronDown,
  Search,
  Bell,
  Smartphone,
  Monitor,
  Code,
  ShieldCheck,
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
  activeSite: _activeSite,
  onOpenTenantSelector,
  onOpenGlobalSearch,
  onOpenSyncModal,
  onOpenMasterCertification,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  viewMode,
  onSetViewMode,
  onToggleMobileMenu,
  currentAiModelName: _currentAiModelName = 'Gemini 2.0 Flash'
}) => {
  return (
    <header className="h-14 md:h-16 bg-white border-b border-slate-200/90 px-3 sm:px-6 flex items-center justify-between gap-3 shrink-0 z-20">
      {/* Left: Mobile Brand & Menu / Desktop Scope Selector */}
      <div className="flex items-center gap-2.5 min-w-0">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Toggle Menu"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Mobile Brand Title */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="w-7 h-7 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-xs shadow-2xs">
            I
          </div>
          <span className="font-bold text-slate-900 text-sm tracking-tight">Imperial AI</span>
        </div>

        {/* Desktop Scope Hierarchy Selector */}
        <div className="hidden md:flex items-center">
          {activeTenantContext ? (
            <button
              onClick={onOpenTenantSelector}
              title="Switch Client or Site Scope"
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100/90 border border-slate-200/90 rounded-xl text-left transition-all cursor-pointer group shadow-2xs text-xs max-w-xs"
            >
              <Briefcase className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="font-semibold text-slate-800 truncate max-w-[110px]">
                {activeTenantContext.client.name}
              </span>
              <span className="text-slate-300 font-mono">/</span>
              <span className="text-slate-500 truncate max-w-[110px]">
                {activeTenantContext.site ? activeTenantContext.site.siteName : 'All Sites'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-700 shrink-0 ml-1 transition-colors" />
            </button>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Workspace Console</span>
              <span className="text-slate-300">·</span>
              <span className="text-[11px] text-slate-400">Autonomous Fleet Operations</span>
            </div>
          )}
        </div>
      </div>

      {/* Middle: Clean Global Search Input (Desktop) */}
      <div className="flex-1 max-w-sm hidden lg:block">
        <button
          onClick={onOpenGlobalSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-600 text-xs transition-all shadow-2xs group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-500 transition-colors" />
            <span>Search fleet, tasks, clients...</span>
          </div>
          <kbd className="hidden xl:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white text-slate-500 border border-slate-200 rounded shadow-2xs font-semibold">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls: Neat, uncongested responsive controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Mobile Search Button */}
        <button
          onClick={onOpenGlobalSearch}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Search"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Sync Status Badge (Compact & Light Theme) */}
        <SyncStatusBadge onClick={onOpenSyncModal} />

        {/* Desktop View Switcher (Desktop vs Mobile Preview vs Code Explorer) */}
        <div className="hidden md:inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 text-xs">
          <button
            type="button"
            onClick={() => onSetViewMode('desktop')}
            title="Desktop Console View"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              viewMode === 'desktop'
                ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Monitor className="w-3.5 h-3.5 text-slate-500" />
            <span>Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => onSetViewMode('mobile')}
            title="Mobile Device Simulator (Pixel 8)"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              viewMode === 'mobile'
                ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-slate-500" />
            <span>Mobile</span>
          </button>
          <button
            type="button"
            onClick={() => onSetViewMode('code')}
            title="Architecture & Code Explorer"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              viewMode === 'code'
                ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-slate-500" />
            <span>Code</span>
          </button>
        </div>

        {/* Master Acceptance Suite Button (Large screens only) */}
        {onOpenMasterCertification && (
          <button
            onClick={onOpenMasterCertification}
            title="Open Master Phases 10-16 Certification Suite"
            className="hidden xl:flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-semibold transition-all shadow-2xs cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Phases 10–16</span>
          </button>
        )}

        {/* Notifications Button */}
        {onOpenNotifications && (
          <button
            onClick={onOpenNotifications}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Security & System Alerts"
            aria-label="Security and system alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
            )}
          </button>
        )}
      </div>
    </header>
  );
};
