import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { User } from '@/types';

/**
 * Auth store — single source of truth for the current user + session.
 *
 * Populated by the `useAuthSync` listener that watches
 * `supabase.auth.onAuthStateChange`. Screens should not call `setUser`
 * directly except at the end of profile creation.
 *
 * There are two independent facts:
 *   - `session`: the Supabase auth session. It exists as soon as someone
 *     signs in, including a brand-new Google/OAuth user who has no app
 *     profile yet.
 *   - `profileStatus`: whether a `public.users` row exists for that session.
 *
 * The root navigator needs both: a session alone must not open Main, because
 * every write (group membership, submissions) has a foreign key to
 * `public.users`. A session without a profile is sent to SetupProfile.
 */

export type ProfileStatus = 'unknown' | 'missing' | 'ready';

interface AuthState {
  user: User | null;
  session: Session | null;
  profileStatus: ProfileStatus;
  isLoading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  profileStatus: 'unknown',
  isLoading: true,

  setUser: (user) =>
    set((state) => ({
      user,
      // A fetched profile completes onboarding; a null user with a live
      // session means the profile row is genuinely absent.
      profileStatus: user ? 'ready' : state.session ? 'missing' : 'unknown',
      isLoading: false,
    })),

  setSession: (session) =>
    set((state) => {
      if (!session) {
        return {
          session: null,
          user: null,
          profileStatus: 'unknown' as ProfileStatus,
        };
      }

      // A token refresh for the same user keeps the hydrated profile. A new
      // user id invalidates it until the listener fetches the new row.
      const sameUser = state.session?.user?.id === session.user?.id;
      return {
        session,
        user: sameUser ? state.user : null,
        profileStatus: sameUser ? state.profileStatus : ('unknown' as ProfileStatus),
      };
    }),

  setLoading: (isLoading) => set({ isLoading }),

  logout: () =>
    set({
      user: null,
      session: null,
      profileStatus: 'unknown',
      isLoading: false,
    }),
}));
