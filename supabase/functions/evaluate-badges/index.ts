// supabase/functions/evaluate-badges/index.ts
// Evaluates badge conditions and persists newly earned badges.
//
// Callable two ways:
//   - User JWT: evaluates the caller only, returns the badges just unlocked.
//   - Service role: { userId } or { all: true } for scheduled/backfill runs.
//
// Response:
//   { ok, evaluated, totalAwarded, results: [{ userId, newlyAwarded[] }] }

import { getServiceClient } from '../_shared/supabase-client.ts';
import { evaluateBadgesForUser } from '../_shared/gamification.ts';
import { verifyUser, unauthorizedResponse } from '../_shared/verify-jwt.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { corsHeaders } from '../_shared/cors.ts';

const MAX_BATCH_USERS = 1000;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const authHeader = req.headers.get('Authorization') ?? '';
  const isService = Boolean(serviceKey) && authHeader === `Bearer ${serviceKey}`;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // An empty body is valid for self-evaluation.
  }

  const supabase = getServiceClient();
  let userIds: string[] = [];

  if (isService) {
    if (body?.all === true) {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .limit(MAX_BATCH_USERS);

      if (error) {
        return errorResponse('Failed to list users', 500, error);
      }
      userIds = ((data ?? []) as Array<{ id: string }>).map((row) => row.id);
    } else if (typeof body?.userId === 'string' && body.userId.trim()) {
      userIds = [body.userId.trim()];
    } else {
      return errorResponse('Provide userId or { all: true }', 400);
    }
  } else {
    const user = await verifyUser(req);
    if (!user) {
      return unauthorizedResponse();
    }
    userIds = [user.userId];
  }

  const results: Array<Record<string, unknown>> = [];
  let totalAwarded = 0;

  for (const userId of userIds) {
    try {
      const newlyAwarded = await evaluateBadgesForUser(supabase, userId);
      totalAwarded += newlyAwarded.length;
      results.push({ userId, newlyAwarded });
    } catch (err) {
      // One user's failure must not abort a batch.
      console.error(`[evaluate-badges] ${userId} failed:`, err);
      results.push({
        userId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return jsonResponse({
    ok: true,
    evaluated: userIds.length,
    totalAwarded,
    results,
  });
});
