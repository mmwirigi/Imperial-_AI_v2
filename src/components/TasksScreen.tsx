import React, { useState } from 'react';
import { 
  CheckSquare, 
  Clock, 
  AlertTriangle, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Filter, 
  Plus, 
  ExternalLink,
  ChevronRight,
  FileCode,
  X,
  Shield,
  Wrench,
  FileText,
  Search,
  Zap,
  Folder,
  Layers
} from 'lucide-react';
import { Task, TaskState, TaskCategory, Site, DangerousActionType } from '../types';

interface TasksScreenProps {
  tasks: Task[];
  sites: Site[];
  onOpenApproval: (task: Task) => void;
  onCreateTask: (task: Task) => void;
}

const CATEGORY_CONFIG: Record<TaskCategory, { 
  label: string; 
  icon: React.ComponentType<{ className?: string }>; 
  color: string; 
  badgeBg: string; 
  badgeBorder: string;
  badgeText: string;
  description: string;
}> = {
  SECURITY: {
    label: 'Security',
    icon: Shield,
    color: 'text-rose-400',
    badgeBg: 'bg-rose-950/40',
    badgeBorder: 'border-rose-800/60',
    badgeText: 'text-rose-400',
    description: 'Vulnerability hardening, plugin access gates, and firewall audits',
  },
  MAINTENANCE: {
    label: 'Maintenance',
    icon: Wrench,
    color: 'text-amber-400',
    badgeBg: 'bg-amber-950/40',
    badgeBorder: 'border-amber-800/60',
    badgeText: 'text-amber-400',
    description: 'Plugin updates, link integrity, transients cleanup, and system health',
  },
  CONTENT: {
    label: 'Content',
    icon: FileText,
    color: 'text-purple-400',
    badgeBg: 'bg-purple-950/40',
    badgeBorder: 'border-purple-800/60',
    badgeText: 'text-purple-400',
    description: 'Publication workflows, post revisions, editorial drafts, and media',
  },
  SEO: {
    label: 'SEO & Metadata',
    icon: Search,
    color: 'text-blue-400',
    badgeBg: 'bg-blue-950/40',
    badgeBorder: 'border-blue-800/60',
    badgeText: 'text-blue-400',
    description: 'Rank Math & Yoast schemas, OpenGraph tags, sitemaps, and indexing',
  },
  PERFORMANCE: {
    label: 'Performance',
    icon: Zap,
    color: 'text-emerald-400',
    badgeBg: 'bg-emerald-950/40',
    badgeBorder: 'border-emerald-800/60',
    badgeText: 'text-emerald-400',
    description: 'Core Web Vitals, Redis object caching, asset minification, and database optimization',
  },
  GENERAL: {
    label: 'General',
    icon: Folder,
    color: 'text-neutral-400',
    badgeBg: 'bg-neutral-800/50',
    badgeBorder: 'border-neutral-700/60',
    badgeText: 'text-neutral-400',
    description: 'Miscellaneous operations and general administrative tasks',
  },
};

const ALL_CATEGORIES: TaskCategory[] = [
  'SECURITY',
  'MAINTENANCE',
  'CONTENT',
  'SEO',
  'PERFORMANCE',
  'GENERAL',
];

