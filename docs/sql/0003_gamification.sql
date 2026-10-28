-- ─────────────────────────────────────────────────────────────────────────────
-- StreakPact — Phase 4: Gamification backend
-- Date: 2026-10-27
--
-- Run AFTER `schema.sql`, `0001_phase_1_5_fixes.sql` and `0002_social.sql`.
-- Idempotent: safe to run more than once.
--
-- Adds:
--   1. xp_events        — append-only XP ledger (idempotent awards)
--   2. award_user_xp()  — atomic XP grant, service-role only
--   3. users.level      — kept in sync from xp by trigger
--   4. users.longest_streak — kept in sync from streaks by trigger
--   5. user_badge_metrics() — one-round-trip metrics for badge evaluation
--   6. pg_cron schedules for evaluate-streaks and weekly-wrapup
--
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. XP LEDGER ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.xp_events (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount     INTEGER NOT NULL CHECK (amount BETWEEN -1000 AND 1000 AND amount <> 0),
  reason     TEXT NOT NULL,
  source_id  TEXT,                                  -- idempotency key (e.g. submission id)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, reason, source_id)
);

CREATE INDEX IF NOT EXISTS idx_xp_events_user
  ON public.xp_events(user_id, created_at DESC);

ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own xp events" ON public.xp_events;
CREATE POLICY "Users read own xp events" ON public.xp_events
  FOR SELECT USING (user_id = auth.uid()::text);

-- No INSERT/UPDATE/DELETE policies: only the service role (edge functions)
-- writes to the ledger.

-- ─── 2. ATOMIC XP AWARD (service role only) ──────────────────────────────────

