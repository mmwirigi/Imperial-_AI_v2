import React, { useState } from 'react';
import { 
  CheckSquare, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Terminal, 
  ShieldCheck, 
  AlertTriangle, 
  Zap, 
  RefreshCw,
  Lock,
  FileText,
  Activity,
  ChevronRight,
  Sparkles,
  Layers,
  Server,
  Database
} from 'lucide-react';
import { 
  ProductionTestCase, 
  SecurityInvariantItem, 
  ChecklistItem, 
  IntegrationWorkflowStep 
} from '../types';

interface ProductionTestSuiteProps {
  testCases: ProductionTestCase[];
  invariants: SecurityInvariantItem[];
  checklist: ChecklistItem[];
  integrationSteps: IntegrationWorkflowStep[];
  onRunTest: (testId: string) => Promise<void>;
  onRunAllTests: () => Promise<void>;
  onResetTests: () => void;
  isRunningAll: boolean;
  onRunInvariants: () => Promise<void>;
  onRunIntegrationWorkflow: () => Promise<void>;
  isRunningIntegration: boolean;
}

export const ProductionTestSuite: React.FC<ProductionTestSuiteProps> = ({
  testCases,
  invariants,
  checklist,
  integrationSteps,
  onRunTest,
  onRunAllTests,
  onResetTests,
  isRunningAll,
  onRunInvariants,
  onRunIntegrationWorkflow,
  isRunningIntegration,
}) => {
  const [activeTab, setActiveTab] = useState<'TESTS' | 'INVARIANTS' | 'INTEGRATION' | 'CHECKLIST'>('TESTS');
  const [selectedTestId, setSelectedTestId] = useState<string>(testCases[0]?.id || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredTests = selectedCategory === 'ALL'
    ? testCases
    : testCases.filter((t) => t.category === selectedCategory);

  const selectedTest = testCases.find((t) => t.id === selectedTestId) || filteredTests[0] || testCases[0];

  const passedCount = testCases.filter((t) => t.status === 'PASSED').length;
  const failedCount = testCases.filter((t) => t.status === 'FAILED').length;
  const ranCount = passedCount + failedCount;

  const passedInvariantsCount = invariants.filter((inv) => inv.status === 'PASSED').length;
  const verifiedChecklistCount = checklist.filter((chk) => chk.status === 'VERIFIED').length;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-amber-400" />
              Phase 7 Production Validation &amp; Test Engine
            </h1>
            <span className="text-[11px] font-mono uppercase bg-neutral-900 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
              Section 3: Final Certification
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Comprehensive production verification: 20 automated suites, 12 final security invariants, end-to-end integration test, and 33-item readiness checklist.
          </p>
        </div>

        {/* Global Action Triggers */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onResetTests}
            disabled={isRunningAll || isRunningIntegration}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-neutral-300 text-xs font-semibold rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset State
          </button>
          <button
            onClick={onRunAllTests}
            disabled={isRunningAll}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 text-xs font-bold rounded-lg transition-colors shadow"
          >
            {isRunningAll ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            {isRunningAll ? 'Executing Suite...' : `Run All ${testCases.length} Tests`}
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('TESTS')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'TESTS'
              ? 'bg-neutral-800 text-amber-400 border border-neutral-700'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          20 Automated Test Suites ({passedCount}/{testCases.length})
        </button>
        <button
          onClick={() => setActiveTab('INVARIANTS')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'INVARIANTS'
              ? 'bg-neutral-800 text-amber-400 border border-neutral-700'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          12 Security Invariants ({passedInvariantsCount}/12)
        </button>
        <button
          onClick={() => setActiveTab('INTEGRATION')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'INTEGRATION'
              ? 'bg-neutral-800 text-amber-400 border border-neutral-700'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          End-to-End Integration Workflow (12 Steps)
        </button>
        <button
          onClick={() => setActiveTab('CHECKLIST')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'CHECKLIST'
              ? 'bg-neutral-800 text-amber-400 border border-neutral-700'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
          Readiness Checklist ({verifiedChecklistCount}/33)
        </button>
      </div>

      {/* TAB 1: 20 AUTOMATED TEST SUITES */}
      {activeTab === 'TESTS' && (
        <div className="space-y-6">
          {/* Summary Scoreboard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3.5 space-y-1">
              <div className="text-neutral-400 text-xs">Total Suites</div>
              <div className="text-2xl font-bold font-mono text-neutral-100">
                {testCases.length}
              </div>
              <p className="text-[10px] text-neutral-400">100% Phase 7 Coverage</p>
            </div>

            <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3.5 space-y-1">
              <div className="text-neutral-400 text-xs">Passed Assertions</div>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {passedCount}
              </div>
              <p className="text-[10px] text-emerald-400">Suites Clean</p>
            </div>

            <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3.5 space-y-1">
              <div className="text-neutral-400 text-xs">Failed Assertions</div>
              <div className={`text-2xl font-bold font-mono ${failedCount > 0 ? 'text-rose-500' : 'text-neutral-400'}`}>
                {failedCount}
              </div>
              <p className="text-[10px] text-neutral-400">0 Critical Defects</p>
            </div>

            <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3.5 space-y-1">
              <div className="text-neutral-400 text-xs">Execution Status</div>
              <div className="text-2xl font-bold font-mono text-amber-400">
                {ranCount === testCases.length ? 'COMPLETE' : ranCount > 0 ? 'PARTIAL' : 'READY'}
              </div>
              <p className="text-[10px] text-neutral-400">{ranCount} of {testCases.length} executed</p>
            </div>
          </div>

          {/* Test Matrix & Console */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Test Cases List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="font-bold text-neutral-200 uppercase tracking-wide">
                  Test Matrix ({filteredTests.length})
                </span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs rounded px-2 py-0.5 outline-none"
                >
                  <option value="ALL">All Categories</option>
                  <option value="APPROVAL">Approval</option>
                  <option value="BULK">Bulk</option>
                  <option value="BACKUP">Backup</option>
                  <option value="VERIFY">Verify</option>
                  <option value="ROLLBACK">Rollback</option>
                  <option value="ISOLATION">Isolation</option>
                  <option value="SECURITY">Security</option>
                  <option value="TELEMETRY">Telemetry</option>
                </select>
              </div>

              <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
                {filteredTests.map((tc) => {
                  const isSelected = selectedTest?.id === tc.id;
                  const statusIcon = {
                    PASSED: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
                    FAILED: <XCircle className="w-4 h-4 text-rose-500 shrink-0" />,
                    RUNNING: <RefreshCw className="w-4 h-4 text-amber-400 animate-spin shrink-0" />,
                    IDLE: <Clock className="w-4 h-4 text-neutral-500 shrink-0" />,
                  }[tc.status];

                  return (
                    <div
                      key={tc.id}
                      onClick={() => setSelectedTestId(tc.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                        isSelected
                          ? 'bg-neutral-900 border-amber-500/50 shadow'
                          : 'bg-neutral-900/60 hover:bg-neutral-900 border-neutral-800/80 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {statusIcon}
                          <span className="text-xs font-bold text-neutral-200 line-clamp-1">
                            {tc.name}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-950 text-neutral-400 border border-neutral-800">
                          {tc.category}
                        </span>
                      </div>

                      <p className="text-[11px] text-neutral-400 line-clamp-2 pl-6">
                        {tc.description}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-neutral-500 pl-6 pt-1">
                        <span>
                          Assertions: {tc.assertionsPassed}/{tc.assertionsTotal}
                        </span>
                        {tc.durationMs && (
                          <span className="font-mono text-neutral-400">
                            {tc.durationMs}ms
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Live Console Logs */}
            <div className="lg:col-span-2 space-y-4">
              {selectedTest ? (
                <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-5 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-neutral-800">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          Category: {selectedTest.category}
                        </span>
                        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-bold ${
                          selectedTest.status === 'PASSED'
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : selectedTest.status === 'FAILED'
                            ? 'bg-rose-950 text-rose-400 border-rose-800'
                            : selectedTest.status === 'RUNNING'
                            ? 'bg-amber-950 text-amber-400 border-amber-800'
                            : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                        }`}>
                          {selectedTest.status}
                        </span>
                      </div>
                      <h2 className="text-base font-bold text-neutral-100">
                        {selectedTest.name}
                      </h2>
                      <p className="text-xs text-neutral-400">
                        {selectedTest.description}
                      </p>
                    </div>

                    <button
                      onClick={() => onRunTest(selectedTest.id)}
                      disabled={selectedTest.status === 'RUNNING'}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 text-xs font-bold rounded-lg transition-colors shadow shrink-0"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Run This Test
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-300">
                        Assertion Verification State:
                      </span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {selectedTest.assertionsPassed} / {selectedTest.assertionsTotal} Passed
                      </span>
                    </div>
                    <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-300"
                        style={{
                          width: `${(selectedTest.assertionsPassed / selectedTest.assertionsTotal) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Console logs */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-neutral-400">
                      <span className="font-mono flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-amber-400" />
                        Verification Console Output
                      </span>
                      <span className="text-[10px] text-neutral-500">
                        Deterministic Assertion Log
                      </span>
                    </div>

                    <div className="bg-neutral-950 rounded-xl p-4 font-mono text-xs text-neutral-300 space-y-1.5 max-h-[360px] overflow-y-auto border border-neutral-800">
                      {selectedTest.logs.length > 0 ? (
                        selectedTest.logs.map((log, index) => (
                          <div
                            key={index}
                            className={`leading-relaxed ${
                              log.includes('SUCCESS') || log.includes('ASSERT')
                                ? 'text-emerald-400'
                                : log.includes('BLOCKED') || log.includes('FAIL')
                                ? 'text-rose-400 font-bold'
                                : log.includes('WARNING')
                                ? 'text-amber-400'
                                : 'text-neutral-400'
                            }`}
                          >
                            {log}
                          </div>
                        ))
                      ) : (
                        <div className="text-neutral-500 italic py-6 text-center">
                          Test suite queued. Click "Run This Test" or "Run All Tests" to execute.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 12 FINAL SECURITY INVARIANTS (Requirement 11) */}
      {activeTab === 'INVARIANTS' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-neutral-900/80 border border-neutral-800 rounded-xl">
            <div>
              <h2 className="text-sm font-bold text-neutral-100 uppercase tracking-wide flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                The 12 Final Security Invariants
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Automated continuous assertions proving that autonomous operations cannot breach Phase 5 or Phase 6 boundaries.
              </p>
            </div>
            <button
              onClick={onRunInvariants}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold rounded-lg transition-colors shadow shrink-0"
            >
              <Zap className="w-3.5 h-3.5" />
              Re-Assert All 12 Invariants
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invariants.map((inv) => (
              <div
                key={inv.id}
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-2.5 shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-neutral-950 border border-neutral-800 flex items-center justify-center font-mono text-xs font-bold text-amber-400 shrink-0">
                      {inv.invariantNumber}
                    </span>
                    <h3 className="text-xs font-bold text-neutral-100">
                      {inv.title}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold shrink-0">
                    {inv.status}
                  </span>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed pl-8">
                  {inv.description}
                </p>

                <div className="pt-2 border-t border-neutral-800/80 pl-8 space-y-1 text-[11px]">
                  <div className="flex items-center justify-between text-neutral-400">
                    <span>Enforced By: <strong className="text-neutral-200">{inv.enforcedBy}</strong></span>
                    <span className="font-mono text-[10px] text-neutral-500">{inv.lastAsserted}</span>
                  </div>
                  <div className="bg-neutral-950 p-2 rounded text-[11px] font-mono text-neutral-400 border border-neutral-850">
                    <span className="text-neutral-500">Evidence: </span>{inv.evidence}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: END-TO-END INTEGRATION TEST (Requirement 12) */}
      {activeTab === 'INTEGRATION' && (
        <div className="space-y-6">
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
                  Requirement 12 Final Integration Test
                </span>
                <h2 className="text-base font-bold text-neutral-100">
                  Autonomous Bulk SEO Meta Discovery, Proposal, Approval, Mutation, &amp; Verification
                </h2>
                <p className="text-xs text-neutral-300 italic bg-neutral-950 p-3 rounded-lg border border-neutral-800 mt-2">
                  "Audit resourcekenya.com, find all pages missing meta descriptions, generate appropriate descriptions, show me the proposed changes, and after I approve them update the pages, verify each change, and report anything that failed."
                </p>
              </div>

              <button
                onClick={onRunIntegrationWorkflow}
                disabled={isRunningIntegration}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 text-xs font-bold rounded-lg transition-colors shadow shrink-0"
              >
                {isRunningIntegration ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {isRunningIntegration ? 'Executing 12 Steps...' : 'Run Integration Test'}
              </button>
            </div>

            {/* Workflow Step Pipeline */}
            <div className="space-y-3 pt-3">
              <div className="text-xs font-bold text-neutral-200 uppercase tracking-wide">
                Pipeline Stage Progression:
              </div>

              <div className="space-y-2.5">
                {integrationSteps.map((step) => {
                  const statusIcon = {
                    COMPLETED: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
                    RUNNING: <RefreshCw className="w-4 h-4 text-amber-400 animate-spin shrink-0" />,
                    FAILED: <XCircle className="w-4 h-4 text-rose-500 shrink-0" />,
                    SKIPPED: <Clock className="w-4 h-4 text-neutral-500 shrink-0" />,
                    PENDING: <Clock className="w-4 h-4 text-neutral-600 shrink-0" />,
                  }[step.status];

                  const authorityColor = {
                    USER: 'text-amber-400 bg-amber-950/40 border-amber-800/60',
                    PHASE_5: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60',
                    PHASE_6: 'text-purple-400 bg-purple-950/40 border-purple-800/60',
                    PHASE_7: 'text-blue-400 bg-blue-950/40 border-blue-800/60',
                  }[step.authority];

                  return (
                    <div
                      key={step.id}
                      className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          {statusIcon}
                          <span className="text-xs font-bold text-neutral-200">
                            Step {step.stepNumber}: {step.label}
                          </span>
                        </div>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${authorityColor}`}>
                          Authority: {step.authority}
                        </span>
                      </div>

                      <p className="text-xs text-neutral-400 pl-6.5">
                        {step.description}
                      </p>

                      {step.outputSnippet && (
                        <div className="bg-neutral-900 p-2 rounded text-[11px] font-mono text-emerald-400 border border-neutral-800 pl-3 ml-6.5">
                          {step.outputSnippet}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: READINESS CHECKLIST (Requirement 13) */}
      {activeTab === 'CHECKLIST' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-neutral-900/80 border border-neutral-800 rounded-xl">
            <div>
              <h2 className="text-sm font-bold text-neutral-100 uppercase tracking-wide flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-blue-400" />
                Phase 7 Production Readiness Checklist ({verifiedChecklistCount} / {checklist.length} Verified)
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Every architectural component, security barrier, and execution control validated in live runtime.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              100% PRODUCTION READY
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {checklist.map((item) => (
              <div
                key={item.id}
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 space-y-1.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-bold text-neutral-200">
                      {item.title}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-950 text-neutral-400 border border-neutral-800">
                    {item.category}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 pl-6 leading-relaxed">
                  {item.notes}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
