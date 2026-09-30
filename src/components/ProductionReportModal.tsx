import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RotateCcw, 
  ShieldCheck, 
  Database, 
  Copy, 
  Check, 
  Download, 
  ExternalLink,
  Layers,
  Terminal,
  Activity
} from 'lucide-react';
import { ProductionReport } from '../types';

interface ProductionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ProductionReport | null;
}

export const ProductionReportModal: React.FC<ProductionReportModalProps> = ({
  isOpen,
  onClose,
  report,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !report) return null;

  const generateMarkdown = () => {
    return `# IMPERIAL AI — PRODUCTION EXECUTION REPORT
Report ID: ${report.id}

=======================================================
1. TASK SUMMARY
=======================================================
Site:       ${report.site.name} (${report.site.url})
Client:     ${report.client.name}
Task:       ${report.taskTitle} (ID: ${report.taskId})
Created:    ${report.createdAt}
Completed:  ${report.completedAt}
Final Status: ${report.finalStatus}

=======================================================
2. REQUEST
=======================================================
${report.userRequest}

=======================================================
3. PLAN
=======================================================
Summary: ${report.plan.summary}
Planned Operations: ${report.plan.plannedOperationsCount}
Target Domains: ${report.plan.affectedDomains.join(', ')}

=======================================================
4. APPROVAL
=======================================================
Approved By:    ${report.approval.approvedBy}
Approved At:    ${report.approval.approvedAt}
Approved Scope: ${report.approval.approvedScope}
Approval Status: ${report.approval.status}
Operation Hash:  ${report.approval.operationHash}

=======================================================
5. BACKUP
=======================================================
Backup Status: ${report.backup.status}
Checkpoint ID: ${report.backup.checkpointId || 'N/A'}
Verified:      ${report.backup.verified ? 'YES' : 'NO'}
Note:          ${report.backup.message}

=======================================================
6. EXECUTION
=======================================================
Total Operations: ${report.execution.totalOperations}
Successful:       ${report.execution.successful}
Failed:           ${report.execution.failed}
Skipped:          ${report.execution.skipped}
Duration:         ${report.execution.durationSeconds}s

=======================================================
7. VERIFICATION
=======================================================
Verification Passed: ${report.verification.passed}
Verification Failed: ${report.verification.failed}
Summary:             ${report.verification.summary}

=======================================================
8. ROLLBACK
=======================================================
Performed:  ${report.rollback.performed ? 'YES' : 'NO'}
Mechanism:  ${report.rollback.mechanism}
Status:     ${report.rollback.status}

=======================================================
9. SECURITY
=======================================================
Security Checks Passed:
${report.security.checksPassed.map((c) => `  * [PASSED] ${c}`).join('\n')}
Intercepted Violations: ${report.security.interceptedEventsCount}

=======================================================
10. ERRORS & ANOMALIES
=======================================================
${
  report.errors.length > 0
    ? report.errors
        .map(
          (err, i) =>
            `[Error ${i + 1}] Resource: ${err.resource}\nOperation: ${err.operation}\nDetails: ${err.error}\nRetryable: ${err.retryability ? 'YES' : 'NO'}`
        )
        .join('\n\n')
    : 'None. All operations completed without execution error.'
}

=======================================================
FINAL STATUS: ${report.finalStatus}
=======================================================
`;
  };

  const handleCopyMarkdown = () => {
    const text = generateMarkdown();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const text = generateMarkdown();
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Imperial_Production_Report_${report.taskId}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusBadge = {
    COMPLETED: {
      color: 'bg-emerald-950/60 text-emerald-400 border-emerald-800',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
      label: 'COMPLETED (100% Verified)',
    },
    PARTIAL_SUCCESS: {
      color: 'bg-amber-950/60 text-amber-300 border-amber-800',
      icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
      label: 'PARTIAL SUCCESS (Reported with Failures)',
    },
    FAILED: {
      color: 'bg-rose-950/60 text-rose-400 border-rose-800',
      icon: <XCircle className="w-4 h-4 text-rose-400" />,
      label: 'FAILED (Halted per Policy)',
    },
    ROLLED_BACK: {
      color: 'bg-purple-950/60 text-purple-400 border-purple-800',
      icon: <RotateCcw className="w-4 h-4 text-purple-400" />,
      label: 'ROLLED BACK (Restored to Preflight State)',
    },
  }[report.finalStatus];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-neutral-100">
                  Production Execution Report
                </h2>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-semibold flex items-center gap-1.5 ${statusBadge.color}`}>
                  {statusBadge.icon}
                  {statusBadge.label}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5 font-mono">
                Task ID: {report.taskId} · Site: {report.site.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition-colors"
              title="Copy formatted markdown"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy MD'}
            </button>
            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition-colors"
              title="Download .md file"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Report Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm">
          {/* 1. TASK SUMMARY */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-2.5">
            <h3 className="text-xs font-bold font-mono uppercase text-amber-400 tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4" />
              1. Task Summary
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-neutral-400">Target Site:</span>{' '}
                <strong className="text-neutral-200">{report.site.name}</strong>{' '}
                <span className="text-neutral-400 font-mono">({report.site.url})</span>
              </div>
              <div>
                <span className="text-neutral-400">Client:</span>{' '}
                <strong className="text-neutral-200">{report.client.name}</strong>
              </div>
              <div>
                <span className="text-neutral-400">Task Title:</span>{' '}
                <span className="text-neutral-200 font-semibold">{report.taskTitle}</span>
              </div>
              <div>
                <span className="text-neutral-400">Timeline:</span>{' '}
                <span className="text-neutral-300 font-mono">{report.createdAt} → {report.completedAt}</span>
              </div>
            </div>
          </div>

          {/* 2. REQUEST & 3. PLAN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Request */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-2">
              <h3 className="text-xs font-bold font-mono uppercase text-neutral-300 tracking-wider">
                2. User Request
              </h3>
              <p className="text-xs text-neutral-300 italic bg-neutral-900/60 p-3 rounded-lg border border-neutral-800 leading-relaxed">
                "{report.userRequest}"
              </p>
            </div>

            {/* Plan */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-2">
              <h3 className="text-xs font-bold font-mono uppercase text-neutral-300 tracking-wider">
                3. Execution Plan
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                {report.plan.summary}
              </p>
              <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-neutral-400">
                <span>Operations: <strong className="text-neutral-200">{report.plan.plannedOperationsCount}</strong></span>
                <span>·</span>
                <span>Domains: <strong className="text-amber-400">{report.plan.affectedDomains.join(', ')}</strong></span>
              </div>
            </div>
          </div>

          {/* 4. APPROVAL & 5. BACKUP */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Approval */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold font-mono uppercase text-neutral-300 tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  4. Approval Authorization
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {report.approval.status}
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="text-neutral-300">
                  <span className="text-neutral-400">Sign-off:</span> {report.approval.approvedBy}
                </div>
                <div className="text-neutral-400">
                  <span>Timestamp:</span> {report.approval.approvedAt}
                </div>
                <div className="text-neutral-400">
                  <span>Scope:</span> <span className="font-mono text-neutral-300">{report.approval.approvedScope}</span>
                </div>
                <div className="text-[10px] font-mono text-neutral-400 truncate pt-1">
                  Hash: {report.approval.operationHash}
                </div>
              </div>
            </div>

            {/* Backup */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold font-mono uppercase text-neutral-300 tracking-wider flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-blue-400" />
                  5. Backup Snapshot
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
                  {report.backup.status}
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="text-neutral-300">
                  <span className="text-neutral-400">Checkpoint ID:</span>{' '}
                  <span className="font-mono text-blue-400">{report.backup.checkpointId || 'None'}</span>
                </div>
                <div className="text-neutral-400">
                  <span>Verified:</span>{' '}
                  <strong className={report.backup.verified ? 'text-emerald-400' : 'text-neutral-400'}>
                    {report.backup.verified ? 'Verified Prior to Change' : 'Unavailable on Host'}
                  </strong>
                </div>
                <p className="text-[11px] text-neutral-400 pt-1">
                  {report.backup.message}
                </p>
              </div>
            </div>
          </div>

          {/* 6. EXECUTION & 7. VERIFICATION STATS */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-bold font-mono uppercase text-neutral-300 tracking-wider">
              6. Execution & 7. Verification Metrics
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 space-y-1">
                <div className="text-[10px] text-neutral-400">TOTAL OPS</div>
                <div className="text-xl font-bold text-neutral-100">{report.execution.totalOperations}</div>
                <div className="text-[10px] text-neutral-400">Duration: {report.execution.durationSeconds}s</div>
              </div>
              <div className="bg-neutral-900 border border-emerald-900/40 rounded-lg p-3 space-y-1">
                <div className="text-[10px] text-emerald-400">SUCCESSFUL</div>
                <div className="text-xl font-bold text-emerald-400">{report.execution.successful}</div>
                <div className="text-[10px] text-neutral-400">Verified Read-Back</div>
              </div>
              <div className="bg-neutral-900 border border-rose-900/40 rounded-lg p-3 space-y-1">
                <div className="text-[10px] text-rose-400">FAILED</div>
                <div className="text-xl font-bold text-rose-400">{report.execution.failed}</div>
                <div className="text-[10px] text-neutral-400">Visible Anomaly</div>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 space-y-1">
                <div className="text-[10px] text-neutral-400">SKIPPED</div>
                <div className="text-xl font-bold text-neutral-300">{report.execution.skipped}</div>
                <div className="text-[10px] text-neutral-400">Non-Critical</div>
              </div>
            </div>
            <p className="text-xs text-neutral-300 bg-neutral-900/40 p-2.5 rounded border border-neutral-850">
              <span className="text-neutral-400 font-medium">Verification Read-Back Summary:</span>{' '}
              {report.verification.summary}
            </p>
          </div>

          {/* 8. ROLLBACK & 9. SECURITY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Rollback */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-2">
              <h3 className="text-xs font-bold font-mono uppercase text-neutral-300 tracking-wider flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
                8. Rollback Engine
              </h3>
              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-neutral-400">Performed:</span>{' '}
                  <strong className={report.rollback.performed ? 'text-purple-400' : 'text-neutral-300'}>
                    {report.rollback.performed ? 'YES (State Reverted)' : 'NO (Normal Execution)'}
                  </strong>
                </div>
                <div>
                  <span className="text-neutral-400">Mechanism:</span>{' '}
                  <span className="font-mono text-neutral-300">{report.rollback.mechanism}</span>
                </div>
                <div className="text-[11px] text-neutral-400">
                  {report.rollback.status}
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-2">
              <h3 className="text-xs font-bold font-mono uppercase text-neutral-300 tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                9. Security Verification
              </h3>
              <div className="space-y-1 text-xs">
                {report.security.checksPassed.map((chk, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-neutral-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="truncate">{chk}</span>
                  </div>
                ))}
                <div className="text-[10px] text-neutral-400 pt-1 font-mono">
                  Intercepted Security Violations: {report.security.interceptedEventsCount}
                </div>
              </div>
            </div>
          </div>

          {/* 10. ERRORS BREAKDOWN */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold font-mono uppercase text-neutral-300 tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              10. Anomalies & Errors ({report.errors.length})
            </h3>
            {report.errors.length > 0 ? (
              <div className="space-y-2">
                {report.errors.map((err, i) => (
                  <div
                    key={i}
                    className="p-3 bg-neutral-900 border border-rose-950/80 rounded-lg text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-mono">
                      <strong className="text-neutral-200">{err.resource}</strong>
                      <span className="text-[10px] px-1.5 py-0.2 bg-rose-950 text-rose-400 border border-rose-800 rounded">
                        {err.operation}
                      </span>
                    </div>
                    <p className="text-rose-300">{err.error}</p>
                    <div className="text-[10px] text-neutral-400 pt-0.5">
                      Retryable: <span className="font-semibold text-neutral-300">{err.retryability ? 'YES' : 'NO'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-400 italic">
                Zero execution errors. Every mutation succeeded and read-back assertions passed 100%.
              </p>
            )}
          </div>

          {/* FINAL STATUS BANNER */}
          <div className={`p-4 rounded-xl border flex items-center justify-between font-mono ${statusBadge.color}`}>
            <div className="flex items-center gap-2">
              {statusBadge.icon}
              <span className="text-xs font-bold uppercase tracking-wider">
                FINAL STATUS: {report.finalStatus}
              </span>
            </div>
            <span className="text-xs">
              Phase 7 Orchestrated · Phase 5 Authorized
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/70 flex items-center justify-between shrink-0">
          <span className="text-xs text-neutral-400">
            Export or attach this structured record to client maintenance invoices.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-xs font-bold rounded-lg transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
