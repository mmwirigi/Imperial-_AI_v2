import React from 'react';
import { Shield, ChevronDown, Smartphone, Monitor, Code } from 'lucide-react';
import { Site } from '../types';

interface TopBarProps {
  currentTab: string;
  activeSite: Site | null;
  onOpenSiteSelector: () => void;
  viewMode: 'mobile' | 'desktop' | 'code';
  onSetViewMode: (mode: 'mobile' | 'desktop' | 'code') => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  activeSite,
  onOpenSiteSelector,
  viewMode,
  onSetViewMode,
}) => {
  return (
    <header className="bg-neutral-950 border-b border-neutral-800 px-4 py-3 shrink-0">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Brand title & Company */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-neutral-100 tracking-tight text-sm md:text-base">
                IMPERIAL AI
              </span>
              <span className="text-[10px] font-mono uppercase bg-neutral-900 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded">
                Phase 1 Foundation
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              WordPress AI Command Center · Imperial Enterprise Kenya
            </p>
          </div>
        </div>

        {/* Zone 2: View Mode Switcher */}
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
            <span className="hidden sm:inline">Android Preview</span>
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
            <span className="hidden sm:inline">Console Dashboard</span>
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
            <span className="hidden sm:inline">Kotlin Source Tree</span>
          </button>
        </div>

        {/* Zone 3: Active Site Context Chip */}
        {activeSite && (
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
        )}
      </div>
    </header>
  );
};
