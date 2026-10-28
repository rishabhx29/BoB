// supabase/functions/evaluate-streaks/index.ts
// Scheduled daily maintenance function to evaluate streaks, consume shields,
// reset broken streaks, and evaluate badges for affected users.
//
// Invoked by pg_cron (see docs/sql/0003_gamification.sql) at 00:05 UTC.

import { getServiceClient } from '../_shared/supabase-client.ts';
import { evaluateBadgesForUser } from '../_shared/gamification.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // pg_cron calls this with the service-role key. Without this check any
  // anonymous caller could trigger a full streak/badge sweep.
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!serviceKey || authHeader !== `Bearer ${serviceKey}`) {
    return errorResponse('Service role required', 403);
  }

  try {
    const supabase = getServiceClient();
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

    // Fetch all active streaks (current_streak > 0)
    const { data: streaks, error: streaksError } = await supabase
      .from('streaks')
      .select('id, user_id, activity_id, current_streak, last_submission_date, shield_used_dates, rest_day_dates')
      .gt('current_streak', 0);

    if (streaksError) {
      return errorResponse('Failed to fetch streaks', 500, streaksError);
    }

    let evaluated = 0;
    let shieldsApplied = 0;
    let streaksReset = 0;

    const shieldUserIds = new Set<string>();
    const resetRows: Array<{
      user_id: string;
      type: string;
      title: string;
      body: string;
      deep_link: string;
      is_read: boolean;
    }> = [];

    for (const streak of (streaks ?? [])) {
      evaluated++;

      // If last submission was yesterday or today, the streak is healthy.
      if (
        streak.last_submission_date === yesterday ||
        (streak.last_submission_date && streak.last_submission_date > yesterday)
      ) {
        continue;
      }

      // If yesterday was declared as a rest day, the streak is protected.
      if (streak.rest_day_dates?.includes(yesterday)) {
        continue;
      }

      // Day was missed! Check shield eligibility.
      const { data: user } = await supabase
        .from('users')
        .select('shields_available')
        .eq('id', streak.user_id)
        .single();

      const shieldsAvailable = user?.shields_available ?? 0;
      const recentShieldUsed = (streak.shield_used_dates ?? []).some(
        (d: string) => d >= sevenDaysAgo
      );

      if (shieldsAvailable > 0 && !recentShieldUsed) {
        // Apply a streak shield.
        await supabase
          .from('users')
          .update({ shields_available: shieldsAvailable - 1 })
          .eq('id', streak.user_id);

        const updatedShieldDates = [...(streak.shield_used_dates ?? []), yesterday].sort();
        await supabase
          .from('streaks')
          .update({
            shield_used_dates: updatedShieldDates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', streak.id);

        shieldUserIds.add(streak.user_id);
        shieldsApplied++;
      } else {
        // Streak is broken.
        await supabase
          .from('streaks')
          .update({
            current_streak: 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', streak.id);

        resetRows.push({
          user_id: streak.user_id,
          type: 'streak_milestone',
          title: 'Your streak took a hit 💔',
          body: 'A missed day reset one of your streaks. Log proof today to start again.',
          deep_link: 'streakpact://home',
          is_read: false,
        });
        streaksReset++;
      }
    }

    // Notify reset users in one round trip (best effort).
    if (resetRows.length > 0) {
      const { error: notifyError } = await supabase.from('notifications').insert(resetRows);
      if (notifyError) {
        console.warn('[evaluate-streaks] Notification insert failed:', notifyError.message);
      }
    }

    // Shield usage can unlock Shield Bearer — evaluate only affected users.
    let badgesAwarded = 0;
    for (const userId of shieldUserIds) {
      try {
        const awarded = await evaluateBadgesForUser(supabase, userId);
        badgesAwarded += awarded.length;
      } catch (err) {
        console.warn(`[evaluate-streaks] Badge eval failed for ${userId}:`, err);
      }
    }

    return jsonResponse({
      ok: true,
      evaluatedDate: yesterday,
      totalEvaluated: evaluated,
      shieldsApplied,
      streaksReset,
      badgesAwarded,
    });
  } catch (err: any) {
    return errorResponse(err.message ?? 'Internal Server Error', 500);
  }
});
