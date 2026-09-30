import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Lock, 
  AlertOctagon, 
  Ban, 
  RefreshCw,
  Terminal,
  ShieldCheck
} from 'lucide-react';
import { SecurityEventItem, SecurityEventType, Site } from '../types';

interface SecurityEventsViewProps {
  events: SecurityEventItem[];
  activeSite: Site | null;
  onResolveEvent: (id: string) => void;
  onClearResolved: () => void;
}

export const SecurityEventsView: React.FC<SecurityEventsViewProps> = ({
  events,
  activeSite,
  onResolveEvent,
  onClearResolved,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const siteEvents = activeSite
    ? events.filter((e) => e.siteId === activeSite.id)
    : events;

  const filteredEvents = siteEvents.filter((e) => {
    const matchesSearch = 
      e.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.siteName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = selectedSeverity === 'ALL' || e.severity === selectedSeverity;
    const matchesType = selectedType === 'ALL' || e.eventType === selectedType;

    return matchesSearch && matchesSeverity && matchesType;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-950 text-rose-300 border-rose-700 animate-pulse';
      case 'HIGH':
        return 'bg-rose-950/80 text-rose-400 border-rose-800';
      case 'MEDIUM':
        return 'bg-amber-950 text-amber-400 border-amber-800';
      default:
        return 'bg-blue-950 text-blue-400 border-blue-800';
    }
  };

  const getEventTypeIcon = (type: SecurityEventType) => {
    switch (type) {
      case 'WRONG_SITE_EXECUTION_BLOCKED':
        return <Ban className="w-4 h-4 text-rose-400" />;
      case 'APPROVAL_INVALIDATED':
        return <AlertOctagon className="w-4 h-4 text-amber-400" />;
      case 'UNAUTHORIZED_OPERATION':
        return <Lock className="w-4 h-4 text-rose-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              Security Events & Audit Log
            </h1>
            <span className="text-[11px] font-mono uppercase bg-neutral-900 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded">
              Phase 7 Section 2 · Authority: Phase 5
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Searchable log of wrong-site execution blocks, approval invalidations, capability mismatches, and limit violations.
          </p>
        </div>

        <button
          onClick={onClearResolved}
          className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-neutral-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Clear Resolved ({events.filter((e) => e.resolved).length})
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search security events by keyword, site name, or error code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-500 outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs rounded-lg px-2.5 py-1.5 outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs rounded-lg px-2.5 py-1.5 outline-none"
          >
            <option value="ALL">All Event Types</option>
            <option value="WRONG_SITE_EXECUTION_BLOCKED">Wrong Site Blocked</option>
            <option value="APPROVAL_INVALIDATED">Approval Invalidated</option>
            <option value="UNAUTHORIZED_OPERATION">Unauthorized Operation</option>
            <option value="CAPABILITY_MISMATCH">Capability Mismatch</option>
            <option value="LIMIT_EXCEEDED">Limit Exceeded</option>
            <option value="AUTHENTICATION_FAILURE">Auth Failure</option>
            <option value="MCP_TOOL_NOT_FOUND">Tool Not Found</option>
            <option value="VERIFICATION_FAILURE">Verification Failure</option>
          </select>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-12 text-center text-neutral-400 space-y-2">
            <ShieldCheck className="w-8 h-8 mx-auto text-emerald-500" />
            <p className="text-xs">No security events found matching current criteria.</p>
          </div>
        ) : (
          filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className={`p-4 rounded-xl border transition-all space-y-2.5 ${
                evt.severity === 'CRITICAL' || evt.severity === 'HIGH'
                  ? 'bg-neutral-950 border-rose-900/60'
                  : 'bg-neutral-950 border-neutral-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  {getEventTypeIcon(evt.eventType)}
                  <span className="text-xs font-mono font-bold text-neutral-200">
                    {evt.eventType}
                  </span>
                  <span className={`text-[9px] font-mono px-2 py-0.2 rounded border font-semibold ${getSeverityBadge(evt.severity)}`}>
                    {evt.severity}
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">
                    {evt.siteName}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-neutral-500 font-mono">
                    {evt.timestamp}
                  </span>
                  {!evt.resolved ? (
                    <button
                      onClick={() => onResolveEvent(evt.id)}
                      className="px-2.5 py-0.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-750 text-[11px] font-medium rounded transition-colors"
                    >
                      Mark Resolved
                    </button>
                  ) : (
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Resolved
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed pl-6">
                {evt.details}
              </p>

              {evt.taskId && (
                <div className="pl-6 text-[10px] font-mono text-neutral-500">
                  Target Task Reference: <span className="text-amber-400">{evt.taskId}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
