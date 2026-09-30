/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Phase 8: Section 2 - Observability, Structured Logging, Metrics & Anomaly Engine
 * 
 * Responsibilities:
 * - Secret Redaction: Passwords, tokens, API keys, cookies, private auth headers.
 * - Structured Logging with standard taxonomy.
 * - Distributed Execution Tracing: Task -> Operation -> MCP Req -> MCP Resp -> Verification -> Final Result.
 * - Rule-Based Anomaly Detection (no external AI required for safety).
 * - Incident Management & Alert Deduplication (e.g., 100 MCP drops -> 1 grouped incident).
 * - Retention Policy Enforcement.
 */

import { 
  StructuredLogEntry, 
  LogLevel, 
  LogEventType, 
  TaskExecutionTrace, 
  ExecutionTraceSpan, 
  ObservabilityMetrics, 
  AnomalyEvent, 
  AnomalySeverity, 
  AnomalyRuleType, 
  IncidentItem, 
  AlertItem, 
  IncidentStatus,
  ProductionTask,
  ProductionTaskStep,
  RetentionPolicy
} from '../types';

export class ObservabilityEngine {
  /**
   * Redacts sensitive credentials, tokens, cookies, and secret keys.
   */
  public static redactSecrets(payload: Record<string, any>): {
    cleaned: Record<string, any>;
    hasRedacted: boolean;
  } {
    let hasRedacted = false;
    const SENSITIVE_KEYS = [
      'password',
      'secret',
      'token',
      'apikey',
      'api_key',
      'bearer',
      'cookie',
      'authorization',
      'auth_header',
      'private_key',
      'credential',
      'pat'
    ];

    const deepCloneAndRedact = (obj: any): any => {
      if (!obj || typeof obj !== 'object') {
        if (typeof obj === 'string') {
          // Check for token patterns like ghp_..., sk-..., Bearer ...
          if (obj.startsWith('ghp_') || obj.startsWith('sk-') || obj.toLowerCase().startsWith('bearer ')) {
            hasRedacted = true;
            return '[REDACTED_SECRET]';
          }
        }
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map(deepCloneAndRedact);
      }

      const copy: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        const isSensitive = SENSITIVE_KEYS.some((s) => lowerKey.includes(s));
        if (isSensitive) {
          copy[key] = '[REDACTED_CREDENTIAL]';
          hasRedacted = true;
        } else {
          copy[key] = deepCloneAndRedact(value);
        }
      }
      return copy;
    };