CREATE OR REPLACE FUNCTION public.award_user_xp(
  p_user_id   TEXT,
  p_amount    INTEGER,
  p_reason    TEXT,
  p_source_id TEXT DEFAULT NULL
)
RETURNS TABLE (xp INTEGER, level INTEGER, awarded BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_inserted BOOLEAN := FALSE;
  v_xp       INTEGER;
  v_level    INTEGER;
BEGIN
  IF p_amount = 0 OR p_amount < -1000 OR p_amount > 1000 THEN
    RAISE EXCEPTION 'invalid_xp_amount';
  END IF;

  IF p_source_id IS NOT NULL THEN
    INSERT INTO public.xp_events(user_id, amount, reason, source_id)
    VALUES (p_user_id, p_amount, p_reason, p_source_id)
    ON CONFLICT (user_id, reason, source_id) DO NOTHING;
    v_inserted := FOUND;
  ELSE
    INSERT INTO public.xp_events(user_id, amount, reason, source_id)
    VALUES (p_user_id, p_amount, p_reason, NULL);
    v_inserted := TRUE;
  END IF;

  IF v_inserted THEN
    UPDATE public.users
       SET xp = GREATEST(0, users.xp + p_amount)
     WHERE id = p_user_id
    RETURNING users.xp, users.level INTO v_xp, v_level;

    IF v_xp IS NULL THEN
      RAISE EXCEPTION 'user_not_found';
    END IF;

    RETURN QUERY SELECT v_xp, v_level, TRUE;
  ELSE
    SELECT u.xp, u.level INTO v_xp, v_level
      FROM public.users u WHERE u.id = p_user_id;

    IF v_xp IS NULL THEN
      RAISE EXCEPTION 'user_not_found';
    END IF;

    RETURN QUERY SELECT v_xp, v_level, FALSE;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.award_user_xp(TEXT, INTEGER, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.award_user_xp(TEXT, INTEGER, TEXT, TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_user_xp(TEXT, INTEGER, TEXT, TEXT) TO service_role;

-- ─── 3. LEVEL SYNC ───────────────────────────────────────────────────────────
-- Levels are derived from XP. Keeping this in the database means every XP write
-- (client, edge function, SQL) leaves `users.level` correct.

CREATE OR REPLACE FUNCTION public.compute_user_level(p_xp INTEGER)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN COALESCE(p_xp, 0) >= 40000 THEN 7
    WHEN COALESCE(p_xp, 0) >= 20000 THEN 6
    WHEN COALESCE(p_xp, 0) >= 10000 THEN 5
    WHEN COALESCE(p_xp, 0) >= 5000  THEN 4
    WHEN COALESCE(p_xp, 0) >= 2500  THEN 3
    WHEN COALESCE(p_xp, 0) >= 1000  THEN 2
    ELSE 1
  END;
$$;

CREATE OR REPLACE FUNCTION public.sync_user_level()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.level := public.compute_user_level(NEW.xp);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_sync_level ON public.users;
CREATE TRIGGER users_sync_level
  BEFORE INSERT OR UPDATE OF xp ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_level();

-- Backfill any users whose stored level drifted from their XP.
UPDATE public.users SET level = public.compute_user_level(xp);

-- ─── 4. LONGEST STREAK SYNC ──────────────────────────────────────────────────
-- `users.longest_streak` powers profile stats and leaderboard tie-breaks.

CREATE OR REPLACE FUNCTION public.sync_user_longest_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
     SET longest_streak = GREATEST(longest_streak, COALESCE(NEW.longest_streak, 0))
   WHERE id = NEW.user_id
     AND longest_streak < COALESCE(NEW.longest_streak, 0);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS streaks_sync_user_longest ON public.streaks;
CREATE TRIGGER streaks_sync_user_longest
  AFTER INSERT OR UPDATE OF longest_streak ON public.streaks
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_longest_streak();

-- Backfill from existing streaks.
UPDATE public.users u
   SET longest_streak = s.best
  FROM (SELECT user_id, MAX(longest_streak) AS best FROM public.streaks GROUP BY user_id) s
 WHERE s.user_id = u.id
   AND s.best > u.longest_streak;

-- ─── 5. BADGE METRICS (service role only) ────────────────────────────────────

CREATE OR REPLACE FUNCTION public.user_badge_metrics(p_user_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_longest       INTEGER := 0;
  v_current       INTEGER := 0;
  v_comeback      INTEGER := 0;
  v_shields       INTEGER := 0;
  v_total_subs    INTEGER := 0;
  v_activity      JSONB := '{}'::JSONB;
  v_nudges        INTEGER := 0;
  v_admin_days    INTEGER := 0;
  v_comments      INTEGER := 0;
  v_early_days    INTEGER := 0;
  v_late_days     INTEGER := 0;
BEGIN
  SELECT COALESCE(MAX(longest_streak), 0),
         COALESCE(MAX(current_streak), 0),
         COALESCE(MAX(CASE WHEN current_streak >= 7 AND longest_streak > current_streak
                           THEN current_streak ELSE 0 END), 0),
         COALESCE(SUM(CARDINALITY(shield_used_dates)), 0)
    INTO v_longest, v_current, v_comeback, v_shields
    FROM public.streaks
   WHERE user_id = p_user_id;

  SELECT COALESCE(total_submissions, 0)
    INTO v_total_subs
    FROM public.users
   WHERE id = p_user_id;

  SELECT COALESCE(jsonb_object_agg(template_key, cnt), '{}'::JSONB)
    INTO v_activity
    FROM (
      SELECT a.template_key, COUNT(*)::INT AS cnt
        FROM public.submissions s
        JOIN public.activities a ON a.id = s.activity_id
       WHERE s.user_id = p_user_id
         AND a.template_key IS NOT NULL
       GROUP BY a.template_key
    ) t;

  SELECT COUNT(*)::INT INTO v_nudges
    FROM public.nudges
   WHERE sender_id = p_user_id AND was_converted = TRUE;

  SELECT COUNT(*)::INT INTO v_admin_days
    FROM public.group_members
   WHERE user_id = p_user_id
     AND role = 'admin'
     AND joined_at <= NOW() - INTERVAL '30 days';

  SELECT COUNT(DISTINCT submission_id)::INT INTO v_comments
    FROM public.comments
   WHERE user_id = p_user_id;

  SELECT COUNT(DISTINCT (client_timestamp AT TIME ZONE 'UTC')::DATE)::INT INTO v_early_days
    FROM public.submissions
   WHERE user_id = p_user_id
     AND EXTRACT(HOUR FROM client_timestamp AT TIME ZONE 'UTC') < 8;

  SELECT COUNT(DISTINCT (client_timestamp AT TIME ZONE 'UTC')::DATE)::INT INTO v_late_days
    FROM public.submissions
   WHERE user_id = p_user_id
     AND EXTRACT(HOUR FROM client_timestamp AT TIME ZONE 'UTC') >= 22;

  RETURN jsonb_build_object(
    'longestStreak',    v_longest,
    'currentStreak',    v_current,
    'comebackStreak',   v_comeback,
    'shieldsUsed',      v_shields,
    'totalSubmissions', v_total_subs,
    'activityCounts',   v_activity,
    'nudgeConversions', v_nudges,
    'adminDays',        v_admin_days,
    'comments',         v_comments,
    'earlyDays',        v_early_days,
    'lateDays',         v_late_days
  );
END;
$$;

REVOKE ALL ON FUNCTION public.user_badge_metrics(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_badge_metrics(TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.user_badge_metrics(TEXT) TO service_role;

-- ─── 6. CRON → EDGE FUNCTIONS ────────────────────────────────────────────────
-- Requires pg_cron + pg_net (both available on Supabase). Secrets are read from
-- Vault first, then from database settings:
--
--   SELECT vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
--   SELECT vault.create_secret('<service_role_key>', 'service_role_key');
--
-- or (SQL editor, no Vault):
--   ALTER DATABASE postgres SET app.settings.supabase_url = 'https://<ref>.supabase.co';
--   ALTER DATABASE postgres SET app.settings.service_role_key = '<service_role_key>';

CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.invoke_edge_function(p_function_name TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url TEXT;
  v_key TEXT;
BEGIN
  IF p_function_name !~ '^[a-z0-9-]+$' THEN
    RAISE EXCEPTION 'invalid_function_name';
  END IF;

  BEGIN
    SELECT decrypted_secret INTO v_url
      FROM vault.decrypted_secrets WHERE name = 'project_url' LIMIT 1;
    SELECT decrypted_secret INTO v_key
      FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1;
  EXCEPTION
    WHEN undefined_table OR invalid_schema_name THEN
      v_url := NULL;
      v_key := NULL;
  END;

  v_url := NULLIF(COALESCE(v_url, current_setting('app.settings.supabase_url', TRUE)), '');
  v_key := NULLIF(COALESCE(v_key, current_setting('app.settings.service_role_key', TRUE)), '');

  IF v_url IS NULL OR v_key IS NULL THEN
    RAISE EXCEPTION 'missing_edge_function_credentials';
  END IF;

  RETURN net.http_post(
    url := RTRIM(v_url, '/') || '/functions/v1/' || p_function_name,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := '{}'::JSONB,
    timeout_milliseconds := 30000
  );
END;
$$;

REVOKE ALL ON FUNCTION public.invoke_edge_function(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.invoke_edge_function(TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.invoke_edge_function(TEXT) TO service_role;

DO $$
BEGIN
  -- Drop any earlier schedules with the same or obsolete names.
  BEGIN PERFORM cron.unschedule('evaluate-streaks-daily'); EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN PERFORM cron.unschedule('weekly-wrapup-sunday'); EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN PERFORM cron.unschedule('streak-check-daily'); EXCEPTION WHEN OTHERS THEN NULL; END;

  -- 00:05 UTC daily — reset missed streaks, apply shields, award badges.
  PERFORM cron.schedule(
    'evaluate-streaks-daily',
    '5 0 * * *',
    $cron$ SELECT public.invoke_edge_function('evaluate-streaks'); $cron$
  );

  -- Sunday 19:00 UTC — weekly squad recap.
  PERFORM cron.schedule(
    'weekly-wrapup-sunday',
    '0 19 * * 0',
    $cron$ SELECT public.invoke_edge_function('weekly-wrapup'); $cron$
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'cron scheduling skipped: %', SQLERRM;
END $$;
