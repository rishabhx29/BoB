import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface QueuedSubmission {
  id: string;
  activityId: string;
  groupId: string;
  timestamp: string;
  title?: string;
  description?: string;
  fieldsData?: Record<string, any>;
  photoUri?: string;
  status: 'pending' | 'syncing' | 'failed';
}

interface SubmissionQueueState {
  queue: QueuedSubmission[];
  addSubmission: (submission: Omit<QueuedSubmission, 'status'>) => void;
  removeSubmission: (id: string) => void;
  updateStatus: (id: string, status: QueuedSubmission['status']) => void;
  clearQueue: () => void;
}

export const useSubmissionQueue = create<SubmissionQueueState>()(
  persist(
    (set) => ({
      queue: [],
      
      addSubmission: (submission) => set((state) => ({
        queue: [...state.queue, { ...submission, status: 'pending' }]
      })),
      
      removeSubmission: (id) => set((state) => ({
        queue: state.queue.filter(s => s.id !== id)
      })),
      
      updateStatus: (id, status) => set((state) => ({
        queue: state.queue.map(s => s.id === id ? { ...s, status } : s)
      })),
      
      clearQueue: () => set({ queue: [] }),
    }),
    {
      name: 'submission-queue-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
