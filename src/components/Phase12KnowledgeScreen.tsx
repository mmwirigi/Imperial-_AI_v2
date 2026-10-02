import React, { useState } from 'react';
import {
  KnowledgeGraphNode,
  KnowledgeSearchResult,
  KnowledgeMemoryCategory
} from '../types';
import { KnowledgeGraphService } from '../services/knowledgeGraphService';
import {
  Database,
  Search,
  BookOpen,
  FileCheck,
  AlertOctagon,
  Download,
  Plus,
  Tag,
  ShieldCheck,
  Clock,
  Sparkles
} from 'lucide-react';

interface Props {
  tenantId: string;
  clientId: string;
  siteId?: string;
  isPlatformAdmin: boolean;
}

export const Phase12KnowledgeScreen: React.FC<Props> = ({
  tenantId,
  clientId,
  siteId
}) => {
  const [nodes, setNodes] = useState<KnowledgeGraphNode[]>(
    KnowledgeGraphService.getBaselineKnowledgeNodes(tenantId, clientId)
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeMemoryCategory | 'ALL'>('ALL');
  const [newLabel, setNewLabel] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<KnowledgeMemoryCategory>('TENANT_ORGANIZATIONAL');

  const searchResults: KnowledgeSearchResult[] = KnowledgeGraphService.searchKnowledge({
    query: searchQuery,
    tenantContextId: tenantId,
    clientContextId: clientId,
    nodes,
    category: selectedCategory === 'ALL' ? undefined : selectedCategory
  });

  const handleIngest = () => {
    if (!newLabel.trim() || !newContent.trim()) return;
    const newNode = KnowledgeGraphService.ingestMemory({
      tenantId,
      clientId,
      siteId,
      nodeType: 'DOCUMENT',
      label: newLabel,
      category: newCategory,
      content: newContent,
      provenanceSource: 'Operator Manual Entry with Injection Sanitization',
      verificationStatus: 'VERIFIED',
      confidenceScore: 99
    });
    setNodes([newNode, ...nodes]);
    setNewLabel('');
    setNewContent('');
  };

  const handleMarkOutdated = (node: KnowledgeGraphNode) => {
    const updated = KnowledgeGraphService.markOutdated(node, 'Manually flagged outdated by operator');
    setNodes(nodes.map(n => (n.id === updated.id ? updated : n)));
  };

  const handleExport = () => {
    const json = KnowledgeGraphService.exportTenantKnowledge(tenantId, nodes);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `knowledge-export-${tenantId}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Phase 12 Knowledge Graph
              </span>
              <span className="text-xs text-neutral-400">Tenant-Aware Provenance & Memory</span>
            </div>
            <h1 className="text-2xl font-bold text-neutral-100 mt-1">Organizational Memory & Knowledge Graph</h1>
            <p className="text-sm text-neutral-400 mt-0.5">
              Structured relationship graph storing verified facts, site technical profiles, and operational decisions.
            </p>
          </div>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all border border-neutral-700"
          >
            <Download className="w-3.5 h-3.5" />
            Export Tenant Graph
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search tenant-scoped knowledge, SOP policies, and decisions..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value as any)}
          className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="ALL">All Categories</option>
          <option value="TENANT_ORGANIZATIONAL">Tenant Organizational SOPs</option>
          <option value="TECHNICAL_SITE">Technical Site Knowledge</option>
          <option value="DECISION_HISTORY">Decision History</option>
          <option value="CLIENT_PROJECT">Client Project Knowledge</option>
        </select>
      </div>

      {/* Ingest Knowledge Box */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
          <Plus className="w-4 h-4 text-emerald-400" />
          Ingest Verified Knowledge Memory
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Title / Fact Label"
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
          />
          <select
            value={newCategory}
            onChange={e => setNewCategory(e.target.value as any)}
            className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="TENANT_ORGANIZATIONAL">Tenant Organizational SOP</option>
            <option value="TECHNICAL_SITE">Technical Site Knowledge</option>
            <option value="DECISION_HISTORY">Decision History</option>
            <option value="CLIENT_PROJECT">Client Project Guidelines</option>
          </select>
          <button
            onClick={handleIngest}
            disabled={!newLabel.trim() || !newContent.trim()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            Ingest with Injection Defense
          </button>
        </div>
        <textarea
          placeholder="Verified technical documentation, operational rule or decision context (untrusted instructions are stripped automatically)..."
          value={newContent}
          onChange={e => setNewContent(e.target.value)}
          rows={2}
          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Results List */}
      <div className="space-y-3">
        {searchResults.map(({ node, relevanceScore, citations, isStale }) => (
          <div
            key={node.id}
            className={`bg-neutral-900 border rounded-2xl p-5 space-y-3 transition-all ${
              isStale ? 'border-neutral-800/50 opacity-60' : 'border-neutral-800'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-neutral-800 text-emerald-400">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                    {node.label}
                    {isStale && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800">
                        OUTDATED
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-3 text-[11px] text-neutral-400 mt-0.5">
                    <span>Category: <strong className="text-neutral-300">{node.category}</strong></span>
                    <span>Confidence: <strong className="text-emerald-400">{node.confidenceScore}%</strong></span>
                    <span>Score: {relevanceScore}</span>
                  </div>
                </div>
              </div>

              {!isStale && (
                <button
                  onClick={() => handleMarkOutdated(node)}
                  className="text-xs text-neutral-400 hover:text-amber-400 transition-colors flex items-center gap-1"
                >
                  <AlertOctagon className="w-3.5 h-3.5" />
                  Mark Outdated
                </button>
              )}
            </div>

            <div className="bg-neutral-950/70 rounded-xl p-3 border border-neutral-800/80 font-mono text-xs text-neutral-300">
              {JSON.stringify(node.properties, null, 2)}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {citations.map((c, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-neutral-950 text-[11px] text-neutral-400 border border-neutral-800">
                  {c}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
