import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { isRpcError } from './rpc';

/**
 * Push registration against the Expo Push API.
 *
 * Device tokens are written to `users.fcm_token` through `set_push_token`
 * (docs/sql/0006_push_tokens.sql) — the exact column and token shape that the
 * `send-push` edge function reads. This file owns everything the device side
 * needs: the EAS project id lookup, the permission prompt, the token RPC and a
 * tiny "already synced" cache so a token is only uploaded once per rotation.
 *
 * Notes:
 *   - Web never registers: Expo push is a native channel.
 *   - Registration requires `extra.eas.projectId` in app config. Without it the
 *     hook no-ops with a dev warning instead of throwing.
 *   - `expo-notifications` is loaded lazily: importing it statically executes
 *     the module in the web bundle too, where its module graph is not built for
 *     Metro web and crashes the whole app. On web the module is never required.
 */

const EXPO_TOKEN_PATTERN = /^Expo(nent)?PushToken\[[^\]]+\]$/;
const CACHE_KEY = 'streakpact:registered_push_token';

type NotificationsModule = typeof import('expo-notifications');

let cachedModule: NotificationsModule | null | undefined;

function notifications(): NotificationsModule | null {
  if (Platform.OS === 'web') return null;
  if (cachedModule !== undefined) return cachedModule;
  try {
    cachedModule = require('expo-notifications') as NotificationsModule;
  } catch (err) {
    console.warn('[push] expo-notifications failed to load:', err);
    cachedModule = null;
  }
  return cachedModule;
}

/** The EAS project id push tokens must be scoped to (Expo servers use it). */
export function getEasProjectId(): string | null {
  const raw = (Constants.expoConfig as any)?.extra?.eas?.projectId;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed ? trimmed : null;
}

/**
 * Foreground presentation: without a handler, notifications that arrive while
 * the app is open are silently dropped on both platforms. Keep OS parity.
 */
export function configureForegroundPresentation(): void {
  const module = notifications();
  if (!module) return;
  module.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * The deep link (`streakpact://…`) carried by a push's `data.link`, if the
 * payload has one. Every other field is ignored — tapping a push routes.
 */
function extractLink(response: { notification?: { request?: { content?: { data?: unknown } } } } | null | undefined): string | null {
  const data = response?.notification?.request?.content?.data as
    | { link?: unknown }
    | undefined;
  return typeof data?.link === 'string' && data.link ? data.link : null;
}

/** Cold launch from a push tap: link of the notification that started the app. */
export async function getLastPushResponseLink(): Promise<string | null> {
  const module = notifications();
  if (!module) return null;
  try {
    return extractLink(await module.getLastNotificationResponseAsync());
  } catch {
    return null;
  }
}

/**
 * Warm tap subscription while the app is running. Returns null on web, so
 * callers must treat that as "nothing to subscribe".
 */
export function subscribeToPushTaps(
  onLink: (link: string) => void
): { remove: () => void } | null {
  const module = notifications();
  if (!module) return null;
  const subscription = module.addNotificationResponseReceivedListener((response) => {
    const link = extractLink(response);
    if (link) onLink(link);
  });
  return { remove: () => subscription.remove() };
}

async function readCache(): Promise<{ userId: string; token: string } | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { userId?: unknown; token?: unknown };
    if (typeof parsed.userId !== 'string' || typeof parsed.token !== 'string') return null;
    return { userId: parsed.userId, token: parsed.token };
  } catch {
    return null;
  }
}

async function writeCache(cache: { userId: string; token: string }): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // A lost cache only means the token is sent again on the next launch.
  }
}

/**
 * Ask for notification permission (once), mint the Expo push token and store
 * it for the current user. Resolves null when registration is impossible or
 * declined — callers should treat that as "no push on this device", never as
 * an error.
 */
export async function registerPushToken(userId: string): Promise<string | null> {
  const module = notifications();
  if (!module || !userId) return null;

  const projectId = getEasProjectId();
  if (!projectId) {
    console.warn(
      '[push] extra.eas.projectId is not set in app config; ' +
        'device push stays disabled until an EAS project id is configured.'
    );
    return null;
  }

  const cached = await readCache();
  if (cached && cached.userId === userId) {
    return cached.token;
  }

  let granted = false;
  try {
    const settings = await module.getPermissionsAsync();
    granted =
      settings.granted ||
      settings.ios?.status === module.IosAuthorizationStatus.PROVISIONAL;
    if (!granted && settings.canAskAgain) {
      granted = (await module.requestPermissionsAsync()).granted;
    }
  } catch (err) {
    console.warn('[push] Permission check failed:', err);
    return null;
  }

  if (!granted) return null;

  let token: string;
  try {
    token = (await module.getExpoPushTokenAsync({ projectId })).data;
  } catch (err) {
    console.warn('[push] Token mint failed:', err);
    return null;
  }

  if (!EXPO_TOKEN_PATTERN.test(token)) {
    console.warn('[push] Unexpected token shape, not registering:', token);
    return null;
  }

  const { error } = await supabase.rpc('set_push_token', { p_token: token });
  if (error) {
    if (isRpcError(error, 'invalid_push_token')) {
      console.warn('[push] Server rejected the token format:', error.message);
      return null;
    }
    console.warn('[push] set_push_token failed:', error.message);
    // Leave the cache untouched so the next launch retries.
    return null;
  }

  await writeCache({ userId, token });
  return token;
}

/**
 * Sign-out path: clear the device token while the session is still valid, and
 * drop the local cache so a later sign-in registers fresh. Best-effort — a
 * failed RPC must never block sign-out.
 */
export async function clearStoredPushToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
  } catch {
    // Cache cleanup is cosmetic.
  }

  if (Platform.OS === 'web') return;

  try {
    await supabase.rpc('set_push_token', { p_token: null });
  } catch (err) {
    console.warn('[push] Token clear failed:', err);
  }
}
