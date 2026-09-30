/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Phase 8: Task Reconciliation & Idempotent Verification Engine
 * 
 * When Imperial AI starts or restarts:
 * 1. Scans RUNNING, EXECUTING, PAUSED, UNKNOWN, interrupted tasks.
 * 2. Determines the actual WordPress state before continuing.
 * 3. Never blindly repeats a mutation.
 * 4. Determines SUCCESS, FAILED, UNKNOWN, or SAFE_TO_RESUME.
 */

import { 
  ProductionTask, 
  ProductionTaskStep, 
  ReconciledTaskRecord, 
  ReconciliationState, 
  IdempotentVerificationResult 
} from '../types';

export class ReconciliationEngine {
  /**
   * Scans tasks for interrupted states and performs live read-back reconciliation.
   */
  public static reconcileTasks(
    tasks: ProductionTask[],
    liveWordPressInspector: (siteId: string, resourceKey: string) => Promise<{ liveValue: string; exists: boolean }>
  ): Promise<ReconciledTaskRecord[]> {
    return Promise.all(
      tasks
        .filter((t) => t.overallStatus === 'RUNNING' || t.overallStatus === 'PAUSED' || t.steps.some((s) => s.state === 'EXECUTING'))
        .map(async (task) => {
          const executingStep = task.steps.find((s) => s.state === 'EXECUTING') || task.steps[task.currentStepIndex];
          const interruptedStepId = executingStep?.id;
          const resource = executingStep?.targetResource || 'wp_core_resource';
          const expected = executingStep?.proposedState || executingStep?.verificationExpected || 'expected_value';

          // Query live WordPress state (read-only audit, zero mutations)
          const liveState = await liveWordPressInspector(task.siteId, resource);

          let reconciledStatus: ReconciliationState = 'UNKNOWN';
          let actionTaken = '';
          let canSafelyResume = false;
          let requiresOperatorDecision = false;

          if (liveState.exists && liveState.liveValue === expected) {
            // Mutation succeeded prior to crash/interruption
            reconciledStatus = 'SUCCESS';
            actionTaken = 'Live WordPress state matches expected outcome. Marked step COMPLETED without repeating mutation (idempotent recovery).';
            canSafelyResume = task.currentStepIndex + 1 < task.steps.length;
          } else if (liveState.exists && executingStep?.preState && liveState.liveValue === executingStep.preState) {
            // Mutation was not executed before crash - pre-state intact
            reconciledStatus = 'SAFE_TO_RESUME';
            actionTaken = 'WordPress remains in pristine pre-state. Safe to resume execution of pending step with active lock.';
            canSafelyResume = true;
          } else if (!liveState.exists) {
            reconciledStatus = 'FAILED';
            actionTaken = 'Target resource was not found on remote WordPress host. Mutation cannot safely proceed.';
            requiresOperatorDecision = true;
          } else {
            // Inconsistent or indeterminate state
            reconciledStatus = 'UNKNOWN';
            actionTaken = 'Target resource state has diverged from both preState and expectedState. Operator inspection required.';
            requiresOperatorDecision = true;
          }

          return {
            taskId: task.id,
            taskTitle: task.title,
            siteId: task.siteId,
            siteName: task.siteName,
            previousStatus: task.overallStatus,
            reconciledStatus,
            interruptedStepId,
            actualWordPressState: liveState.liveValue,
            expectedWordPressState: expected,
            actionTaken,
            timestamp: new Date().toLocaleTimeString(),
            canSafelyResume,
            requiresOperatorDecision,
          };
        })
    );
  }

  /**
   * Idempotent Verification:
   * Before retrying any mutation, verifies whether the desired outcome is already present.
   */
  public static verifyIdempotency(
    step: ProductionTaskStep,
    siteId: string,
    liveValue: string
  ): IdempotentVerificationResult {
    const desired = step.proposedState || step.verificationExpected || '';
    const isAlreadyExecuted = liveValue.trim() === desired.trim();

    let recommendation: 'MARK_SUCCESS_NOOP' | 'EXECUTE_MUTATION' | 'INVESTIGATE_CONFLICT' | 'HALT_SAFETY';

    if (isAlreadyExecuted) {
      recommendation = 'MARK_SUCCESS_NOOP';
    } else if (step.preState && liveValue.trim() === step.preState.trim()) {
      recommendation = 'EXECUTE_MUTATION';
    } else if (!liveValue) {
      recommendation = 'HALT_SAFETY';
    } else {
      recommendation = 'INVESTIGATE_CONFLICT';
    }

    return {
      operationId: step.id,
      targetResource: step.targetResource,
      desiredState: desired,
      liveState: liveValue,
      isAlreadyExecuted,
      isSafeToExecute: recommendation === 'EXECUTE_MUTATION',
      recommendation,
      verifiedAt: new Date().toLocaleTimeString(),
    };
  }
}
