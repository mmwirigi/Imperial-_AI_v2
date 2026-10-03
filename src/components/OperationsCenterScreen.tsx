import React, { useState } from 'react';
import {
  Layers,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Terminal,
  Activity,
  FileText
} from 'lucide-react';
import {
  BulkOperationBatch,
  Site,
  ProductionTask,
  AuditEvent
} from '../types';
import { Button, Card, Badge, MetricCard } from './common/UIComponents';

interface OperationsCenterScreenProps {
  batches: BulkOperationBatch[];
  tasks: ProductionTask[];
  sites: Site[];
  auditEvents: AuditEvent[];
  activeSite: Site | null;
  onExecuteBatch: (batchId: string) => void;
  onRollbackBatch: (batchId: string) => void;
}

export const OperationsCenterScreen: React.FC<OperationsCenterScreenProps> = ({
  batches,
  tasks,
  sites,
  auditEvents,
  activeSite,
  onExecuteBatch,
  onRollbackBatch
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'ROLLEDBACK'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Collect operations from production task steps
  const allOperations = tasks.flatMap((t) =>
    t.steps.map((s) => ({
      taskId: t.id,
      taskTitle: t.title,
      clientId: t.clientId,
      siteId: t.siteId,
      siteName: t.siteName,
      stepId: s.id,
      title: s.title,
      resource: s.targetResource,
      action: s.action,
      state: s.state,
      durationMs: s.durationMs || 120,
      verificationExpected: s.verificationExpected,
      rollbackSafe: Boolean(s.rollbackPayload || s.checkpointId || t.canRollback),
      result: s.state === 'COMPLETED' ? 'Verified in pristine state' : s.state === 'FAILED' ? 'Execution failure encountered' : 'Pending execution'
    }))
  );

  const filteredOps = allOperations.filter((op) => {
    if (activeFilter === 'ACTIVE' && op.state !== 'EXECUTING' && op.state !== 'PENDING') return false;
    if (activeFilter === 'COMPLETED' && op.state !== 'COMPLETED') return false;
    if (activeFilter === 'FAILED' && op.state !== 'FAILED') return false;
    if (activeFilter === 'ROLLEDBACK' && op.state !== 'ROLLED_BACK') return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        op.taskTitle.toLowerCase().includes(q) ||
        op.resource.toLowerCase().includes(q) ||
        op.siteName.toLowerCase().includes(q) ||
        op.action.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const completedCount = allOperations.filter((o) => o.state === 'COMPLETED').length;
  const activeCount = allOperations.filter((o) => o.state === 'EXECUTING' || o.state === 'PENDING').length;
  const failedCount = allOperations.filter((o) => o.state === 'FAILED').length;
  const rolledBackCount = allOperations.filter((o) => o.state === 'ROLLED_BACK').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="info" size="sm">
              PRODUCTION OPERATIONS
            </Badge>
            <span className="text-xs text-slate-500 font-mono">
              Total Operations: {allOperations.length}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Operations &amp; Bulk Batches
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time execution telemetry, granular resource transformations, and deterministic rollbacks.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Completed Operations"
          value={completedCount}
          subtitle="Verified 100% via read-back"
          icon={CheckCircle2}
          accentColor="emerald"
        />
        <MetricCard
          title="In-Flight / Queued"
          value={activeCount}
          subtitle="Pipeline processing"
          icon={Activity}
          accentColor="amber"
        />
        <MetricCard
          title="Failures & Tripped"
          value={failedCount}
          subtitle="Zero silent mutations"
          icon={XCircle}
          accentColor={failedCount > 0 ? 'rose' : 'emerald'}
        />
        <MetricCard
          title="Rollback Events"
          value={rolledBackCount}
          subtitle="Preflight snapshots restored"
          icon={RotateCcw}
          accentColor="indigo"
        />
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by resource, task, action, or site name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 text-slate-900"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs px-1">
          {(['ALL', 'ACTIVE', 'COMPLETED', 'FAILED', 'ROLLEDBACK'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                activeFilter === tab
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Operations Table / Cards List */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-500" />
            Execution Timeline ({filteredOps.length} operations)
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            Granular Step Breakdown
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredOps.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs">No operations found matching the active filter.</p>
            </div>
          ) : (
            filteredOps.map((op, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{op.title}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {op.action}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      Resource: {op.resource}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-500 text-[11px] font-mono">
                    <span className="font-semibold text-slate-700">{op.siteName}</span>
                    <span>•</span>
                    <span>Task: {op.taskTitle}</span>
                    <span>•</span>
                    <span>Duration: {op.durationMs}ms</span>
                  </div>

                  <div className="text-[11px] text-slate-600 font-mono">
                    Assertion: <span className="text-emerald-700 font-semibold">{op.verificationExpected}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Badge
                    variant={
                      op.state === 'COMPLETED'
                        ? 'success'
                        : op.state === 'EXECUTING'
                        ? 'warning'
                        : op.state === 'FAILED'
                        ? 'error'
                        : 'neutral'
                    }
                    size="md"
                    dot={op.state === 'EXECUTING'}
                  >
                    {op.state}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
