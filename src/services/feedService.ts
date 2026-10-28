import { supabase } from './supabase';
import { AppError } from './errors';
import { FeedItem } from '@/types';
import { mapUserRow } from './userService';
import { PUBLIC_USER_COLUMNS } from './userColumns';

const LOG_PREFIX = '[feedService]';

export interface FetchFeedParams {
  /** Groups the current user belongs to. The feed never leaves this scope. */
  groupIds: string[];
  limitCount?: number;
  offset?: number;
  /** When set, only this user's submissions are returned. */
  userId?: string;
}

export interface FeedPage {
  items: FeedItem[];
  hasMore: boolean;
}

/** Shared projection so a single card and a feed page never drift apart. */
const FEED_SELECT = `
  *,
  user:users!submissions_user_id_fkey(${PUBLIC_USER_COLUMNS}),
  activity:activities!submissions_activity_id_fkey(*),
  group:groups!submissions_group_id_fkey(id, name, emoji)
  reactions(user_id, emoji, created_at),
  comments(count)
`;

/**
 * Fetch one page of the aggregated feed for the user's pacts.
 *
 * Joins the author profile, group identity and activity, then adds the
 * author's current streak for each activity. Social rows are embedded in the
 * same query so a feed page is one round trip.
 */
export async function fetchAggregatedFeed({
  groupIds,
  limitCount = 20,
  offset = 0,
  userId,
}: FetchFeedParams): Promise<FeedPage> {
  if (groupIds.length === 0) {
    return { items: [], hasMore: false };
  }

  // Fetch one extra row so the caller knows whether another page exists.
  let query = supabase
    .from('submissions')
    .select(FEED_SELECT)
    .in('group_id', groupIds)
    .order('client_timestamp', { ascending: false })
    .order('id', { ascending: false })
    .range(offset, offset + limitCount);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data: rows, error } = await query;

  if (error) {
    console.error(`${LOG_PREFIX} Failed to load feed:`, error);
    throw new AppError('NETWORK', 'Failed to load the squad feed');
  }

  const fetched = (rows ?? []) as any[];
  const hasMore = fetched.length > limitCount;
  const pageRows = hasMore ? fetched.slice(0, limitCount) : fetched;

  if (pageRows.length === 0) {
    return { items: [], hasMore: false };
  }

  const streakMap = await fetchStreakMap(pageRows);
  return { items: mapFeedRows(pageRows, streakMap), hasMore };
}

/**
 * Fetch the same card shape for one submission. Used by notification deep
 * links (`streakpact://submission/<id>`) so the detail screen is identical to
 * the card the user saw in the feed.
 */
export async function fetchSubmissionFeedItem(submissionId: string): Promise<FeedItem | null> {
  const { data: row, error } = await supabase
    .from('submissions')
    .select(FEED_SELECT)
    .eq('id', submissionId)
    .maybeSingle();

  if (error) {
    console.error(`${LOG_PREFIX} Failed to load submission:`, error);
    throw new AppError('NETWORK', 'Failed to load proof');
  }

  if (!row) return null;

  const streakMap = await fetchStreakMap([row]);
  return mapFeedRows([row], streakMap)[0] ?? null;
}

async function fetchStreakMap(rows: any[]): Promise<Map<string, number>> {
  const userIds = Array.from(new Set(rows.map((row) => row.user_id)));
  const activityIds = Array.from(new Set(rows.map((row) => row.activity_id)));

  const { data: streakRows, error: streakError } = await supabase
    .from('streaks')
    .select('user_id, activity_id, current_streak')
    .in('user_id', userIds)
    .in('activity_id', activityIds);

  if (streakError) {
    // A missing streak row must not take down the whole feed.
    console.warn(`${LOG_PREFIX} Failed to load streaks:`, streakError);
  }

  const streakMap = new Map<string, number>();
  for (const streak of (streakRows ?? []) as any[]) {
    streakMap.set(`${streak.user_id}_${streak.activity_id}`, streak.current_streak ?? 0);
  }
  return streakMap;
}

function mapFeedRows(pageRows: any[], streakMap: Map<string, number>): FeedItem[] {
  return pageRows.map((row: any) => {
    const embeddedReactions = Array.isArray(row.reactions) ? row.reactions : [];

    return {
      id: row.id,
      userId: row.user_id,
      activityId: row.activity_id,
      groupId: row.group_id,
      groupName: row.group?.name || 'PACT',
      groupColor: row.activity?.color || '#3B82F6',
      photoUrl: row.photo_url ?? null,
      title:
        row.title ??
        (row.activity?.name ? `${row.activity.name} Session` : 'Streak Proof'),
      description: row.description ?? null,
      fieldValues: row.field_values ?? {},
      xpEarned: row.xp_earned ?? 0,
      clientTimestamp: row.client_timestamp,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      streakCount: streakMap.get(`${row.user_id}_${row.activity_id}`) ?? 0,
      initialReactions: embeddedReactions.map((reaction: any) => ({
        submissionId: row.id,
        userId: reaction.user_id,
        emoji: reaction.emoji,
        createdAt: reaction.created_at,
      })),
      commentCount: readEmbeddedCount(row.comments),
      user: row.user ? mapUserRow(row.user) : undefined,
      activity: row.activity
        ? {
            id: row.activity.id,
            groupId: row.activity.group_id,
            name: row.activity.name,
            icon: row.activity.icon,
            color: row.activity.color,
            templateKey: row.activity.template_key ?? null,
            frequency: row.activity.frequency,
            frequencyDays: row.activity.frequency_days ?? [],
            restDaysPerWeek: row.activity.rest_days_per_week ?? 0,
            requirePhoto: row.activity.require_photo ?? false,
            templateFields: row.activity.template_fields ?? [],
            isArchived: row.activity.is_archived ?? false,
            createdAt: row.activity.created_at,
            updatedAt: row.activity.updated_at,
          }
        : undefined,
    };
  });
}

/** PostgREST returns embedded counts as `[{ count: n }]` (or an object). */
function readEmbeddedCount(embedded: unknown): number {
  if (Array.isArray(embedded)) {
    return Number((embedded[0] as any)?.count ?? 0);
  }
  if (embedded && typeof embedded === 'object') {
    return Number((embedded as any).count ?? 0);
  }
  return 0;
}
