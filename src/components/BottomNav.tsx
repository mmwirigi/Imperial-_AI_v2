import React from 'react';
import { LayoutDashboard, Layers, CheckSquare, MessageSquare, Settings } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  activeTasksBadgeCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  activeTasksBadgeCount = 0,
}) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: LayoutDashboard },
    { id: 'sites', label: 'Sites', icon: Layers },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: activeTasksBadgeCount },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="bg-neutral-950/95 backdrop-blur-md border-t border-neutral-800 px-2 py-1.5 shrink-0">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-all ${
                isActive
                  ? 'text-amber-400 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-amber-400' : 'text-neutral-400'}`} />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2.5 bg-amber-500 text-neutral-950 text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[11px] mt-1 tracking-tight">{tab.label}</span>
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
