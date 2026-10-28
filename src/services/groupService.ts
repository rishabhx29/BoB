import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { AppError, isAppError } from '@/services/errors';
import { firstRow, isRpcError } from '@/services/rpc';
import { PUBLIC_USER_COLUMNS } from '@/services/userColumns';
import { mapUserRow } from '@/services/userService';
import {
  Activity,
  ActivitySeed,
  AddActivityInput,
  CreateGroupInput,
  Group,
  GroupMember,
  UpdateGroupInput,
} from '@/types';

/**
 * Group service — group CRUD, membership & activities against Supabase.
 * Real-time notification mirrors are written to the `notifications` table.
 */

const LOG_PREFIX = '[groupService]';
const GROUP_MEMBERS_SELECT = `*, group_members(*, user:users!group_members_user_id_fkey(${PUBLIC_USER_COLUMNS}))`;
const INVITE_CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no ambiguous chars
const INVITE_CODE_LENGTH = 6;
const MAX_INVITE_ATTEMPTS = 5;
export const MAX_GROUP_MEMBERS = 6;

// ─── Row Mappers (snake_case DB → camelCase app types) ───────────────────────

function mapGroupRow(row: Record<string, any>): Group {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    vibe: row.vibe ?? null,
    goalDescription: row.goal_description ?? null,
    inviteCode: row.invite_code,
    submissionWindowStart: row.submission_window_start,
    submissionWindowEnd: row.submission_window_end,
    groupStreakEnabled: row.group_streak_enabled,
    memberCount: row.member_count,
    adminId: row.admin_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? null,
  };
}

function mapMemberRow(row: Record<string, any>): GroupMember {
  return {
    groupId: row.group_id,
    userId: row.user_id,
    role: row.role,
    joinedAt: row.joined_at,
    user: row.user ? mapUserRow(row.user) : undefined,
  };
}

