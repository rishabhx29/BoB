import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useAuthStore } from '@/store/useAuthStore';
import { useSubmissionQueue, SyncResult } from '@/store/useSubmissionQueue';

const EMPTY_RESULT: SyncResult = { successCount: 0, discardedCount: 0, failCount: 0 };

/** Don't hammer the server when NetInfo emits several events in a row. */
const MIN_ATTEMPT_INTERVAL_MS = 5_000;

export interface OfflineSyncState {
  /** Proofs that have not reached the server yet (pending or syncing). */
  pendingCount: number;
  /** Retryable failures. */
  failedCount: number;
  /** Failures that need the user to change something (e.g. activity deleted). */
  blockedCount: number;
  isSyncing: boolean;
  /** Result of the most recent non-empty sync, for the status toast. */
  lastResult: SyncResult | null;
  lastSyncedAt: string | null;
  syncNow: () => Promise<SyncResult>;
}

/**
 * Drives the offline submission queue.
 *
 * Syncs on:
 *   - sign-in / app boot (auth store ready)
 *   - connectivity regain (NetInfo)
 *   - app returning to the foreground
 *
 * Mount this exactly once, at the app root.
 */
export function useOfflineSync(): OfflineSyncState {
  const userId = useAuthStore((state) => state.user?.id);
  const queue = useSubmissionQueue((state) => state.queue);
  const isSyncing = useSubmissionQueue((state) => state.isSyncing);
  const syncQueue = useSubmissionQueue((state) => state.syncQueue);
  const lastSyncedAt = useSubmissionQueue((state) => state.lastSyncedAt);
  const retrySubmission = useSubmissionQueue((state) => state.retrySubmission);

  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const lastAttemptRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const runSync = useCallback(
    async (force: boolean = false): Promise<SyncResult> => {
      if (!userId) return EMPTY_RESULT;

      const now = Date.now();
      if (!force && now - lastAttemptRef.current < MIN_ATTEMPT_INTERVAL_MS) {
        return EMPTY_RESULT;
      }
      lastAttemptRef.current = now;

      try {
        const result = await syncQueue(userId);
        if (
          mountedRef.current &&
          (result.successCount > 0 || result.discardedCount > 0 || result.failCount > 0)
        ) {
          setLastResult(result);
        }
        return result;
      } catch (err) {
        console.warn('[useOfflineSync] Queue sync failed:', err);
        return EMPTY_RESULT;
      }
    },
    [syncQueue, userId]
  );

  // Attempt once auth is ready — restores proofs queued before the app closed.
  useEffect(() => {
    if (!userId) return;
    void runSync(true);
  }, [userId, runSync]);

  // Connectivity regain.
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online =
        state.isConnected !== false && state.isInternetReachable !== false;
      if (online) void runSync();
    });
    return unsubscribe;
  }, [runSync]);

  // Returning to the foreground is the most common "I have signal again" moment
  // on mobile, where NetInfo events can be missed while backgrounded.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') void runSync();
    });
    return () => subscription.remove();
  }, [runSync]);

  const syncNow = useCallback(async () => {
    // Clear permanent failures first: the user explicitly asked to retry.
    for (const item of useSubmissionQueue.getState().queue) {
      if (item.isPermanent) retrySubmission(item.id);
    }
    return runSync(true);
  }, [retrySubmission, runSync]);

  const pendingCount = userId
    ? queue.filter(
        (item) =>
          item.status !== 'failed' &&
          (!item.ownerId || item.ownerId === userId)
      ).length
    : 0;
  const failedCount = userId
    ? queue.filter(
        (item) =>
          item.status === 'failed' &&
          !item.isPermanent &&
          (!item.ownerId || item.ownerId === userId)
      ).length
    : 0;
  const blockedCount = userId
    ? queue.filter(
        (item) => item.isPermanent && (!item.ownerId || item.ownerId === userId)
      ).length
    : 0;

  return {
    pendingCount,
    failedCount,
    blockedCount,
    isSyncing,
    lastResult,
    lastSyncedAt,
    syncNow,
  };
}
