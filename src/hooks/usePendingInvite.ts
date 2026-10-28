import { useCallback, useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import { useAuthStore } from '@/store/useAuthStore';
import { RootStackParamList } from '@/types';
import {
  clearPendingInvite,
  extractInviteCode,
  readPendingInvite,
  rememberPendingInvite,
} from '@/navigation/pendingInvite';

/**
 * Carries an invite code across the auth gate.
 *
 * Two entry points:
 *   - cold start / hard reload: `Linking.getInitialURL()` is parsed and, if the
 *     user is not signed in, the code is parked until Main is reachable.
 *   - warm link while signed in: React Navigation routes it directly, so this
 *     hook only records links that arrive before the session is ready.
 *
 * Consumption runs a short delay after Main mounts so React Navigation gets
 * the first chance to apply the same URL. If `JoinGroup` is already on screen
 * the code is simply cleared.
 */
export function usePendingInvite(
  navigationRef: NavigationContainerRefWithCurrent<RootStackParamList>
) {
  const isReady = useAuthStore(
    (state) => state.session !== null && state.profileStatus === 'ready'
  );
  const isReadyRef = useRef(isReady);
  isReadyRef.current = isReady;
  const consumingRef = useRef(false);

  const consume = useCallback(async () => {
    if (consumingRef.current) return;
    if (!isReadyRef.current || !navigationRef.isReady()) return;

    consumingRef.current = true;
    try {
      const code = await readPendingInvite();
      if (!code) return;

      await clearPendingInvite();
      if (navigationRef.getCurrentRoute()?.name === 'JoinGroup') return;
      navigationRef.navigate('JoinGroup', { code });
    } finally {
      consumingRef.current = false;
    }
  }, [navigationRef]);

  useEffect(() => {
    let cancelled = false;

    const capture = async (url: string | null) => {
      const code = extractInviteCode(url);
      if (!code) return;
      await rememberPendingInvite(code);
      if (!cancelled) await consume();
    };

    void (async () => {
      try {
        await capture(await Linking.getInitialURL());
      } catch {
        // No initial URL is normal on a cold native start.
      }
    })();

    const subscription = Linking.addEventListener('url', ({ url }) => {
      // Once the gate is ready, React Navigation owns the route change; only
      // park the code while the screens are unavailable.
      if (isReadyRef.current) return;
      const code = extractInviteCode(url);
      if (code) void rememberPendingInvite(code);
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [consume]);

  useEffect(() => {
    if (!isReady) return;
    // Let the navigator settle (and let its own linking handler run) before
    // replaying a stored invite.
    const timer = setTimeout(() => void consume(), 300);
    return () => clearTimeout(timer);
  }, [isReady, consume]);

  return { handleReady: consume };
}
