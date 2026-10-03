import React from 'react';
import {
  LayoutDashboard,
  Users,
  Bot,
  CheckSquare,
  ShieldCheck,
  MoreHorizontal
} from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenMoreMenu: () => void;
  activeTasksBadgeCount?: number;
  pendingApprovalsBadgeCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenMoreMenu,
  activeTasksBadgeCount = 0,
  pendingApprovalsBadgeCount = 0
}) => {
  const primaryTabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'assistant', label: 'AI', icon: Bot },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: activeTasksBadgeCount },
    { id: 'approvals', label: 'Approvals', icon: ShieldCheck, badge: pendingApprovalsBadgeCount }
  ];

  return (
    <nav className="md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 py-1 shrink-0 z-30 shadow-lg">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {primaryTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            currentTab === tab.id ||
            (tab.id === 'overview' && currentTab === 'home') ||
            (tab.id === 'assistant' && currentTab === 'chat');

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all min-h-[48px] select-none ${
                isActive ? 'text-amber-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-amber-600' : 'text-slate-500'}`} />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-amber-500 text-slate-950 text-[9px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center shadow-xs">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 font-medium">{tab.label}</span>
              {isActive && <span className="w-1 h-1 bg-amber-500 rounded-full mt-0.5" />}
            </button>
          );
        })}

        {/* More Menu Trigger */}
        <button
          onClick={onOpenMoreMenu}
          className="flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all min-h-[48px] text-slate-500 hover:text-slate-800 select-none"
        >
          <MoreHorizontal className="w-5 h-5 text-slate-500" />
          <span className="text-[10px] tracking-tight mt-0.5 font-medium">More</span>
        </button>
      </div>
    </nav>
  );
};