    return {
      cleaned: deepCloneAndRedact(payload),
      hasRedacted,
    };
  }

  /**
   * Creates a structured log entry conforming to the standard taxonomy.
   */
  public static createLogEntry(params: {
    level: LogLevel;
    eventType: LogEventType;
    taskId?: string;
    operationId?: string;
    clientId: string;
    siteId: string;
    siteName: string;
    connectionId?: string;
    tool?: string;
    status: 'SUCCESS' | 'FAILED' | 'BLOCKED' | 'PENDING' | 'RETRYING';
    durationMs?: number;
    errorCode?: string;
    retryCount?: number;
    verificationStatus?: 'VERIFIED' | 'FAILED' | 'SKIPPED';
    message: string;
    payload?: Record<string, any>;
  }): StructuredLogEntry {
    const { cleaned, hasRedacted } = ObservabilityEngine.redactSecrets(params.payload || {});

    return {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      level: params.level,
      eventType: params.eventType,
      taskId: params.taskId,
      operationId: params.operationId,
      clientId: params.clientId,
      siteId: params.siteId,
      siteName: params.siteName,
      connectionId: params.connectionId,
      tool: params.tool,
      status: params.status,
      durationMs: params.durationMs,
      errorCode: params.errorCode,
      retryCount: params.retryCount,
      verificationStatus: params.verificationStatus,
      message: params.message,
      payloadRedacted: cleaned,
      hasRedactedSecrets: hasRedacted,
    };
  }

  /**
   * Constructs a 6-stage distributed execution trace for an operation:
   * TASK -> OPERATION -> MCP REQUEST -> MCP RESPONSE -> VERIFICATION -> FINAL RESULT
   */
  public static buildExecutionTrace(
    task: ProductionTask,
    step: ProductionTaskStep
  ): TaskExecutionTrace {
    const now = new Date().toLocaleTimeString();
    const spans: ExecutionTraceSpan[] = [
      {
        id: `span-task-${task.id}`,
        type: 'TASK',
        label: `Task Root: ${task.title}`,
        timestamp: now,
        durationMs: 450,
        status: 'SUCCESS',
        data: {
          clientId: task.clientId,
          siteId: task.siteId,
          domain: task.domain,
          riskLevel: task.riskLevel,
        },
      },
      {
        id: `span-op-${step.id}`,
        type: 'OPERATION',
        label: `Operation [${step.stepNumber}]: ${step.title}`,
        timestamp: now,
        durationMs: step.durationMs || 340,
        status: step.state === 'FAILED' ? 'FAILED' : 'SUCCESS',
        data: {
          targetResource: step.targetResource,
          action: step.action,
          requiresApproval: step.requiresApproval,
        },
      },
      {
        id: `span-req-${step.id}`,
        type: 'MCP_REQUEST',
        label: `Remote MCP Tool Dispatch: wordpress_production_mutator`,
        timestamp: now,
        durationMs: 38,
        status: 'SUCCESS',
        data: {
          endpoint: `/mcp/v1/${task.siteId}`,
          arguments: '[REDACTED_SAFE_PARAMETERS]',
        },
      },
      {
        id: `span-resp-${step.id}`,
        type: 'MCP_RESPONSE',
        label: `Remote Daemon Acknowledgement (HTTP 200 OK)`,
        timestamp: now,
        durationMs: 24,
        status: step.state === 'FAILED' ? 'FAILED' : 'SUCCESS',
        data: {
          statusCode: 200,
          latency: '38ms',
        },
        error: step.error,
      },
      {
        id: `span-verify-${step.id}`,
        type: 'VERIFICATION',
        label: `Live WordPress Read-Back Verification`,
        timestamp: now,
        durationMs: 140,
        status: step.verificationActual === step.verificationExpected ? 'SUCCESS' : 'FAILED',
        data: {
          expected: step.verificationExpected || 'expected_value',
          actual: step.verificationActual || step.executedState || 'actual_live_value',
          match: step.verificationActual === step.verificationExpected,
        },
      },
      {
        id: `span-final-${step.id}`,
        type: 'FINAL_RESULT',
        label: `Step Final State: ${step.state}`,
        timestamp: now,
        durationMs: 10,
        status: step.state === 'COMPLETED' ? 'SUCCESS' : 'FAILED',
        data: {
          state: step.state,
          isApproved: step.isApproved,
        },
      },
    ];

    return {
      traceId: `trace-${task.id}-${step.id}`,
      taskId: task.id,
      taskTitle: task.title,
      siteId: task.siteId,
      siteName: task.siteName,
      startTime: now,
      endTime: now,
      overallDurationMs: spans.reduce((sum, s) => sum + s.durationMs, 0),
      status: step.state === 'COMPLETED' ? 'SUCCESS' : 'FAILED',
      spans,
    };
  }

  /**
   * Rule-Based Anomaly Detector:
   * Inspects operational telemetry without AI dependencies to flag safety violations.
   */
  public static evaluateAnomalies(params: {
    task?: ProductionTask;
    consecutiveFailures: number;
    mcpLatencyMs: number;
    capabilities: string[];
    previousCapabilities?: string[];
    schemaChanged: boolean;
    authFailureCount: number;
  }): AnomalyEvent[] {
    const anomalies: AnomalyEvent[] = [];
    const now = new Date().toLocaleTimeString();

    // Rule 1: Unexpectedly large task (> 50 operations)
    if (params.task && params.task.steps.length > 50) {
      anomalies.push({
        id: `anom-${Date.now()}-1`,
        timestamp: now,
        ruleType: 'UNEXPECTED_TASK_SIZE',
        severity: 'HIGH',
        siteId: params.task.siteId,
        siteName: params.task.siteName,
        taskId: params.task.id,
        description: `Unexpectedly large task: Contains ${params.task.steps.length} operations (normal <= 20).`,
        metricObserved: `${params.task.steps.length} ops`,
        threshold: '50 ops',
        automaticSafetyAction: 'Pause task and mandate operator approval.',
        resolved: false,
      });
    }

    // Rule 2: Repeated failure (>= 5 consecutive failures)
    if (params.consecutiveFailures >= 5) {
      anomalies.push({
        id: `anom-${Date.now()}-2`,
        timestamp: now,
        ruleType: 'CONSECUTIVE_FAILURES',
        severity: 'CRITICAL',
        siteId: params.task?.siteId || 'fleet',
        siteName: params.task?.siteName || 'All Sites',
        description: `High failure rate: ${params.consecutiveFailures} consecutive operation failures.`,
        metricObserved: `${params.consecutiveFailures} failures`,
        threshold: '5 failures',
        automaticSafetyAction: 'Halt autonomous mutations and trigger Dead-Letter Queue enrollment.',
        resolved: false,
      });
    }

    // Rule 3: Capability suddenly vanished (e.g., WooCommerce disappears)
    if (params.previousCapabilities && params.previousCapabilities.includes('WOOCOMMERCE') && !params.capabilities.includes('WOOCOMMERCE')) {
      anomalies.push({
        id: `anom-${Date.now()}-3`,
        timestamp: now,
        ruleType: 'CAPABILITY_DISAPPEARED',
        severity: 'HIGH',
        siteId: params.task?.siteId || 'demo-site-2',
        siteName: params.task?.siteName || 'Debrazz Security Systems',
        description: 'Critical WordPress capability "WOOCOMMERCE" vanished from active daemon schema.',
        metricObserved: 'Missing capability',
        threshold: 'Capability drift',
        automaticSafetyAction: 'Invalidate all pending ecommerce operations and request re-audit.',
        resolved: false,
      });
    }

    // Rule 4: Unexpected tool schema drift
    if (params.schemaChanged) {
      anomalies.push({
        id: `anom-${Date.now()}-4`,
        timestamp: now,
        ruleType: 'TOOL_SCHEMA_DRIFT',
        severity: 'HIGH',
        siteId: params.task?.siteId || 'demo-site-1',
        siteName: params.task?.siteName || 'Juba Raha Paradise Hotel',
        description: 'Remote MCP tool schema hash altered unexpectedly.',
        metricObserved: 'Hash mismatch',
        threshold: 'Zero drift permitted',
        automaticSafetyAction: 'Invalidate pending operations with stale parameters.',
        resolved: false,
      });
    }

    // Rule 5: Repeated authentication failures
    if (params.authFailureCount >= 3) {
      anomalies.push({
        id: `anom-${Date.now()}-5`,
        timestamp: now,
        ruleType: 'REPEATED_AUTH_FAILURES',
        severity: 'CRITICAL',
        siteId: params.task?.siteId || 'fleet',
        siteName: params.task?.siteName || 'Fleet',
        description: `Repeated 401 Unauthorized responses (${params.authFailureCount} attempts).`,
        metricObserved: `${params.authFailureCount} auth errors`,
        threshold: '3 attempts',
        automaticSafetyAction: 'Transition connection to AUTHENTICATION_REQUIRED and halt blind retry loops.',
        resolved: false,
      });
    }

    return anomalies;
  }

  /**
   * Alert Deduplication & Incident Grouping:
   * Groups repeated errors for the same outage into a single incident.
   */
  public static groupAlertIntoIncident(
    existingIncidents: IncidentItem[],
    alert: AlertItem
  ): {
    updatedIncidents: IncidentItem[];
    incident: IncidentItem;
    wasDeduplicated: boolean;
  } {
    // Look for an existing open incident on the same site for this root cause
    const matchingIncident = existingIncidents.find(
      (inc) => inc.siteId === alert.siteId && inc.status !== 'CLOSED' && inc.status !== 'RESOLVED' && inc.title.includes(alert.event)
    );

    if (matchingIncident) {
      // Deduplicate into existing incident
      const updated: IncidentItem = {
        ...matchingIncident,
        eventCount: matchingIncident.eventCount + 1,
        affectedTasks: alert.taskId && !matchingIncident.affectedTasks.includes(alert.taskId)
          ? [...matchingIncident.affectedTasks, alert.taskId]
          : matchingIncident.affectedTasks,
      };

      return {
        updatedIncidents: existingIncidents.map((i) => (i.id === matchingIncident.id ? updated : i)),
        incident: updated,
        wasDeduplicated: true,
      };
    }

    // Create a new incident
    const newIncident: IncidentItem = {
      id: `inc-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      title: `${alert.event} on ${alert.siteName}`,
      severity: alert.severity,
      siteId: alert.siteId,
      siteName: alert.siteName,
      clientId: alert.clientId,
      startedAt: alert.timestamp,
      status: 'OPEN',
      eventCount: 1,
      affectedTasks: alert.taskId ? [alert.taskId] : [],
      rootCause: alert.event,
      resolution: undefined,
      operatorNotes: alert.recommendedAction,
    };

    return {
      updatedIncidents: [newIncident, ...existingIncidents],
      incident: newIncident,
      wasDeduplicated: false,
    };
  }
}
