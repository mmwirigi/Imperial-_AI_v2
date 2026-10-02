import React, { useEffect, useState } from 'react';
import { syncManager } from '../services/dataSyncService';
import {
  SyncEngineMetrics,
  SyncOutboxOperation,
  SyncReconciliationReport
} from '../types';
import {
  X,
  Wifi,
  WifiOff,
  RefreshCw,
  Database,
  Layers,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  ArrowRight,
  HardDrive
} from 'lucide-react';

interface Props {
  onClose: () => void;
  onRefreshTasks?: () => void;
}

export const DataSyncStatusModal: React.FC<Props> = ({ onClose, onRefreshTasks }) => {
  const [metrics, setMetrics] = useState<SyncEngineMetrics>(syncManager.getMetrics());
  const [outbox, setOutbox] = useState<SyncOutboxOperation[]>(syncManager.getOutboxItems());
  const [history, setHistory] = useState<SyncReconciliationReport[]>(
    syncManager.getReconciliationHistory()
  );
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsub = syncManager.subscribe(m => {
      setMetrics(m);
      setOutbox(syncManager.getOutboxItems());
      setHistory(syncManager.getReconciliationHistory());
    });
    return unsub;
  }, []);

  const handleToggleOffline = () => {
    syncManager.setSimulatedOffline(!metrics.isSimulatedOffline);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await syncManager.reconcileWithServer();
      if (onRefreshTasks) {
        onRefreshTasks();
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl border ${
                metrics.isOnline
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              {metrics.isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    metrics.isOnline
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}
                >
                  {metrics.isOnline ? 'Online • Connected' : 'Offline • Caching Locally'}
                </span>
                <span className="text-xs text-neutral-400">Two-Way Data Sync</span>
              </div>
              <h2 className="text-lg font-bold text-neutral-100 mt-0.5">
                Production Task Sync &amp; Offline Reconciler
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls & Metrics Bar */}
        <div className="p-6 bg-neutral-900/60 border-b border-neutral-800 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
              <span className="text-neutral-400 font-semibold flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-neutral-400" />
                Cached Tasks
              </span>
              <div className="text-lg font-bold text-neutral-100">{metrics.cachedTasksCount}</div>
            </div>
            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
              <span className="text-neutral-400 font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Outbox Buffer
              </span>
              <div className="text-lg font-bold text-amber-400">{metrics.pendingOutboxCount} ops</div>
            </div>
            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
              <span className="text-neutral-400 font-semibold flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                Local Storage
              </span>
              <div className="text-lg font-bold text-neutral-100">
                {(metrics.storageUsageBytes / 1024).toFixed(1)} KB
              </div>
            </div>
            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
              <span className="text-neutral-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Sync Status
              </span>
              <div className="text-xs font-mono font-bold text-emerald-400 uppercase pt-1">
                {metrics.syncStatus}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleOffline}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  metrics.isSimulatedOffline
                    ? 'bg-amber-950 text-amber-300 border-amber-700'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
                }`}
              >
                {metrics.isSimulatedOffline ? 'Restore Network Connection' : 'Simulate Network Disconnection'}
              </button>
              <span className="text-[11px] text-neutral-500">
                {metrics.isSimulatedOffline ? 'Testing offline task queuing' : 'Live network active'}
              </span>
            </div>

            <button
              onClick={handleManualSync}
              disabled={isSyncing || !metrics.isOnline}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Reconciling Tasks...' : 'Sync & Reconcile Now'}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Outbox Change Buffer */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Outbox Change Queue ({outbox.length})
              </h3>
              <span className="text-neutral-500 text-[11px]">
                {outbox.length === 0 ? 'All changes delivered' : 'Changes buffered locally'}
              </span>
            </div>

            {outbox.length > 0 ? (
              <div className="space-y-2">
                {outbox.map(item => (
                  <div
                    key={item.id}
                    className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-800 text-neutral-300 font-bold">
                          {item.operationType}
                        </span>
                        <span className="font-bold text-neutral-200">Task #{item.taskId}</span>
                      </div>
                      <p className="text-neutral-500 font-mono text-[10px] mt-1">
                        Idempotency Key: {item.idempotencyKey.substring(0, 28)}...
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-neutral-950/60 rounded-xl border border-neutral-800/80 text-neutral-400 text-center">
                Outbox is clean. No pending production task changes awaiting server delivery.
              </div>
            )}
          </div>

          {/* Reconciliation History */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Recent Reconciliation History
            </h3>
            {history.length > 0 ? (
              <div className="space-y-2">
                {history.map(rep => (
                  <div key={rep.id} className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-200">Reconciliation {rep.id}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          {rep.status}
                        </span>
                      </div>
                      <span className="text-neutral-500 font-mono text-[10px]">{rep.reconciledAt}</span>
                    </div>
                    <div className="space-y-1 font-mono text-[11px] text-neutral-400">
                      {rep.details.map((detail, idx) => (
                        <div key={idx} className={detail.includes('[RECONCILE]') ? 'text-amber-400' : ''}>
                          {detail}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-neutral-950/60 rounded-xl border border-neutral-800/80 text-neutral-400 text-center">
                No past reconciliation sessions recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
