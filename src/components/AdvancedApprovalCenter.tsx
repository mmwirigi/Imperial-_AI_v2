import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  History, 
  Search, 
  Check, 
  X, 
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  Lock,
  Database,
  RotateCcw,
  Hash,
  Sliders,
  AlertOctagon,
  Eye,
  UserCheck,
  CheckSquare,
  Square,
  FileSearch,
  Zap,
  RefreshCw,
  Info
} from 'lucide-react';
import { AdvancedApprovalItem, ToolRiskLevel, Site, ApprovalStatus } from '../types';

interface AdvancedApprovalCenterProps {
  approvals: AdvancedApprovalItem[];
  activeSite: Site | null;
  onApprove: (id: string, comments?: string) => void;
  onReject: (id: string, comments?: string) => void;
  onApproveAllPending: () => void;
  onRejectAllPending?: () => void;
  onToggleObjectApproval?: (approvalId: string, objectId: string, status: 'APPROVED' | 'REJECTED') => void;
  onBatchSetObjectsApproval?: (approvalId: string, objectIds: string[], status: 'APPROVED' | 'REJECTED') => void;
  onInvalidateApproval?: (approvalId: string, reason: string) => void;
}

export const AdvancedApprovalCenter: React.FC<AdvancedApprovalCenterProps> = ({
  approvals,
  activeSite,
  onApprove,
  onReject,
  onApproveAllPending,
  onRejectAllPending,
  onToggleObjectApproval,
  onBatchSetObjectsApproval,
  onInvalidateApproval,
}) => {
  const [selectedApproval, setSelectedApproval] = useState<AdvancedApprovalItem | null>(approvals[0] || null);
  const [operatorComment, setOperatorComment] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'DECIDED'>('PENDING');
  const [selectedObjectIds, setSelectedObjectIds] = useState<string[]>([]);
  const [inspectingObject, setInspectingObject] = useState<{
    id: string;
    name: string;
    resourceType: string;
    currentVal: string;
    proposedVal: string;
    risk: ToolRiskLevel;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
  } | null>(null);

  const siteApprovals = activeSite
    ? approvals.filter((a) => a.siteId === activeSite.id)
    : approvals;

  const filteredApprovals = siteApprovals.filter((a) => {
    if (activeFilter === 'PENDING') return a.status === 'PENDING';
    if (activeFilter === 'DECIDED') return a.status !== 'PENDING';
    return true;
  });

  const pendingCount = siteApprovals.filter((a) => a.status === 'PENDING').length;
  const current = selectedApproval || filteredApprovals[0] || null;

  const getRiskBadge = (risk: ToolRiskLevel) => {
    switch (risk) {
      case 'DESTRUCTIVE':
        return { label: 'CRITICAL / DESTRUCTIVE', style: 'bg-rose-950 text-rose-300 border-rose-800' };
      case 'HIGH_RISK_WRITE':
        return { label: 'HIGH RISK WRITE', style: 'bg-amber-950/80 text-amber-300 border-amber-800' };
      case 'LOW_RISK_WRITE':
        return { label: 'LOW RISK WRITE', style: 'bg-blue-950 text-blue-300 border-blue-800' };
      default:
        return { label: 'READ-ONLY', style: 'bg-neutral-800 text-neutral-300 border-neutral-700' };
    }
  };

  const getStatusBadge = (status: ApprovalStatus) => {
    switch (status) {
      case 'APPROVED':
        return { label: 'APPROVED', style: 'bg-emerald-950 text-emerald-400 border-emerald-800' };
      case 'REJECTED':
        return { label: 'REJECTED', style: 'bg-rose-950 text-rose-400 border-rose-800' };
      case 'EXPIRED':
        return { label: 'EXPIRED (TTL EXCEEDED)', style: 'bg-neutral-900 text-neutral-400 border-neutral-700' };
      case 'INVALIDATED_TAMPERED':
        return { label: 'INVALIDATED / TAMPERED', style: 'bg-rose-950 text-rose-300 border-rose-600 font-bold animate-pulse' };
      default:
        return { label: 'AWAITING OPERATOR DECISION', style: 'bg-amber-950/90 text-amber-400 border-amber-800' };
    }
  };

  // Multi-select handlers for objects
  const handleToggleSelectObject = (id: string) => {
    setSelectedObjectIds((prev) => 
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllObjects = () => {
    if (!current?.affectedObjects) return;
    if (selectedObjectIds.length === current.affectedObjects.length) {
      setSelectedObjectIds([]);
    } else {
      setSelectedObjectIds(current.affectedObjects.map((o) => o.id));
    }
  };

  const handleApproveSelectedObjects = () => {
    if (!current || selectedObjectIds.length === 0) return;
    if (onBatchSetObjectsApproval) {
      onBatchSetObjectsApproval(current.id, selectedObjectIds, 'APPROVED');
    } else if (onToggleObjectApproval) {
      selectedObjectIds.forEach((id) => onToggleObjectApproval(current.id, id, 'APPROVED'));
    }
    setSelectedObjectIds([]);
  };

  const handleRejectSelectedObjects = () => {
    if (!current || selectedObjectIds.length === 0) return;
    if (onBatchSetObjectsApproval) {
      onBatchSetObjectsApproval(current.id, selectedObjectIds, 'REJECTED');
    } else if (onToggleObjectApproval) {
      selectedObjectIds.forEach((id) => onToggleObjectApproval(current.id, id, 'REJECTED'));
    }
    setSelectedObjectIds([]);
  };

  const handleApproveAllObjects = () => {
    if (!current?.affectedObjects) return;
    const allIds = current.affectedObjects.map((o) => o.id);
    if (onBatchSetObjectsApproval) {
      onBatchSetObjectsApproval(current.id, allIds, 'APPROVED');
    } else if (onToggleObjectApproval) {
      allIds.forEach((id) => onToggleObjectApproval(current.id, id, 'APPROVED'));
    }
  };

  const handleRejectAllObjects = () => {
    if (!current?.affectedObjects) return;
    const allIds = current.affectedObjects.map((o) => o.id);
    if (onBatchSetObjectsApproval) {
      onBatchSetObjectsApproval(current.id, allIds, 'REJECTED');
    } else if (onToggleObjectApproval) {
      allIds.forEach((id) => onToggleObjectApproval(current.id, id, 'REJECTED'));
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              Advanced Production Approval Center
            </h1>
            <span className="text-[11px] font-mono uppercase bg-neutral-900 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-bold">
              Phase 7 Section 2 · Authority: Phase 5
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Deterministic cryptographic binding of user_id, task_id, site_id, operation IDs, operation hash, timestamps, execution limits, and backup status.
          </p>
        </div>

        {pendingCount > 0 && (
          <div className="flex items-center gap-2">
            {onRejectAllPending && (
              <button
                onClick={onRejectAllPending}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-rose-300 text-xs font-semibold rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Reject All Pending
              </button>
            )}
            <button
              onClick={onApproveAllPending}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded-lg transition-colors shadow"
            >
              <Check className="w-3.5 h-3.5" />
              Approve All Pending ({pendingCount})
            </button>
          </div>
        )}
      </div>

      {/* Security Rule Callout */}
      <div className="bg-neutral-950 border border-amber-500/20 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-neutral-300">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Approval Integrity Rule:</strong> Approvals are deterministically bound to the exact operation set. If the operation changes after approval, the system immediately <strong>invalidates approval</strong>. Never treat a previous approval as permission for a modified task.
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
        <button
          onClick={() => setActiveFilter('PENDING')}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeFilter === 'PENDING'
              ? 'bg-amber-500 text-neutral-950'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Clock className="w-3 h-3" />
          Pending Approvals ({pendingCount})
        </button>
        <button
          onClick={() => setActiveFilter('DECIDED')}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeFilter === 'DECIDED'
              ? 'bg-neutral-800 text-neutral-200'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <History className="w-3 h-3" />
          Approval History
        </button>
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
            activeFilter === 'ALL'
              ? 'bg-neutral-800 text-neutral-200'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          All Requests ({siteApprovals.length})
        </button>
      </div>

      {/* Main Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Requests List */}
        <div className="space-y-2">
          {filteredApprovals.length === 0 ? (
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-8 text-center text-neutral-400 space-y-2">
              <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-500" />
              <p className="text-xs">No approval requests found matching this filter.</p>
            </div>
          ) : (
            filteredApprovals.map((req) => {
              const isSelected = current?.id === req.id;
              const badge = getRiskBadge(req.riskLevel);
              const statusBadge = getStatusBadge(req.status);

              return (
                <div
                  key={req.id}
                  onClick={() => {
                    setSelectedApproval(req);
                    setSelectedObjectIds([]);
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-neutral-900 border-amber-500/50 shadow'
                      : 'bg-neutral-900/60 hover:bg-neutral-900 border-neutral-800/80 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded border font-bold ${badge.style}`}>
                      {badge.label}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {req.requestedAt}
                    </span>
                  </div>
                  <h3 className="text-xs font-semibold text-neutral-200 line-clamp-2">
                    {req.title}
                  </h3>
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-neutral-800/40">
                    <span className="truncate max-w-[130px] font-medium">{req.clientName}</span>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${statusBadge.style}`}>
                      {req.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column (2 Cols): Comprehensive Approval Specification */}
        <div className="lg:col-span-2 space-y-4">
          {current ? (
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-5 space-y-5">
              {/* Header Status & Binding Meta */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-neutral-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-bold ${getRiskBadge(current.riskLevel).style}`}>
                      {getRiskBadge(current.riskLevel).label}
                    </span>
                    <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded border font-bold ${getStatusBadge(current.status).style}`}>
                      {getStatusBadge(current.status).label}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-neutral-100">
                    {current.title}
                  </h2>
                  <p className="text-xs text-neutral-300">
                    {current.actionSummary}
                  </p>
                </div>

                {/* Simulated Integrity Test Button */}
                {current.status === 'PENDING' && onInvalidateApproval && (
                  <button
                    onClick={() => onInvalidateApproval(current.id, 'Deterministic Hash Mismatch: Proposal altered from 5 to 45 objects after operator review.')}
                    title="Simulate modifying operation set after approval to test invalidation"
                    className="px-2.5 py-1 text-[10px] font-mono text-rose-300 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-700 rounded transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                    Test Invalidation (Modify Proposal)
                  </button>
                )}
              </div>

              {/* Invalidation Alert if tampered / altered */}
              {current.status === 'INVALIDATED_TAMPERED' && (
                <div className="p-3.5 bg-rose-950/80 border border-rose-600 rounded-xl text-xs space-y-2 text-rose-200">
                  <div className="flex items-center gap-2 font-bold text-rose-300">
                    <AlertOctagon className="w-4 h-4 text-rose-400 animate-bounce" />
                    APPROVAL INVALIDATED — OPERATION-SET HASH MISMATCH
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {current.invalidationReason || 'The operation parameters were altered after operator approval was granted. Prior authorization is revoked.'}
                  </p>
                  <p className="text-[10px] font-mono text-rose-300 bg-neutral-950 p-2 rounded border border-rose-900">
                    SECURITY ENFORCEMENT: Zero mutations permitted. Original approval must NOT authorize the modified operation. Re-submit task to Phase 5 Security Authority for fresh operator approval.
                  </p>
                </div>
              )}

              {/* 11 Required Production Approval Interface Attributes */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono uppercase text-neutral-400 font-semibold tracking-wider">
                  Mandatory Production Approval Metadata (11 Attributes)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs bg-neutral-950 p-3.5 rounded-xl border border-neutral-800">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase">1. Site</span>
                    <div className="text-neutral-200 font-semibold truncate">{current.siteName}</div>
                    <div className="text-[9px] font-mono text-neutral-500">{current.siteId}</div>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase">2. Client</span>
                    <div className="text-neutral-200 font-semibold truncate">{current.clientName}</div>
                    <div className="text-[9px] font-mono text-neutral-500">{current.clientId}</div>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase">3. Task</span>
                    <div className="text-amber-400 font-mono text-[11px] truncate">{current.taskId}</div>
                    <div className="text-[9px] text-neutral-400">{current.domain}</div>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase">4. Risk Level</span>
                    <div className="text-neutral-200 font-mono text-[11px] font-semibold">{current.riskLevel}</div>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase">5. Execution Limits</span>
                    <div className="text-neutral-200 font-mono text-[11px]">
                      Max {current.approvedLimits?.maxAffectedObjects || 10} objs / {current.approvedLimits?.maxOperations || 15} ops
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase">6. Backup Status</span>
                    <div className="flex items-center gap-1 font-mono text-[11px]">
                      <Database className="w-3 h-3 text-blue-400" />
                      <span className={
                        current.backupStatus === 'VERIFIED' 
                          ? 'text-emerald-400 font-bold' 
                          : current.backupStatus === 'UNAVAILABLE' 
                          ? 'text-rose-400 font-bold' 
                          : 'text-neutral-400'
                      }>
                        {current.backupStatus}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase">7. Rollback Availability</span>
                    <div className="text-[11px] font-mono truncate">
                      {current.rollbackMechanism === 'UNAVAILABLE' ? (
                        <span className="text-rose-400 font-bold">ROLLBACK NOT AVAILABLE</span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">{current.rollbackMechanism}</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase">8. Approval Status</span>
                    <div className="font-mono text-[11px] font-bold text-neutral-200 truncate">
                      {current.status}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cryptographic Operation Binding Box */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="text-[10px] font-mono uppercase flex items-center gap-1">
                    <Hash className="w-3 h-3 text-amber-400" />
                    Deterministic Operation-Set SHA-256 Hash:
                  </span>
                  <span className="text-[10px] font-mono">User ID: <strong className="text-neutral-200">{current.userId}</strong></span>
                </div>
                <div className="font-mono text-[11px] text-amber-300 bg-neutral-900 p-2 rounded border border-neutral-800 truncate">
                  {current.operationHash}
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 pt-1 border-t border-neutral-800/60">
                  <span>Scope: {current.approvedScope}</span>
                  <span>Expires: {current.expiresAt}</span>
                </div>
              </div>

              {/* Notice when rollback is unavailable (Requirement 4) */}
              {current.rollbackMechanism === 'UNAVAILABLE' && (
                <div className="p-3.5 bg-rose-950/40 border border-rose-800/80 rounded-xl text-xs space-y-1 text-rose-300">
                  <div className="font-bold flex items-center gap-1.5 text-rose-300">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    ROLLBACK NOT AVAILABLE
                  </div>
                  <div className="text-[11px] text-neutral-300">
                    RECOVERY METHOD: MANUAL/BACKUP RESTORATION
                  </div>
                  <p className="text-[10px] text-rose-400 font-mono">
                    Environment lacks native rollback tool or snapshot capability. Proceed with caution.
                  </p>
                </div>
              )}

              {/* Bulk Operations & Granular Affected Objects Review (Requirement 1) */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-200 uppercase tracking-wide">
                      Affected Objects ({current.affectedObjects?.length || 0})
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">
                      (Every object must be reviewed before execution)
                    </span>
                  </div>

                  {/* Bulk Select & Multi-Action Controls */}
                  {current.status === 'PENDING' && current.affectedObjects && current.affectedObjects.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={handleSelectAllObjects}
                        className="px-2 py-1 text-[11px] bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded font-semibold transition-colors flex items-center gap-1"
                      >
                        {selectedObjectIds.length === current.affectedObjects.length ? (
                          <CheckSquare className="w-3 h-3 text-amber-400" />
                        ) : (
                          <Square className="w-3 h-3 text-neutral-400" />
                        )}
                        {selectedObjectIds.length === current.affectedObjects.length ? 'Deselect All' : 'Select All'}
                      </button>

                      {selectedObjectIds.length > 0 ? (
                        <>
                          <button
                            onClick={handleApproveSelectedObjects}
                            className="px-2.5 py-1 text-[11px] bg-emerald-700 hover:bg-emerald-600 text-white rounded font-bold transition-colors flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            Approve Selected ({selectedObjectIds.length})
                          </button>
                          <button
                            onClick={handleRejectSelectedObjects}
                            className="px-2.5 py-1 text-[11px] bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded font-semibold transition-colors flex items-center gap-1"
                          >
                            <X className="w-3 h-3" />
                            Reject Selected ({selectedObjectIds.length})
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={handleApproveAllObjects}
                            className="px-2.5 py-1 text-[11px] bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-emerald-400 rounded font-semibold transition-colors"
                          >
                            Approve All Objects
                          </button>
                          <button
                            onClick={handleRejectAllObjects}
                            className="px-2.5 py-1 text-[11px] bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-rose-400 rounded font-semibold transition-colors"
                          >
                            Reject All Objects
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {current.affectedObjects?.map((obj) => {
                    const isSelected = selectedObjectIds.includes(obj.id);
                    return (
                      <div
                        key={obj.id}
                        className={`bg-neutral-950 border rounded-lg p-3 flex items-center justify-between gap-3 text-xs transition-colors ${
                          isSelected ? 'border-amber-500/60 bg-neutral-900/60' : 'border-neutral-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {current.status === 'PENDING' && (
                            <button
                              onClick={() => handleToggleSelectObject(obj.id)}
                              className="text-neutral-400 hover:text-neutral-200"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-amber-400" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          <div className="space-y-0.5 min-w-0">
                            <div className="font-semibold text-neutral-200 truncate">{obj.name}</div>
                            <div className="text-[10px] text-neutral-400 font-mono truncate">
                              Type: {obj.resourceType} | Risk: <span className="text-amber-400">{obj.risk}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setInspectingObject(obj)}
                            className="px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] font-semibold text-neutral-300 rounded flex items-center gap-1 transition-colors"
                            title="Inspect individual operation diff and verification rule"
                          >
                            <FileSearch className="w-3 h-3 text-blue-400" />
                            Inspect
                          </button>

                          {onToggleObjectApproval && current.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => onToggleObjectApproval(current.id, obj.id, 'APPROVED')}
                                className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                                  obj.status === 'APPROVED'
                                    ? 'bg-emerald-600 text-neutral-100 border-emerald-500'
                                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                                }`}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => onToggleObjectApproval(current.id, obj.id, 'REJECTED')}
                                className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                                  obj.status === 'REJECTED'
                                    ? 'bg-rose-950 text-rose-300 border-rose-800'
                                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                                }`}
                              >
                                Reject
                              </button>
                            </>
                          )}

                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-semibold ${
                            obj.status === 'APPROVED' 
                              ? 'text-emerald-400 border-emerald-900 bg-emerald-950/60' 
                              : obj.status === 'REJECTED'
                              ? 'text-rose-400 border-rose-900 bg-rose-950/60'
                              : 'text-neutral-400 border-neutral-800 bg-neutral-900'
                          }`}>
                            {obj.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Side-by-Side Current Values vs. Proposed Values (Required attributes 6 & 7) */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-neutral-200 uppercase tracking-wide">
                  Current Values vs. Proposed Values Comparison
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 space-y-1">
                    <span className="text-[10px] font-mono text-rose-400 uppercase font-bold flex items-center gap-1">
                      <X className="w-3.5 h-3.5" />
                      Current Values
                    </span>
                    <div className="bg-neutral-900 border border-neutral-800/80 rounded p-2 text-neutral-300 font-mono text-[11px] leading-relaxed break-words whitespace-pre-wrap">
                      {current.previousValue}
                    </div>
                  </div>

                  <div className="bg-neutral-950 border border-emerald-950/60 rounded-lg p-3 space-y-1">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Proposed Values
                    </span>
                    <div className="bg-neutral-900 border border-emerald-900/40 rounded p-2 text-emerald-200 font-mono text-[11px] leading-relaxed break-words whitespace-pre-wrap">
                      {current.proposedValue}
                    </div>
                  </div>
                </div>
              </div>

              {/* Decision Section or Historical Audit Metadata */}
              {current.status === 'PENDING' ? (
                <div className="pt-2 border-t border-neutral-800 space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-300">
                      Operator Decision Audit Notes (Required for Phase 5 compliance)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Approved per Q3 client content calendar approval..."
                      value={operatorComment}
                      onChange={(e) => setOperatorComment(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-lg p-2 text-xs text-neutral-200 outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2.5">
                    <button
                      onClick={() => onReject(current.id, operatorComment)}
                      className="px-4 py-2 bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-800 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject Mutation
                    </button>
                    <button
                      onClick={() => onApprove(current.id, operatorComment)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-neutral-100 text-xs font-bold rounded-lg transition-colors shadow flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve & Sign Hash Token
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-3 border-t border-neutral-800 text-xs text-neutral-400 space-y-1 bg-neutral-950 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-300">Immutable Decision Record:</span>
                    <span className="font-mono text-neutral-400">{current.decidedAt || 'Recorded'}</span>
                  </div>
                  <div>Operator: <strong className="text-neutral-200">{current.operator || 'finnesteditor@gmail.com'}</strong></div>
                  {current.comments && <div>Notes: "{current.comments}"</div>}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-12 text-center text-neutral-400 space-y-2">
              <ShieldCheck className="w-8 h-8 mx-auto text-neutral-600" />
              <p className="text-xs">Select an approval request to inspect its specifications.</p>
            </div>
          )}
        </div>
      </div>

      {/* Inspect Individual Operation Modal */}
      {inspectingObject && current && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono text-amber-400 uppercase">Operation Inspector</span>
                <h3 className="text-sm font-bold text-neutral-100">{inspectingObject.name}</h3>
              </div>
              <button
                onClick={() => setInspectingObject(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-neutral-950 p-3 rounded-lg border border-neutral-800 font-mono text-[11px]">
                <div>
                  <span className="text-neutral-500 uppercase block text-[9px]">Resource Type</span>
                  <span className="text-neutral-200">{inspectingObject.resourceType}</span>
                </div>
                <div>
                  <span className="text-neutral-500 uppercase block text-[9px]">Risk Assessment</span>
                  <span className="text-amber-400">{inspectingObject.risk}</span>
                </div>
                <div>
                  <span className="text-neutral-500 uppercase block text-[9px]">Rollback Support</span>
                  <span className="text-emerald-400">{current.rollbackMechanism}</span>
                </div>
                <div>
                  <span className="text-neutral-500 uppercase block text-[9px]">Approval Status</span>
                  <span className="text-neutral-200">{inspectingObject.status}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-neutral-300">Current Metadata:</span>
                <div className="bg-neutral-950 border border-neutral-800 p-2.5 rounded font-mono text-[11px] text-neutral-400 whitespace-pre-wrap">
                  {inspectingObject.currentVal}
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-emerald-400">Proposed Metadata:</span>
                <div className="bg-neutral-950 border border-emerald-950/60 p-2.5 rounded font-mono text-[11px] text-emerald-300 whitespace-pre-wrap">
                  {inspectingObject.proposedVal}
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-neutral-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  Mandatory Verification Rule Assertion:
                </span>
                <div className="bg-neutral-950 border border-neutral-800 p-2.5 rounded font-mono text-[10px] text-blue-300">
                  Read {inspectingObject.resourceType}. Confirm: actual metadata == expected metadata ('{inspectingObject.proposedVal}').
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-800 flex justify-end">
              <button
                onClick={() => setInspectingObject(null)}
                className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
