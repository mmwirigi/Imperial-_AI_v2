/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Phase 8: Reliable Task Persistence Engine
 * Ensures production tasks, checkpoints, locks, and dead-letter items survive:
 * - Application restart
 * - Android process termination
 * - MCP disconnection
 * - Temporary network failure
 * - Server restart
 */

import { 
  ProductionTask, 
  BackupCheckpoint, 
  DeadLetterItem, 
  ResourceLock, 
  ReconciledTaskRecord, 
  TaskRecoveryCheckpoint 
} from '../types';

const STORAGE_KEYS = {
  TASKS: 'imperial_phase8_production_tasks_v1',
  CHECKPOINTS: 'imperial_phase8_checkpoints_v1',
  DEAD_LETTER: 'imperial_phase8_dead_letter_v1',
  RESOURCE_LOCKS: 'imperial_phase8_resource_locks_v1',
  RECONCILED: 'imperial_phase8_reconciled_tasks_v1',
  RECOVERY_POINTS: 'imperial_phase8_recovery_points_v1',
  LAST_CRASH_OR_SHUTDOWN: 'imperial_phase8_last_heartbeat_v1',
};

export class ReliabilityPersistenceManager {
  private static instance: ReliabilityPersistenceManager;

  private isLocalStorageAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
    } catch {
      return false;
    }
  }

  public static getInstance(): ReliabilityPersistenceManager {
    if (!ReliabilityPersistenceManager.instance) {
      ReliabilityPersistenceManager.instance = new ReliabilityPersistenceManager();
    }
    return ReliabilityPersistenceManager.instance;
  }

  // Save tasks durably with execution status, steps, journal, and verification
  public saveTasks(tasks: ProductionTask[]): void {
    if (!this.isLocalStorageAvailable()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      localStorage.setItem(STORAGE_KEYS.LAST_CRASH_OR_SHUTDOWN, Date.now().toString());
    } catch (err) {
      console.warn('[ReliabilityPersistence] Failed to persist tasks to storage:', err);
    }
  }

  public loadTasks(defaultTasks: ProductionTask[]): ProductionTask[] {
    if (!this.isLocalStorageAvailable()) return defaultTasks;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (!raw) return defaultTasks;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return defaultTasks;
    } catch (err) {
      console.warn('[ReliabilityPersistence] Failed to load tasks from storage:', err);
      return defaultTasks;
    }
  }

  // Dead-Letter Queue persistence
  public saveDeadLetterItems(items: DeadLetterItem[]): void {
    if (!this.isLocalStorageAvailable()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.DEAD_LETTER, JSON.stringify(items));
    } catch (err) {
      console.warn('[ReliabilityPersistence] Failed to persist DLQ to storage:', err);
    }
  }

  public loadDeadLetterItems(defaultItems: DeadLetterItem[]): DeadLetterItem[] {
    if (!this.isLocalStorageAvailable()) return defaultItems;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DEAD_LETTER);
      if (!raw) return defaultItems;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : defaultItems;
    } catch {
      return defaultItems;
    }
  }

  // Resource Locks persistence
  public saveResourceLocks(locks: ResourceLock[]): void {
    if (!this.isLocalStorageAvailable()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.RESOURCE_LOCKS, JSON.stringify(locks));
    } catch (err) {
      console.warn('[ReliabilityPersistence] Failed to persist locks to storage:', err);
    }
  }

  public loadResourceLocks(defaultLocks: ResourceLock[]): ResourceLock[] {
    if (!this.isLocalStorageAvailable()) return defaultLocks;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.RESOURCE_LOCKS);
      if (!raw) return defaultLocks;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : defaultLocks;
    } catch {
      return defaultLocks;
    }
  }

  // Checkpoints persistence
  public saveRecoveryCheckpoints(points: TaskRecoveryCheckpoint[]): void {
    if (!this.isLocalStorageAvailable()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.RECOVERY_POINTS, JSON.stringify(points));
    } catch (err) {
      console.warn('[ReliabilityPersistence] Failed to persist recovery points:', err);
    }
  }

  public loadRecoveryCheckpoints(defaultPoints: TaskRecoveryCheckpoint[]): TaskRecoveryCheckpoint[] {
    if (!this.isLocalStorageAvailable()) return defaultPoints;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.RECOVERY_POINTS);
      if (!raw) return defaultPoints;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : defaultPoints;
    } catch {
      return defaultPoints;
    }
  }

  // Check for interrupted execution on startup
  public detectInterruptedState(tasks: ProductionTask[]): {
    hasInterruptedTasks: boolean;
    interruptedTasks: ProductionTask[];
  } {
    const interrupted = tasks.filter(
      (t) => t.overallStatus === 'RUNNING' || t.steps.some((s) => s.state === 'EXECUTING' || s.state === 'VERIFYING')
    );
    return {
      hasInterruptedTasks: interrupted.length > 0,
      interruptedTasks: interrupted,
    };
  }

  // Export full diagnostic bundle for operator inspection
  public exportDiagnosticSnapshot(): string {
    if (!this.isLocalStorageAvailable()) return JSON.stringify({ error: 'Storage not accessible' });
    const snapshot = {
      timestamp: new Date().toISOString(),
      tasks: localStorage.getItem(STORAGE_KEYS.TASKS),
      dlq: localStorage.getItem(STORAGE_KEYS.DEAD_LETTER),
      locks: localStorage.getItem(STORAGE_KEYS.RESOURCE_LOCKS),
      checkpoints: localStorage.getItem(STORAGE_KEYS.RECOVERY_POINTS),
      lastHeartbeat: localStorage.getItem(STORAGE_KEYS.LAST_CRASH_OR_SHUTDOWN),
    };
    return JSON.stringify(snapshot, null, 2);
  }
}

export const persistenceManager = ReliabilityPersistenceManager.getInstance();
