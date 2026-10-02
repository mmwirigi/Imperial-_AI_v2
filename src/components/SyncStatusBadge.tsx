import React, { useEffect, useState } from 'react';
import { syncManager } from '../services/dataSyncService';
import { SyncEngineMetrics } from '../types';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, Clock } from 'lucide-react';

interface Props {
  onClick: () => void;
}

export const SyncStatusBadge: React.FC<Props> = ({ onClick }) => {
  const [metrics, setMetrics] = useState<SyncEngineMetrics>(syncManager.getMetrics());

  useEffect(() => {
    const unsubscribe = syncManager.subscribe(updated => {
      setMetrics(updated);
    });
    return unsubscribe;
  }, []);

  let badgeColor = 'bg-emerald-950/80 text-emerald-400 border-emerald-800';
  let icon = <CheckCircle2 className="w-3 h-3 text-emerald-400" />;
  let label = 'Synced';

  if (!metrics.isOnline) {
    badgeColor = 'bg-amber-950/80 text-amber-400 border-amber-800';
    icon = <WifiOff className="w-3 h-3 text-amber-400" />;
    label = metrics.pendingOutboxCount > 0
      ? `Offline (${metrics.pendingOutboxCount} queued)`
      : 'Offline (Cached)';
  } else if (metrics.syncStatus === 'SYNCING') {
    badgeColor = 'bg-blue-950/80 text-blue-400 border-blue-800 animate-pulse';
    icon = <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" />;
    label = 'Reconciling...';
  } else if (metrics.pendingOutboxCount > 0) {
    badgeColor = 'bg-amber-950/80 text-amber-400 border-amber-800';
    icon = <Clock className="w-3 h-3 text-amber-400" />;
    label = `${metrics.pendingOutboxCount} Pending Sync`;
  }

  return (
    <button
      onClick={onClick}
      title="Data Synchronization & Offline Reconciler Status. Click for details."
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border transition-all hover:brightness-125 ${badgeColor}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};