export const TasksScreen: React.FC<TasksScreenProps> = ({
  tasks,
  sites,
  onOpenApproval,
  onCreateTask,
}) => {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<TaskCategory | 'ALL'>('ALL');
  const [selectedStateFilter, setSelectedStateFilter] = useState<TaskState | 'ALL'>('ALL');
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>('ALL');
  const [inspectingTask, setInspectingTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSiteId, setNewSiteId] = useState(sites[0]?.id || '');
  const [newCategory, setNewCategory] = useState<TaskCategory>('SECURITY');
  const [newActionType, setNewActionType] = useState<DangerousActionType>('READ_ONLY_AUDIT');

  const filteredTasks = tasks.filter((t) => {
    const matchCategory = selectedCategoryFilter === 'ALL' || t.category === selectedCategoryFilter;
    const matchState = selectedStateFilter === 'ALL' || t.status === selectedStateFilter;
    const matchSite = selectedSiteFilter === 'ALL' || t.siteId === selectedSiteFilter;
    return matchCategory && matchState && matchSite;
  });

  // Group filtered tasks by category
  const tasksByCategory: Record<TaskCategory, Task[]> = ALL_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = filteredTasks.filter((t) => (t.category || 'GENERAL') === cat);
    return acc;
  }, {} as Record<TaskCategory, Task[]>);

  const stateColors: Record<TaskState, { bg: string; text: string; border: string }> = {
    DRAFT: { bg: 'bg-neutral-800', text: 'text-neutral-400', border: 'border-neutral-700' },
    PLANNED: { bg: 'bg-blue-950/30', text: 'text-blue-400', border: 'border-blue-800/40' },
    AWAITING_APPROVAL: { bg: 'bg-amber-950/30', text: 'text-amber-400', border: 'border-amber-700/50' },
    RUNNING: { bg: 'bg-cyan-950/30', text: 'text-cyan-400', border: 'border-cyan-700/50' },
    COMPLETED: { bg: 'bg-emerald-950/30', text: 'text-emerald-400', border: 'border-emerald-700/40' },
    FAILED: { bg: 'bg-rose-950/30', text: 'text-rose-400', border: 'border-rose-700/40' },
    CANCELLED: { bg: 'bg-neutral-800', text: 'text-neutral-500', border: 'border-neutral-700' },
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const targetSite = sites.find((s) => s.id === newSiteId) || sites[0];

    const isReadOnly = newActionType === 'READ_ONLY_AUDIT';
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: newTitle,
      description: newDesc,
      siteId: targetSite.id,
      siteName: targetSite.siteName,
      category: newCategory,
      createdDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      updatedDate: 'Just now',
      status: isReadOnly ? 'PLANNED' : 'AWAITING_APPROVAL',
      requestedAction: newActionType.toLowerCase(),
      dangerousActionType: newActionType,
      approvalRequirement: isReadOnly ? 'NONE' : 'REQUIRED',
      executionResult: null,
    };

    onCreateTask(newTask);
    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewDesc('');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-neutral-100 uppercase tracking-wider font-mono">
              Operations Task Pipeline
            </h1>
            <span className="text-xs font-mono text-neutral-400">
              ({tasks.length} Total Tasks)
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Classified by operational category with strict per-site isolation & approval gating
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded-lg transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Queue Task</span>
        </button>
      </div>

      {/* Category Overview Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {ALL_CATEGORIES.map((cat) => {
          const config = CATEGORY_CONFIG[cat];
          const Icon = config.icon;
          const count = tasks.filter((t) => (t.category || 'GENERAL') === cat).length;
          const isSelected = selectedCategoryFilter === cat;

          return (
            <button
              key={cat}
              onClick={() => setSelectedCategoryFilter(isSelected ? 'ALL' : cat)}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-neutral-800/90 border-amber-500 ring-1 ring-amber-500/50'
                  : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                <span className="text-xs font-mono font-bold text-neutral-200">
                  {count}
                </span>
              </div>
              <div className="text-[11px] font-semibold text-neutral-300 mt-1 truncate">
                {config.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter Segmented Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          <button
            onClick={() => setSelectedStateFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg border font-mono transition-colors shrink-0 cursor-pointer ${
              selectedStateFilter === 'ALL'
                ? 'bg-amber-500 text-neutral-950 font-bold border-amber-500'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'
            }`}
          >
            All States ({tasks.length})
          </button>
          {(
            [
              'AWAITING_APPROVAL',
              'RUNNING',
              'PLANNED',
              'COMPLETED',
              'FAILED',
              'CANCELLED',
            ] as TaskState[]
          ).map((state) => {
            const count = tasks.filter((t) => t.status === state).length;
            const isSelected = selectedStateFilter === state;
            return (
              <button
                key={state}
                onClick={() => setSelectedStateFilter(state)}
                className={`px-2.5 py-1.5 rounded-lg border font-mono transition-colors shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-neutral-950 font-bold border-amber-500'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                }`}
              >
                {state.replace('_', ' ')} ({count})
              </button>
            );
          })}
        </div>

        {/* Site Scope Filter */}
        <select
          value={selectedSiteFilter}
          onChange={(e) => setSelectedSiteFilter(e.target.value)}
          className="bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs rounded-lg px-3 py-1.5 outline-none font-mono"
        >
          <option value="ALL">All Client Sites</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.siteName}
            </option>
          ))}
        </select>
      </div>

      {/* Grouped Tasks Container */}
      <div className="space-y-6">
        {filteredTasks.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center text-xs text-neutral-400">
            No tasks match the selected category, state, or site filter.
          </div>
        ) : (
          ALL_CATEGORIES.map((category) => {
            const categoryTasks = tasksByCategory[category] || [];
            if (categoryTasks.length === 0) return null;

            const config = CATEGORY_CONFIG[category];
            const Icon = config.icon;

            return (
              <div key={category} className="space-y-3">
                {/* Category Section Header */}
                <div className="flex items-center justify-between px-3 py-2 bg-neutral-900/80 border border-neutral-800/80 rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-md ${config.badgeBg} border ${config.badgeBorder}`}>
                      <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xs font-bold text-neutral-200 uppercase font-mono tracking-wider">
                          {config.label}
                        </h2>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400">
                          {categoryTasks.length} {categoryTasks.length === 1 ? 'task' : 'tasks'}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-500 hidden sm:block">
                        {config.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Task Cards in this category */}
                <div className="space-y-2.5">
                  {categoryTasks.map((task) => {
                    const style = stateColors[task.status] || stateColors.DRAFT;
                    return (
                      <div
                        key={task.id}
                        className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700/80 rounded-xl p-4 transition-all space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-mono uppercase bg-neutral-950 border border-neutral-800 px-2 py-0.5 rounded text-amber-400 font-semibold">
                                {task.siteName}
                              </span>

                              {/* Category Badge */}
                              <span
                                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border flex items-center gap-1 ${config.badgeBg} ${config.badgeBorder} ${config.badgeText}`}
                              >
                                <Icon className="w-2.5 h-2.5" />
                                {config.label}
                              </span>

                              {/* Status Badge */}
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${style.bg} ${style.text} ${style.border}`}
                              >
                                {task.status.replace('_', ' ')}
                              </span>

                              <span className="text-[10px] font-mono text-neutral-500">
                                Created: {task.createdDate}
                              </span>
                            </div>

                            <h3 className="text-sm font-bold text-neutral-100">{task.title}</h3>
                            <p className="text-xs text-neutral-300">{task.description}</p>
                          </div>

                          {/* Actions & Result button */}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            {task.status === 'AWAITING_APPROVAL' && (
                              <button
                                onClick={() => onOpenApproval(task)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow transition-colors cursor-pointer"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>Review Approval</span>
                              </button>
                            )}

                            {task.executionResult && (
                              <button
                                onClick={() => setInspectingTask(task)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 transition-colors cursor-pointer"
                              >
                                <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                                <span>View Result ({task.executionResult.executionDurationMs}ms)</span>
                              </button>
                            )}

                            <button
                              onClick={() => setInspectingTask(task)}
                              className="p-1.5 text-neutral-400 hover:text-neutral-200 cursor-pointer"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Footer metadata */}
                        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 pt-1 border-t border-neutral-800/80">
                          <span>Action: {task.requestedAction}</span>
                          <span>Approval: {task.approvalRequirement}</span>
                          <span>Updated: {task.updatedDate}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Inspect Task Execution Modal */}
      {inspectingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-neutral-900 border border-neutral-700/80 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">
                  Task Execution Inspector
                </span>
                <h3 className="text-sm font-bold text-neutral-100">{inspectingTask.title}</h3>
              </div>
              <button
                onClick={() => setInspectingTask(null)}
                className="text-neutral-400 hover:text-neutral-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1 text-xs">
              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 space-y-1.5 font-mono text-[11px]">
                <div className="text-neutral-400 flex items-center justify-between">
                  <span>Site Scope:</span>
                  <span className="text-neutral-200">{inspectingTask.siteName}</span>
                </div>
                <div className="text-neutral-400 flex items-center justify-between">
                  <span>Category:</span>
                  <span className="text-amber-400 font-semibold">{inspectingTask.category}</span>
                </div>
                <div className="text-neutral-400 flex items-center justify-between">
                  <span>Current Status:</span>
                  <span className="text-neutral-200">{inspectingTask.status}</span>
                </div>
                <div className="text-neutral-400 flex items-center justify-between">
                  <span>Dangerous Action Gate:</span>
                  <span className="text-neutral-200">{inspectingTask.dangerousActionType}</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-neutral-300 mb-1">Description:</h4>
                <p className="text-neutral-400 leading-relaxed">{inspectingTask.description}</p>
              </div>

              {inspectingTask.executionResult ? (
                <div className="space-y-2">
                  <h4 className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Execution Summary:
                  </h4>
                  <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 text-neutral-200">
                    {inspectingTask.executionResult.summary}
                  </div>

                  <h4 className="font-semibold text-neutral-300">Execution Stream Logs:</h4>
                  <div className="bg-black/90 p-3 rounded-lg border border-neutral-800 font-mono text-[10px] text-neutral-400 space-y-1">
                    {inspectingTask.executionResult.logs.map((log, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="text-neutral-600 select-none">{idx + 1}</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-neutral-950 rounded-lg border border-neutral-800 text-neutral-500 text-center font-mono">
                  No execution output available. Task is currently {inspectingTask.status}.
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-neutral-800 flex justify-end">
              <button
                onClick={() => setInspectingTask(null)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-neutral-900 border border-neutral-700/80 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wider font-mono">
                Queue New Operations Task
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-neutral-400 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] text-neutral-400 font-medium">Target Site Scope *</label>
                <select
                  value={newSiteId}
                  onChange={(e) => setNewSiteId(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-200 outline-none"
                >
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.siteName} ({s.websiteUrl})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-neutral-400 font-medium">Operational Category *</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as TaskCategory)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-200 outline-none"
                >
                  <option value="SECURITY">Security (Hardening, Malware, Access)</option>
                  <option value="MAINTENANCE">Maintenance (Updates, Link Integrity, Transients)</option>
                  <option value="CONTENT">Content (Publishing, Revisions, Drafts)</option>
                  <option value="SEO">SEO & Metadata (Rank Math, Yoast, Sitemaps)</option>
                  <option value="PERFORMANCE">Performance (Caching, Web Vitals, DB)</option>
                  <option value="GENERAL">General Operations</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-neutral-400 font-medium">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Audit Room Booking SEO schema"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-100 outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-neutral-400 font-medium">Dangerous Action Gate</label>
                <select
                  value={newActionType}
                  onChange={(e) => setNewActionType(e.target.value as DangerousActionType)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-200 outline-none"
                >
                  <option value="READ_ONLY_AUDIT">Read-Only Audit (Low Risk - Auto Approved)</option>
                  <option value="MODIFY_PLUGIN">Modify / Deactivate Plugin (High Risk)</option>
                  <option value="PUBLISH_CONTENT">Publish Content (Medium Risk)</option>
                  <option value="DELETE_PAGE">Delete Page (Critical Risk)</option>
                  <option value="BULK_EDIT_CONTENT">Bulk Edit Records (High Risk)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-neutral-400 font-medium">Execution Directives</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Parameters, targeted post IDs, or diagnostic requirements..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-100 outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-neutral-800 text-neutral-300 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Queue Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
