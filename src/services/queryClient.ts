import { QueryClient } from '@tanstack/react-query';

/**
 * TanStack Query client with stale time tuned per data type.
 * 
 * Stale times:
 * - Feed submissions: 30s (frequent updates)
 * - Group data: 2 min (moderately dynamic)
 * - Calendar / Streaks: 60s (updated after submissions)
 * - Profile / User: 5 min (rarely changes mid-session)
 * - Badge definitions: 1 hour (static data)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,        // 1 minute default
      retry: 2,
      refetchOnWindowFocus: false, // Mobile apps: don't refetch on window focus
      refetchOnReconnect: true,    // But do refetch when network comes back
    },
    mutations: {
      retry: 1,
    },
  },
});

// ─── Query Key Constants ───────────────────────────────────────────────────────
// Centralized to avoid typos and enable precise cache invalidation.

export const QUERY_KEYS = {
  // User
  currentUser: ['currentUser'] as const,
  user: (userId: string) => ['user', userId] as const,

  // Groups
  myGroups: ['myGroups'] as const,
  group: (groupId: string) => ['group', groupId] as const,
  groupMembers: (groupId: string) => ['groupMembers', groupId] as const,

  // Activities
  activities: (groupId: string) => ['activities', groupId] as const,
  activity: (activityId: string) => ['activity', activityId] as const,

  // Submissions
  feed: (groupId?: string) => ['feed', groupId ?? 'all'] as const,
  submissions: (userId: string, activityId?: string) =>
    ['submissions', userId, activityId ?? 'all'] as const,

  // Streaks
  streaks: (userId: string) => ['streaks', userId] as const,
  streak: (userId: string, activityId: string) =>
    ['streak', userId, activityId] as const,
  calendar: (userId: string, activityId: string, month: string) =>
    ['calendar', userId, activityId, month] as const,

  // Badges
  badges: ['badges'] as const,
  userBadges: (userId: string) => ['userBadges', userId] as const,

  // Leaderboard
  leaderboard: (groupId: string) => ['leaderboard', groupId] as const,
} as const;

// ─── Stale Time Config (ms) ────────────────────────────────────────────────────

export const STALE_TIMES = {
  feed: 30 * 1000,          // 30s
  groups: 2 * 60 * 1000,    // 2 min
  calendar: 60 * 1000,      // 1 min
  profile: 5 * 60 * 1000,   // 5 min
  badges: 60 * 60 * 1000,   // 1 hour
} as const;