function mapActivityRow(row: Record<string, any>): Activity {
  return {
    id: row.id,
    groupId: row.group_id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    templateKey: row.template_key ?? null,
    frequency: row.frequency,
    frequencyDays: row.frequency_days ?? [],
    restDaysPerWeek: row.rest_days_per_week ?? 1,
    requirePhoto: row.require_photo ?? false,
    templateFields: row.template_fields ?? [],
    isArchived: row.is_archived ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── Error Handling ──────────────────────────────────────────────────────────

function handleServiceError(operation: string, error: unknown): never {
  if (isAppError(error)) {
    console.error(`${LOG_PREFIX} ${operation}: ${error.code} — ${error.message}`);
    throw error;
  }
  console.error(`${LOG_PREFIX} ${operation}:`, error);
  throw new AppError('NETWORK', `${operation} failed`);
}

// ─── Internals ───────────────────────────────────────────────────────────────

function getCurrentUserId(): string {
  const uid = useAuthStore.getState().session?.user?.id;
  if (!uid) throw new AppError('NOT_AUTHENTICATED', 'No authenticated user');
  return uid;
}

async function fetchLiveGroup(groupId: string): Promise<Group> {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new AppError('NOT_FOUND', 'Group not found');
  return mapGroupRow(data);
}

async function requireAdmin(userId: string, groupId: string): Promise<void> {
  const { data, error } = await supabase
    .from('group_members')
    .select('role')
    .match({ group_id: groupId, user_id: userId })
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new AppError('NOT_FOUND', 'Membership not found');
  if (data.role !== 'admin') throw new AppError('NOT_ADMIN', 'Admin role required');
}

async function insertActivities(
  groupId: string,
  userId: string,
  seeds: ActivitySeed[]
): Promise<void> {
  const rows = seeds.map((seed) => ({
    group_id: groupId,
    name: seed.name,
    icon: seed.icon,
    color: seed.color,
    frequency: seed.frequency,
    frequency_days: seed.frequencyDays,
    require_photo: seed.requirePhoto,
    template_key: seed.templateKey ?? null,
    template_fields: seed.templateFields ?? [],
    created_by: userId,
  }));
  const { error } = await supabase.from('activities').insert(rows);
  if (error) throw error;
}

// ─── Invite Codes ────────────────────────────────────────────────────────────

export function generateInviteCode(): string {
  let code = '';
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += INVITE_CHARSET[Math.floor(Math.random() * INVITE_CHARSET.length)];
  }
  return code;
}

function isUniqueViolation(error: PostgrestError | null): boolean {
  return error?.code === '23505';
}

export function normalizeInviteCode(rawCode: string): string {
  return rawCode.trim().toUpperCase();
}

// ─── Group Lifecycle ─────────────────────────────────────────────────────────

export async function createGroup(
  input: CreateGroupInput,
  selectedTemplates?: ActivitySeed[]
): Promise<Group> {
  try {
    getCurrentUserId();

    const { data, error } = await supabase.rpc('create_group', {
      p_name: input.name,
      p_emoji: input.emoji,
      p_vibe: input.vibe,
      p_goal_description: input.goalDescription,
    });

    if (error) {
      if (isRpcError(error, 'invalid_group_name') || isRpcError(error, 'invalid_vibe')) {
        throw new AppError('VALIDATION', 'That pact could not be created. Check the details.');
      }
      if (isRpcError(error, 'not_authenticated')) {
        throw new AppError('NOT_AUTHENTICATED', 'No authenticated user');
      }
      console.error(`${LOG_PREFIX} createGroup RPC failed:`, error);
      throw new AppError('NETWORK', 'Could not create pact');
    }

    const row = firstRow<Record<string, any>>(data);
    if (!row) {
      throw new AppError('NETWORK', 'Could not create pact');
    }

    const group = mapGroupRow(row);

    // The RPC creates the group + admin membership atomically. Activity seeds
    // are optional bulk inserts that require the admin role granted above.
    if (selectedTemplates && selectedTemplates.length > 0) {
      await insertActivities(group.id, group.adminId, selectedTemplates);
    }

    return group;
  } catch (error) {
    handleServiceError('createGroup', error);
  }
}

export async function joinGroupByCode(code: string): Promise<Group> {
  try {
    getCurrentUserId();

    const { data, error } = await supabase.rpc('join_group_by_code', {
      p_code: normalizeInviteCode(code),
    });

    if (error) {
      if (isRpcError(error, 'invalid_invite_code')) {
        throw new AppError('NOT_FOUND', 'Invalid invite code');
      }
      if (isRpcError(error, 'group_full')) {
        throw new AppError('GROUP_FULL', 'This pact is full');
      }
      if (isRpcError(error, 'already_member')) {
        throw new AppError('ALREADY_MEMBER', 'You already joined this pact');
      }
      if (isRpcError(error, 'not_authenticated')) {
        throw new AppError('NOT_AUTHENTICATED', 'No authenticated user');
      }
      console.error(`${LOG_PREFIX} joinGroupByCode RPC failed:`, error);
      throw new AppError('NETWORK', 'Could not join pact');
    }

    const row = firstRow<Record<string, any>>(data);
    if (!row) {
      throw new AppError('NETWORK', 'Could not join pact');
    }

    // The database trigger creates the admin's `new_group_member`
    // notification, so no client write is needed here.
    return mapGroupRow(row);
  } catch (error) {
    handleServiceError('joinGroupByCode', error);
  }
}

export async function leaveGroup(groupId: string): Promise<void> {
  try {
    const userId = getCurrentUserId();
    const group = await fetchLiveGroup(groupId);

    const { data: members, error } = await supabase
      .from('group_members')
      .select('user_id, role')
      .eq('group_id', groupId);
    if (error) throw error;

    const rows = (members ?? []) as Record<string, any>[];
    const mine = rows.find((m) => m.user_id === userId);
    if (!mine) throw new AppError('NOT_FOUND', 'You are not a member of this group');

    const adminCount = rows.filter((m) => m.role === 'admin').length;
    if (mine.role === 'admin' && adminCount === 1 && group.memberCount > 1) {
      throw new AppError('NOT_ALLOWED', 'Promote another admin before leaving');
    }

    const { error: deleteError } = await supabase
      .from('group_members')
      .delete()
      .match({ group_id: groupId, user_id: userId });
    if (deleteError) throw deleteError;

    // `group_members_sync_count` maintains groups.member_count server-side.
  } catch (error) {
    handleServiceError('leaveGroup', error);
  }
}

// ─── Group Reads ─────────────────────────────────────────────────────────────

export async function fetchUserGroups(): Promise<Group[]> {
  try {
    const userId = getCurrentUserId();
    const { data, error } = await supabase
      .from('group_members')
      .select('group:groups(*)')
      .eq('user_id', userId);
    if (error) throw error;

    return ((data ?? []) as Record<string, any>[])
      .filter((row) => row.group && !row.group.deleted_at)
      .map((row) => mapGroupRow(row.group))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (error) {
    handleServiceError('fetchUserGroups', error);
  }
}

export async function fetchGroupWithMembers(
  groupId: string
): Promise<{ group: Group; members: GroupMember[] }> {
  try {
    const { data, error } = await supabase
      .from('groups')
      .select(GROUP_MEMBERS_SELECT)
      .eq('id', groupId)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new AppError('NOT_FOUND', 'Group not found');

    // `select()` receives a runtime-built column list, so supabase-js cannot
    // infer its shape at the type level. The mapper validates the fields.
    const groupRow = data as unknown as Record<string, any>;
    const members = ((groupRow.group_members ?? []) as Record<string, any>[]).map(mapMemberRow);
    members.sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
    return { group: mapGroupRow(groupRow), members };
  } catch (error) {
    handleServiceError('fetchGroupWithMembers', error);
  }
}

// ─── Group Admin Operations ──────────────────────────────────────────────────

export async function updateGroup(groupId: string, updates: UpdateGroupInput): Promise<Group> {
  try {
    const userId = getCurrentUserId();
    await requireAdmin(userId, groupId);

    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.emoji !== undefined) payload.emoji = updates.emoji;
    if (updates.vibe !== undefined) payload.vibe = updates.vibe;
    if (updates.goalDescription !== undefined) payload.goal_description = updates.goalDescription;
    if (updates.submissionWindowStart !== undefined) {
      payload.submission_window_start = updates.submissionWindowStart;
    }
    if (updates.submissionWindowEnd !== undefined) {
      payload.submission_window_end = updates.submissionWindowEnd;
    }
    if (updates.groupStreakEnabled !== undefined) {
      payload.group_streak_enabled = updates.groupStreakEnabled;
    }

    const { data, error } = await supabase
      .from('groups')
      .update(payload)
      .eq('id', groupId)
      .select()
      .single();
    if (error) throw error;
    return mapGroupRow(data);
  } catch (error) {
    handleServiceError('updateGroup', error);
  }
}

export async function removeMember(groupId: string, userIdToRemove: string): Promise<void> {
  try {
    const userId = getCurrentUserId();
    await requireAdmin(userId, groupId);
    if (userIdToRemove === userId) {
      throw new AppError('NOT_ALLOWED', 'Use leaveGroup to remove yourself');
    }

    const { error: deleteError } = await supabase
      .from('group_members')
      .delete()
      .match({ group_id: groupId, user_id: userIdToRemove });
    if (deleteError) throw deleteError;

    // `group_members_sync_count` maintains groups.member_count server-side.
  } catch (error) {
    handleServiceError('removeMember', error);
  }
}

export async function regenerateInviteCode(groupId: string): Promise<string> {
  try {
    const userId = getCurrentUserId();
    await requireAdmin(userId, groupId);

    for (let attempt = 0; attempt < MAX_INVITE_ATTEMPTS; attempt++) {
      const inviteCode = generateInviteCode();
      const { data, error } = await supabase
        .from('groups')
        .update({ invite_code: inviteCode })
        .eq('id', groupId)
        .select('invite_code')
        .single();

      if (!error) return (data as Record<string, any>).invite_code as string;
      if (!isUniqueViolation(error)) throw error;
      // Collision — regenerate and retry
    }

    throw new AppError('NETWORK', 'Could not generate a unique invite code');
  } catch (error) {
    handleServiceError('regenerateInviteCode', error);
  }
}

export async function deleteGroup(groupId: string): Promise<void> {
  try {
    const userId = getCurrentUserId();
    await requireAdmin(userId, groupId);

    const { error } = await supabase
      .from('groups')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', groupId);
    if (error) throw error;
  } catch (error) {
    handleServiceError('deleteGroup', error);
  }
}

// ─── Activities ──────────────────────────────────────────────────────────────

export async function fetchGroupActivities(
  groupId: string,
  unarchivedOnly: boolean = true
): Promise<Activity[]> {
  try {
    let query = supabase.from('activities').select('*').eq('group_id', groupId);
    if (unarchivedOnly) query = query.eq('is_archived', false);

    const { data, error } = await query.order('created_at', { ascending: true });
    if (error) throw error;
    return ((data ?? []) as Record<string, any>[]).map(mapActivityRow);
  } catch (error) {
    handleServiceError('fetchGroupActivities', error);
  }
}

export async function addActivity(
  groupId: string,
  input: AddActivityInput
): Promise<Activity> {
  try {
    const userId = getCurrentUserId();
    const { data, error } = await supabase
      .from('activities')
      .insert({
        group_id: groupId,
        name: input.name,
        icon: input.icon,
        color: input.color,
        frequency: input.frequency ?? 'daily',
        frequency_days: input.frequencyDays ?? [0, 1, 2, 3, 4, 5, 6],
        require_photo: input.requirePhoto ?? false,
        template_key: input.templateKey ?? null,
        template_fields: input.templateFields ?? [],
        created_by: userId,
      })
      .select()
      .single();
    if (error) throw error;
    return mapActivityRow(data);
  } catch (error) {
    handleServiceError('addActivity', error);
  }
}

export async function archiveActivity(activityId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('activities')
      .update({ is_archived: true })
      .eq('id', activityId);
    if (error) throw error;
  } catch (error) {
    handleServiceError('archiveActivity', error);
  }
}

