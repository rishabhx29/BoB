import { create } from 'zustand';
import { Streak, DayStatus } from '@/types';

interface StreakState {
  streaks: Streak[];                              // All user streaks
  calendarData: Record<string, DayStatus[]>;     // activityId → day statuses

  // Actions
  setStreaks: (streaks: Streak[]) => void;
  updateStreak: (activityId: string, updates: Partial<Streak>) => void;
  setCalendarData: (activityId: string, days: DayStatus[]) => void;
}

export const useStreakStore = create<StreakState>((set) => ({
  streaks: [],
  calendarData: {},

  setStreaks: (streaks) => set({ streaks }),

  updateStreak: (activityId, updates) =>
    set((state) => ({
      streaks: state.streaks.map((s) =>
        s.activityId === activityId ? { ...s, ...updates } : s
      ),
    })),

  setCalendarData: (activityId, days) =>
    set((state) => ({
      calendarData: { ...state.calendarData, [activityId]: days },
    })),
}));
