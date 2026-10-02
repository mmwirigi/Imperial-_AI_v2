import React, { useState } from 'react';
import {
  EnterpriseApiKey,
  IntegrationInstance,
  InboundWebhookSubscription,
  WebhookEventDelivery,
  WorkflowModel,
  WorkflowRunRecord
} from '../types';
import { EnterpriseIntegrationService } from '../services/enterpriseIntegrationService';
import {
  Key,
  Plug,
  Webhook,
  Play,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  Shield,
  Clock,
  Terminal,
  FileText,
  Trash2,
  Copy,
  ExternalLink
} from 'lucide-react';

interface Props {
  tenantId: string;
  clientId: string;
  siteId?: string;
  isPlatformAdmin: boolean;
}

export const Phase10IntegrationsScreen: React.FC<Props> = ({
  tenantId,
  clientId,
  siteId,
  isPlatformAdmin
}) => {
  const [activeTab, setActiveTab] = useState<'API_KEYS' | 'INTEGRATIONS' | 'WEBHOOKS' | 'WORKFLOWS'>('INTEGRATIONS');

  // API Keys State
  const [apiKeys, setApiKeys] = useState<EnterpriseApiKey[]>([
    {
      id: 'key-1',
      tenantId,
      name: 'Production Ingestion Worker',
      keyPrefix: 'imp_live_acme_7f9a',
      keyHash: 'a7b8c9d0e1f20123456789abcdef0123456789abcdef0123456789abcdef0123',
      scopes: ['sites:read', 'tasks:create', 'workflows:trigger'],
      createdAt: '2026-09-28T10:00:00Z',
      expiresAt: '2026-12-28T10:00:00Z',
      lastUsedAt: '2026-10-01T04:22:10Z',
      status: 'ACTIVE',
      createdBy: 'admin@acme.com'
    }
  ]);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedRawSecret, setGeneratedRawSecret] = useState<string | null>(null);

  // Integrations State
  const [integrations, setIntegrations] = useState<IntegrationInstance[]>([
    {
      id: 'int-gsc',
      tenantId,
      clientId,
      siteId,
      provider: 'GOOGLE_SEARCH_CONSOLE',
      name: 'Google Search Console',
      status: 'CONNECTED',
      scopes: ['webmasters.readonly', 'webmasters.inspect'],
      credentialRef: `vault:${tenantId}:gsc:9f8e7d:ya29...`,
      healthStatus: 'HEALTHY',
      lastCheckedAt: '2026-10-01T05:30:00Z',
      lastSuccessfulSync: '2026-10-01T05:30:00Z',
      config: { propertyUrl: 'sc-domain:imperialenterprise.ke' },
      syncHistory: [
        { id: 's-1', timestamp: '10 mins ago', status: 'SUCCESS', recordsProcessed: 42, details: 'Sitemap and crawl index refreshed.' }
      ]
    },
    {
      id: 'int-ga4',
      tenantId,
      clientId,
      siteId,
      provider: 'GOOGLE_ANALYTICS_4',
      name: 'Google Analytics 4',
      status: 'CONNECTED',
      scopes: ['analytics.readonly'],
      credentialRef: `vault:${tenantId}:ga4:4c3b2a:ya29...`,
      healthStatus: 'HEALTHY',
      lastCheckedAt: '2026-10-01T05:00:00Z',
      lastSuccessfulSync: '2026-10-01T05:00:00Z',
      config: { propertyId: 'properties/318491204' },
      syncHistory: [
        { id: 's-2', timestamp: '35 mins ago', status: 'SUCCESS', recordsProcessed: 128, details: 'Traffic sessions and events ingested.' }
      ]
    },
    {
      id: 'int-email',
      tenantId,
      clientId,
      siteId,
      provider: 'EMAIL_TRANSACTIONAL',
      name: 'Transactional Email (SendGrid/SMTP)',
      status: 'CONNECTED',
      scopes: ['mail.send'],
      credentialRef: `vault:${tenantId}:email:8a7b6c:SG.x...`,
      healthStatus: 'HEALTHY',
      lastCheckedAt: '2026-10-01T04:45:00Z',
      config: { fromAddress: 'alerts@imperialenterprise.ke' },
      syncHistory: []
    },
    {
      id: 'int-slack',
      tenantId,
      clientId,
      siteId,
      provider: 'SLACK_NOTIFICATIONS',
      name: 'Slack Security Alerts',
      status: 'CONNECTED',
      scopes: ['incoming-webhook'],
      credentialRef: `vault:${tenantId}:slack:1a2b3c:hooks...`,
      healthStatus: 'HEALTHY',
      lastCheckedAt: '2026-10-01T04:00:00Z',
      config: { channel: '#imperial-sec-ops' },
      syncHistory: []
    }
  ]);

  // Webhooks State
  const [webhooks, setWebhooks] = useState<WebhookEventDelivery[]>([
    {
      id: 'wh-1',
      tenantId,
      direction: 'INBOUND',
      provider: 'Google Search Console',
      eventType: 'crawl.completed',
      payloadSummary: '{"siteUrl": "imperialenterprise.ke", "pagesCrawled": 340}',
      signatureVerified: true,
      idempotencyKey: 'idemp-gsc-9921',
      status: 'DELIVERED',
      attemptCount: 1,
      timestamp: '2026-10-01T04:40:12Z'
    },
    {
      id: 'wh-2',
      tenantId,
      direction: 'OUTBOUND',
      provider: 'Slack Ops Webhook',
      eventType: 'alert.anomaly_detected',
      payloadSummary: '{"severity": "HIGH", "message": "TTFB latency spike detected"}',
      signatureVerified: true,
      idempotencyKey: 'idemp-slk-8842',
      status: 'DELIVERED',
      attemptCount: 1,
      timestamp: '2026-10-01T05:12:00Z'
    }
  ]);

  // Workflows State
  const [workflows, setWorkflows] = useState<WorkflowModel[]>([
    {
      id: 'wf-site-health',
      tenantId,
      clientId,
      siteId,
      name: 'Automated Site Health & SEO Audit',
      description: 'Runs weekly deep crawl, checks GSC index status, and stages optimization report.',
      version: 2,
      status: 'ACTIVE',
      triggerType: 'SCHEDULED',
      triggerConfig: { cron: '0 0 * * 0' },
      conditions: [{ field: 'site.mcpStatus', operator: 'EQUALS', value: 'CONNECTED' }],
      actions: [
        { id: 'a1', stepNumber: 1, actionType: 'AUDIT_SITE', title: 'WordPress Stack & Integrity Audit', params: {}, requiresPhase5Approval: false },
        { id: 'a2', stepNumber: 2, actionType: 'GSC_INSPECT', title: 'Google Search Console URL Verification', params: {}, requiresPhase5Approval: false },
        { id: 'a3', stepNumber: 3, actionType: 'ANALYTICS_REPORT', title: 'Generate GA4 Performance Summary', params: {}, requiresPhase5Approval: false }
      ],
      retryPolicy: { maxRetries: 3, backoffSeconds: 30 },
      requiresApproval: false,
      createdBy: 'admin@acme.com',
      createdAt: '2026-09-20T12:00:00Z',
      lastRunAt: '2026-10-01T04:00:00Z',
      lastRunStatus: 'SUCCESS'
    },
    {
      id: 'wf-core-patch',
      tenantId,
      clientId,
      siteId,
      name: 'High-Impact WordPress Core & Plugin Patching',
      description: 'Detects critical security updates, generates automated rollback snapshot, and requests approval.',
      version: 1,
      status: 'ACTIVE',
      triggerType: 'ANOMALY_DETECTED',
      triggerConfig: { threshold: 80 },
      conditions: [{ field: 'vulnerabilitiesDetected', operator: 'GREATER_THAN', value: 0 }],
      actions: [
        { id: 'b1', stepNumber: 1, actionType: 'TRIGGER_BACKUP', title: 'Pre-flight Snapshot Creation', params: {}, requiresPhase5Approval: false },
        { id: 'b2', stepNumber: 2, actionType: 'EXECUTE_CONTROLLED_TASK', title: 'Apply WordPress Security Patch', params: {}, requiresPhase5Approval: true },
        { id: 'b3', stepNumber: 3, actionType: 'SEND_NOTIFICATION', title: 'Notify Admin via Slack', params: {}, requiresPhase5Approval: false }
      ],
      retryPolicy: { maxRetries: 1, backoffSeconds: 60 },
      requiresApproval: true,
      createdBy: 'admin@acme.com',
      createdAt: '2026-09-25T14:30:00Z',
      lastRunAt: '2026-10-01T05:15:00Z',
      lastRunStatus: 'PENDING_APPROVAL'
    }
  ]);

  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRunRecord[]>([]);
  const [runningWfId, setRunningWfId] = useState<string | null>(null);

  // Handle Generate API Key
  const handleGenerateKey = () => {
    if (!newKeyName.trim()) return;
    const { keyRecord, rawSecret } = EnterpriseIntegrationService.generateApiKey({
      tenantId,
      name: newKeyName,
      scopes: ['sites:read', 'tasks:create', 'workflows:trigger'],
      expiryDays: 60,
      createdBy: 'operator@imperial.ai'
    });
    setApiKeys([keyRecord, ...apiKeys]);
    setGeneratedRawSecret(rawSecret);
    setNewKeyName('');
  };

  // Handle Health Check
  const handleHealthCheck = async (inst: IntegrationInstance) => {
    await EnterpriseIntegrationService.checkIntegrationHealth(inst);
    setIntegrations([...integrations]);
  };

  // Handle Run Workflow
  const handleRunWorkflow = (wf: WorkflowModel) => {
    setRunningWfId(wf.id);
    try {
      const { runRecord } = EnterpriseIntegrationService.executeWorkflow({
        workflow: wf,
        tenantContextId: tenantId,
        userPermissions: ['EXECUTE_TASKS', 'MANAGE_SITES'],
        isPlatformAdmin
      });
      setWorkflowRuns([runRecord, ...workflowRuns]);
      setWorkflows([...workflows]);
    } catch (err: any) {
      alert(err.message || 'Workflow execution failed');
    } finally {
      setRunningWfId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Phase 10 Foundation
              </span>
              <span className="text-xs text-neutral-400">Tenant: {tenantId}</span>
            </div>
            <h1 className="text-2xl font-bold text-neutral-100 mt-1">Enterprise API & Automation Ecosystem</h1>
            <p className="text-sm text-neutral-400 mt-0.5">
              Secure external platform adapters, cryptographically signed webhooks, and policy-bound workflows.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('INTEGRATIONS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'INTEGRATIONS'
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              Integrations ({integrations.length})
            </button>
            <button
              onClick={() => setActiveTab('API_KEYS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'API_KEYS'
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              API Keys ({apiKeys.length})
            </button>
            <button
              onClick={() => setActiveTab('WEBHOOKS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'WEBHOOKS'
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              Webhooks ({webhooks.length})
            </button>
            <button
              onClick={() => setActiveTab('WORKFLOWS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'WORKFLOWS'
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              Workflows ({workflows.length})
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: INTEGRATIONS DIRECTORY */}
      {activeTab === 'INTEGRATIONS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map(inst => (
            <div key={inst.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-amber-400">
                    <Plug className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-neutral-100">{inst.name}</h3>
                    <p className="text-xs text-neutral-400">Provider: {inst.provider}</p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                    inst.status === 'CONNECTED'
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                      : 'bg-amber-950/80 text-amber-400 border border-amber-800'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {inst.status}
                </span>
              </div>

              <div className="bg-neutral-950/60 rounded-xl p-3 border border-neutral-800/80 space-y-2 text-xs">
                <div className="flex justify-between text-neutral-400">
                  <span>Vault Pointer:</span>
                  <span className="font-mono text-neutral-300">{inst.credentialRef}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Granted Scopes:</span>
                  <span className="font-mono text-amber-400/90">{inst.scopes.join(', ')}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Last Health Check:</span>
                  <span className="text-neutral-300">{new Date(inst.lastCheckedAt).toLocaleTimeString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => handleHealthCheck(inst)}
                  className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-amber-400 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Run Health Diagnostic
                </button>
                <button
                  onClick={async () => {
                    await EnterpriseIntegrationService.runSyncJob(inst);
                    setIntegrations([...integrations]);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Sync Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: API KEYS */}
      {activeTab === 'API_KEYS' && (
        <div className="space-y-4">
          {/* Create Key Box */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
            <h3 className="text-base font-bold text-neutral-100 mb-2 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              Issue Tenant-Scoped API Key
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              API keys are hashed with SHA-256 immediately upon creation. Raw keys are never stored on the server.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Key Description (e.g. CI/CD Deployment Bot)"
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={handleGenerateKey}
                disabled={!newKeyName.trim()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Generate Key
              </button>
            </div>

            {/* Display raw secret once alert */}
            {generatedRawSecret && (
              <div className="mt-4 p-4 bg-amber-950/40 border border-amber-600/60 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  Copy your API key now. You will not be able to see it again!
                </div>
                <div className="flex items-center justify-between bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                  <code className="text-xs font-mono text-emerald-400 break-all">{generatedRawSecret}</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedRawSecret);
                      alert('Copied to clipboard!');
                    }}
                    className="ml-3 p-1.5 text-neutral-400 hover:text-white"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Keys List */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-neutral-800">
              <h3 className="text-sm font-bold text-neutral-200">Active Tenant Keys</h3>
            </div>
            <div className="divide-y divide-neutral-800">
              {apiKeys.map(key => (
                <div key={key.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-neutral-100">{key.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-800 text-neutral-300">
                        {key.keyPrefix}...
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-neutral-400 mt-1">
                      <span>Scopes: {key.scopes.join(', ')}</span>
                      <span>Expires: {new Date(key.expiresAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {key.status}
                    </span>
                    <button
                      onClick={() => {
                        setApiKeys(apiKeys.map(k => (k.id === key.id ? { ...k, status: 'REVOKED' } : k)));
                      }}
                      className="p-1.5 text-rose-400 hover:bg-rose-950/50 rounded-lg transition-colors"
                      title="Revoke Key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WEBHOOKS & DELIVERIES */}
      {activeTab === 'WEBHOOKS' && (
        <div className="space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                  <Webhook className="w-4 h-4 text-amber-400" />
                  Verified Event Stream & Delivery Logs
                </h3>
                <p className="text-xs text-neutral-400">
                  Every webhook validates HMAC signatures, checks replay nonces, and enforces bounded retry backoff.
                </p>
              </div>
            </div>

            <div className="divide-y divide-neutral-800">
              {webhooks.map(wh => (
                <div key={wh.id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          wh.direction === 'INBOUND' ? 'bg-blue-950 text-blue-400' : 'bg-purple-950 text-purple-400'
                        }`}
                      >
                        {wh.direction}
                      </span>
                      <span className="font-bold text-xs text-neutral-200">{wh.provider}</span>
                      <span className="text-xs text-neutral-400 font-mono">({wh.eventType})</span>
                    </div>
                    <p className="text-xs font-mono text-neutral-400">{wh.payloadSummary}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-neutral-500 font-mono">{wh.idempotencyKey}</span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Signature Verified
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: WORKFLOW AUTOMATION ENGINE */}
      {activeTab === 'WORKFLOWS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workflows.map(wf => (
              <div key={wf.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-neutral-100">{wf.name}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-800 text-neutral-300">
                        v{wf.version}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-1">{wf.description}</p>
                  </div>
                  {wf.requiresApproval && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Approval Enforced
                    </span>
                  )}
                </div>

                <div className="bg-neutral-950/60 rounded-xl p-3 border border-neutral-800/80 space-y-2">
                  <div className="text-xs font-semibold text-neutral-300">Steps ({wf.actions.length}):</div>
                  <ol className="list-decimal list-inside text-xs text-neutral-400 space-y-1">
                    {wf.actions.map(a => (
                      <li key={a.id} className={a.requiresPhase5Approval ? 'text-amber-400 font-semibold' : ''}>
                        {a.title} {a.requiresPhase5Approval && '(Phase 5 Approval Required)'}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-neutral-500">
                    Trigger: <span className="font-mono text-neutral-400">{wf.triggerType}</span>
                  </div>
                  <button
                    onClick={() => handleRunWorkflow(wf)}
                    disabled={runningWfId === wf.id}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
                  >
                    <Play className="w-3.5 h-3.5" />
                    {runningWfId === wf.id ? 'Evaluating...' : 'Run Workflow'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Workflow Execution Log */}
          {workflowRuns.length > 0 && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                Latest Workflow Run Logs
              </h3>
              <div className="bg-neutral-950 rounded-xl p-4 font-mono text-xs text-neutral-300 space-y-1.5 border border-neutral-800 max-h-60 overflow-y-auto">
                {workflowRuns[0].logs.map((log, idx) => (
                  <div key={idx} className={log.includes('Phase 5') ? 'text-amber-400 font-bold' : ''}>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
