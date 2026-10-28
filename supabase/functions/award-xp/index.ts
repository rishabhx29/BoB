// supabase/functions/award-xp/index.ts
// Service-role endpoint for awarding (or deducting) XP atomically.
//
// Body (single):  { userId, amount, reason, sourceId? }
// Body (batch):   { awards: [{ userId, amount, reason, sourceId? }] }
//
// `sourceId` is an idempotency key: repeating the same
// (userId, reason, sourceId) is a no-op, which makes retries safe.
//
// This function is intentionally NOT callable with a user JWT — XP must be
// granted by trusted server logic, never by the client.

import { getServiceClient } from '../_shared/supabase-client.ts';
import { awardXp } from '../_shared/gamification.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { corsHeaders } from '../_shared/cors.ts';

const REASON_PATTERN = /^[a-z0-9_:-]{1,64}$/;

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

  const awards = Array.isArray(body?.awards) ? body.awards : [body];
  if (awards.length === 0 || awards.length > 100) {
    return errorResponse('Provide between 1 and 100 awards', 400);
  }

  const supabase = getServiceClient();
  const results: Array<Record<string, unknown>> = [];

  for (const award of awards) {
    const userId = typeof award?.userId === 'string' ? award.userId.trim() : '';
    const amount = Number(award?.amount);
    const reason = typeof award?.reason === 'string' ? award.reason.trim() : '';
    const sourceId =
      typeof award?.sourceId === 'string' && award.sourceId.length <= 128
        ? award.sourceId
        : null;

    if (!userId) {
      return errorResponse('userId is required', 400);
    }
    if (!Number.isInteger(amount) || amount === 0 || Math.abs(amount) > 1000) {
      return errorResponse('amount must be a non-zero integer within ±1000', 400);
    }
    if (!REASON_PATTERN.test(reason)) {
      return errorResponse('reason must be snake_case (a-z, 0-9, _, :, -), max 64 chars', 400);
    }

    try {
      const result = await awardXp(supabase, { userId, amount, reason, sourceId });
      results.push({ userId, reason, sourceId, ...result });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('user_not_found')) {
        return errorResponse(`User not found: ${userId}`, 404);
      }
      return errorResponse('Failed to award XP', 500, { userId, message });
    }
  }

  return jsonResponse({ ok: true, results });
});
