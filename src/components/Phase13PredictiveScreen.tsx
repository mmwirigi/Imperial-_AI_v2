import React, { useState } from 'react';
import {
  MetricDataPoint,
  PredictiveAnomaly,
  PredictiveForecast,
  DecisionRecommendation
} from '../types';
import { PredictiveIntelligenceService } from '../services/predictiveIntelligenceService';
import {
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  HelpCircle,
  Activity,
  ArrowUpRight,
  Shield,
  Clock,
  Layers,
  BarChart2
} from 'lucide-react';

interface Props {
  tenantId: string;
  clientId: string;
  siteId?: string;
  isPlatformAdmin: boolean;
}

export const Phase13PredictiveScreen: React.FC<Props> = ({
  tenantId,
  clientId,
  siteId
}) => {
  const [metrics] = useState<MetricDataPoint[]>(PredictiveIntelligenceService.getBaselineMetrics(siteId));
  const [anomalies] = useState<PredictiveAnomaly[]>(
    PredictiveIntelligenceService.detectAnomalies({ tenantId, clientId, siteId, metrics })
  );
  const [forecast] = useState<PredictiveForecast>(
    PredictiveIntelligenceService.generateForecast({ tenantId, siteId, targetMetric: 'Daily Search Clicks' })
  );
  const [recommendations, setRecommendations] = useState<DecisionRecommendation[]>(
    PredictiveIntelligenceService.generateRecommendations({ tenantId, clientId, siteId, anomalies })
  );

  const handleApproveRecommendation = (recId: string) => {
    setRecommendations(
      recommendations.map(r => (r.id === recId ? { ...r, status: 'APPROVED' } : r))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Phase 13 Decision Support
              </span>
              <span className="text-xs text-neutral-400">Explainable Predictive Analytics</span>
            </div>
            <h1 className="text-2xl font-bold text-neutral-100 mt-1">Predictive Intelligence & Anomalies</h1>
            <p className="text-sm text-neutral-400 mt-0.5">
              Identifies traffic, performance, and cost anomalies. Generates uncertainty-aware recommendations bound to Phase 5 approval.
            </p>
          </div>
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-400 flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>Direct mutation blocked: <strong className="text-neutral-200">Advisory Only</strong></span>
          </div>
        </div>
      </div>

      {/* Anomalies Section */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Detected Statistical Anomalies ({anomalies.length})
        </h2>
        <div className="space-y-3">
          {anomalies.map(anom => (
            <div key={anom.id} className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-neutral-100">{anom.metricName}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950 text-rose-400 border border-rose-800">
                    Z-Score: {anom.deviationZScore}σ
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-800 text-neutral-300">
                    Severity: {anom.severity}
                  </span>
                </div>
                <span className="text-xs text-neutral-500">{new Date(anom.detectedAt).toLocaleTimeString()}</span>
              </div>
              <p className="text-xs text-neutral-300">{anom.explanation}</p>
              <div className="text-xs text-neutral-400 pt-1">
                <strong>Possible Causes:</strong> {anom.possibleCauses.join(' • ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Forecast Section */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            14-Day Metric Forecast: {forecast.targetMetric}
          </h2>
          <span className="text-xs text-neutral-400">Confidence Interval: {forecast.modelMetadata.confidenceInterval}%</span>
        </div>

        {/* Forecast Table / Preview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {forecast.forecastValues.slice(0, 7).map(fv => (
            <div key={fv.date} className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-center space-y-1">
              <div className="text-[10px] text-neutral-400 font-mono">{fv.date.substring(5)}</div>
              <div className="text-base font-bold text-cyan-400">{fv.projected}</div>
              <div className="text-[10px] text-neutral-500">[{fv.lowerBound} - {fv.upperBound}]</div>
            </div>
          ))}
        </div>

        {/* Disclaimer Banner */}
        <div className="p-3 bg-neutral-950/80 rounded-xl border border-neutral-800/80 flex items-start gap-2.5 text-xs text-neutral-400">
          <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <span>{forecast.disclaimer}</span>
        </div>
      </div>

      {/* Recommendation Queue */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          Evidence-Based Recommendation Queue ({recommendations.length})
        </h2>
        <div className="space-y-4">
          {recommendations.map(rec => (
            <div key={rec.id} className="p-5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-800 text-neutral-300">
                    {rec.category}
                  </span>
                  <h3 className="font-bold text-sm text-neutral-100">{rec.title}</h3>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    rec.status === 'APPROVED'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}
                >
                  {rec.status === 'APPROVED' ? 'Approved by Operator' : 'Requires Phase 5 Approval'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-neutral-400">
                <div className="p-3 bg-neutral-900/60 rounded-lg border border-neutral-800">
                  <span className="text-neutral-300 font-semibold">Observed Evidence:</span> {rec.observedEvidence}
                </div>
                <div className="p-3 bg-neutral-900/60 rounded-lg border border-neutral-800">
                  <span className="text-neutral-300 font-semibold">Cautious Impact:</span> {rec.cautiousImpact}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs">
                <div className="text-neutral-500">
                  Verification Metric: <span className="text-neutral-300">{rec.suggestedVerificationMetric}</span>
                </div>
                {rec.status === 'PROPOSED' && (
                  <button
                    onClick={() => handleApproveRecommendation(rec.id)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Approve and Route to Phase 7
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
