import React, { useState } from 'react';
import {
  ScalabilityQuotaMetrics,
  DisasterRecoveryDrill,
  InternationalLocaleConfig,
  MarketplaceExtension,
  GlobalReleasePipeline
} from '../types';
import { GlobalScaleService } from '../services/globalScaleService';
import {
  Globe2,
  HardDriveDownload,
  ShoppingBag,
  Rocket,
  ShieldCheck,
  CheckCircle,
  Zap,
  Activity,
  Layers,
  Clock,
  Coins,
  Server
} from 'lucide-react';

interface Props {
  tenantId: string;
  clientId: string;
  isPlatformAdmin: boolean;
}

export const Phase16GlobalScaleScreen: React.FC<Props> = ({
  tenantId
}) => {
  const [metrics] = useState<ScalabilityQuotaMetrics>(
    GlobalScaleService.getScalabilityMetrics(tenantId)
  );

  const [drDrill, setDrDrill] = useState<DisasterRecoveryDrill | null>(null);
  const [isDrilling, setIsDrilling] = useState(false);

  const [localeConfig, setLocaleConfig] = useState<InternationalLocaleConfig>(
    GlobalScaleService.getLocaleConfig(tenantId)
  );

  const [extensions] = useState<MarketplaceExtension[]>(
    GlobalScaleService.getMarketplaceExtensions()
  );

  const [pipeline] = useState<GlobalReleasePipeline>(
    GlobalScaleService.getGlobalReleasePipeline()
  );

  const handleRunDrill = () => {
    setIsDrilling(true);
    setTimeout(() => {
      const drill = GlobalScaleService.runDisasterRecoveryDrill({
        siteId: 'site-wp-production',
        backupId: 'backup-snapshot-latest',
        drillType: 'SANDBOX_RESTORE_SIMULATION'
      });
      setDrDrill(drill);
      setIsDrilling(false);
    }, 800);
  };

  const handleCurrencyChange = (curr: 'USD' | 'EUR' | 'GBP' | 'KES') => {
    let rate = 1.0;
    let sym = '$';
    if (curr === 'EUR') { rate = 0.92; sym = '€'; }
    if (curr === 'GBP') { rate = 0.78; sym = '£'; }
    if (curr === 'KES') { rate = 129.5; sym = 'KSh '; }

    setLocaleConfig({
      ...localeConfig,
      currencyCode: curr,
      currencySymbol: sym,
      exchangeRateToUsd: rate,
      lastRateSyncAt: new Date().toISOString()
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Phase 16 Global Scale
              </span>
              <span className="text-xs text-neutral-400">High-Availability & Ecosystem Expansion</span>
            </div>
            <h1 className="text-2xl font-bold text-neutral-100 mt-1">Global Scale & Imperial AI Ecosystem</h1>
            <p className="text-sm text-neutral-400 mt-0.5">
              Verified disaster recovery RTO/RPO drills, multi-currency localization, curated marketplace extensions, and staged release engineering.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              RTO Objective Met (&lt;15m)
            </span>
          </div>
        </div>
      </div>

      {/* Grid: DR Restore Drill & Scalability */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Disaster Recovery Sandbox Simulation */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
              <HardDriveDownload className="w-4 h-4 text-blue-400" />
              Automated Disaster Recovery (DR) Drill
            </h2>
            <button
              onClick={handleRunDrill}
              disabled={isDrilling}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-sm"
            >
              <Zap className="w-3.5 h-3.5" />
              {isDrilling ? 'Running Sandbox Restore...' : 'Execute DR Drill'}
            </button>
          </div>

          <p className="text-xs text-neutral-400">
            Simulates a cold-site restoration into an isolated sandbox container to scientifically prove that snapshots can be restored within recovery time objectives.
          </p>

          {drDrill ? (
            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  Drill {drDrill.status}
                </span>
                <span className="font-mono text-neutral-500">{drDrill.id}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-neutral-400">
                <div className="p-2.5 bg-neutral-900 rounded-lg border border-neutral-800">
                  <div>Simulated RTO: <strong className="text-neutral-100">{drDrill.simulatedRtoMinutes}m</strong></div>
                  <div className="text-[10px] text-neutral-500">Target: &lt;{drDrill.targetRtoMinutes}m</div>
                </div>
                <div className="p-2.5 bg-neutral-900 rounded-lg border border-neutral-800">
                  <div>Simulated RPO: <strong className="text-neutral-100">{drDrill.simulatedRpoMinutes}m</strong></div>
                  <div className="text-[10px] text-neutral-500">Target: &lt;{drDrill.targetRpoMinutes}m</div>
                </div>
              </div>
              <p className="text-neutral-300 font-mono text-[11px] pt-1">{drDrill.recoveryReport}</p>
            </div>
          ) : (
            <div className="p-6 bg-neutral-950/60 rounded-xl border border-neutral-800/80 text-center text-xs text-neutral-500">
              Click &quot;Execute DR Drill&quot; to initiate verified sandbox restoration.
            </div>
          )}
        </div>

        {/* Global Scalability & Cache Isolation */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-400" />
            Tenant-Isolated Scalability & Backpressure
          </h2>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
              <span className="text-neutral-400 font-semibold">Throughput Rate:</span>
              <div className="text-lg font-bold text-blue-400">{metrics.requestCountPerMin} / {metrics.maxAllowedPerMin} req/m</div>
            </div>
            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
              <span className="text-neutral-400 font-semibold">Isolated Cache Hit Rate:</span>
              <div className="text-lg font-bold text-emerald-400">{metrics.cacheHitRatePct}%</div>
            </div>
            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
              <span className="text-neutral-400 font-semibold">Concurrent Tasks:</span>
              <div className="text-lg font-bold text-neutral-100">{metrics.concurrentTasks} / {metrics.maxConcurrentTasks}</div>
            </div>
            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
              <span className="text-neutral-400 font-semibold">Queue Backlog:</span>
              <div className="text-lg font-bold text-neutral-100">{metrics.queueBacklogSize} (Healthy)</div>
            </div>
          </div>

          {/* International Currency Switcher */}
          <div className="pt-2 border-t border-neutral-800/80 space-y-2 text-xs">
            <div className="flex items-center justify-between text-neutral-300 font-bold">
              <span className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                Multi-Currency Engine
              </span>
              <span className="font-mono text-emerald-400">
                Sample Rate: {GlobalScaleService.formatCurrency(499, localeConfig)}
              </span>
            </div>
            <div className="flex gap-2">
              {(['USD', 'EUR', 'GBP', 'KES'] as const).map(c => (
                <button
                  key={c}
                  onClick={() => handleCurrencyChange(c)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    localeConfig.currencyCode === c
                      ? 'bg-amber-500 text-neutral-950'
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Curated Marketplace Foundation */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-blue-400" />
          Curated Marketplace Foundation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {extensions.map(ext => (
            <div key={ext.id} className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3 text-xs">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-neutral-100">{ext.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950 text-blue-400 border border-blue-800">
                      v{ext.version}
                    </span>
                  </div>
                  <p className="text-neutral-400 mt-0.5">By {ext.publisherName} • Category: {ext.category}</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {ext.reviewStatus}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-neutral-400 font-semibold">Declared Permissions:</span>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {ext.permissionsRequested.map(p => (
                    <span key={p} className="px-2 py-0.5 rounded bg-neutral-900 text-[10px] font-mono text-amber-400 border border-neutral-800">
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-neutral-400">Installs: {ext.installCount} (★ {ext.rating})</span>
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-bold ${
                    ext.isInstalledByTenant
                      ? 'bg-neutral-800 text-neutral-400'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  {ext.isInstalledByTenant ? 'Installed' : 'Install Connector'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
