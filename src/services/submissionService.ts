import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { AppError } from './errors';
import {
  Submission,
  CreateSubmissionInput,
  UpdateSubmissionInput,
  Activity,
} from '@/types';
import { deleteSubmissionPhoto } from './storageService';
import { firstRow, isRpcError } from './rpc';
import { PUBLIC_USER_COLUMNS } from './userColumns';
import { mapUserRow } from './userService';

const LOG_PREFIX = '[submissionService]';

/**
 * Shared projection. `users(...)` is an explicit allow-list because the
 * database revokes SELECT on private columns (email, fcm_token, …).
 */
const SUBMISSION_SELECT = `
  *,
  user:users!submissions_user_id_fkey(${PUBLIC_USER_COLUMNS}),
  activity:activities!submissions_activity_id_fkey(*)
`;

// ─── Row Mappers ─────────────────────────────────────────────────────────────

export function mapSubmissionRow(row: Record<string, any>): Submission {
  return {
    id: row.id,
    userId: row.user_id,
    activityId: row.activity_id,
    groupId: row.group_id,
    photoUrl: row.photo_url ?? null,
    title: row.title ?? null,
    description: row.description ?? null,
    fieldValues: row.field_values ?? {},
    xpEarned: row.xp_earned ?? 0,
    clientTimestamp: row.client_timestamp,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    user: row.user ? mapUserRow(row.user) : undefined,
    activity: row.activity
      ? ({
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
        } satisfies Activity)
      : undefined,
  };
}

// ─── Current User Resolver ───────────────────────────────────────────────────

function requireCurrentUserId(): string {
  const storeUser = useAuthStore.getState().user;
  if (storeUser?.id) return storeUser.id;

  const sessionUserId = useAuthStore.getState().session?.user?.id;
  if (sessionUserId) return sessionUserId;

  throw new AppError('NOT_AUTHENTICATED', 'You must be logged in to perform this action');
}

// ─── Error Mapping (Postgres RPC tokens → AppError) ──────────────────────────

function mapCreateError(error: PostgrestError): never {
  if (isRpcError(error, 'duplicate_submission')) {
    throw new AppError(
      'DUPLICATE_SUBMISSION',
      'You have already logged a submission for this activity today.'
    );
  }
  if (isRpcError(error, 'not_authenticated')) {
    throw new AppError('NOT_AUTHENTICATED', 'You must be logged in to submit proof');
  }
  if (isRpcError(error, 'not_allowed')) {
    throw new AppError('NOT_ALLOWED', 'You are not a member of this pact');
  }
  if (
    isRpcError(error, 'invalid_timestamp') ||
    isRpcError(error, 'invalid_field_values') ||
    isRpcError(error, 'invalid_activity') ||
    isRpcError(error, 'invalid_photo_url') ||
    isRpcError(error, 'activity_not_found') ||
    isRpcError(error, 'activity_group_mismatch')
  ) {
    throw new AppError('VALIDATION', 'This proof could not be submitted. Please try again.');
  }

  console.error(`${LOG_PREFIX} createSubmission failed:`, error);
  throw new AppError('NETWORK', error.message);
}

// ─── Submission CRUD ─────────────────────────────────────────────────────────

/**
 * Creates a submission. XP, streak math and shield awards are all computed
 * inside the `create_submission` database function; the client sends only the
 * proof content plus its original timestamp and timezone offset.
 */
export async function createSubmission(input: CreateSubmissionInput): Promise<Submission> {
  requireCurrentUserId();

  const clientTimestamp = input.clientTimestamp || new Date().toISOString();
  // `getTimezoneOffset()` returns minutes behind UTC, so negate it to get the
  // offset used by the server's local-hour bonus calculation.
  const timezoneOffsetMinutes = -new Date(clientTimestamp).getTimezoneOffset();

  const { data, error } = await supabase.rpc('create_submission', {
    p_activity_id: input.activityId,
    p_group_id: input.groupId,
    p_photo_url: input.photoUrl ?? null,
    p_title: input.title ?? null,
    p_description: input.description ?? null,
    p_field_values: input.fieldValues ?? {},
    p_client_timestamp: clientTimestamp,
    p_timezone_offset_minutes: timezoneOffsetMinutes,
  });

  if (error) mapCreateError(error);

  const row = firstRow<Record<string, any>>(data);
  if (!row) {
    throw new AppError('NETWORK', 'Submission could not be created');
  }

  // Hydrate the embedded author/activity for callers that need a full object.
  // The row itself is enough for feeds, so a read failure is non-fatal.
  try {
    const hydrated = await getSubmissionById(row.id);
    if (hydrated) return hydrated;
  } catch (hydrateError) {
    console.warn(`${LOG_PREFIX} Could not hydrate new submission:`, hydrateError);
  }

  return mapSubmissionRow(row);
}

