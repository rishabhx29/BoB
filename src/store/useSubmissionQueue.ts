import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uploadSubmissionPhoto, deleteSubmissionPhoto } from '@/services/storageService';
import { createSubmission } from '@/services/submissionService';
import { queryClient, QUERY_KEYS } from '@/services/queryClient';
import { isAppError, AppErrorCode } from '@/services/errors';

export interface QueuedSubmission {
  id: string;
  /** Account that created the proof; queues survive logout but stay scoped. */
  ownerId?: string;
  activityId: string;
  groupId: string;
  timestamp: string;
  title?: string;
  description?: string;
  fieldsData?: Record<string, any>;
  /** Local file URI, kept until the upload succeeds. */
  photoUri?: string;
  /** Remote URL captured after a successful upload, so retries don't re-upload. */
  uploadedPhotoUrl?: string;
  status: 'pending' | 'syncing' | 'failed';
  /** A permanent failure will not retry automatically; the user must act. */
  isPermanent?: boolean;
  errorMessage?: string;
}

export interface SyncResult {
  successCount: number;
  /** Duplicates already on the server; dropped without blocking the queue. */
  discardedCount: number;
  failCount: number;
}

const EMPTY_RESULT: SyncResult = { successCount: 0, discardedCount: 0, failCount: 0 };

/**
 * Errors that will never succeed on retry. Network/storage/auth failures stay
 * pending so the next connectivity event can try again.
 */
const PERMANENT_ERROR_CODES: AppErrorCode[] = [
  'VALIDATION',
  'NOT_FOUND',
  'NOT_ALLOWED',
  'NOT_ADMIN',
  'GROUP_FULL',
  'ALREADY_MEMBER',
];

function isRemoteUri(uri: string): boolean {
  return uri.startsWith('http://') || uri.startsWith('https://');
}

interface SubmissionQueueState {
  queue: QueuedSubmission[];
  isSyncing: boolean;
  lastSyncedAt: string | null;
  addSubmission: (submission: Omit<QueuedSubmission, 'status'>) => void;
  removeSubmission: (id: string) => void;
  updateStatus: (
    id: string,
    status: QueuedSubmission['status'],
    options?: { errorMessage?: string; isPermanent?: boolean }
  ) => void;
  setUploadedPhoto: (id: string, url: string) => void;
  /** Clears a permanent failure and lets the next sync try again. */
  retrySubmission: (id: string) => void;
  clearQueue: () => void;
  syncQueue: (userId: string) => Promise<SyncResult>;
}

export const useSubmissionQueue = create<SubmissionQueueState>()(
  persist(
    (set, get) => ({
      queue: [],
      isSyncing: false,
      lastSyncedAt: null,

      addSubmission: (submission) =>
        set((state) => ({
          queue: [...state.queue, { ...submission, status: 'pending' }],
        })),

      removeSubmission: (id) =>
        set((state) => ({
          queue: state.queue.filter((s) => s.id !== id),
        })),

      updateStatus: (id, status, options) =>
        set((state) => ({
          queue: state.queue.map((s) =>
            s.id === id
              ? {
                  ...s,
                  status,
                  errorMessage: options?.errorMessage,
                  isPermanent: options?.isPermanent ?? false,
                }
              : s
          ),
        })),

      setUploadedPhoto: (id, url) =>
        set((state) => ({
          queue: state.queue.map((s) =>
            s.id === id ? { ...s, uploadedPhotoUrl: url, photoUri: undefined } : s
          ),
        })),

      retrySubmission: (id) =>
        set((state) => ({
          queue: state.queue.map((s) =>
            s.id === id
              ? { ...s, status: 'pending', isPermanent: false, errorMessage: undefined }
              : s
          ),
        })),

      clearQueue: () => set({ queue: [] }),

      syncQueue: async (userId: string) => {
        const { queue, isSyncing, removeSubmission, updateStatus, setUploadedPhoto } = get();

        // The guard is synchronous, so two connectivity events cannot double-run.
        if (isSyncing || !userId) {
          return EMPTY_RESULT;
        }

        const candidates = queue.filter(
          (item) =>
            !item.isPermanent &&
            // Never upload another account's queued proofs.
            (!item.ownerId || item.ownerId === userId)
        );
        if (candidates.length === 0) {
          return EMPTY_RESULT;
        }

        set({ isSyncing: true });
        let successCount = 0;
        let discardedCount = 0;
        let failCount = 0;

        for (const item of candidates) {
          let uploadedPhotoUrl = item.uploadedPhotoUrl ?? null;

          try {
            updateStatus(item.id, 'syncing');

            // 1. Upload the photo once, then reuse the URL on every retry.
            if (!uploadedPhotoUrl && item.photoUri) {
              if (isRemoteUri(item.photoUri)) {
                uploadedPhotoUrl = item.photoUri;
              } else {
                uploadedPhotoUrl = await uploadSubmissionPhoto(
                  userId,
                  item.activityId,
                  item.photoUri
                );
                setUploadedPhoto(item.id, uploadedPhotoUrl);
              }
            }

            // 2. Insert, preserving the original client timestamp so streaks and
            //    the feed keep the moment the proof actually happened.
            await createSubmission({
              activityId: item.activityId,
              groupId: item.groupId,
              photoUrl: uploadedPhotoUrl,
              title: item.title,
              description: item.description,
              fieldValues: item.fieldsData,
              clientTimestamp: item.timestamp,
            });

            removeSubmission(item.id);
            successCount++;
          } catch (err: any) {
            console.warn('[useSubmissionQueue] Failed to sync item:', item.id, err);

            if (isAppError(err) && err.code === 'DUPLICATE_SUBMISSION') {
              // The proof already exists (e.g. a first attempt landed but the
              // response was lost). Drop it and clean up the orphaned upload.
              removeSubmission(item.id);
              discardedCount++;
              if (uploadedPhotoUrl) {
                deleteSubmissionPhoto(uploadedPhotoUrl).catch(() => {});
              }
              continue;
            }

            failCount++;
            const permanent =
              isAppError(err) && PERMANENT_ERROR_CODES.includes(err.code);

            updateStatus(item.id, 'failed', {
              errorMessage: err?.message || 'Sync failed',
              isPermanent: permanent,
            });
          }
        }

        // Only refresh caches when the server state actually changed.
        if (successCount > 0 || discardedCount > 0) {
          queryClient.invalidateQueries({ queryKey: ['feed'] });
          queryClient.invalidateQueries({ queryKey: ['today-submissions'] });
          queryClient.invalidateQueries({ queryKey: ['submissions'] });
          queryClient.invalidateQueries({ queryKey: ['streaks'] });
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currentUser });
        }

        set({
          isSyncing: false,
          lastSyncedAt:
            successCount > 0 ? new Date().toISOString() : get().lastSyncedAt,
        });

        return { successCount, discardedCount, failCount };
      },
    }),
    {
      name: 'submission-queue-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Never persist transient flags: a killed app must not restore a queue
      // stuck in `syncing`.
      partialize: (state) => ({ queue: state.queue }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.queue = state.queue.map((item) =>
          item.status === 'syncing' ? { ...item, status: 'pending' } : item
        );
      },
    }
  )
);
