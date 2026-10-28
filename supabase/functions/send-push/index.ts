// supabase/functions/send-push/index.ts
// Service-role endpoint that delivers an Expo push notification to pact members.
//
// Body: { userIds: string[], title: string, body: string, data?: Record<string, unknown>, type?: string }
//
// `type` (a NotificationType, e.g. "reaction_received") is matched against the
// recipient's `users.notification_preferences` so muted categories never ring.
// Tokens live in `users.fcm_token` (Expo push token) and invalid/missing tokens
// are skipped rather than failing the whole batch.

import { getServiceClient } from '../_shared/supabase-client.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { corsHeaders } from '../_shared/cors.ts';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_TOKEN_PATTERN = /^Expo(nent)?PushToken\[[^\]]+\]$/;
const MAX_RECIPIENTS = 100;
const CHUNK_SIZE = 100;

type NotificationPreferences = {
  pushEnabled?: boolean;
  streakReminders?: boolean;
  socialActivity?: boolean;
  nudges?: boolean;
  weeklyRecap?: boolean;
};

type PreferenceKey = Exclude<keyof NotificationPreferences, 'pushEnabled'>;

/**
 * Which preference toggle owns each notification type. Types without a
 * dedicated toggle follow only the master `pushEnabled` switch.
 */
function preferenceKeyForType(type: string): PreferenceKey | null {
  switch (type) {
    case 'daily_reminder':
    case 'streak_at_risk':
    case 'streak_broken':
    case 'streak_milestone':
    case 'badge_earned':
    case 'level_up':
    case 'shield_earned':
      return 'streakReminders';
    case 'teammate_submitted':
    case 'reaction_received':
    case 'comment_received':
    case 'new_group_member':
      return 'socialActivity';
    case 'nudge_received':
      return 'nudges';
    case 'weekly_wrapup':
      return 'weeklyRecap';
    default:
      return null;
  }
}

/** Missing/partial preferences default to "on" so older rows keep working. */
function allowsPush(raw: unknown, type: string): boolean {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return true;
  const preferences = raw as NotificationPreferences;
  if (preferences.pushEnabled === false) return false;
  const key = preferenceKeyForType(type);
  if (!key) return true;
  return preferences[key] !== false;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!serviceKey || authHeader !== `Bearer ${serviceKey}`) {
    return errorResponse('Service role required', 403);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const userIds: string[] = Array.isArray(body?.userIds)
    ? Array.from(
        new Set(
          body.userIds
            .filter((id: unknown): id is string => typeof id === 'string')
            .map((id: string) => id.trim())
            .filter(Boolean)
        )
      )
    : [];

  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const message = typeof body?.body === 'string' ? body.body.trim() : '';
  const data =
    body?.data && typeof body.data === 'object' && !Array.isArray(body.data)
      ? body.data
      : {};
  const notificationType =
    typeof body?.type === 'string'
      ? body.type
      : typeof (data as Record<string, unknown>).type === 'string'
        ? String((data as Record<string, unknown>).type)
        : '';

  if (userIds.length === 0 || userIds.length > MAX_RECIPIENTS) {
    return errorResponse(`Provide between 1 and ${MAX_RECIPIENTS} userIds`, 400);
  }
  if (!title || title.length > 120) {
    return errorResponse('title is required (max 120 chars)', 400);
  }
  if (!message || message.length > 500) {
    return errorResponse('body is required (max 500 chars)', 400);
  }

  const supabase = getServiceClient();
  const { data: users, error } = await supabase
    .from('users')
    .select('id, fcm_token, notification_preferences')
    .in('id', userIds)
    .not('fcm_token', 'is', null);

  if (error) {
    return errorResponse('Failed to look up push tokens', 500, error);
  }

  const tokens: string[] = [];
  let muted = 0;
  for (const user of (users ?? []) as Array<{
    id: string;
    fcm_token: string | null;
    notification_preferences: unknown;
  }>) {
    const token = user.fcm_token?.trim();
    if (!token || !EXPO_TOKEN_PATTERN.test(token)) continue;
    if (notificationType && !allowsPush(user.notification_preferences, notificationType)) {
      muted += 1;
      continue;
    }
    tokens.push(token);
  }

  const skipped = userIds.length - tokens.length;
  if (tokens.length === 0) {
    return jsonResponse({
      ok: true,
      requested: userIds.length,
      sent: 0,
      skipped,
      muted,
      tickets: [],
    });
  }

  const tickets: unknown[] = [];
  let sent = 0;

  for (let i = 0; i < tokens.length; i += CHUNK_SIZE) {
    const messages = tokens.slice(i, i + CHUNK_SIZE).map((token) => ({
      to: token,
      title,
      body: message,
      data,
      sound: 'default',
      priority: 'high',
    }));

    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        console.error('[send-push] Expo push failed:', response.status, payload);
        continue;
      }

      const batchTickets = Array.isArray(payload?.data) ? payload.data : [];
      tickets.push(...batchTickets);
      sent += batchTickets.filter((ticket: any) => ticket?.status === 'ok').length;
    } catch (err) {
      console.error('[send-push] Expo push request error:', err);
    }
  }

  return jsonResponse({
    ok: true,
    requested: userIds.length,
    sent,
    skipped,
    muted,
    tickets,
  });
});