/**
 * Updates an existing submission (title, description, fieldValues only).
 * Enforces the 1-hour edit window rule client-side; the database enforces it
 * again in RLS and via column-level grants.
 */
export async function updateSubmission(
  submissionId: string,
  input: UpdateSubmissionInput
): Promise<Submission> {
  const userId = requireCurrentUserId();

  // 1. Fetch submission to verify ownership and the 1-hour window.
  const { data: existing, error: fetchErr } = await supabase
    .from('submissions')
    .select('id, user_id, group_id, created_at')
    .eq('id', submissionId)
    .single();

  if (fetchErr || !existing) {
    throw new AppError('NOT_FOUND', 'Submission not found');
  }

  if (existing.user_id !== userId) {
    throw new AppError('NOT_ALLOWED', 'You can only edit your own submissions');
  }

  const createdAtMs = new Date(existing.created_at).getTime();
  const oneHourMs = 60 * 60 * 1000;
  if (Date.now() - createdAtMs > oneHourMs) {
    throw new AppError(
      'NOT_ALLOWED',
      'Submissions can only be edited within 1 hour of posting'
    );
  }

  // 2. Perform update (only content columns are writable).
  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };
  if (input.title !== undefined) {
    updates.title = input.title ? input.title.trim().slice(0, 80) : null;
  }
  if (input.description !== undefined) {
    updates.description = input.description ? input.description.trim().slice(0, 500) : null;
  }
  if (input.fieldValues !== undefined) {
    updates.field_values = input.fieldValues;
  }

  const { data, error } = await supabase
    .from('submissions')
    .update(updates)
    .eq('id', submissionId)
    .select(SUBMISSION_SELECT)
    .single();

  if (error) {
    throw new AppError('NETWORK', error.message);
  }

  return mapSubmissionRow(data);
}

/**
 * Deletes a submission within 24 hours.
 *
 * The database function validates ownership/window, removes the row and
 * reverses XP atomically. Photo cleanup happens afterwards and is best-effort.
 */
export async function deleteSubmission(submissionId: string): Promise<void> {
  requireCurrentUserId();

  const { data, error } = await supabase.rpc('delete_submission', {
    p_submission_id: submissionId,
  });

  if (error) {
    if (isRpcError(error, 'not_found')) {
      throw new AppError('NOT_FOUND', 'Submission not found');
    }
    if (isRpcError(error, 'not_authenticated')) {
      throw new AppError('NOT_AUTHENTICATED', 'You must be logged in to delete a submission');
    }
    if (isRpcError(error, 'delete_window_expired') || isRpcError(error, 'not_allowed')) {
      throw new AppError(
        'NOT_ALLOWED',
        'Submissions can only be deleted within 24 hours of posting'
      );
    }
    console.error(`${LOG_PREFIX} deleteSubmission failed:`, error);
    throw new AppError('NETWORK', error.message);
  }

  const row = firstRow<Record<string, any>>(data);
  if (row?.photo_url) {
    deleteSubmissionPhoto(row.photo_url).catch((err) => {
      console.warn(`${LOG_PREFIX} Failed to delete storage photo:`, err);
    });
  }
}

// ─── Submission Reads ────────────────────────────────────────────────────────

/**
 * Fetch a user's submissions history across all groups.
 */
export async function fetchUserSubmissions(
  userId: string,
  limitCount: number = 50
): Promise<Submission[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select(SUBMISSION_SELECT)
    .eq('user_id', userId)
    .order('client_timestamp', { ascending: false })
    .limit(limitCount);

  if (error) throw new AppError('NETWORK', error.message);
  return ((data ?? []) as any[]).map(mapSubmissionRow);
}

/**
 * Fetch submissions for a specific activity in a group.
 */
export async function fetchActivitySubmissions(
  activityId: string,
  limitCount: number = 30
): Promise<Submission[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select(SUBMISSION_SELECT)
    .eq('activity_id', activityId)
    .order('client_timestamp', { ascending: false })
    .limit(limitCount);

  if (error) throw new AppError('NETWORK', error.message);
  return ((data ?? []) as any[]).map(mapSubmissionRow);
}

/**
 * Fetch a single submission by its ID.
 */
export async function getSubmissionById(submissionId: string): Promise<Submission | null> {
  const { data, error } = await supabase
    .from('submissions')
    .select(SUBMISSION_SELECT)
    .eq('id', submissionId)
    .maybeSingle();

  if (error) throw new AppError('NETWORK', error.message);
  return data ? mapSubmissionRow(data) : null;
}
