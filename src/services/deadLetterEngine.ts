/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Phase 8: Dead-Letter Queue & Controlled Retry Engine
 * 
 * Error Classification:
 * - RETRYABLE: Temporary network drop, socket timeout, 502/503/504 gateway error.
 * - NON_RETRYABLE: Permission denied, wrong site, invalid schema, rejected approval.
 * - VERIFICATION_REQUIRED: Read-back diff mismatch, unknown execution outcome.
 * - SECURITY_BLOCK: Phase 5 authorization failure, client isolation breach.
 * 
 * Progressive Escalation Hierarchy:
 * Failure 1 -> Controlled retry
 * Failure 2 -> Exponential backoff with jitter
 * Repeated failure (exceeds maxRetries) -> Move to Dead-Letter Queue, pause task
 * Security failure -> Immediate halt, NEVER retry, raise SecurityEvent
 */

import { 
  DeadLetterItem, 
  DeadLetterStatus, 
  RetryClassification, 
  RetryPolicy, 
  ProductionTask, 
  ProductionTaskStep 
} from '../types';

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 3,
  baseBackoffMs: 1000,
  maxBackoffMs: 10000,
  backoffMultiplier: 2,
  jitter: true,
};

export class DeadLetterEngine {
  /**
   * Classify an error to determine whether it is safe to retry.
   */
  public static classifyError(errorMessage: string, httpCode?: number): RetryClassification {
    const lower = errorMessage.toLowerCase();

    // Security & Authorization: NEVER RETRY
    if (
      lower.includes('permission') || 
      lower.includes('unauthorized') || 
      lower.includes('wrong site') || 
      lower.includes('isolation') || 
      lower.includes('security') ||
      lower.includes('tamper') ||
      lower.includes('403')
    ) {
      return 'SECURITY_BLOCK';
    }

    // Invalid parameters / Schema mismatches: NON-RETRYABLE
    if (
      lower.includes('schema') || 
      lower.includes('invalid argument') || 
      lower.includes('not supported') || 
      lower.includes('cannot modify') ||
      lower.includes('approval rejected')
    ) {
      return 'NON_RETRYABLE';
    }

    // Verification Mismatch / Indeterminate State: VERIFICATION REQUIRED
    if (
      lower.includes('verification') || 
      lower.includes('mismatch') || 
      lower.includes('unknown') || 
      lower.includes('indeterminate')
    ) {
      return 'VERIFICATION_REQUIRED';
    }

    // Network & Infrastructure: RETRYABLE
    if (
      lower.includes('timeout') || 
      lower.includes('socket') || 
      lower.includes('econnreset') || 
      lower.includes('gateway') || 
      lower.includes('502') || 
      lower.includes('503') || 
      lower.includes('504') ||
      httpCode === 502 || httpCode === 503 || httpCode === 504
    ) {
      return 'RETRYABLE';
    }

    return 'NON_RETRYABLE';
  }

  /**
   * Calculate exponential backoff delay with jitter
   */
  public static calculateBackoff(
    attempt: number,
    policy: RetryPolicy = DEFAULT_RETRY_POLICY
  ): number {
    const rawDelay = policy.baseBackoffMs * Math.pow(policy.backoffMultiplier, attempt - 1);
    const boundedDelay = Math.min(rawDelay, policy.maxBackoffMs);

    if (policy.jitter) {
      // Add +/- 20% jitter
      const jitterFactor = 0.8 + Math.random() * 0.4;
      return Math.round(boundedDelay * jitterFactor);
    }

    return boundedDelay;
  }

  /**
   * Enroll a failed operation into the Dead-Letter Queue
   */
  public static createDeadLetterItem(params: {
    task: ProductionTask;
    step: ProductionTaskStep;
    failureReason: string;
    failureCategory: 'RETRY_LIMIT_EXCEEDED' | 'VERIFICATION_FAILURE' | 'MCP_DISCONNECT' | 'INCONSISTENT_STATE' | 'UNKNOWN_OUTCOME' | 'SAFETY_HALT';
    retryCount: number;
    errorHistory: Array<{ attempt: number; error: string; delayMs: number; classification: RetryClassification }>;
    recommendation: string;
  }): DeadLetterItem {
    const now = new Date().toLocaleTimeString();
    return {
      id: `dlq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      taskId: params.task.id,
      taskTitle: params.task.title,
      operationId: params.step.id,
      operationTitle: params.step.title,
      siteId: params.task.siteId,
      siteName: params.task.siteName,
      failureReason: params.failureReason,
      failureCategory: params.failureCategory,
      retryCount: params.retryCount,
      retryHistory: params.errorHistory.map((h) => ({
        attemptNumber: h.attempt,
        timestamp: now,
        delayMs: h.delayMs,
        errorMessage: h.error,
        classification: h.classification,
      })),
      timestamps: {
        firstAttempt: now,
        lastAttempt: now,
        enteredQueue: now,
      },
      lastKnownState: {
        preState: params.step.preState,
        attemptedPayload: params.step.proposedState,
        actualLiveState: params.step.verificationActual,
      },
      recoveryRecommendation: params.recommendation,
      status: 'PENDING_REVIEW',
      operatorNotes: '',
    };
  }
}
