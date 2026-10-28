import React, { useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import { useAuthStore } from '@/store/useAuthStore';
import { RootStackParamList } from '@/types';
import { navigateDeepLink } from '@/navigation/deepLinks';
import {
  configureForegroundPresentation,
  getLastPushResponseLink,
  subscribeToPushTaps,
  registerPushToken,
} from '@/services/pushService';

interface PushSyncProps {
  navigationRef: NavigationContainerRefWithCurrent<RootStackParamList>;
}

/**
 * Headless component that owns the native push side of notifications:
 *
 *   1. Foreground presentation (banners while the app is open).
 *   2. Token registration — mints the Expo push token and stores it via
 *      `set_push_token` once the auth gate reaches Main. Retried on foreground;
 *      the service's cache turns repeats into no-ops.
 *   3. Tap routing — a push payload carries `data: { link: 'streakpact://…' }`;
 *      tapping routes through the same deep-link resolver as in-app links.
 *      Links that arrive before the gate is ready are queued until Main mounts.
 *
 * Web is a no-op: Expo push is a native channel and the native module is never
 * loaded there (see `pushService`).
 */
export function PushSync({ navigationRef }: PushSyncProps): null {
  const session = useAuthStore((state) => state.session);
  const profileStatus = useAuthStore((state) => state.profileStatus);
  const isReady = session !== null && profileStatus === 'ready';

  const isReadyRef = useRef(isReady);
  isReadyRef.current = isReady;

  const registerInflight = useRef(false);
  const pendingLink = useRef<string | null>(null);

  useEffect(() => {
    configureForegroundPresentation();
  }, []);

  /** Route a link if the gate allows it; queue it while still resolving. */
  const routeLink = useCallback(
    (link: string | null) => {
      if (!link) return;
      if (!isReadyRef.current) {
        // Cold start from a push tap: the auth gate may still be resolving.
        pendingLink.current = link;
        return;
      }
      if (!navigationRef.isReady()) return;
      navigateDeepLink(navigationRef, link);
    },
    [navigationRef]
  );

  // ── Tap routing ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS === 'web') return;

    // Cold launched from a push tap.
    let cancelled = false;
    void getLastPushResponseLink().then((link) => {
      if (!cancelled) routeLink(link);
    });

    // Warm taps while the app is backgrounded or open.
    const subscription = subscribeToPushTaps((link) => routeLink(link));

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [routeLink]);

  // ── Queued links, replayed once the gate reaches Main ──────────────────────
  useEffect(() => {
    if (!isReady) return;
    const queued = pendingLink.current;
    if (!queued) return;
    pendingLink.current = null;
    routeLink(queued);
  }, [isReady, routeLink]);

  // ── Token registration ─────────────────────────────────────────────────────
  const syncRegistration = useCallback(async () => {
    if (registerInflight.current) return;
    if (!isReadyRef.current) return;
    const userId = useAuthStore.getState().session?.user?.id ?? '';
    if (!userId) return;

    registerInflight.current = true;
    try {
      await registerPushToken(userId);
    } finally {
      registerInflight.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;
    void syncRegistration();
  }, [isReady, syncRegistration]);

  // Retrying on foreground covers a boot that happened offline: registration
  // only runs while the profile is ready and the service dedupes repeats.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const onAppStateChange = (state: AppStateStatus) => {
      if (state === 'active' && isReadyRef.current) void syncRegistration();
    };
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, [syncRegistration]);

  return null;
}
