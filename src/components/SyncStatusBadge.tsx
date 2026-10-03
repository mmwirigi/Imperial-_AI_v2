import React, { useEffect, useState } from 'react';
import { syncManager } from '../services/dataSyncService';
import { SyncEngineMetrics } from '../types';
import { WifiOff, RefreshCw, CheckCircle2, Clock } from 'lucide-react';

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

  let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80';
  let icon = <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />;
  let label = 'Synced';

  if (!metrics.isOnline) {
    badgeColor = 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/80';
    icon = <WifiOff className="w-3 h-3 text-amber-600 shrink-0" />;
    label = metrics.pendingOutboxCount > 0
      ? `Offline (${metrics.pendingOutboxCount})`
      : 'Offline';
  } else if (metrics.syncStatus === 'SYNCING') {
    badgeColor = 'bg-sky-50 text-sky-700 border-sky-200 animate-pulse hover:bg-sky-100/80';
    icon = <RefreshCw className="w-3 h-3 text-sky-600 animate-spin shrink-0" />;
    label = 'Syncing...';
  } else if (metrics.pendingOutboxCount > 0) {
    badgeColor = 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/80';
    icon = <Clock className="w-3 h-3 text-amber-600 shrink-0" />;
    label = `${metrics.pendingOutboxCount} Queued`;
  }

  return (
    <button
      onClick={onClick}
      title="Data Synchronization & Offline Reconciler Status. Click for details."
      className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors shadow-2xs ${badgeColor}`}
    >
      {icon}
      <span className="hidden sm:inline font-mono">{label}</span>
    </button>
  );
};

