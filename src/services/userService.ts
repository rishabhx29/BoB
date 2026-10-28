import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { AppError, isAppError } from '@/services/errors';
import { NotificationPreferences, User } from '@/types';
import { normalizeNotificationPreferences } from '@/utils/notificationPreferences';
import { firstRow, isRpcError } from '@/services/rpc';
import { PUBLIC_USER_COLUMNS } from '@/services/userColumns';

/**
 * User service — profile provisioning & lookup against the Supabase `users`
 * table, keyed by `auth.uid()` (the current Supabase session's user id).
 *
 * Security boundary (docs/sql/0005_security.sql):
 *   - public reads only expose PUBLIC_USER_COLUMNS
 *   - inserts / self reads go through SECURITY DEFINER RPCs
 *   - profile updates may only touch presentation columns
 */

const LOG_PREFIX = '[userService]';

export interface EnsureUserProfile {
  username: string;
  displayName?: string;
  avatarUrl?: string | null;
}

// ─── Row Mapper (snake_case DB → camelCase app type) ─────────────────────────

export function mapUserRow(row: Record<string, any>): User {
  return {
    id: row.id,
    // Email is private and only present on self-profile RPC results.
    email: row.email ?? '',
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url ?? null,
    bio: row.bio ?? null,
    xp: row.xp ?? 0,
    level: row.level ?? 1,
    totalSubmissions: row.total_submissions ?? 0,
    longestStreak: row.longest_streak ?? 0,
    shieldsAvailable: row.shields_available ?? 0,
    notificationPreferences: normalizeNotificationPreferences(row.notification_preferences),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getCurrentUserId(): string {
  const uid = useAuthStore.getState().session?.user?.id;
  if (!uid) throw new AppError('NOT_AUTHENTICATED', 'No active session');
  return uid;
}

function mapProfileError(error: { message?: string; code?: string }): never {
  if (error.code === '23505' || isRpcError(error as any, 'username_taken')) {
    throw new AppError('USERNAME_TAKEN', 'That username is already taken.');
  }
  if (isRpcError(error as any, 'username_invalid')) {
    throw new AppError('USERNAME_INVALID', 'That username is not valid.');
  }
  if (isRpcError(error as any, 'not_authenticated')) {
    throw new AppError('NOT_AUTHENTICATED', 'No active session');
  }
  console.error(`${LOG_PREFIX} profile RPC failed:`, error);
  throw new AppError('NETWORK', 'Failed to save profile');
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Create or update the authenticated user's profile row.
 * Called after sign-up, on profile setup, and any time profile fields change.
 *
 * `id`/`email` are derived from the JWT server-side — the client never sends
 * them, so a caller cannot create a profile for another account.
 */
export async function ensureCurrentUser(profile: EnsureUserProfile): Promise<User> {
  try {
    getCurrentUserId();

    const { data, error } = await supabase.rpc('ensure_user_profile', {
      p_username: profile.username,
      p_display_name: profile.displayName ?? null,
      p_avatar_url: profile.avatarUrl ?? null,
    });

    if (error) mapProfileError(error);

    const row = firstRow<Record<string, any>>(data);
    if (!row) {
      throw new AppError('NETWORK', 'Profile could not be saved');
    }
    return mapUserRow(row);
  } catch (error) {
    if (isAppError(error)) throw error;
    console.error(`${LOG_PREFIX} ensureCurrentUser:`, error);
    throw new AppError('NETWORK', 'Failed to save profile');
  }
}

/**
 * Fetch the current authenticated user's full profile (including private
 * fields such as email and notification preferences).
 * Returns null if the row doesn't exist yet.
 */
export async function fetchCurrentUser(): Promise<User | null> {
  try {
    getCurrentUserId();

    const { data, error } = await supabase.rpc('get_my_profile');
    if (error) throw error;

    const row = firstRow<Record<string, any>>(data);
    return row ? mapUserRow(row) : null;
  } catch (error) {
    if (isAppError(error)) throw error;
    console.error(`${LOG_PREFIX} fetchCurrentUser:`, error);
    throw new AppError('NETWORK', 'Failed to load user');
  }
}

/** Public profile lookup. Private columns are not granted to clients. */
export async function getUserById(id: string): Promise<User> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(PUBLIC_USER_COLUMNS)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new AppError('NOT_FOUND', `User ${id} not found`);
    return mapUserRow(data);
  } catch (error) {
    if (isAppError(error)) throw error;
    console.error(`${LOG_PREFIX} getUserById:`, error);
    throw new AppError('NETWORK', 'Failed to load user');
  }
}

/**
 * Check whether a username is available (case-insensitive, debounced caller-side).
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('is_username_available', {
      p_username: username,
    });

    if (error) throw error;
    return data === true;
  } catch (error) {
    if (isAppError(error)) throw error;
    console.error(`${LOG_PREFIX} isUsernameAvailable:`, error);
    throw new AppError('NETWORK', 'Username check failed');
  }
}

/**
 * Update the current user's presentation/profile fields.
 *
 * Only username, display_name, avatar_url, bio and notification_preferences
 * are writable from the client; the database enforces the same allow-list.
 */
export async function updateCurrentUserProfile(updates: Partial<{
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  notificationPreferences: NotificationPreferences;
}>): Promise<User> {
  try {
    const uid = getCurrentUserId();
    const payload: Record<string, any> = {};
    if (updates.username !== undefined) payload.username = updates.username;
    if (updates.displayName !== undefined) payload.display_name = updates.displayName;
    if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;
    if (updates.bio !== undefined) payload.bio = updates.bio;
    if (updates.notificationPreferences !== undefined) {
      payload.notification_preferences = updates.notificationPreferences;
    }

    if (Object.keys(payload).length > 0) {
      const { error } = await supabase
        .from('users')
        .update(payload)
        .eq('id', uid);

      if (error) {
        if (error.code === '23505') {
          throw new AppError('USERNAME_TAKEN', 'That username is already taken.');
        }
        throw error;
      }
    }

    // Read back through the self RPC: the direct SELECT intentionally cannot
    // see private fields such as email or notification preferences.
    const profile = await fetchCurrentUser();
    if (!profile) {
      throw new AppError('NOT_FOUND', 'Profile not found');
    }
    return profile;
  } catch (error) {
    if (isAppError(error)) throw error;
    console.error(`${LOG_PREFIX} updateCurrentUserProfile:`, error);
    throw new AppError('NETWORK', 'Failed to update profile');
  }
}

export const userService = {
  ensureCurrentUser,
  fetchCurrentUser,
  getUserById,
  isUsernameAvailable,
  updateCurrentUserProfile,
};
