import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { storage } from '@/utils/storage';
import { mapUserRow } from '@/services/userService';
import { firstRow } from '@/services/rpc';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@/utils/notificationPreferences';

/**
 * useAuthSync - single source of truth for the Supabase session.
 *
 * Mounted once at the app root. Subscribes to supabase.auth.onAuthStateChange
 * and writes the session into the Zustand store. Also keeps the JWT in
 * SecureStore (via storage) in sync with the live session.
 *
 * CRITICAL invariant: only this hook writes `session` to the store. The
 * `useCurrentUser` hook writes the *user profile* (not the session). The
 * two are separate concerns:
 *   - session:       who is authenticated right now (auth layer)
 *   - profileStatus: whether that identity has a `public.users` row yet
 *
 * A session without a profile row is a normal state (first Google sign-in).
 * The root navigator keeps that user in SetupProfile instead of Main.
 *
 * Bonus: when the app comes back to the foreground, we re-validate the
 * session by calling getSession() - this catches token refresh + expiry
 * that would otherwise only show up on the next API call.
 */
export function useAuthSync(): void {
  const setSession = useAuthStore((s) => s.setSession);
  const setLoading = useAuthStore((s) => s.setLoading);

  // Guard against re-entrancy from rapid foreground events.
  const inflight = useRef(false);

  useEffect(() => {
    let mounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    const persist = async (accessToken: string | null) => {
      if (accessToken) {
        await storage.setItem('streakpact_jwt', accessToken);
      } else {
        await storage.removeItem('streakpact_jwt');
      }
    };

    const syncUser = async (session: any) => {
      if (!session?.user?.id) {
        useAuthStore.getState().setUser(null);
        return;
      }

      // Self-profile RPC: `users` no longer grants private columns such as
      // email / notification_preferences to the authenticated role.
      const { data, error } = await supabase.rpc('get_my_profile');

      if (error && (error.code === 'PGRST303' || /future/i.test(error.message))) {
        console.warn('[useAuthSync] Clock skew detected (PGRST303). Resetting session.');
        await supabase.auth.signOut();
        return;
      }

      if (error) {
        // The server could not answer, so we cannot tell a missing profile
        // from a transient failure. If a profile is already hydrated, keep it
        // (it is only stale, not wrong). Otherwise fall back to a session
        // identity — the pre-existing offline behaviour — rather than trapping
        // the user behind a setup screen they cannot submit.
        console.warn('[useAuthSync] Could not load profile, using session data:', error.message);
        const current = useAuthStore.getState();
        if (current.user?.id === session.user.id) return;
        if (mounted) useAuthStore.getState().setUser(sessionUser(session));
        return;
      }

      const profile = firstRow<Record<string, any>>(data);
      if (!mounted) return;

      // `null` here means the RPC succeeded with zero rows: the auth user
      // exists but has never created a profile. The gate routes them to setup.
      useAuthStore.getState().setUser(profile ? mapUserRow(profile) : null);
    };

    const refreshSession = async () => {
      if (inflight.current) return;
      inflight.current = true;
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(data.session);
        await persist(data.session?.access_token ?? null);
        await syncUser(data.session);
      } catch (err) {
        console.warn('[useAuthSync] getSession failed:', err);
      } finally {
        if (mounted) setLoading(false);
        inflight.current = false;
      }
    };

    const init = async () => {
      // 1) Initial session check
      await refreshSession();

      // 2) Subscribe to future changes (sign-in, sign-out, token refresh)
      const sub = supabase.auth.onAuthStateChange((_event, session) => {
        if (!mounted) return;
        setSession(session);

        // Supabase holds an internal auth lock while invoking this callback.
        // Deferring the profile request avoids a deadlock on that lock.
        setTimeout(() => {
          if (!mounted) return;
          void persist(session?.access_token ?? null);
          void syncUser(session);
        }, 0);
      });
      subscription = sub.data.subscription;
    };

    init();

    // 3) Re-validate on foreground (catches silent token expiry)
    const onAppStateChange = (state: AppStateStatus) => {
      if (state === 'active') refreshSession();
    };
    const appStateSub = AppState.addEventListener('change', onAppStateChange);

    return () => {
      mounted = false;
      subscription?.unsubscribe();
      appStateSub.remove();
    };
  }, [setSession, setLoading]);
}

/**
 * Identity used until the profile row can be read. Only reached when the
 * profile request itself failed; a successful "no rows" response goes through
 * `setUser(null)` and the SetupProfile gate instead.
 */
function sessionUser(session: any) {
  const email: string = session.user.email ?? '';
  const fallbackName = session.user.user_metadata?.display_name || email.split('@')[0] || 'User';
  return {
    id: session.user.id,
    email,
    username: session.user.user_metadata?.username || email.split('@')[0] || 'user',
    displayName: fallbackName,
    avatarUrl: session.user.user_metadata?.avatar_url ?? null,
    bio: null,
    xp: 0,
    level: 1,
    totalSubmissions: 0,
    longestStreak: 0,
    shieldsAvailable: 0,
    notificationPreferences: { ...DEFAULT_NOTIFICATION_PREFERENCES },
    createdAt: session.user.created_at || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
