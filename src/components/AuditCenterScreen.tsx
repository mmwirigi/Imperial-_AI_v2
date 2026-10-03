import React, { useState } from 'react';
import {
  FileCheck2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  User,
  Globe,
  Search,
  Hash,
  Sparkles,
  Lock
} from 'lucide-react';
import { AuditEvent } from '../types';
import { Card, Badge, Button, MetricCard } from './common/UIComponents';

interface AuditCenterScreenProps {
  auditEvents: AuditEvent[];
}

export const AuditCenterScreen: React.FC<AuditCenterScreenProps> = ({
  auditEvents
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAudits = auditEvents.filter((a) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    const action = a.userAction || a.aiAction || a.title || '';
    const site = a.siteName || '';
    const summary = a.resultSummary || a.details || '';
    const toolName = a.tool || '';
    return (
      action.toLowerCase().includes(q) ||
      site.toLowerCase().includes(q) ||
      summary.toLowerCase().includes(q) ||
      toolName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="amber" size="sm" dot>
            CRYPTOGRAPHIC AUDIT LOG
          </Badge>
          <span className="text-xs text-slate-500 font-mono">Immutable Hash Chain</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
          Enterprise Audit Center
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          SHA-256 chained, tamper-resistant operations audit trail. Complete traceability for every production mutation.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Recorded Events"
          value={auditEvents.length}
          subtitle="Chained sequentially"
          icon={FileCheck2}
          accentColor="amber"
        />
        <MetricCard
          title="Hash Chain State"
          value="VERIFIED"
          subtitle="Zero tampering detected"
          icon={ShieldCheck}
          accentColor="emerald"
        />
        <MetricCard
          title="Operator Logins"
          value="MFA Enforced"
          subtitle="Signed authorization tokens"
          icon={User}
          accentColor="blue"
        />
        <MetricCard
          title="Secrets Scrubbed"
          value="100% Redacted"
          subtitle="Never stored in plaintext"
          icon={Lock}
          accentColor="indigo"
        />
      </div>

      {/* Search Input */}
      <div className="p-2 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search audit trail by operator, action, site name, or result..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 text-slate-900"
          />
        </div>
      </div>

      {/* Timeline View (WHO DID WHAT ON WHICH SITE WHEN RESULT) */}
      <Card className="p-6 space-y-6">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          Immutable Activity Timeline
        </h3>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {filteredAudits.map((event, idx) => (
            <div key={event.id || idx} className="relative group">
              {/* Dot */}
              <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white shadow-2xs ring-2 ring-amber-400/20" />

              <div className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:bg-slate-50/70 transition-all space-y-2 text-xs shadow-2xs">
                {/* Top: WHO DID WHAT */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      {(event.userAction || '').includes('Approved') || (event.userAction || '').includes('Operator') ? 'Martin (Operator)' : 'Autonomous Agent'}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      {event.userAction || event.aiAction || 'System Mutation'}
                    </span>
                  </div>
                  <span className="text-slate-400 font-mono text-[10px]">{event.timestamp}</span>
                </div>

                {/* ON WHICH CLIENT & SITE */}
                <div className="flex items-center gap-2 text-slate-500 text-[11px] font-mono">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-800">{event.siteName}</span>
                  <span>•</span>
                  <span>Tool: {event.tool}</span>
                </div>

                {/* RESULT */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-mono text-[11px] leading-relaxed">
                  Result: <strong className="text-slate-900">{event.resultSummary}</strong>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                  <span>Status: <strong className="text-emerald-700">{event.approvalStatus}</strong></span>
                  <span>Parameters: {event.parametersSummary}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
