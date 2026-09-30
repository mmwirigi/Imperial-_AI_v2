import React, { useState } from 'react';
import { 
  Layers, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Play, 
  RotateCcw, 
  Filter, 
  ChevronRight, 
  Check, 
  X,
  Search,
  Database,
  Sliders,
  Sparkles,
  CheckSquare,
  Square,
  FileSearch,
  ShieldCheck,
  Info
} from 'lucide-react';
import { BulkOperationBatch, BulkOperationItem, Site, ToolRiskLevel } from '../types';

interface BulkOperationsViewProps {
  batches: BulkOperationBatch[];
  activeSite: Site | null;
  onApproveItem: (batchId: string, itemId: string) => void;
  onRejectItem: (batchId: string, itemId: string) => void;
  onApproveAll: (batchId: string) => void;
  onRejectAll?: (batchId: string) => void;
  onApproveSelected?: (batchId: string, itemIds: string[]) => void;
  onRejectSelected?: (batchId: string, itemIds: string[]) => void;
  onExecuteBatch: (batchId: string) => void;
  onRollbackBatch: (batchId: string) => void;
  onNewBatchScan: (siteId: string, operationType: string) => void;
}

export const BulkOperationsView: React.FC<BulkOperationsViewProps> = ({
  batches,
  activeSite,
  onApproveItem,
  onRejectItem,
  onApproveAll,
  onRejectAll,
  onApproveSelected,
  onRejectSelected,
  onExecuteBatch,
  onRollbackBatch,
  onNewBatchScan,
}) => {
  const [selectedBatch, setSelectedBatch] = useState<BulkOperationBatch>(batches[0] || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [batchLimit, setBatchLimit] = useState<number>(10);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [inspectingItem, setInspectingItem] = useState<BulkOperationItem | null>(null);

  const siteBatches = activeSite
    ? batches.filter((b) => b.siteId === activeSite.id)
    : batches;

  const currentBatch = selectedBatch || siteBatches[0] || null;

  const filteredItems = currentBatch
    ? currentBatch.items.filter((item) =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.proposedValue.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const handleToggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (!currentBatch) return;
    if (selectedItemIds.length === currentBatch.items.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(currentBatch.items.map((i) => i.id));
    }
  };

  const handleApproveSelected = () => {
    if (!currentBatch || selectedItemIds.length === 0) return;
    if (onApproveSelected) {
      onApproveSelected(currentBatch.id, selectedItemIds);
    } else {
      selectedItemIds.forEach((id) => onApproveItem(currentBatch.id, id));
    }
    setSelectedItemIds([]);
  };

  const handleRejectSelected = () => {
    if (!currentBatch || selectedItemIds.length === 0) return;
    if (onRejectSelected) {
      onRejectSelected(currentBatch.id, selectedItemIds);
    } else {
      selectedItemIds.forEach((id) => onRejectItem(currentBatch.id, id));
    }
    setSelectedItemIds([]);
  };

  const handleRejectAll = () => {
    if (!currentBatch) return;
    if (onRejectAll) {
      onRejectAll(currentBatch.id);
    } else {
      currentBatch.items.forEach((item) => onRejectItem(currentBatch.id, item.id));
    }
    setSelectedItemIds([]);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              Controlled Bulk Operations Engine
            </h1>
            <span className="text-[11px] font-mono uppercase bg-neutral-900 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-bold">
              Pillar 3 & 4 · Human Review Gate
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Display every affected object before execution. Approve all, approve selected, reject all, reject selected, and inspect individual operations.
          </p>
        </div>

        {/* Quick Scan Triggers */}
        {activeSite && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNewBatchScan(activeSite.id, 'SEO_META_SCAN')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-neutral-200 text-xs font-semibold rounded-lg transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-amber-400" />
              Scan Missing Meta
            </button>
            <button
              onClick={() => onNewBatchScan(activeSite.id, 'ALT_TEXT_SCAN')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-neutral-200 text-xs font-semibold rounded-lg transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Scan Missing Alt Tags
            </button>
          </div>
        )}
      </div>

      {/* Safety Banner */}
      <div className="bg-neutral-950 border border-amber-500/20 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-neutral-300">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Approval Integrity Guardrail:</strong> Never treat a previous approval as permission for a modified task. Every affected page or resource must be reviewed with current metadata and proposed metadata before execution.
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Batch Jobs List */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-neutral-200 uppercase tracking-wide">
            Bulk Operation Batches ({siteBatches.length})
          </div>

          <div className="space-y-2">
            {siteBatches.map((batch) => {
              const isSelected = currentBatch?.id === batch.id;
              return (
                <div
                  key={batch.id}
                  onClick={() => {
                    setSelectedBatch(batch);
                    setSelectedItemIds([]);
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-neutral-900 border-amber-500/50 shadow'
                      : 'bg-neutral-900/60 hover:bg-neutral-900 border-neutral-800/80 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-950 text-neutral-300 border border-neutral-800">
                      {batch.domain}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {batch.status}
                    </span>
                  </div>
                  <h3 className="text-xs font-semibold text-neutral-200">
                    {batch.title}
                  </h3>
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-neutral-800/40">
                    <span>{batch.siteName}</span>
                    <span className="font-mono text-amber-400 font-semibold">
                      {batch.approvedCount}/{batch.items.length} Approved
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (2 Cols): Selected Batch Review & Item Diffs */}
        <div className="lg:col-span-2 space-y-4">
          {currentBatch ? (
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-5 space-y-5">
              {/* Batch Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-neutral-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      {currentBatch.domain}
                    </span>
                    <span className="text-xs text-neutral-400">
                      {currentBatch.siteName}
                    </span>
                    {currentBatch.checkpointId ? (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-blue-950 text-blue-400 border border-blue-900 rounded flex items-center gap-1">
                        <Database className="w-3 h-3" />
                        Checkpoint: {currentBatch.checkpointId}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-neutral-800 text-neutral-400 border border-neutral-700 rounded">
                        Checkpoint: Auto-Preflight
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-bold text-neutral-100">
                    {currentBatch.title}
                  </h2>
                  <p className="text-xs text-neutral-400">
                    {currentBatch.description}
                  </p>
                </div>

                {/* Batch Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    onClick={() => onExecuteBatch(currentBatch.id)}
                    disabled={currentBatch.approvedCount === 0 || currentBatch.status === 'EXECUTING'}
                    className="px-3.5 py-1.5 bg-amber-500 disabled:opacity-50 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded-lg transition-colors shadow flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Execute Approved ({currentBatch.approvedCount})
                  </button>
                  {currentBatch.checkpointId && (
                    <button
                      onClick={() => onRollbackBatch(currentBatch.id)}
                      className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Rollback Batch
                    </button>
                  )}
                </div>
              </div>

              {/* Safety Constraints & Throttling Limits */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-neutral-300 font-medium">Batch Rate Limit:</span>
                  <select
                    value={batchLimit}
                    onChange={(e) => setBatchLimit(Number(e.target.value))}
                    className="bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs rounded px-2 py-0.5 outline-none"
                  >
                    <option value={5}>Max 5 items / batch</option>
                    <option value={10}>Max 10 items / batch (Recommended)</option>
                    <option value={25}>Max 25 items / batch</option>
                  </select>
                </div>
                <div className="text-[11px] text-neutral-400 font-mono">
                  Throttle: <strong className="text-neutral-200">400ms</strong> interval | Read-back verification active
                </div>
              </div>

              {/* Granular Selection & Bulk Approval Bar (Requirement 1 & 3) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleSelectAll}
                    className="px-2.5 py-1 text-xs bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded font-semibold transition-colors flex items-center gap-1.5"
                  >
                    {selectedItemIds.length === currentBatch.items.length ? (
                      <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-neutral-400" />
                    )}
                    {selectedItemIds.length === currentBatch.items.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <span className="text-xs text-neutral-400">
                    {selectedItemIds.length} of {currentBatch.items.length} items selected
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {selectedItemIds.length > 0 ? (
                    <>
                      <button
                        onClick={handleApproveSelected}
                        className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve Selected ({selectedItemIds.length})
                      </button>
                      <button
                        onClick={handleRejectSelected}
                        className="px-3 py-1 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject Selected ({selectedItemIds.length})
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => onApproveAll(currentBatch.id)}
                        className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg transition-colors border border-neutral-750 flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Approve All
                      </button>
                      <button
                        onClick={handleRejectAll}
                        className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg transition-colors border border-neutral-750 flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5 text-rose-400" />
                        Reject All
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Search Filter */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter affected pages / resources by title, URL or proposed metadata..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-500 outline-none focus:border-amber-500"
                />
              </div>

              {/* Items List with Before/After Diff Comparison (Requirement 1 example: Page, Current, Proposed, Risk, Status) */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {filteredItems.map((item) => {
                  const isSelected = selectedItemIds.includes(item.id);
                  const isApproved = item.status === 'APPROVED';
                  const isRejected = item.status === 'REJECTED';
                  const isVerified = item.status === 'VERIFIED';

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border transition-colors space-y-2.5 ${
                        isSelected
                          ? 'bg-neutral-950 border-amber-500/60'
                          : isApproved
                          ? 'bg-neutral-950/90 border-emerald-900/50'
                          : isRejected
                          ? 'bg-neutral-950/60 border-rose-950/40 opacity-60'
                          : 'bg-neutral-950 border-neutral-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            onClick={() => handleToggleSelectItem(item.id)}
                            className="text-neutral-400 hover:text-neutral-200 shrink-0"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-amber-400" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                          <div className="space-y-0.5 min-w-0">
                            <h4 className="text-xs font-bold text-neutral-200 truncate">
                              {item.title}
                            </h4>
                            {item.url && (
                              <span className="text-[10px] text-neutral-400 font-mono truncate block">
                                {item.url}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Item Status, Risk & Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => setInspectingItem(item)}
                            className="px-2 py-1 text-xs font-semibold rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 flex items-center gap-1"
                            title="Inspect individual operation diff and verification assertion"
                          >
                            <FileSearch className="w-3 h-3 text-blue-400" />
                            Inspect
                          </button>

                          {isVerified ? (
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              VERIFIED
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => onApproveItem(currentBatch.id, item.id)}
                                className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center gap-1 transition-colors ${
                                  isApproved
                                    ? 'bg-emerald-600 text-neutral-100 font-bold'
                                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border border-neutral-800'
                                }`}
                              >
                                <Check className="w-3 h-3" />
                                {isApproved ? 'Approved' : 'Approve'}
                              </button>
                              <button
                                onClick={() => onRejectItem(currentBatch.id, item.id)}
                                className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center gap-1 transition-colors ${
                                  isRejected
                                    ? 'bg-rose-950 text-rose-300 border border-rose-800 font-bold'
                                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border border-neutral-800'
                                }`}
                              >
                                <X className="w-3 h-3" />
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Visual Diff: Current Metadata (Before) vs Proposed Metadata (After) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div className="bg-neutral-900 border border-neutral-800/80 rounded p-2.5 space-y-1">
                          <span className="text-[10px] font-mono text-rose-400 uppercase font-semibold flex items-center gap-1">
                            <X className="w-3 h-3" />
                            Current Metadata
                          </span>
                          <p className="text-neutral-300 font-mono text-[11px] leading-relaxed break-words">
                            {item.currentValue}
                          </p>
                        </div>
                        <div className="bg-neutral-900 border border-emerald-900/40 rounded p-2.5 space-y-1">
                          <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Proposed Metadata
                          </span>
                          <p className="text-emerald-200 font-mono text-[11px] leading-relaxed break-words">
                            {item.proposedValue}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-12 text-center text-neutral-400 space-y-2">
              <Layers className="w-8 h-8 mx-auto text-neutral-600" />
              <p className="text-xs">No bulk batches available for the active site context.</p>
            </div>
          )}
        </div>
      </div>

      {/* Inspect Item Modal */}
      {inspectingItem && currentBatch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono text-amber-400 uppercase">Bulk Operation Item Inspector</span>
                <h3 className="text-sm font-bold text-neutral-100">{inspectingItem.title}</h3>
              </div>
              <button
                onClick={() => setInspectingItem(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 font-mono text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Resource ID:</span>
                  <span className="text-neutral-300">{inspectingItem.resourceId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Target URL:</span>
                  <span className="text-amber-400 truncate max-w-[280px]">{inspectingItem.url || 'Internal REST post'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Approval Status:</span>
                  <span className="text-emerald-400 font-bold">{inspectingItem.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Rollback Mechanism:</span>
                  <span className="text-neutral-300">WORDPRESS_REVISION / REST SNAPSHOT</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-rose-400">Current Metadata:</span>
                <div className="bg-neutral-950 border border-neutral-800 p-2.5 rounded font-mono text-[11px] text-neutral-300 whitespace-pre-wrap">
                  {inspectingItem.currentValue}
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-emerald-400">Proposed Metadata:</span>
                <div className="bg-neutral-950 border border-emerald-950/60 p-2.5 rounded font-mono text-[11px] text-emerald-200 whitespace-pre-wrap">
                  {inspectingItem.proposedValue}
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-neutral-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  Live Read-Back Verification Rule:
                </span>
                <div className="bg-neutral-950 border border-neutral-800 p-2.5 rounded font-mono text-[10px] text-blue-300">
                  Read live endpoint {inspectingItem.url}. Confirm rendered meta description matches proposed value.
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-800 flex justify-end">
              <button
                onClick={() => setInspectingItem(null)}
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
