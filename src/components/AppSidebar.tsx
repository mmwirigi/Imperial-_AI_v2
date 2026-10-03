import React from 'react';
import {
  LayoutDashboard,
  Users,
  Globe,
  Bot,
  CheckSquare,
  ShieldCheck,
  Activity,
  Layers,
  Plug,
  TrendingUp,
  Cpu,
  ShieldAlert,
  FileCheck2,
  Settings,
  ChevronRight,
  LogOut,
  Sparkles,
  Shield
} from 'lucide-react';
import { ActiveTenantContext } from '../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  activeTenantContext?: ActiveTenantContext | null;
  activeTasksBadgeCount?: number;
  pendingApprovalsBadgeCount?: number;
  securityEventsBadgeCount?: number;
  reliabilityBadgeCount?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const AppSidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeTenantContext,
  activeTasksBadgeCount = 0,
  pendingApprovalsBadgeCount = 0,
  securityEventsBadgeCount = 0,
  reliabilityBadgeCount = 0,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'sites', label: 'Sites', icon: Globe },
    { id: 'assistant', label: 'AI Assistant', icon: Bot },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: activeTasksBadgeCount, badgeColor: 'amber' },
    { id: 'approvals', label: 'Approvals', icon: ShieldCheck, badge: pendingApprovalsBadgeCount, badgeColor: 'rose' },
    { id: 'operations', label: 'Operations', icon: Layers },
    { id: 'integrations', label: 'Integrations', icon: Plug },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'monitoring', label: 'Monitoring', icon: Cpu, badge: reliabilityBadgeCount, badgeColor: 'amber' },
    { id: 'security', label: 'Security', icon: ShieldAlert, badge: securityEventsBadgeCount, badgeColor: 'rose' },
    { id: 'audit', label: 'Audit', icon: FileCheck2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col bg-white border-r border-slate-200/90 h-screen transition-all duration-300 z-30 shrink-0 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 bg-white">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 shrink-0 shadow-2xs">
            <Shield className="w-5 h-5 fill-amber-500/20" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 tracking-tight text-sm">
                  IMPERIAL AI
                </span>
                <span className="text-[9px] font-mono uppercase bg-amber-100 text-amber-900 px-1 py-0.2 rounded font-bold">
                  PROD
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium truncate">
                WordPress AI Platform
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {!isCollapsed && (
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Platform Navigation
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentTab === item.id ||
            (item.id === 'overview' && currentTab === 'home') ||
            (item.id === 'assistant' && currentTab === 'chat');

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              title={item.label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative ${
                isActive
                  ? 'bg-amber-50 text-amber-950 font-bold border border-amber-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-amber-600' : 'text-slate-400 group-hover:text-slate-600'
                }`}
              />

              {!isCollapsed && (
                <>
                  <span className="truncate flex-1 text-left">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        item.badgeColor === 'rose'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}

              {isActive && !isCollapsed && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 absolute right-2" />
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Profile / Tenant Context */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/70">
        {!isCollapsed ? (
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-xs shrink-0">
                {activeTenantContext ? activeTenantContext.user.displayName.substring(0, 2).toUpperCase() : 'MM'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-800 truncate">
                  {activeTenantContext ? activeTenantContext.user.displayName : 'Martin Mwirigi'}
                </div>
                <div className="text-[10px] text-slate-400 font-medium truncate">
                  {activeTenantContext ? activeTenantContext.membership.role : 'Super Admin'}
                </div>
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Connected" />
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-xs">
              {activeTenantContext ? activeTenantContext.user.displayName.substring(0, 2).toUpperCase() : 'MM'}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
