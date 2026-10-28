import { supabase } from './supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { AppError } from './errors';
import { firstRow, isRpcError } from './rpc';
import { Streak, User, Activity } from '@/types';
import { StreakMember } from '@/components/ui/StreakSummaryBar';
import { DuelMember } from '@/components/ui/ComparativeView';

const LOG_PREFIX = '[streakService]';

export type CalendarDotStatus = 'submitted' | 'missed' | 'pending' | 'rest' | 'inactive';

export const CALENDAR_DOT_COLORS: Record<CalendarDotStatus, string> = {
  submitted: '#10B981', // Green
  missed: '#EF4444',    // Red
  pending: '#F59E0B',   // Orange / Amber
  rest: '#6B7280',      // Grey
  inactive: '#8B5CF6',  // Purple
};

function mapStreakRow(row: Record<string, any>): Streak {
  return {
    id: row.id,
    userId: row.user_id,
    activityId: row.activity_id,
    currentStreak: row.current_streak ?? 0,
    longestStreak: row.longest_streak ?? 0,
    lastSubmissionDate: row.last_submission_date ?? null,
    shieldUsedDates: row.shield_used_dates ?? [],
    restDayDates: row.rest_day_dates ?? [],
    updatedAt: row.updated_at,
  };
}

function requireCurrentUserId(): string {
  const storeUser = useAuthStore.getState().user;
  if (storeUser?.id) return storeUser.id;

  const sessionUserId = useAuthStore.getState().session?.user?.id;
  if (sessionUserId) return sessionUserId;

  throw new AppError('NOT_AUTHENTICATED', 'You must be logged in to perform this action');
}

// ─── 6.1 Streak Queries ──────────────────────────────────────────────────────

/**
 * Fetch all streaks for a given user.
 */
export async function fetchUserStreaks(userId: string): Promise<Streak[]> {
  const { data, error } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .order('current_streak', { ascending: false });

  if (error) {
    console.error(`${LOG_PREFIX} fetchUserStreaks error:`, error);
    throw new AppError('NETWORK', 'Failed to load streaks');
  }
  return ((data ?? []) as any[]).map(mapStreakRow);
}

/**
 * Fetch streak for a specific user and activity.
 */
export async function fetchStreak(userId: string, activityId: string): Promise<Streak | null> {
  const { data, error } = await supabase
    .from('streaks')
    .select('*')
    .match({ user_id: userId, activity_id: activityId })
    .maybeSingle();

  if (error) {
    console.error(`${LOG_PREFIX} fetchStreak error:`, error);
    throw new AppError('NETWORK', 'Failed to load streak');
  }
  return data ? mapStreakRow(data) : null;
}

// ─── 6.2 Rest Day System ─────────────────────────────────────────────────────

/**
 * Declare a rest day for today or a specific date.
 * Enforces:
 *   - No backdating (must be today or future)
 *   - Maximum 2 rest days per calendar week per activity
 */
export async function declareRestDay(
  activityId: string,
  targetDateStr?: string
): Promise<Streak> {
  requireCurrentUserId();

  const { data, error } = await supabase.rpc('declare_rest_day', {
    p_activity_id: activityId,
    p_target_date: targetDateStr ?? null,
  });

  if (error) {
    if (isRpcError(error, 'rest_day_backdated')) {
      throw new AppError('NOT_ALLOWED', 'Cannot backdate a rest day declaration.');
    }
    if (isRpcError(error, 'rest_day_limit')) {
      throw new AppError(
        'VALIDATION',
        'Maximum 2 rest days allowed per week for this activity.'
      );
    }
    if (isRpcError(error, 'not_authenticated')) {
      throw new AppError('NOT_AUTHENTICATED', 'You must be logged in to declare a rest day');
    }
    if (isRpcError(error, 'not_allowed')) {
      throw new AppError('NOT_ALLOWED', 'You are not a member of this pact');
    }
    if (isRpcError(error, 'activity_not_found')) {
      throw new AppError('NOT_FOUND', 'Activity not found');
    }
    console.error(`${LOG_PREFIX} declareRestDay failed:`, error);
    throw new AppError('NETWORK', error.message);
  }

  const row = firstRow<Record<string, any>>(data);
  if (!row) {
    throw new AppError('NETWORK', 'Failed to declare rest day');
  }
  return mapStreakRow(row);
}

// ─── 6.3 Streak Shield Logic ─────────────────────────────────────────────────

/**
 * Consumes a streak shield for a missed day.
 * Enforces:
 *   - User has available shields (> 0)
 *   - Maximum 1 shield per activity per week
 */
