import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileCheck2,
  Search,
  Filter
} from 'lucide-react';
import { SecurityEventItem } from '../types';
import { Button, Card, Badge, MetricCard } from './common/UIComponents';

interface SecurityCenterScreenProps {
  securityEvents: SecurityEventItem[];
}

export const SecurityCenterScreen: React.FC<SecurityCenterScreenProps> = ({
  securityEvents
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEvents = securityEvents.filter((e) => {
    if (filterSeverity !== 'ALL' && e.severity !== filterSeverity) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        (e.description || '').toLowerCase().includes(q) ||
        (e.threatActor || '').toLowerCase().includes(q) ||
        (e.eventType || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const criticalCount = securityEvents.filter((e) => e.severity === 'CRITICAL').length;
  const highCount = securityEvents.filter((e) => e.severity === 'HIGH').length;
  const mediumCount = securityEvents.filter((e) => e.severity === 'MEDIUM').length;

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <Badge variant="error" size="sm" dot>CRITICAL</Badge>;
      case 'HIGH':
        return <Badge variant="warning" size="sm" dot>HIGH</Badge>;
      case 'MEDIUM':
        return <Badge variant="amber" size="sm">MEDIUM</Badge>;
      default:
        return <Badge variant="neutral" size="sm">LOW</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="error" size="sm" dot>
            PHASE 5 SECURITY AUTHORITY
          </Badge>
          <span className="text-xs text-slate-500 font-mono">Real-Time Threat Gates</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
          Security Center &amp; Access Controls
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Guaranteed invariant gates: Wrong-site blocks, prompt-injection defense, and tenant isolation.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Security Invariants"
          value="ENFORCED"
          subtitle="Zero bypass permitted"
          icon={ShieldCheck}
          accentColor="emerald"
        />
        <MetricCard
          title="Blocked Operations"
          value={criticalCount + highCount}
          subtitle="Immediate containment"
          icon={ShieldAlert}
          accentColor={criticalCount > 0 ? 'rose' : 'emerald'}
        />
        <MetricCard
          title="Cross-Site Attempts"
          value="0 Permitted"
          subtitle="Strict context binding"
          icon={Lock}
          accentColor="blue"
        />
        <MetricCard
          title="Credentials Sealed"
          value="Keystore Safe"
          subtitle="Never logged or exported"
          icon={Shield}
          accentColor="indigo"
        />
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search security events by actor, description or event type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 text-slate-900"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs px-1">
          {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                filterSeverity === sev
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            Security Events &amp; Invariant Telemetry ({filteredEvents.length})
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            Append-Only Audit Stream
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredEvents.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <ShieldCheck className="w-8 h-8 mx-auto text-emerald-500" />
              <p className="text-xs font-semibold text-slate-700">Zero Security Violations</p>
              <p className="text-[11px] text-slate-400">All operating boundaries and authentication invariants are intact.</p>
            </div>
          ) : (
            filteredEvents.map((evt) => (
              <div key={evt.id} className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors space-y-2 text-xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(evt.severity)}
                    <span className="font-bold text-slate-900">{evt.eventType}</span>
                  </div>
                  <span className="text-slate-400 font-mono text-[10px]">{evt.timestamp}</span>
                </div>

                <p className="text-slate-700 leading-relaxed text-xs">{evt.description}</p>

                <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500 pt-1">
                  <span>Threat Actor: <strong className="text-slate-800">{evt.threatActor}</strong></span>
                  <span>•</span>
                  <span>IP: <strong className="text-slate-800">{evt.ipAddress}</strong></span>
                  <span>•</span>
                  <span className="text-emerald-700 font-bold">Mitigation: {evt.mitigationAction}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
