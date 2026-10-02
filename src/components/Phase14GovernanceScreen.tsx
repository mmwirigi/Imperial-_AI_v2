import React, { useState } from 'react';
import {
  TamperResistantAuditRecord,
  EnterpriseSecuritySession,
  EnterpriseIncidentRecord,
  DataRetentionPolicy
} from '../types';
import { GovernanceComplianceService } from '../services/governanceComplianceService';
import {
  ShieldCheck,
  Lock,
  AlertOctagon,
  FileCheck2,
  RefreshCw,
  LogOut,
  UserCheck,
  Database,
  History,
  CheckCircle,
  XCircle,
  Sparkles,
  Key
} from 'lucide-react';

interface Props {
  tenantId: string;
  clientId: string;
  siteId?: string;
  isPlatformAdmin: boolean;
}

export const Phase14GovernanceScreen: React.FC<Props> = ({
  tenantId,
  clientId,
  siteId
}) => {
  // Audit Chain State
  const [auditChain, setAuditChain] = useState<TamperResistantAuditRecord[]>(() => {
    let chain: TamperResistantAuditRecord[] = [];
    const r1 = GovernanceComplianceService.appendAuditRecord({
      existingChain: chain,
      tenantId,
      userId: 'usr-101',
      userEmail: 'operator@acme.com',
      actionType: 'LOGIN_SESSION_ESTABLISHED',
      requestPayload: { mfaMethod: 'TOTP', ip: '192.168.1.1' },
      policyDecision: 'PERMITTED',
      executionResult: 'SUCCESS'
    });
    chain.push(r1);

    const r2 = GovernanceComplianceService.appendAuditRecord({
      existingChain: chain,
      tenantId,
      userId: 'usr-101',
      userEmail: 'operator@acme.com',
      actionType: 'MUTATE_WP_CONFIG',
      requestPayload: { action: 'OPTIMIZE_TABLES', site: siteId || 'site-1' },
      policyDecision: 'APPROVAL_GRANTED',
      approvedBy: 'security-lead@acme.com',
      executionResult: 'SUCCESS'
    });
    chain.push(r2);
    return chain;
  });

  const [chainVerification, setChainVerification] = useState<{ valid: boolean; error?: string }>({ valid: true });

  // Sessions State
  const [sessions, setSessions] = useState<EnterpriseSecuritySession[]>([
    {
      sessionId: 'sess-alpha',
      userId: 'usr-101',
      tenantId,
      ipAddress: '102.164.89.12',
      userAgent: 'Chrome 128 / macOS Sequoia',
      mfaVerified: true,
      createdAt: '2026-10-01T04:00:00Z',
      lastActiveAt: '2026-10-01T05:32:00Z',
      isRevoked: false
    },
    {
      sessionId: 'sess-beta',
      userId: 'usr-102',
      tenantId,
      ipAddress: '197.232.14.88',
      userAgent: 'Imperial AI Android Client 2.5',
      mfaVerified: true,
      createdAt: '2026-10-01T02:15:00Z',
      lastActiveAt: '2026-10-01T05:10:00Z',
      isRevoked: false
    }
  ]);

  // Incidents State
  const [incidents] = useState<EnterpriseIncidentRecord[]>([
    {
      id: 'inc-9901',
      tenantId,
      clientId,
      siteId,
      title: 'High Concurrency Rate Limit Spike from Untrusted IP Range',
      severity: 'SEV_2_HIGH',
      status: 'CONTAINED',
      leadInvestigatorId: 'sec-ops@acme.com',
      timeline: [
        { timestamp: '04:15 UTC', note: 'Edge firewall triggered rate-limit threshold (1,200 req/min)', author: 'Sentinel' },
        { timestamp: '04:18 UTC', note: 'Automated IP subnet quarantine engaged', author: 'Phase 8 Self-Healing' }
      ],
      containmentActionTaken: 'Quarantine applied to CIDR block. Zero data compromised.',
      customerCommReleased: false,
      createdAt: '2026-10-01T04:15:00Z'
    }
  ]);

  const handleVerifyChain = () => {
    const res = GovernanceComplianceService.verifyAuditHashChain(auditChain);
    setChainVerification(res);
  };

  const handleTamperSimulation = () => {
    const tampered = JSON.parse(JSON.stringify(auditChain));
    if (tampered.length > 0) {
      tampered[0].actionType = 'FORGED_ADMIN_ACTION';
      setAuditChain(tampered);
      const res = GovernanceComplianceService.verifyAuditHashChain(tampered);
      setChainVerification(res);
    }
  };

  const handleRevokeSession = (sessionId: string) => {
    setSessions(
      sessions.map(s => (s.sessionId === sessionId ? GovernanceComplianceService.revokeSession(s) : s))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Phase 14 Governance & GRC
              </span>
              <span className="text-xs text-neutral-400">Cryptographic Append-Only Integrity</span>
            </div>
            <h1 className="text-2xl font-bold text-neutral-100 mt-1">Enterprise Governance, Risk & Compliance</h1>
            <p className="text-sm text-neutral-400 mt-0.5">
              Tamper-resistant audit hash chaining, separation-of-duties enforcement, and instant session revocation.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleVerifyChain}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
            >
              <ShieldCheck className="w-4 h-4" />
              Verify Hash Chain
            </button>
            <button
              onClick={handleTamperSimulation}
              className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-rose-400 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all border border-neutral-700"
            >
              <AlertOctagon className="w-4 h-4" />
              Simulate Tamper
            </button>
          </div>
        </div>
      </div>

      {/* Verification Status Banner */}
      <div
        className={`p-4 rounded-2xl border flex items-center justify-between ${
          chainVerification.valid
            ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
            : 'bg-rose-950/60 border-rose-800 text-rose-300'
        }`}
      >
        <div className="flex items-center gap-3">
          {chainVerification.valid ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <div>
            <h4 className="text-sm font-bold">
              {chainVerification.valid
                ? 'Audit Chain Cryptographically Valid'
                : 'CRITICAL AUDIT TAMPERING DETECTED!'}
            </h4>
            <p className="text-xs opacity-90">
              {chainVerification.valid
                ? 'All SHA-256 hash pointers verified from genesis block to tip. Zero tampering detected.'
                : chainVerification.error}
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold uppercase tracking-wider">
          Blocks: {auditChain.length}
        </span>
      </div>

      {/* Tamper-Resistant Audit Log */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
          <History className="w-4 h-4 text-rose-400" />
          Append-Only Audit Hash Trail
        </h3>
        <div className="space-y-3">
          {auditChain.map(record => (
            <div key={record.id} className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-800 text-neutral-300">
                    Block #{record.index}
                  </span>
                  <span className="font-bold text-neutral-100">{record.actionType}</span>
                  <span className="text-neutral-400">by {record.userEmail}</span>
                </div>
                <span className="text-neutral-500 font-mono">{record.timestamp}</span>
              </div>
              <div className="font-mono text-[11px] text-neutral-400 space-y-0.5">
                <div>Prev Hash: <span className="text-neutral-500">{record.previousRecordHash.substring(0, 32)}...</span></div>
                <div>Curr Hash: <span className="text-emerald-400">{record.currentRecordHash.substring(0, 32)}...</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Security Sessions */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
          <Key className="w-4 h-4 text-rose-400" />
          Active Enterprise Sessions & Revocation
        </h3>
        <div className="divide-y divide-neutral-800">
          {sessions.map(sess => (
            <div key={sess.sessionId} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-neutral-100">{sess.userAgent}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-800 text-neutral-300">
                    {sess.ipAddress}
                  </span>
                  {sess.mfaVerified && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      MFA Verified
                    </span>
                  )}
                </div>
                <p className="text-neutral-500 mt-0.5">Last active: {sess.lastActiveAt}</p>
              </div>

              <div>
                {sess.isRevoked ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-950 text-rose-400 border border-rose-800">
                    Revoked
                  </span>
                ) : (
                  <button
                    onClick={() => handleRevokeSession(sess.sessionId)}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-rose-950 text-neutral-300 hover:text-rose-400 rounded-xl transition-all flex items-center gap-1.5 border border-neutral-700"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Revoke Session
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
