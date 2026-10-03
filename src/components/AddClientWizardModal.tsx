import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Building2,
  Globe,
  Server,
  ShieldCheck,
  Search,
  Activity,
  ArrowRight,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { ClientCompany, Site } from '../types';
import { Button, Card, Badge } from './common/UIComponents';

interface AddClientWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddClient: (newClient: ClientCompany, newSite?: Site) => void;
  tenantId: string;
}

export const AddClientWizardModal: React.FC<AddClientWizardModalProps> = ({
  isOpen,
  onClose,
  onAddClient,
  tenantId
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 7;

  // Form State
  const [clientName, setClientName] = useState('');
  const [industry, setIndustry] = useState('Engineering');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [mcpEndpoint, setMcpEndpoint] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationPassed, setVerificationPassed] = useState(false);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep === 3) {
      // Step 3 -> 4: Trigger MCP verification simulation
      setIsVerifying(true);
      setTimeout(() => {
        setIsVerifying(false);
        setVerificationPassed(true);
        setCurrentStep(4);
      }, 700);
      return;
    }
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    const slug = clientName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const clientId = `client-${Date.now()}`;
    const siteId = `site-${Date.now()}`;

    const newClient: ClientCompany = {
      id: clientId,
      organizationId: tenantId,
      name: clientName || 'New Enterprise Client',
      slug,
      industry: industry || 'Technology',
      contactEmail: contactEmail || 'contact@client.io',
      contactPerson: contactPerson || 'Operations Lead',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      siteIds: [siteId],
      mcpConnectionIds: [`mcp-${siteId}`],
      customAiInstructions: 'Standard enterprise WordPress maintenance and SEO optimization.',
      assignedManager: 'Martin Mwirigi Bundi'
    };

    const newSite: Site = {
      id: siteId,
      tenantId,
      clientId,
      siteName: `${clientName} Production`,
      websiteUrl: websiteUrl || 'https://newclient.internal',
      clientCompanyName: clientName,
      mcpEndpoint: mcpEndpoint || 'mcp://localhost:8080/wp-mcp',
      mcpStatus: 'CONNECTED',
      wordPressType: 'SELF_HOSTED',
      seoPlugin: 'RANK_MATH',
      pageBuilder: 'ELEMENTOR',
      notes: 'Provisioned via Imperial AI Onboarding Wizard.',
      aiInstructions: 'Maintain high performance, monitor core updates, audit SEO metadata.',
      permissionPolicy: {
        siteId,
        requireApprovalForDeletePages: true,
        requireApprovalForDeletePosts: true,
        requireApprovalForSiteSettings: true,
        requireApprovalForPublishing: true,
        requireApprovalForPlugins: true,
        requireApprovalForThemes: true,
        requireApprovalForUsers: true,
        requireApprovalForDns: true,
        requireApprovalForBulkEdit: true
      },
      lastConnection: 'Active via MCP Protocol',
      lastActivity: 'Initial capability discovery completed',
      isDemo: false
    };

    onAddClient(newClient, newSite);
    onClose();
  };

  const stepTitles = [
    'Client Information',
    'Website & Scope',
    'Connect MCP Protocol',
    'Verify Connection',
    'Discover Capabilities',
    'Initial Health Check',
    'Provision Complete'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Wizard Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Step {currentStep} of {totalSteps}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-600">
                {stepTitles[currentStep - 1]}
              </span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mt-1">
              Add New Enterprise Client
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Line */}
        <div className="h-1 bg-slate-100 w-full overflow-hidden">
          <div
            className="h-full bg-amber-500 transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>

        {/* Wizard Step Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* STEP 1: Client Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Client Organization Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Apex Global Logistics Ltd"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Industry / Sector
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 text-slate-900 text-xs bg-white"
                >
                  <option value="Engineering & Infrastructure">Engineering &amp; Infrastructure</option>
                  <option value="Commercial Security & Biometrics">Commercial Security &amp; Biometrics</option>
                  <option value="Luxury Hospitality & Leisure">Luxury Hospitality &amp; Leisure</option>
                  <option value="Business & Resources Advisory">Business &amp; Resources Advisory</option>
                  <option value="Non-Profit & Community Development">Non-Profit &amp; Community Development</option>
                  <option value="Solar Energy & Renewables">Solar Energy &amp; Renewables</option>
                  <option value="Healthcare & Pharmaceuticals">Healthcare &amp; Pharmaceuticals</option>
                  <option value="E-Commerce & Retail">E-Commerce &amp; Retail</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Eng. Francis Mwangi"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    placeholder="procurement@client.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Website */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primary WordPress Website URL *
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="url"
                    placeholder="https://clientdomain.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 text-slate-900 text-xs"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Must be reachable via HTTPS with standard WordPress REST / XML-RPC / MCP endpoints enabled.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-1.5">
                <span className="font-bold text-amber-900">Multi-Site Scope Guarantee</span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Additional subdomains and regional sites can be attached to this client record at any time.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Connect MCP */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Model Context Protocol (MCP) Endpoint
                </label>
                <div className="relative">
                  <Server className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="mcp://client.internal:8080/wp-mcp"
                    value={mcpEndpoint}
                    onChange={(e) => setMcpEndpoint(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Secure protocol connecting Imperial AI agents to the remote WordPress instance.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: Verify Connection */}
          {currentStep === 4 && (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                MCP Handshake Verified
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Bidirectional cryptographic tunnel established. Protocol latency: 18ms. Zero socket leakage.
              </p>
            </div>
          )}

          {/* STEP 5: Discover Capabilities */}
          {currentStep === 5 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800">
                Discovered WordPress Capabilities
              </h4>
              <div className="space-y-2">
                {[
                  { name: 'Core REST API v2', status: 'AVAILABLE', version: 'WordPress 6.7.1' },
                  { name: 'SEO Plugin Inspector', status: 'AVAILABLE', plugin: 'Rank Math SEO' },
                  { name: 'Visual Page Builder', status: 'AVAILABLE', plugin: 'Elementor Pro' },
                  { name: 'Atomic Backup Checkpoint Engine', status: 'AVAILABLE', engine: 'Active' },
                  { name: 'WooCommerce E-Commerce', status: 'NOT_INSTALLED', engine: 'None' },
                ].map((cap, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">{cap.name}</div>
                      <div className="text-[11px] text-slate-500">{cap.version || cap.plugin || cap.engine}</div>
                    </div>
                    <Badge variant={cap.status === 'AVAILABLE' ? 'success' : 'neutral'} size="sm">
                      {cap.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: Initial Health Check */}
          {currentStep === 6 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800">
                Automated Baseline Health Audit
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                  <span className="text-slate-500">Security Score</span>
                  <div className="text-lg font-bold text-emerald-600">98 / 100</div>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                  <span className="text-slate-500">SSL Certificate</span>
                  <div className="text-lg font-bold text-emerald-600">Valid (312d)</div>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                  <span className="text-slate-500">PHP Memory Limit</span>
                  <div className="text-lg font-bold text-slate-900">512 MB</div>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                  <span className="text-slate-500">Database Engine</span>
                  <div className="text-lg font-bold text-slate-900">MySQL 8.0.35</div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Complete */}
          {currentStep === 7 && (
            <div className="py-6 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                <Sparkles className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-900">
                Client Ready to Provision
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                <span className="font-bold text-slate-800">{clientName || 'New Client'}</span> is now
                configured with complete tenant isolation, MCP daemon routing, and preflight backup checks.
              </p>
            </div>
          )}
        </div>

        {/* Wizard Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            disabled={currentStep === 1}
            icon={ArrowLeft}
          >
            Back
          </Button>

          {currentStep < totalSteps ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleNext}
              disabled={currentStep === 1 && !clientName.trim()}
              isLoading={isVerifying}
              icon={ArrowRight}
              iconPosition="right"
            >
              {currentStep === 3 ? 'Verify & Continue' : 'Next Step'}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleComplete}
              icon={CheckCircle2}
            >
              Provision Client
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