export async function consumeStreakShield(
  activityId: string,
  missedDateStr: string
): Promise<Streak> {
  requireCurrentUserId();

  const { data, error } = await supabase.rpc('consume_streak_shield', {
    p_activity_id: activityId,
    p_missed_date: missedDateStr,
  });

  if (error) {
    if (isRpcError(error, 'no_shields')) {
      throw new AppError('NOT_ALLOWED', 'No streak shields available to consume.');
    }
    if (isRpcError(error, 'shield_cooldown') || isRpcError(error, 'shield_already_used')) {
      throw new AppError(
        'NOT_ALLOWED',
        'Streak shields can only be used once per activity every 7 days.'
      );
    }
    if (isRpcError(error, 'not_authenticated')) {
      throw new AppError('NOT_AUTHENTICATED', 'You must be logged in to use a shield');
    }
    if (isRpcError(error, 'not_allowed')) {
      throw new AppError('NOT_ALLOWED', 'You are not a member of this pact');
    }
    if (isRpcError(error, 'invalid_date')) {
      throw new AppError('VALIDATION', 'That date cannot be shielded.');
    }
    if (isRpcError(error, 'activity_not_found')) {
      throw new AppError('NOT_FOUND', 'Activity not found');
    }
    if (isRpcError(error, 'user_not_found')) {
      throw new AppError('NOT_FOUND', 'User profile not found');
    }
    console.error(`${LOG_PREFIX} consumeStreakShield failed:`, error);
    throw new AppError('NETWORK', error.message);
  }

  const row = firstRow<Record<string, any>>(data);
  if (!row) {
    throw new AppError('NETWORK', 'Failed to consume streak shield');
  }
  return mapStreakRow(row);
}

// ─── 6.4 Calendar & Tracker Aggregation Queries ──────────────────────────────

export interface GroupCalendarDayStatus {
  date: string; // YYYY-MM-DD
  dots: string[]; // Color hexes
  memberStatuses: {
    userId: string;
    displayName: string;
    avatarUrl?: string | null;
    status: CalendarDotStatus;
    color: string;
    submissionId?: string;
  }[];
}

/**
 * Generates the full month grid data for all group members.
 * Supports multi-member dots with PRD-compliant color statuses.
 */
export async function fetchGroupMonthlyCalendar(
  groupId: string,
  year: number,
  month: number // 1-12
): Promise<Record<string, string[]>> {
  const padMonth = String(month).padStart(2, '0');
  const startDate = `${year}-${padMonth}-01`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const endDate = `${year}-${padMonth}-${String(daysInMonth).padStart(2, '0')}`;
  const today = new Date().toISOString().slice(0, 10);

  // 1. Fetch group members
  const { data: memberRows } = await supabase
    .from('group_members')
    .select('user_id, user:users(id, display_name, avatar_url)')
    .eq('group_id', groupId);

  const members = (memberRows ?? []).map((m: any) => ({
    userId: m.user_id,
    displayName: m.user?.display_name || 'Member',
    avatarUrl: m.user?.avatar_url,
  }));

  if (members.length === 0) return {};

  // 2. Fetch submissions for this group in date range
  const { data: submissions = [] } = await supabase
    .from('submissions')
    .select('id, user_id, activity_id, client_timestamp')
    .eq('group_id', groupId)
    .gte('client_timestamp', `${startDate}T00:00:00.000Z`)
    .lte('client_timestamp', `${endDate}T23:59:59.999Z`);

  // Map: dateStr -> Set of userIds who submitted
  const submittedMap = new Map<string, Set<string>>();
  for (const s of (submissions as any[])) {
    const d = s.client_timestamp ? s.client_timestamp.slice(0, 10) : null;
    if (!d) continue;
    if (!submittedMap.has(d)) submittedMap.set(d, new Set());
    submittedMap.get(d)!.add(s.user_id);
  }

  // 3. Fetch rest days from streaks for these members
  const memberIds = members.map((m) => m.userId);
  const { data: streaks = [] } = await supabase
    .from('streaks')
    .select('user_id, rest_day_dates, shield_used_dates')
    .in('user_id', memberIds);

  const restDaysMap = new Map<string, Set<string>>(); // date -> Set<userId>
  for (const str of (streaks as any[])) {
    for (const rd of (str.rest_day_dates || [])) {
      if (!restDaysMap.has(rd)) restDaysMap.set(rd, new Set());
      restDaysMap.get(rd)!.add(str.user_id);
    }
  }

  // 4. Build output mapping
  const result: Record<string, string[]> = {};

  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = `${year}-${padMonth}-${String(day).padStart(2, '0')}`;
    const dots: string[] = [];

    for (const member of members) {
      const hasSubmitted = submittedMap.get(dayStr)?.has(member.userId);
      const isRestDay = restDaysMap.get(dayStr)?.has(member.userId);

      if (hasSubmitted) {
        dots.push(CALENDAR_DOT_COLORS.submitted);
      } else if (isRestDay) {
        dots.push(CALENDAR_DOT_COLORS.rest);
      } else if (dayStr === today) {
        dots.push(CALENDAR_DOT_COLORS.pending);
      } else if (dayStr < today) {
        dots.push(CALENDAR_DOT_COLORS.missed);
      }
    }

    if (dots.length > 0) {
      result[dayStr] = dots;
    }
  }

  return result;
}

/**
 * Fetch member streaks for the StreakSummaryBar.
 */
