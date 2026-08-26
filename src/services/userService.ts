import { supabase } from '@/services/supabase';
import { firebaseAuth } from '@/services/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import { AppError, isAppError } from '@/services/errors';
import { User } from '@/types';

/**
 * User service — profile provisioning & lookup against the Supabase `users`
 * table, keyed by the Firebase UID stored in the auth store.
 */

const LOG_PREFIX = '[userService]';

export interface EnsureUserProfile {
  username: string;
  displayName?: string;
  avatarUrl?: string | null;
}

// ─── Row Mapper (snake_case DB → camelCase app type) ─────────────────────────

function mapUserRow(row: Record<string, any>): User {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url ?? null,
    xp: row.xp ?? 0,
    level: row.level ?? 1,
    totalSubmissions: row.total_submissions ?? 0,
    longestStreak: row.longest_streak ?? 0,
    shieldsAvailable: row.shields_available ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function ensureCurrentUser(profile: EnsureUserProfile): Promise<User> {
  try {
    const storeUser = useAuthStore.getState().user;
    const uid = storeUser?.id ?? firebaseAuth.currentUser?.uid;
    if (!uid) throw new AppError('NOT_FOUND', 'No authenticated user');

    const email = storeUser?.email || firebaseAuth.currentUser?.email || '';

    const { data, error } = await supabase
      .from('users')
      .upsert(
        {
          id: uid,
          email,
          username: profile.username,
          display_name: profile.displayName || profile.username,
          avatar_url: profile.avatarUrl ?? null,
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) throw error;
    return mapUserRow(data);
  } catch (error) {
    console.error(`${LOG_PREFIX} ensureCurrentUser:`, error);
    throw isAppError(error) ? error : new AppError('NETWORK', 'Failed to save profile');
  }
}

export async function getUserById(id: string): Promise<User> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new AppError('NOT_FOUND', `User ${id} not found`);
    return mapUserRow(data);
  } catch (error) {
    console.error(`${LOG_PREFIX} getUserById:`, error);
    throw isAppError(error) ? error : new AppError('NETWORK', 'Failed to load user');
  }
}

export const userService = { ensureCurrentUser, getUserById };
