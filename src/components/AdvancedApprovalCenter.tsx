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
import { Button, Card, Badge } from './common/UIComponents';

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
  const [activeFilter, setActiveFilter] = useState<'PENDING' | 'DECIDED' | 'ALL'>('PENDING');
  const [selectedApproval, setSelectedApproval] = useState<AdvancedApprovalItem | null>(null);
  const [operatorComment, setOperatorComment] = useState('');
  const [selectedObjectIds, setSelectedObjectIds] = useState<string[]>([]);
  const [inspectingObject, setInspectingObject] = useState<any | null>(null);

  const siteApprovals = activeSite
    ? approvals.filter((a) => a.siteName === activeSite.siteName)
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
        return { label: 'CRITICAL RISK', style: 'bg-rose-50 text-rose-800 border-rose-200' };
      case 'HIGH_RISK_WRITE':
        return { label: 'HIGH RISK', style: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'LOW_RISK_WRITE':
        return { label: 'LOW RISK', style: 'bg-amber-50 text-amber-800 border-amber-200' };
      default:
        return { label: 'READ ONLY', style: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    }
  };

  const getStatusBadge = (status: ApprovalStatus) => {
    switch (status) {
      case 'APPROVED':
        return { label: 'APPROVED', style: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'REJECTED':
        return { label: 'REJECTED', style: 'bg-rose-50 text-rose-800 border-rose-200' };
      case 'EXPIRED':
        return { label: 'EXPIRED', style: 'bg-slate-100 text-slate-600 border-slate-200' };
      case 'INVALIDATED_TAMPERED':
        return { label: 'INVALIDATED / TAMPERED', style: 'bg-rose-100 text-rose-900 border-rose-300 font-bold' };
      default:
        return { label: 'AWAITING OPERATOR DECISION', style: 'bg-amber-50 text-amber-900 border-amber-300' };
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="error" size="sm">
              PHASE 5 SAFETY AUTHORITY
            </Badge>
            <span className="text-xs text-slate-500 font-mono">
              Pending: {pendingCount} Decisions
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Production Approval Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict human-in-the-loop authorization gates. Zero unapproved mutations touch production WordPress databases.
          </p>
        </div>

        {pendingCount > 0 && (
          <Button
            variant="primary"
            size="md"
            onClick={onApproveAllPending}
            icon={Check}
          >
            Approve All Pending ({pendingCount})
          </Button>
        )}
      </div>

      {/* Security Rule Callout */}
      <Card className="p-3.5 bg-amber-50/60 border-amber-200 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-amber-900">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Approval Integrity Invariant:</strong> Approvals are cryptographically bound to the exact operation set. If parameters change post-approval, the system immediately <strong>invalidates authorization</strong>.
          </span>
        </div>
      </Card>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveFilter('PENDING')}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
            activeFilter === 'PENDING'
              ? 'bg-amber-500 text-slate-950 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Pending Approvals ({pendingCount})
        </button>
        <button
          onClick={() => setActiveFilter('DECIDED')}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
            activeFilter === 'DECIDED'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Approval History
        </button>
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
            activeFilter === 'ALL'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 space-y-2">
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
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-amber-50/40 border-amber-400 ring-2 ring-amber-400/20 shadow-2xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200/90'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${badge.style}`}>
                      {badge.label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {req.requestedAt}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 line-clamp-2">
                    {req.title}
                  </h3>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <span className="truncate max-w-[130px] font-semibold text-slate-700">{req.clientName}</span>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${statusBadge.style}`}>
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
            <Card className="p-6 space-y-5">
              {/* Header Status & Binding Meta */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border font-bold ${getRiskBadge(current.riskLevel).style}`}>
                      {getRiskBadge(current.riskLevel).label}
                    </span>
                    <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border font-bold ${getStatusBadge(current.status).style}`}>
                      {getStatusBadge(current.status).label}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900">
                    {current.title}
                  </h2>
                  <p className="text-xs text-slate-600">
                    {current.actionSummary}
                  </p>
                </div>

                {/* Simulated Integrity Test Button */}
                {current.status === 'PENDING' && onInvalidateApproval && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onInvalidateApproval(current.id, 'Deterministic Hash Mismatch: Proposal altered after review.')}
                    icon={AlertOctagon}
                  >
                    Test Invalidation
                  </Button>
                )}
              </div>

              {/* Invalidation Alert if tampered / altered */}
              {current.status === 'INVALIDATED_TAMPERED' && (
                <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-xs space-y-2 text-rose-900">
                  <div className="flex items-center gap-2 font-bold text-rose-900">
                    <AlertOctagon className="w-4 h-4 text-rose-600" />
                    APPROVAL INVALIDATED — OPERATION-SET HASH MISMATCH
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {current.invalidationReason || 'Operation parameters were altered post-authorization. Authorization revoked.'}
                  </p>
                  <p className="text-[10px] font-mono text-rose-800 bg-white p-2 rounded-xl border border-rose-200">
                    SECURITY ENFORCEMENT: Zero mutations permitted. Fresh operator authorization required.
                  </p>
                </div>
              )}

              {/* Required Metadata Grid */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">
                  Mandatory Production Approval Metadata (11 Attributes)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">Site</span>
                    <div className="text-slate-900 font-bold truncate">{current.siteName}</div>
                    <div className="text-[9px] font-mono text-slate-500">{current.siteId}</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">Client</span>
                    <div className="text-slate-900 font-bold truncate">{current.clientName}</div>
                    <div className="text-[9px] font-mono text-slate-500">{current.clientId}</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">Task ID</span>
                    <div className="text-amber-800 font-mono text-[11px] font-bold truncate">{current.taskId}</div>
                    <div className="text-[9px] text-slate-500">{current.domain}</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">Risk Level</span>
                    <div className="text-slate-900 font-mono text-[11px] font-bold">{current.riskLevel}</div>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">Limits</span>
                    <div className="text-slate-700 font-mono text-[11px]">
                      Max {current.approvedLimits?.maxAffectedObjects || 10} objs / {current.approvedLimits?.maxOperations || 15} ops
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">Backup Status</span>
                    <div className="flex items-center gap-1 font-mono text-[11px]">
                      <Database className="w-3 h-3 text-blue-600" />
                      <span className="text-emerald-700 font-bold">{current.backupStatus}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">Rollback Ready</span>
                    <div className="text-[11px] font-mono font-semibold text-emerald-700 truncate">
                      {current.rollbackMechanism}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">Approval State</span>
                    <div className="font-mono text-[11px] font-bold text-slate-900 truncate">
                      {current.status}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cryptographic Operation Binding Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-500 font-mono text-[10px]">
                  <span className="uppercase flex items-center gap-1 font-bold">
                    <Hash className="w-3.5 h-3.5 text-amber-600" />
                    Deterministic Operation-Set SHA-256 Hash:
                  </span>
                  <span>User: <strong className="text-slate-800">{current.userId}</strong></span>
                </div>
                <div className="font-mono text-[11px] text-amber-900 bg-white p-2 rounded-xl border border-slate-200 truncate">
                  {current.operationHash}
                </div>
              </div>

              {/* Bulk Operations & Affected Objects Review */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 uppercase tracking-wide">
                      Affected Objects ({current.affectedObjects?.length || 0})
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      (Every object must be reviewed before execution)
                    </span>
                  </div>

                  {current.status === 'PENDING' && current.affectedObjects && current.affectedObjects.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleSelectAllObjects}
                      >
                        {selectedObjectIds.length === current.affectedObjects.length ? 'Deselect All' : 'Select All'}
                      </Button>

                      {selectedObjectIds.length > 0 ? (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleApproveSelectedObjects}
                            icon={Check}
                          >
                            Approve ({selectedObjectIds.length})
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={handleRejectSelectedObjects}
                            icon={X}
                          >
                            Reject ({selectedObjectIds.length})
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleApproveAllObjects}
                          >
                            Approve All
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRejectAllObjects}
                          >
                            Reject All
                          </Button>
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
                        className={`bg-white border rounded-xl p-3 flex items-center justify-between gap-3 text-xs transition-colors ${
                          isSelected ? 'border-amber-400 bg-amber-50/20' : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {current.status === 'PENDING' && (
                            <button
                              onClick={() => handleToggleSelectObject(obj.id)}
                              className="text-slate-400 hover:text-slate-700"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-amber-600" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          <div className="space-y-0.5 min-w-0">
                            <div className="font-bold text-slate-800 truncate">{obj.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono truncate">
                              Type: {obj.resourceType} | Risk: <span className="text-amber-700 font-bold">{obj.risk}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setInspectingObject(obj)}
                            icon={FileSearch}
                          >
                            Inspect
                          </Button>

                          <Badge
                            variant={obj.status === 'APPROVED' ? 'success' : obj.status === 'REJECTED' ? 'error' : 'neutral'}
                            size="sm"
                          >
                            {obj.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Side-by-Side Current Values vs. Proposed Values */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Current Values vs. Proposed Values Comparison
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-3.5 space-y-1">
                    <span className="text-[10px] font-mono text-rose-800 uppercase font-bold flex items-center gap-1">
                      <X className="w-3.5 h-3.5" />
                      Current Values
                    </span>
                    <div className="bg-white border border-rose-200 rounded-xl p-2.5 text-rose-950 font-mono text-[11px] leading-relaxed break-words whitespace-pre-wrap">
                      {current.previousValue}
                    </div>
                  </div>

                  <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-3.5 space-y-1">
                    <span className="text-[10px] font-mono text-emerald-800 uppercase font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Proposed Values
                    </span>
                    <div className="bg-white border border-emerald-200 rounded-xl p-2.5 text-emerald-950 font-mono text-[11px] leading-relaxed break-words whitespace-pre-wrap">
                      {current.proposedValue}
                    </div>
                  </div>
                </div>
              </div>

              {/* Decision Action Buttons */}
              {current.status === 'PENDING' ? (
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Operator Decision Audit Notes
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Approved per Q3 client content calendar..."
                      value={operatorComment}
                      onChange={(e) => setOperatorComment(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 rounded-xl p-2.5 text-xs text-slate-900 outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2.5">
                    <Button
                      variant="danger"
                      size="md"
                      onClick={() => onReject(current.id, operatorComment)}
                      icon={XCircle}
                    >
                      Reject Mutation
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => onApprove(current.id, operatorComment)}
                      icon={CheckCircle2}
                    >
                      Approve &amp; Sign Hash Token
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Immutable Decision Record:</span>
                    <span className="font-mono text-slate-500">{current.decidedAt || 'Recorded'}</span>
                  </div>
                  <div>Operator: <strong className="text-slate-900">{current.operator || 'operator@imperial.ai'}</strong></div>
                  {current.comments && <div>Notes: "{current.comments}"</div>}
                </div>
              )}
            </Card>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 space-y-2">
              <ShieldCheck className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs">Select an approval request to inspect its specifications.</p>
            </div>
          )}
        </div>
      </div>

      {/* Inspect Individual Operation Modal */}
      {inspectingObject && current && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono text-amber-700 font-bold uppercase">Operation Inspector</span>
                <h3 className="text-base font-bold text-slate-900">{inspectingObject.name}</h3>
              </div>
              <button
                onClick={() => setInspectingObject(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400 uppercase block text-[9px] font-semibold">Resource Type</span>
                  <span className="text-slate-800 font-bold">{inspectingObject.resourceType}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase block text-[9px] font-semibold">Risk</span>
                  <span className="text-amber-700 font-bold">{inspectingObject.risk}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-700">Current Metadata:</span>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl font-mono text-[11px] text-slate-700 whitespace-pre-wrap">
                  {inspectingObject.currentVal}
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-emerald-700">Proposed Metadata:</span>
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl font-mono text-[11px] text-emerald-900 whitespace-pre-wrap">
                  {inspectingObject.proposedVal}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setInspectingObject(null)}
              >
                Close Inspector
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
