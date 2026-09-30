/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Phase 8: Resource & Site Concurrency Locking Engine
 * 
 * Prevents two workers or tasks from simultaneously modifying:
 * - The same site (respecting site-level concurrency)
 * - The same resource (e.g. Page 100, WooCommerce Catalog)
 * - The same task or operation
 * 
 * Independent sites (Site A and Site B) execute concurrently.
 * Same-site mutations queue behind site/resource locks.
 */

import { ResourceLock, LockStatus, LockTargetType } from '../types';

export class ResourceLockManager {
  private locks: Map<string, ResourceLock> = new Map();
  private maxConcurrencyPerSite: number = 1; // Mutations strictly serialized per site

  constructor(initialLocks: ResourceLock[] = []) {
    initialLocks.forEach((lock) => this.locks.set(lock.resourceKey, lock));
  }

  public getAllLocks(): ResourceLock[] {
    return Array.from(this.locks.values());
  }

  /**
   * Acquire lock on a resource or site.
   * If lock is held by another task, records conflict and returns false.
   */
  public acquireLock(params: {
    targetType: LockTargetType;
    resourceKey: string;
    siteId: string;
    siteName: string;
    taskId: string;
    taskTitle: string;
    operationId: string;
    ttlSeconds?: number;
  }): { acquired: boolean; lock?: ResourceLock; conflictReason?: string } {
    const existing = this.locks.get(params.resourceKey);
    const now = Date.now();

    // Check if existing lock expired
    if (existing && existing.status === 'ACQUIRED') {
      const expiresTime = new Date(existing.expiresAt).getTime();
      if (now < expiresTime) {
        // Active conflict!
        if (existing.taskId !== params.taskId) {
          if (!existing.waitingTasks.includes(params.taskId)) {
            existing.waitingTasks.push(params.taskId);
          }
          return {
            acquired: false,
            conflictReason: `Resource lock conflict: "${params.resourceKey}" is currently locked by Task ${existing.taskTitle} (expires ${existing.expiresAt}).`,
          };
        }
      }
    }

    // Site concurrency check for mutations
    if (params.targetType === 'SITE') {
      const activeSiteLocks = Array.from(this.locks.values()).filter(
        (l) => l.siteId === params.siteId && l.status === 'ACQUIRED' && l.taskId !== params.taskId
      );
      if (activeSiteLocks.length >= this.maxConcurrencyPerSite) {
        return {
          acquired: false,
          conflictReason: `Site concurrency limit reached (${this.maxConcurrencyPerSite}): Site "${params.siteName}" already has an active mutation in progress.`,
        };
      }
    }

    const ttl = params.ttlSeconds || 900; // 15 mins default TTL
    const newLock: ResourceLock = {
      id: `lock-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      targetType: params.targetType,
      resourceKey: params.resourceKey,
      siteId: params.siteId,
      siteName: params.siteName,
      taskId: params.taskId,
      taskTitle: params.taskTitle,
      operationId: params.operationId,
      ownerToken: `tok-lock-${Date.now()}`,
      acquiredAt: new Date().toLocaleTimeString(),
      expiresAt: new Date(now + ttl * 1000).toLocaleTimeString(),
      ttlSeconds: ttl,
      status: 'ACQUIRED',
      waitingTasks: [],
    };

    this.locks.set(params.resourceKey, newLock);
    return { acquired: true, lock: newLock };
  }

  /**
   * Release lock for a resource.
   */
  public releaseLock(resourceKey: string, taskId: string): boolean {
    const lock = this.locks.get(resourceKey);
    if (!lock) return false;
    if (lock.taskId === taskId || lock.ownerToken.length > 0) {
      lock.status = 'RELEASED';
      this.locks.delete(resourceKey);
      return true;
    }
    return false;
  }

  /**
   * Release all locks held by a task when task completes or rolls back.
   */
  public releaseAllForTask(taskId: string): void {
    for (const [key, lock] of this.locks.entries()) {
      if (lock.taskId === taskId) {
        lock.status = 'RELEASED';
        this.locks.delete(key);
      }
    }
  }

  /**
   * Determine if independent sites can execute concurrently
   */
  public canExecuteConcurrentSites(siteIdA: string, siteIdB: string): boolean {
    return siteIdA !== siteIdB;
  }
}
