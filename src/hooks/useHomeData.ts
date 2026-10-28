import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { AppError } from '@/services/errors';
import { STALE_TIMES } from '@/services/queryClient';
import { mapSubmissionRow } from '@/services/submissionService';
import { Group, Submission, TodayActivityItem } from '@/types';
import { useAllGroupActivities } from './useActivities';
import { useUserStreaks } from './useStreaks';

/** Local calendar day as YYYY-MM-DD (matches how users read "today"). */
function localDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function localDayBounds(): { start: Date; end: Date } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

/**
 * The current user's submissions for the local day, keyed by activity id.
 * A user can only have one submission per activity per day.
 */
function useTodaySubmissions(groupIds: string[], userId: string) {
  const scopeKey = groupIds.slice().sort().join(',');

  return useQuery({
    queryKey: ['today-submissions', userId, scopeKey] as const,
    enabled: groupIds.length > 0 && userId.length > 0,
    queryFn: async (): Promise<Record<string, Submission>> => {
      const { start, end } = localDayBounds();
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', userId)
        .in('group_id', groupIds)
        .gte('client_timestamp', start.toISOString())
        .lt('client_timestamp', end.toISOString());

      if (error) {
        console.error('[useHomeData] Failed to load today submissions:', error);
        throw new AppError('NETWORK', "Failed to load today's proofs");
      }

      const byActivity: Record<string, Submission> = {};
      for (const row of (data ?? []) as any[]) {
        byActivity[row.activity_id] = mapSubmissionRow(row);
      }
      return byActivity;
    },
    staleTime: STALE_TIMES.feed,
  });
}

export interface HomeData {
  todayItems: TodayActivityItem[];
  /** Best current streak across the user's activities. */
  streakDays: number;
  /** Number of proofs the user has logged today. */
  doneToday: number;
  isLoading: boolean;
  isRefetching: boolean;
  isError: boolean;
  refetch: () => Promise<void>;
}

/**
 * Real data behind the home header and "Today" banner.
 *
 * Shows activities scheduled for today (or already logged today), the user's
 * current streak, and how many proofs they have logged today.
 */
export function useHomeData(groups: Group[], userId?: string): HomeData {
  const groupIds = useMemo(() => groups.map((group) => group.id), [groups]);

  const activitiesQuery = useAllGroupActivities(groupIds);
  const submissionsQuery = useTodaySubmissions(groupIds, userId ?? '');
  const streaksQuery = useUserStreaks(userId ?? '');

  const todayItems = useMemo<TodayActivityItem[]>(() => {
    const activitiesByGroup = activitiesQuery.data ?? {};
    const submissionsByActivity = submissionsQuery.data ?? {};
    const streakByActivity = new Map(
      (streaksQuery.data ?? []).map((streak) => [streak.activityId, streak] as const)
    );

    const now = new Date();
    const todayKey = localDayKey(now);
    const weekday = now.getDay(); // 0 = Sunday, matching frequency_days

    const items: TodayActivityItem[] = [];

    for (const group of groups) {
      for (const activity of activitiesByGroup[group.id] ?? []) {
        if (activity.isArchived) continue;

        const submission = submissionsByActivity[activity.id] ?? null;
        const streak = streakByActivity.get(activity.id);
        const restToday = streak?.restDayDates?.includes(todayKey) ?? false;

        const dueToday =
          activity.frequency === 'daily' ||
          activity.frequency === 'x_per_week' ||
          (activity.frequency === 'specific_days' &&
            activity.frequencyDays.includes(weekday));

        if (!dueToday && !submission) continue;
        if (restToday && !submission) continue;

        items.push({
          activity,
          group,
          submission,
          streak: streak?.currentStreak ?? 0,
        });
      }
    }

    // Pending first: the banner should read as a to-do list, not a victory lap.
    items.sort(
      (a, b) => Number(Boolean(a.submission)) - Number(Boolean(b.submission))
    );

    return items;
  }, [groups, activitiesQuery.data, submissionsQuery.data, streaksQuery.data]);

  const streakDays = useMemo(
    () =>
      (streaksQuery.data ?? []).reduce(
        (best, streak) => Math.max(best, streak.currentStreak),
        0
      ),
    [streaksQuery.data]
  );

  const doneToday = submissionsQuery.data
    ? Object.keys(submissionsQuery.data).length
    : 0;

  const refetch = useCallback(async () => {
    await Promise.all([
      activitiesQuery.refetch(),
      submissionsQuery.refetch(),
      streaksQuery.refetch(),
    ]);
  }, [activitiesQuery.refetch, submissionsQuery.refetch, streaksQuery.refetch]);

  return {
    todayItems,
    streakDays,
    doneToday,
    isLoading:
      activitiesQuery.isLoading ||
      submissionsQuery.isLoading ||
      streaksQuery.isLoading,
    isRefetching:
      activitiesQuery.isRefetching ||
      submissionsQuery.isRefetching ||
      streaksQuery.isRefetching,
    isError: activitiesQuery.isError || submissionsQuery.isError,
    refetch,
  };
}
