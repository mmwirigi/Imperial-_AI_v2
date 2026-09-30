import React from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  CheckSquare, 
  ShieldCheck,
  MessageSquare, 
  Settings,
  Activity,
  Beaker,
  Database,
  ShieldAlert
} from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  activeTasksBadgeCount?: number;
  pendingApprovalsBadgeCount?: number;
  securityEventsBadgeCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  activeTasksBadgeCount = 0,
  pendingApprovalsBadgeCount = 0,
  securityEventsBadgeCount = 0,
}) => {
  const tabs = [
    { id: 'home', label: 'Operations', icon: LayoutDashboard },
    { id: 'tasks', label: 'Task Engine', icon: CheckSquare, badge: activeTasksBadgeCount },
    { id: 'approvals', label: 'Approvals', icon: ShieldCheck, badge: pendingApprovalsBadgeCount },
    { id: 'bulk', label: 'Bulk Ops', icon: Database },
    { id: 'chat', label: 'Agent Chat', icon: MessageSquare },
    { id: 'security', label: 'Security Log', icon: ShieldAlert, badge: securityEventsBadgeCount },
    { id: 'monitoring', label: 'Monitoring', icon: Activity },
    { id: 'testing', label: 'Test Suite', icon: Beaker },
    { id: 'sites', label: 'Sites', icon: Layers },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="bg-neutral-950/95 backdrop-blur-md border-t border-neutral-800 px-2 py-1.5 shrink-0 overflow-x-auto">
      <div className="flex items-center justify-start sm:justify-center gap-1 min-w-max mx-auto px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 sm:px-3 rounded-lg transition-all ${
                isActive
                  ? 'text-amber-400 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'text-amber-400' : 'text-neutral-400'}`} />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2.5 bg-amber-500 text-neutral-950 text-[9px] font-bold px-1.5 py-0.2 rounded-full min-w-[15px] text-center">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] sm:text-[11px] mt-1 tracking-tight whitespace-nowrap">{tab.label}</span>
              {isActive && (
                <span className="w-1 h-1 bg-amber-400 rounded-full mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
