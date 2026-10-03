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
import { Button, Card, Badge } from './common/UIComponents';

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
      id: 'int-wp-1',
      tenantId,
      clientId,
      siteId,
      provider: 'CUSTOM_WEBHOOK',
      name: 'Primary WordPress Host Connection',
      status: 'CONNECTED',
      credentialRef: 'vault://credentials/wp-mcp-core',
      scopes: ['posts:write', 'plugins:read', 'database:snapshot'],
      lastCheckedAt: '2026-10-01T05:00:00Z',
      healthStatus: 'HEALTHY',
      config: { host: 'wp-core' },
      syncHistory: []
    },
    {
      id: 'int-gsc-1',
      tenantId,
      clientId,
      siteId,
      provider: 'GOOGLE_SEARCH_CONSOLE',
      name: 'Google Search Console Verification',
      status: 'CONNECTED',
      credentialRef: 'vault://oauth2/google/gsc-prod',
      scopes: ['searchconsole:read', 'sitemaps:submit'],
      lastCheckedAt: '2026-10-01T04:30:00Z',
      healthStatus: 'HEALTHY',
      config: { propertyId: 'gsc-1' },
      syncHistory: []
    },
    {
      id: 'int-ga4-1',
      tenantId,
      clientId,
      siteId,
      provider: 'GOOGLE_ANALYTICS_4',
      name: 'Google Analytics 4 Measurement Pipeline',
      status: 'CONNECTED',
      credentialRef: 'vault://oauth2/google/ga4-prod',
      scopes: ['analytics.readonly'],
      lastCheckedAt: '2026-10-01T04:35:00Z',
      healthStatus: 'HEALTHY',
      config: { measurementId: 'G-12345' },
      syncHistory: []
    },
    {
      id: 'int-gbp-1',
      tenantId,
      clientId,
      siteId,
      provider: 'GOOGLE_BUSINESS_PROFILE',
      name: 'Google Business Profile Connector',
      status: 'CONNECTED',
      credentialRef: 'vault://oauth2/google/gbp-prod',
      scopes: ['business.manage'],
      lastCheckedAt: '2026-10-01T04:40:00Z',
      healthStatus: 'HEALTHY',
      config: { locationId: 'loc-1' },
      syncHistory: []
    },
    {
      id: 'int-email-1',
      tenantId,
      clientId,
      siteId,
      provider: 'EMAIL_TRANSACTIONAL',
      name: 'Transactional Email Dispatcher (SendGrid)',
      status: 'CONNECTED',
      credentialRef: 'vault://apikeys/sendgrid/transactional',
      scopes: ['mail:send'],
      lastCheckedAt: '2026-10-01T04:45:00Z',
      healthStatus: 'HEALTHY',
      config: { sender: 'notify@imperial.ai' },
      syncHistory: []
    },
    {
      id: 'int-s3-1',
      tenantId,
      clientId,
      siteId,
      provider: 'CLOUD_STORAGE',
      name: 'Cold Storage & Checkpoint Archive (Cloudflare R2)',
      status: 'CONNECTED',
      credentialRef: 'vault://s3/cloudflare-r2-backups',
      scopes: ['s3:PutObject', 's3:GetObject'],
      lastCheckedAt: '2026-10-01T04:50:00Z',
      healthStatus: 'HEALTHY',
      config: { bucket: 'backups-prod' },
      syncHistory: []
    }
  ]);

  // Webhooks State
  const [webhooks, setWebhooks] = useState<InboundWebhookSubscription[]>([
    {
      id: 'wh-sub-1',
      tenantId,
      clientId,
      provider: 'GitHub Deployment Hook',
      endpointUrl: '/api/v1/webhooks/github',
      secretHash: 'sha256-whsec-github-production-1234',
      status: 'ACTIVE',
      retryCount: 0,
      replayProtectionNonceCache: ['nonce-1', 'nonce-2'],
      lastReceivedAt: '2026-09-20T12:00:00Z'
    },
    {
      id: 'wh-sub-2',
      tenantId,
      clientId,
      provider: 'WordPress Error Stream',
      endpointUrl: '/api/v1/webhooks/wp-errors',
      secretHash: 'sha256-whsec-wp-errors-production-5678',
      status: 'ACTIVE',
      retryCount: 0,
      replayProtectionNonceCache: ['nonce-3'],
      lastReceivedAt: '2026-09-21T10:00:00Z'
    }
  ]);

  // Workflows State
  const [workflows, setWorkflows] = useState<WorkflowModel[]>([
    {
      id: 'wf-auto-backup',
      tenantId,
      clientId,
      name: 'Pre-Deployment Database Snapshot & Integrity Check',
      description: 'Trigger checkpoint snapshot prior to deployment',
      version: 1,
      status: 'ACTIVE',
      triggerType: 'WEBHOOK',
      triggerConfig: { event: 'GITHUB_DEPLOYMENT_COMPLETED' },
      conditions: [{ field: 'branch', operator: 'EQUALS', value: 'main' }],
      actions: [
        { id: 'a1', stepNumber: 1, actionType: 'TRIGGER_BACKUP', title: 'Create WordPress Checkpoint Snapshot', params: {}, requiresPhase5Approval: false },
        { id: 'a2', stepNumber: 2, actionType: 'AUDIT_SITE', title: 'Verify Checkpoint Reversibility', params: {}, requiresPhase5Approval: false }
      ],
      retryPolicy: { maxRetries: 2, backoffSeconds: 30 },
      requiresApproval: false,
      createdBy: 'admin@acme.com',
      createdAt: '2026-09-22T08:00:00Z',
      lastRunAt: '2026-10-01T04:55:00Z',
      lastRunStatus: 'SUCCESS'
    },
    {
      id: 'wf-security-patch',
      tenantId,
      clientId,
      name: 'Vulnerability Detected -> Security Patch Workflow',
      description: 'Automated patch preparation when threat detected',
      version: 1,
      status: 'ACTIVE',
      triggerType: 'ANOMALY_DETECTED',
      triggerConfig: { event: 'VULNERABILITY_ALERT', threshold: 0 },
      conditions: [{ field: 'vulnerabilitiesDetected', operator: 'GREATER_THAN', value: 0 }],
      actions: [
        { id: 'b1', stepNumber: 1, actionType: 'TRIGGER_BACKUP', title: 'Pre-flight Snapshot Creation', params: {}, requiresPhase5Approval: false },
        { id: 'b2', stepNumber: 2, actionType: 'EXECUTE_CONTROLLED_TASK', title: 'Apply WordPress Security Patch', params: {}, requiresPhase5Approval: true },
        { id: 'b3', stepNumber: 3, actionType: 'SEND_NOTIFICATION', title: 'Notify Admin via Slack', params: {}, requiresPhase5Approval: false }
      ],
      retryPolicy: { maxRetries: 1, backoffSeconds: 60 },
      requiresApproval: true,
      createdBy: 'admin@acme.com',
      createdAt: '2026-09-23T09:00:00Z',
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Header */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="amber" size="sm">
                ENTERPRISE GATEWAY
              </Badge>
              <span className="text-xs text-slate-500 font-mono">Scope: {tenantId}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">
              Enterprise API &amp; Integrations Ecosystem
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Secure external platform adapters, cryptographically signed webhooks, and policy-bound workflows.
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveTab('INTEGRATIONS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'INTEGRATIONS'
                  ? 'bg-amber-500 text-slate-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Integrations ({integrations.length})
            </button>
            <button
              onClick={() => setActiveTab('API_KEYS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'API_KEYS'
                  ? 'bg-amber-500 text-slate-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              API Keys ({apiKeys.length})
            </button>
            <button
              onClick={() => setActiveTab('WEBHOOKS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'WEBHOOKS'
                  ? 'bg-amber-500 text-slate-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Webhooks ({webhooks.length})
            </button>
            <button
              onClick={() => setActiveTab('WORKFLOWS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'WORKFLOWS'
                  ? 'bg-amber-500 text-slate-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Workflows ({workflows.length})
            </button>
          </div>
        </div>
      </Card>

      {/* TAB 1: INTEGRATIONS DIRECTORY */}
      {activeTab === 'INTEGRATIONS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map((inst) => (
            <Card key={inst.id} className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
                    <Plug className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{inst.name}</h3>
                    <p className="text-xs text-slate-500 font-mono">Provider: {inst.provider}</p>
                  </div>
                </div>
                <Badge variant={inst.status === 'CONNECTED' ? 'success' : 'warning'} size="sm" dot>
                  {inst.status}
                </Badge>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Vault Pointer:</span>
                  <span className="font-mono text-slate-900 font-bold">{inst.credentialRef}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Scopes:</span>
                  <span className="font-mono text-amber-800 font-semibold">{inst.scopes.join(', ')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Last Health Check:</span>
                  <span className="text-slate-800">{new Date(inst.lastCheckedAt).toLocaleTimeString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleHealthCheck(inst)}
                  icon={RefreshCw}
                >
                  Health Check
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={async () => {
                    await EnterpriseIntegrationService.runSyncJob(inst);
                    setIntegrations([...integrations]);
                  }}
                  icon={RefreshCw}
                >
                  Sync Now
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* TAB 2: API KEYS */}
      {activeTab === 'API_KEYS' && (
        <div className="space-y-4">
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-600" />
              Issue Tenant-Scoped API Key
            </h3>
            <p className="text-xs text-slate-500">
              API keys are hashed with SHA-256 immediately upon creation. Raw keys are never stored on the server.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Key Description (e.g. CI/CD Deployment Bot)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 rounded-xl px-4 py-2 text-xs text-slate-900"
              />
              <Button
                variant="primary"
                size="md"
                onClick={handleGenerateKey}
                disabled={!newKeyName.trim()}
                icon={Plus}
              >
                Generate Key
              </Button>
            </div>

            {generatedRawSecret && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  IMPORTANT: Copy your raw API Key now. It will never be displayed again.
                </div>
                <div className="p-3 bg-white rounded-xl border border-amber-200 font-mono text-xs text-slate-900 break-all select-all font-bold">
                  {generatedRawSecret}
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Active API Keys</h3>
            <div className="space-y-2">
              {apiKeys.map((key) => (
                <div key={key.id} className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{key.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{key.keyPrefix}••••••••</div>
                  </div>
                  <Badge variant="success" size="sm">
                    {key.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: WEBHOOKS */}
      {activeTab === 'WEBHOOKS' && (
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Webhook className="w-4 h-4 text-purple-600" />
            Inbound HMAC-SHA256 Webhook Subscriptions
          </h3>
          <div className="space-y-3">
            {webhooks.map((wh) => (
              <div key={wh.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{wh.provider}</span>
                  <Badge variant="success" size="sm">
                    {wh.status}
                  </Badge>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Endpoint: {wh.endpointUrl} • Nonces cached: {wh.replayProtectionNonceCache.length}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 4: WORKFLOWS */}
      {activeTab === 'WORKFLOWS' && (
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Play className="w-4 h-4 text-amber-600" />
            Policy-Bound Automation Workflows
          </h3>
          <div className="space-y-3">
            {workflows.map((wf) => (
              <div key={wf.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{wf.name}</h4>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Trigger: {wf.triggerType} ({wf.triggerConfig?.event || 'default'}) • Steps: {wf.actions.length}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRunWorkflow(wf)}
                    isLoading={runningWfId === wf.id}
                    icon={Play}
                  >
                    Run Staged
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
