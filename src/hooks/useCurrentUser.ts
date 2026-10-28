import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { STALE_TIMES, QUERY_KEYS } from '@/services/queryClient';
import { useAuthStore } from '@/store/useAuthStore';
import { AppError } from '@/services/errors';
import { NotificationPreferences, User } from '@/types';

/**
 * Hooks for the authenticated user's profile row (public.users).
 *
 * The session is the source of truth for "am I signed in?" (managed by
 * useAuthSync). The user profile is a separate concept — populated lazily
 * by these hooks. Screens that need the profile should call useCurrentUser
 * and read `data` directly, not poke the store.
 *
 * Hooks:
 *   - useCurrentUser()          — the current authenticated user's profile
 *   - useUpdateProfile()        — mutation to update name/username/avatar
 *   - useUsernameAvailability() — username uniqueness check (debounced)
 *   - fetchCurrentUserOnce()    — one-shot fetcher (Splash / post-signup)
 */

export function useCurrentUser() {
  const session = useAuthStore((s) => s.session);

  return useQuery({
    queryKey: [...QUERY_KEYS.currentUser, session?.user?.id ?? 'anon'] as const,
    queryFn: async (): Promise<User | null> => {
      if (!session?.user?.id) return null;
      return userService.fetchCurrentUser();
    },
    enabled: !!session?.user?.id,
    staleTime: STALE_TIMES.profile,
    // Don't retry on auth errors — there's no point retrying a "not signed in" error.
    retry: (count, err) => {
      if (err instanceof AppError && err.code === 'NOT_AUTHENTICATED') return false;
      return count < 2;
    },
  });
}

/** One-shot fetcher. Use in Splash / after sign-up before useCurrentUser's effect runs. */
export async function fetchCurrentUserOnce(): Promise<User | null> {
  return userService.fetchCurrentUser();
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.session?.user?.id);

  return useMutation({
    mutationFn: (
      updates: Partial<{
        username: string;
        displayName: string;
        avatarUrl: string | null;
        bio: string | null;
        notificationPreferences: NotificationPreferences;
      }>
    ) => userService.updateCurrentUserProfile(updates),
    onSuccess: (user) => {
      const key = [...QUERY_KEYS.currentUser, user.id] as const;
      queryClient.setQueryData(key, user);
      if (!userId) return;
      // Keep the auth store's copy in sync so headers/avatars update instantly.
      useAuthStore.getState().setUser(user);
    },
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.session?.user?.id);

  return useMutation({
    mutationFn: (preferences: NotificationPreferences) =>
      userService.updateCurrentUserProfile({ notificationPreferences: preferences }),
    onMutate: async (preferences) => {
      if (!userId) return {};
      const key = [...QUERY_KEYS.currentUser, userId] as const;
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<User | null>(key);
      if (previous) {
        queryClient.setQueryData(key, { ...previous, notificationPreferences: preferences });
      }
      return { previous, key };
    },
    onError: (_error, _preferences, context) => {
      if (context?.previous && context?.key) {
        queryClient.setQueryData(context.key, context.previous);
      }
    },
    onSuccess: (user) => {
      const key = [...QUERY_KEYS.currentUser, user.id] as const;
      queryClient.setQueryData(key, user);
      useAuthStore.getState().setUser(user);
    },
  });
}

/**
 * Username availability check. Internally debounced so callers don't have
 * to manage timers. After `debounceMs` of inactivity, the hook fires a
 * single query and caches the result. Returns null while debouncing or
 * while the query is loading.
 *
 * Pass `currentUsername` when editing an existing profile: keeping your own
 * username must not report "taken".
 */
export function useUsernameAvailability(
  username: string,
  debounceMs: number = 400,
  currentUsername?: string
) {
  const [debounced, setDebounced] = useState(username);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(username), debounceMs);
    return () => clearTimeout(handle);
  }, [username, debounceMs]);

  return useQuery({
    queryKey: ['username-available', debounced.toLowerCase()] as const,
    queryFn: async (): Promise<boolean> => {
      if (!debounced || debounced.length < 3) return false;
      if (
        currentUsername &&
        currentUsername.toLowerCase() === debounced.toLowerCase()
      ) {
        return true;
      }
      return userService.isUsernameAvailable(debounced);
    },
    enabled: debounced.length >= 3,
    staleTime: 30 * 1000,
  });
}
