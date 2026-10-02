import React, { useState } from 'react';
import { Phase10To16AcceptanceItem } from '../types';
import { Phase10To16TestSuite } from '../services/phase10To16TestSuite';
import {
  X,
  Play,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Download,
  Terminal,
  Activity,
  Award
} from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const MasterPhases10To16SuiteModal: React.FC<Props> = ({ onClose }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<{
    items: Phase10To16AcceptanceItem[];
    passedCount: number;
    failedCount: number;
    allPassed: boolean;
  } | null>(null);

  const handleRunTests = async () => {
    setIsRunning(true);
    try {
      const res = await Phase10To16TestSuite.runAllTests();
      setResults(res);
    } catch (err: any) {
      alert(`Test runner error: ${err?.message || err}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleExportReport = () => {
    if (!results) return;
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `imperial-ai-phases-10-to-16-acceptance-certification.json`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="px-6 py-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-neutral-950">
                  Phases 10–16
                </span>
                <span className="text-xs text-neutral-400">Master Acceptance Suite</span>
              </div>
              <h2 className="text-lg font-bold text-neutral-100 mt-0.5">
                Consolidated Acceptance Certification
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Controls & Stats */}
        <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-neutral-300">
              <span>Tests:</span>
              <strong className="text-white">{results ? results.items.length : 26}</strong>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Passed:</span>
              <strong>{results ? results.passedCount : 0}</strong>
            </div>
            <div className="flex items-center gap-1.5 text-rose-400">
              <XCircle className="w-4 h-4" />
              <span>Failed:</span>
              <strong>{results ? results.failedCount : 0}</strong>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {results && (
              <button
                onClick={handleExportReport}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all border border-neutral-700"
              >
                <Download className="w-3.5 h-3.5" />
                Export Audit Report
              </button>
            )}
            <button
              onClick={handleRunTests}
              disabled={isRunning}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md"
            >
              <Play className="w-3.5 h-3.5" />
              {isRunning ? 'Running All Assertions...' : 'Execute Certification Suite'}
            </button>
          </div>
        </div>

        {/* Modal Results List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {results ? (
            results.items.map(item => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border text-xs space-y-1.5 transition-all ${
                  item.status === 'PASSED'
                    ? 'bg-neutral-950/60 border-neutral-800'
                    : 'bg-rose-950/30 border-rose-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-800 text-neutral-300">
                      Phase {item.phase}
                    </span>
                    <span className="font-bold text-neutral-100">{item.requirementTitle}</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                      item.status === 'PASSED'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {item.status === 'PASSED' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {item.status}
                  </span>
                </div>
                <p className="text-neutral-400 font-mono text-[11px]">{item.evidence}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-16 space-y-3 text-neutral-400">
              <Activity className="w-12 h-12 text-amber-500/40 mx-auto" />
              <div className="text-sm font-semibold text-neutral-200">
                Ready to execute 26 automated acceptance tests
              </div>
              <p className="text-xs text-neutral-500 max-w-md mx-auto">
                Validates API key hashing, webhook HMAC signing, 8 specialist agents, knowledge graph isolation, Z-score anomalies, audit hash chaining, SaaS entitlements, and disaster recovery RTO.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
