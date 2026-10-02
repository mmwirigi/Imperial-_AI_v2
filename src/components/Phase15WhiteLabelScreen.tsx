import React, { useState } from 'react';
import {
  WhiteLabelBrandingConfig,
  TenantSaaSEntitlement,
  BillingSubscription,
  SupportTicketRecord
} from '../types';
import { WhiteLabelSaaSConfigService } from '../services/whiteLabelSaaSConfigService';
import {
  Palette,
  CreditCard,
  LifeBuoy,
  Download,
  CheckCircle,
  AlertTriangle,
  Globe,
  Sliders,
  Shield,
  HelpCircle,
  FileText,
  Users
} from 'lucide-react';

interface Props {
  tenantId: string;
  clientId: string;
  isPlatformAdmin: boolean;
}

export const Phase15WhiteLabelScreen: React.FC<Props> = ({
  tenantId,
  isPlatformAdmin
}) => {
  const [branding, setBranding] = useState<WhiteLabelBrandingConfig>(
    WhiteLabelSaaSConfigService.getDefaultBranding(tenantId, 'Acme Enterprise Media')
  );

  const [entitlement] = useState<TenantSaaSEntitlement>({
    tenantId,
    ...WhiteLabelSaaSConfigService.getTierLimits('AGENCY'),
    tier: 'AGENCY',
    currentUsage: {
      clients: 18,
      sites: 64,
      users: 14,
      integrations: 12,
      agentRunsThisMonth: 1840,
      tokensThisMonth: 6200000,
      storageUsedMb: 32000
    },
    softLimitWarningIssued: false,
    hardLimitBlocked: false
  });

  const [subscription] = useState<BillingSubscription>(
    WhiteLabelSaaSConfigService.getBaselineSubscription(tenantId, 'AGENCY')
  );

  const [supportTicket, setSupportTicket] = useState<SupportTicketRecord>({
    id: 'ticket-911',
    tenantId,
    requestedBy: 'operator@acme.com',
    subject: 'Assistance diagnosing Cloudflare DNS caching with Redis MCP',
    priority: 'URGENT',
    status: 'OPEN',
    temporarySupportAccessGranted: false,
    createdAt: '2026-10-01T04:20:00Z',
    messages: [
      { sender: 'operator@acme.com', timestamp: '04:20 UTC', text: 'Requests temporary audit inspection from platform engineering.' }
    ]
  });

  const handleSaveBranding = () => {
    alert('Tenant branding and custom domain mapping updated successfully.');
  };

  const handleGrantSupport = () => {
    const updated = WhiteLabelSaaSConfigService.grantTemporarySupportAccess(supportTicket, 4);
    setSupportTicket(updated);
  };

  const handleExportDiagnostics = () => {
    const json = WhiteLabelSaaSConfigService.exportSanitizedDiagnostics({
      tenantId,
      organizationName: branding.organizationName,
      entitlement
    });
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sanitized-diagnostics-${tenantId}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20">
                Phase 15 Commercialization
              </span>
              <span className="text-xs text-neutral-400">White-Label & Metered SaaS</span>
            </div>
            <h1 className="text-2xl font-bold text-neutral-100 mt-1">White-Label SaaS & Customer Operations</h1>
            <p className="text-sm text-neutral-400 mt-0.5">
              Custom agency branding, domain mapping, metered plan entitlements, and time-limited support access.
            </p>
          </div>
          <button
            onClick={handleExportDiagnostics}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all border border-neutral-700"
          >
            <Download className="w-3.5 h-3.5" />
            Export Sanitized Diagnostics
          </button>
        </div>
      </div>

      {/* Grid: Branding Studio & Plan Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branding Studio */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
            <Palette className="w-4 h-4 text-orange-400" />
            White-Label Agency Branding
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-neutral-400 font-semibold block mb-1">Organization Display Name</label>
              <input
                type="text"
                value={branding.organizationName}
                onChange={e => setBranding({ ...branding, organizationName: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-neutral-400 font-semibold block mb-1">Custom CNAME Domain Mapping</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={branding.customDomain}
                  onChange={e => setBranding({ ...branding, customDomain: e.target.value })}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-mono focus:outline-none focus:border-orange-500"
                />
                <span className="px-3 py-2 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  DNS Verified
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              <div>
                <label className="text-neutral-400 font-semibold block mb-1">Primary Color</label>
                <div className="flex items-center gap-2 bg-neutral-950 p-2 rounded-xl border border-neutral-800">
                  <div className="w-5 h-5 rounded-md border" style={{ backgroundColor: branding.primaryColorHex }} />
                  <span className="font-mono text-neutral-300">{branding.primaryColorHex}</span>
                </div>
              </div>
              <div>
                <label className="text-neutral-400 font-semibold block mb-1">Secondary</label>
                <div className="flex items-center gap-2 bg-neutral-950 p-2 rounded-xl border border-neutral-800">
                  <div className="w-5 h-5 rounded-md border" style={{ backgroundColor: branding.secondaryColorHex }} />
                  <span className="font-mono text-neutral-300">{branding.secondaryColorHex}</span>
                </div>
              </div>
              <div>
                <label className="text-neutral-400 font-semibold block mb-1">Accent</label>
                <div className="flex items-center gap-2 bg-neutral-950 p-2 rounded-xl border border-neutral-800">
                  <div className="w-5 h-5 rounded-md border" style={{ backgroundColor: branding.accentColorHex }} />
                  <span className="font-mono text-neutral-300">{branding.accentColorHex}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveBranding}
              className="w-full mt-2 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition-all shadow-sm"
            >
              Save White-Label Theme
            </button>
          </div>
        </div>

        {/* Plan Entitlements & Metering */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-orange-400" />
              SaaS Entitlements ({entitlement.tier} Plan)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-950 text-amber-400 border border-amber-800">
              ${subscription.amountUsd}/mo
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-neutral-400 mb-1">
                <span>WordPress Sites Provisioned:</span>
                <span className="font-bold text-neutral-200">{entitlement.currentUsage.sites} / {entitlement.maxSites}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-neutral-950 overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full"
                  style={{ width: `${(entitlement.currentUsage.sites / entitlement.maxSites) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-neutral-400 mb-1">
                <span>Monthly Agent Runs:</span>
                <span className="font-bold text-neutral-200">{entitlement.currentUsage.agentRunsThisMonth} / {entitlement.monthlyAgentRunsQuota}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-neutral-950 overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${(entitlement.currentUsage.agentRunsThisMonth / entitlement.monthlyAgentRunsQuota) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-neutral-400 mb-1">
                <span>AI Token Consumption:</span>
                <span className="font-bold text-neutral-200">6.2M / 15.0M tokens</span>
              </div>
              <div className="w-full h-2 rounded-full bg-neutral-950 overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: '41%' }} />
              </div>
            </div>

            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1 text-neutral-400">
              <div className="text-neutral-200 font-semibold">Payment Details:</div>
              <div>{subscription.paymentMethodSummary}</div>
              <div className="text-[11px] text-neutral-500">Next billing date: November 1, 2026</div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Support & Audited Access Delegation */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
          <LifeBuoy className="w-4 h-4 text-orange-400" />
          Time-Limited Customer Support Access
        </h2>
        <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-bold text-neutral-100">{supportTicket.subject}</span>
              <p className="text-neutral-400 mt-0.5">Ticket ID: {supportTicket.id} • Priority: {supportTicket.priority}</p>
            </div>
            {supportTicket.temporarySupportAccessGranted ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1.5 animate-pulse">
                <Shield className="w-3.5 h-3.5" />
                Active 4-Hour Support Window
              </span>
            ) : (
              <button
                onClick={handleGrantSupport}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
              >
                <Shield className="w-3.5 h-3.5" />
                Grant Temporary 4-Hour Access
              </button>
            )}
          </div>
          <div className="space-y-1 pt-1 border-t border-neutral-800/80">
            {supportTicket.messages.map((m, idx) => (
              <div key={idx} className="text-neutral-400">
                <strong className="text-neutral-300">[{m.timestamp}] {m.sender}:</strong> {m.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
