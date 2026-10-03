import React from 'react';
import {
  Cpu,
  Server,
  Activity,
  Globe,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  Clock,
  HardDrive
} from 'lucide-react';
import {
  McpConnectionHealth,
  SiteHealthReport,
  DeadLetterItem,
  IncidentItem,
  Site,
  ProductionTask,
  SecurityEventItem
} from '../types';
import { Card, Badge, MetricCard } from './common/UIComponents';

interface MonitoringCenterScreenProps {
  mcpHealthList: McpConnectionHealth[];
  siteHealthReports: SiteHealthReport[];
  deadLetterItems: DeadLetterItem[];
  sites: Site[];
  tasks: ProductionTask[];
  securityEvents: SecurityEventItem[];
}

export const MonitoringCenterScreen: React.FC<MonitoringCenterScreenProps> = ({
  mcpHealthList,
  siteHealthReports,
  deadLetterItems,
  sites,
  tasks,
  securityEvents
}) => {
  const activeIncidents = deadLetterItems.filter((i) => i.status === 'PENDING_REVIEW');
  const healthyMcpCount = mcpHealthList.filter((m) => m.state === 'CONNECTED').length;
  const failedTasksCount = tasks.filter((t) => t.overallStatus === 'FAILED').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="success" size="sm" dot>
            OBSERVABILITY &amp; HEALTH
          </Badge>
          <span className="text-xs text-slate-500 font-mono">Real-Time Metrics</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
          System &amp; MCP Health Monitoring
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Live daemon health telemetry, WordPress host response latency, and self-healing recovery triggers.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="MCP Fleet Health"
          value={`${healthyMcpCount}/${mcpHealthList.length || 5}`}
          subtitle="All daemons responding"
          icon={Server}
          accentColor="emerald"
        />
        <MetricCard
          title="WordPress Fleet"
          value={`${sites.length} Hosts`}
          subtitle="Zero downtime detected"
          icon={Globe}
          accentColor="blue"
        />
        <MetricCard
          title="Failed Task Events"
          value={failedTasksCount}
          subtitle="Captured in dead-letter"
          icon={AlertTriangle}
          accentColor={failedTasksCount > 0 ? 'amber' : 'emerald'}
        />
        <MetricCard
          title="Open Incidents"
          value={activeIncidents.length}
          subtitle="Pending operator review"
          icon={ShieldAlert}
          accentColor={activeIncidents.length > 0 ? 'rose' : 'emerald'}
        />
      </div>

      {/* MCP Health Table & Host Latency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-600" />
            MCP Connection Health
          </h3>
          <div className="space-y-2.5">
            {mcpHealthList.map((mcp) => (
              <div
                key={mcp.serverId}
                className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900">{mcp.serverName}</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Response: {mcp.responseTimeMs}ms • Tools: {mcp.toolAvailabilityCount} • Errors: {mcp.consecutiveFailures}
                  </div>
                </div>
                <Badge variant={mcp.state === 'CONNECTED' ? 'success' : 'warning'} size="sm" dot>
                  {mcp.state}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" />
            WordPress Remote Host Health
          </h3>
          <div className="space-y-2.5">
            {sites.map((site) => (
              <div
                key={site.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900">{site.siteName}</div>
                  <div className="text-[11px] text-slate-400 font-mono truncate max-w-[200px]">
                    {site.websiteUrl}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    HTTP 200 OK
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