// ─── Group Streak ─────────────────────────────────────────────────────────────

/**
 * Compute the current group streak: the number of consecutive days
 * (ending today) on which every current member has at least one submission.
 *
 * Cheap client-side implementation. For groups with many members
 * and many submissions, a Postgres function would be faster; this is
 * fine up to ~50 members + a few hundred submissions.
 */
export async function getGroupStreak(groupId: string): Promise<number> {
  try {
    // Get current members
    const { data: members, error: mErr } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);
    if (mErr) throw mErr;
    const memberIds = (members ?? []).map((m: any) => m.user_id);
    if (memberIds.length === 0) return 0;

    // Pull the last 30 days of submissions for the group
    const since = new Date(Date.now() - 30 * 86400_000).toISOString();
    const { data: subs, error: sErr } = await supabase
      .from('submissions')
      .select('user_id, client_timestamp')
      .eq('group_id', groupId)
      .gte('client_timestamp', since);
    if (sErr) throw sErr;

    // Build a set: { userId → Set<YYYY-MM-DD> }
    const byUserDay = new Map<string, Set<string>>();
    for (const s of subs ?? []) {
      const day = (s.client_timestamp as string).slice(0, 10);
      if (!byUserDay.has(s.user_id)) byUserDay.set(s.user_id, new Set());
      byUserDay.get(s.user_id)!.add(day);
    }

    // Walk back from today, requiring every member to have submitted
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const day = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
      const allSubmitted = memberIds.every((uid) => byUserDay.get(uid)?.has(day));
      if (allSubmitted) streak++;
      else break;
    }
    return streak;
  } catch (error) {
    handleServiceError('getGroupStreak', error);
  }
}