export async function fetchGroupStreakMembers(groupId: string): Promise<StreakMember[]> {
  // 1. Fetch group members with user details
  const { data: memberRows } = await supabase
    .from('group_members')
    .select('user_id, user:users(id, display_name, avatar_url)')
    .eq('group_id', groupId);

  if (!memberRows || memberRows.length === 0) return [];

  const userIds = memberRows.map((m: any) => m.user_id);

  // 2. Fetch streaks for these users
  const { data: streakRows = [] } = await supabase
    .from('streaks')
    .select('user_id, current_streak')
    .in('user_id', userIds);

  // Map highest current streak per user
  const maxStreakByUser = new Map<string, number>();
  for (const s of (streakRows as any[])) {
    const cur = maxStreakByUser.get(s.user_id) ?? 0;
    if (s.current_streak > cur) {
      maxStreakByUser.set(s.user_id, s.current_streak);
    }
  }

  const members: StreakMember[] = memberRows.map((m: any) => {
    const streak = maxStreakByUser.get(m.user_id) ?? 0;
    let flameColor = '#F97316'; // Orange
    if (streak >= 30) flameColor = '#EF4444'; // Red
    else if (streak >= 14) flameColor = '#8B5CF6'; // Purple
    else if (streak >= 7) flameColor = '#3B82F6'; // Blue

    return {
      id: m.user_id,
      name: m.user?.display_name || 'Member',
      avatarUrl: m.user?.avatar_url,
      streak,
      flameColor,
    };
  });

  return members.sort((a, b) => b.streak - a.streak);
}

/**
 * Fetch comparative head-to-head duel data between two pact members.
 */
export async function fetchComparativeDuel(
  member1Id: string,
  member2Id: string,
  groupId?: string
): Promise<{ member1: DuelMember; member2: DuelMember; leadText: string }> {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Fetch users
  const { data: users } = await supabase
    .from('users')
    .select('id, display_name, avatar_url')
    .in('id', [member1Id, member2Id]);

  const userList = users ?? [];
  const u1 = userList.find((u: any) => u.id === member1Id);
  const u2 = userList.find((u: any) => u.id === member2Id);

  // Fetch streaks
  const streaks1 = await fetchUserStreaks(member1Id);
  const streaks2 = await fetchUserStreaks(member2Id);

  const best1 = streaks1[0]?.currentStreak ?? 0;
  const best2 = streaks2[0]?.currentStreak ?? 0;

  // Build calendar data for each member
  const now = new Date();
  const padMonth = String(currentMonth).padStart(2, '0');
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

  const { data: subs1 = [] } = await supabase
    .from('submissions')
    .select('client_timestamp')
    .eq('user_id', member1Id);

  const { data: subs2 = [] } = await supabase
    .from('submissions')
    .select('client_timestamp')
    .eq('user_id', member2Id);

  const cal1: Record<string, string[]> = {};
  for (const s of (subs1 as any[])) {
    const d = s.client_timestamp?.slice(0, 10);
    if (d) cal1[d] = ['#3B82F6']; // Blue
  }

  const cal2: Record<string, string[]> = {};
  for (const s of (subs2 as any[])) {
    const d = s.client_timestamp?.slice(0, 10);
    if (d) cal2[d] = ['#F59E0B']; // Orange
  }

  let leadText = 'Tied! 🏆';
  if (best1 > best2) {
    leadText = `Ahead by ${best1 - best2} ${best1 - best2 === 1 ? 'day' : 'days'} 🔥`;
  } else if (best2 > best1) {
    leadText = `Behind by ${best2 - best1} ${best2 - best1 === 1 ? 'day' : 'days'}`;
  }

  const member1: DuelMember = {
    id: member1Id,
    name: u1?.display_name || 'Member 1',
    avatarUrl: u1?.avatar_url,
    color: '#3B82F6',
    calendarData: cal1,
  };

  const member2: DuelMember = {
    id: member2Id,
    name: u2?.display_name || 'Member 2',
    avatarUrl: u2?.avatar_url,
    color: '#F59E0B',
    calendarData: cal2,
  };

  return { member1, member2, leadText };
}

/**
 * Fetch 365-day year overview heatmap data for a user.
 */
export async function fetchUserYearHeatmap(
  userId: string
): Promise<{ date: string; count: number }[]> {
  const oneYearAgo = new Date(Date.now() - 365 * 86400000).toISOString();

  const { data: submissions = [] } = await supabase
    .from('submissions')
    .select('client_timestamp')
    .eq('user_id', userId)
    .gte('client_timestamp', oneYearAgo);

  const countByDate = new Map<string, number>();
  for (const s of (submissions as any[])) {
    const dateStr = s.client_timestamp?.slice(0, 10);
    if (dateStr) {
      countByDate.set(dateStr, (countByDate.get(dateStr) ?? 0) + 1);
    }
  }

  const result: { date: string; count: number }[] = [];
  for (let i = 364; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    result.push({
      date: d,
      count: countByDate.get(d) ?? 0,
    });
  }

  return result;
}
