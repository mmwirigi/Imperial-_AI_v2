import React from 'react';
import { AlertTriangle, ShieldAlert, Check, X } from 'lucide-react';
import { DangerousActionType } from '../types';

interface ApprovalModalProps {
  isOpen: boolean;
  siteName: string;
  actionType: DangerousActionType;
  description: string;
  targetResource: string;
  onApprove: () => void;
  onReject: () => void;
  onClose: () => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  isOpen,
  siteName,
  actionType,
  description,
  targetResource,
  onApprove,
  onReject,
  onClose,
}) => {
  if (!isOpen) return null;

  const actionLabels: Record<DangerousActionType, { label: string; risk: string; badgeColor: string }> = {
    DELETE_PAGE: { label: 'Delete WordPress Page', risk: 'CRITICAL', badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
    DELETE_POST: { label: 'Delete Published Post', risk: 'HIGH', badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    CHANGE_SITE_SETTINGS: { label: 'Modify Core Site Settings', risk: 'CRITICAL', badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
    PUBLISH_CONTENT: { label: 'Publish Live Content', risk: 'MEDIUM', badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    MODIFY_PLUGIN: { label: 'Install / Deactivate Plugin', risk: 'CRITICAL', badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
    MODIFY_THEME: { label: 'Modify Active Theme Assets', risk: 'CRITICAL', badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
    CHANGE_USER: { label: 'Modify User Permissions', risk: 'CRITICAL', badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
    CHANGE_DNS_SETTINGS: { label: 'Modify Domain / DNS Settings', risk: 'CRITICAL', badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
    BULK_EDIT_CONTENT: { label: 'Bulk Edit Database Records', risk: 'HIGH', badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    READ_ONLY_AUDIT: { label: 'Read-Only Site Inspection', risk: 'LOW', badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  };

  const info = actionLabels[actionType] || { label: actionType, risk: 'ELEVATED', badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-semibold">
                Operator Approval Gate
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${info.badgeColor}`}>
                {info.risk} RISK
              </span>
            </div>
            <h3 className="text-base font-bold text-neutral-100">{info.label}</h3>
          </div>
        </div>

        {/* Target Site Verification */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">Target Site Scope:</span>
            <span className="font-semibold text-neutral-100">{siteName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">Target Resource:</span>
            <span className="font-mono text-neutral-300 truncate max-w-[200px]">{targetResource}</span>
          </div>
        </div>

        {/* Action Description */}
        <div className="text-xs text-neutral-300 bg-neutral-800/40 p-3 rounded-lg border border-neutral-800">
          <p className="font-medium text-neutral-200 mb-1">Proposed Execution:</p>
          <p>{description}</p>
        </div>

        <p className="text-[11px] text-neutral-400 leading-relaxed">
          Security Policy: Dangerous operations require explicit operator authorization before execution. 
          Audit logging will record this confirmation.
        </p>

        {/* Decision Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => {
              onReject();
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-rose-900/60 bg-rose-950/20 text-rose-300 hover:bg-rose-950/40 text-xs font-semibold transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Reject Action
          </button>
          <button
            onClick={() => {
              onApprove();
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-colors shadow-md"
          >
            <Check className="w-3.5 h-3.5" />
            Authorize Execution
          </button>
        </div>
      </div>
    </div>
  );
};
