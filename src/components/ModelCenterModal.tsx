import React, { useState } from 'react';
import { 
  Search, 
  RefreshCw, 
  X, 
  Check, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Eye, 
  Wrench, 
  BrainCircuit, 
  Layers,
  ArrowUpDown,
  ExternalLink
} from 'lucide-react';
import { AIModel } from '../types';

interface ModelCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  models: AIModel[];
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  onRefreshModels: () => void;
  isRefreshing?: boolean;
  lastUpdated?: string;
}

type FilterType = 'ALL' | 'FREE' | 'PAID' | 'VISION' | 'TOOLS' | 'REASONING';
type SortType = 'NAME' | 'CONTEXT' | 'COST';

export const ModelCenterModal: React.FC<ModelCenterModalProps> = ({
  isOpen,
  onClose,
  models,
  selectedModelId,
  onSelectModel,
  onRefreshModels,
  isRefreshing = false,
  lastUpdated = 'Recently',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
  const [activeSort, setActiveSort] = useState<SortType>('NAME');

  if (!isOpen) return null;

  // Filter
  const filtered = models.filter((m) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q) ||
      m.provider.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q);

    const matchesFilter =
      activeFilter === 'ALL' ||
      (activeFilter === 'FREE' && m.isFree) ||
      (activeFilter === 'PAID' && !m.isFree) ||
      (activeFilter === 'VISION' && m.supportsVision) ||
      (activeFilter === 'TOOLS' && m.supportsTools) ||
      (activeFilter === 'REASONING' && m.supportsReasoning);

    return matchesSearch && matchesFilter;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (activeSort === 'NAME') return a.name.localeCompare(b.name);
    if (activeSort === 'CONTEXT') return b.contextLength - a.contextLength;
    if (activeSort === 'COST') return a.inputCost - b.inputCost;
    return 0;
  });

  const freeModels = models.filter((m) => m.isFree);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-100 font-mono tracking-wide uppercase">
                  OpenRouter AI Model Center
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                  {models.length} Models Available
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Dynamic catalog with verified pricing & hardware capability tags
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefreshModels}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono border border-neutral-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Sort Controls */}
        <div className="py-3 space-y-2.5 border-b border-neutral-800">
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, provider, context length, or ID..."
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 text-neutral-100 text-xs rounded-lg pl-9 pr-8 py-2 outline-none font-mono transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-neutral-500 hover:text-neutral-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
              <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3" /> Sort:
              </span>
              {(['NAME', 'CONTEXT', 'COST'] as SortType[]).map((sort) => (
                <button
                  key={sort}
                  onClick={() => setActiveSort(sort)}
                  className={`px-2 py-1 text-[11px] font-mono rounded border transition-colors cursor-pointer ${
                    activeSort === sort
                      ? 'bg-amber-500 text-neutral-950 font-bold border-amber-500'
                      : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                  }`}
                >
                  {sort === 'NAME' ? 'Name' : sort === 'CONTEXT' ? 'Context' : 'Cost'}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {(
              [
                { id: 'ALL', label: 'All Models' },
                { id: 'FREE', label: 'Free Models' },
                { id: 'PAID', label: 'Paid Models' },
                { id: 'VISION', label: 'Vision Capable' },
                { id: 'TOOLS', label: 'Tools Supported' },
                { id: 'REASONING', label: 'Reasoning CoT' },
              ] as { id: FilterType; label: string }[]
            ).map((filter) => {
              const isSelected = activeFilter === filter.id;
              const count =
                filter.id === 'ALL'
                  ? models.length
                  : filter.id === 'FREE'
                  ? models.filter((m) => m.isFree).length
                  : filter.id === 'PAID'
                  ? models.filter((m) => !m.isFree).length
                  : filter.id === 'VISION'
                  ? models.filter((m) => m.supportsVision).length
                  : filter.id === 'TOOLS'
                  ? models.filter((m) => m.supportsTools).length
                  : models.filter((m) => m.supportsReasoning).length;

              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`px-3 py-1 rounded-full text-xs font-mono transition-colors shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                      : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:border-neutral-700 hover:text-neutral-200'
                  }`}
                >
                  {filter.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Free Models Highlight Banner if viewing ALL */}
        {activeFilter === 'ALL' && !searchQuery && freeModels.length > 0 && (
          <div className="my-2.5 p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-emerald-900/50 text-emerald-400">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-emerald-300 font-mono">
                  FREE MODELS SECTION ({freeModels.length} ZERO-COST OPTIONS)
                </h4>
                <p className="text-[11px] text-neutral-400">
                  Verified from OpenRouter metadata ($0.00 prompt & completion). Ideal for routine audits.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveFilter('FREE')}
              className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-mono font-semibold border border-emerald-500/40 transition-colors shrink-0"
            >
              Filter Free
            </button>
          </div>
        )}

        {/* Model Grid */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-2">
          {sorted.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500 font-mono bg-neutral-950 rounded-xl border border-neutral-800">
              No AI models match your current filter or search criteria.
            </div>
          ) : (
            sorted.map((model) => {
              const isSelected = model.id === selectedModelId;
              return (
                <div
                  key={model.id}
                  onClick={() => onSelectModel(model.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-800/90 border-amber-500 ring-1 ring-amber-500/40'
                      : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700/80 hover:bg-neutral-900/50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 font-semibold">
                          {model.provider}
                        </span>

                        {model.isFree ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 font-bold">
                            FREE
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                            ${model.inputCost.toFixed(2)}/1M prompt
                          </span>
                        )}

                        {isSelected && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500 text-neutral-950 font-bold flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> ACTIVE DEFAULT
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                        {model.name}
                      </h3>
                      <p className="text-[10px] font-mono text-neutral-500">{model.id}</p>
                      <p className="text-xs text-neutral-400 leading-relaxed pt-0.5">
                        {model.description}
                      </p>
                    </div>

                    {/* Action button */}
                    <div className="shrink-0 self-end sm:self-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectModel(model.id);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-neutral-950'
                            : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700'
                        }`}
                      >
                        {isSelected ? 'Active Model' : 'Select Model'}
                      </button>
                    </div>
                  </div>

                  {/* Capabilities badges bar */}
                  <div className="mt-3 pt-2.5 border-t border-neutral-850 flex items-center justify-between text-[11px] font-mono text-neutral-400 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-neutral-300">
                        <Zap className="w-3 h-3 text-amber-400" />
                        {model.contextLength >= 1000
                          ? `${Math.round(model.contextLength / 1000)}k Context`
                          : `${model.contextLength} Tokens`}
                      </span>

                      {model.supportsTools && (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Wrench className="w-3 h-3" /> Tools
                        </span>
                      )}

                      {model.supportsVision && (
                        <span className="flex items-center gap-1 text-blue-400">
                          <Eye className="w-3 h-3" /> Vision
                        </span>
                      )}

                      {model.supportsReasoning && (
                        <span className="flex items-center gap-1 text-purple-400">
                          <BrainCircuit className="w-3 h-3" /> Reasoning
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-neutral-500">
                      {model.isFree
                        ? 'Zero-cost inference'
                        : `Prompt: $${model.inputCost.toFixed(2)} / Out: $${model.outputCost.toFixed(2)} per 1M`}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-[11px] font-mono text-neutral-500">
          <span>Catalog Cached · Last updated: {lastUpdated}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
