-- ─────────────────────────────────────────────────────────────────────────────
-- StreakPact — Phase 6: Security hardening
-- Date: 2026-10-27
--
-- Run AFTER `schema.sql`, `0001_phase_1_5_fixes.sql`, `0002_social.sql`,
-- `0003_gamification.sql` and `0004_notifications_profile.sql`.
-- Idempotent: safe to run more than once.
--
-- What it fixes:
--   1. users: public reads no longer expose email / fcm_token / timezone /
--      notification_preferences. Writes move behind SECURITY DEFINER RPCs.
--   2. groups: invite codes are no longer world-readable; creation and joins
--      are server-side; member_count is trigger-maintained.
--   3. group_members: clients can no longer self-insert with role='admin'.
--   4. streaks: clients can no longer write arbitrary streak rows/values.
--   5. submissions: XP, streaks and shields are computed server-side; delete
--      is an RPC that validates ownership and the 24-hour window.
--   6. notifications: clients can no longer spoof notifications; join/nudge
--      notifications are created by triggers.
--   7. nudges: the 4-hour cooldown is enforced in the database.
--   8. storage: submission photo owners can replace/delete their own objects.
--
-- Client code that must be deployed together with this migration:
--   • userService / useAuthSync     → get_my_profile, ensure_user_profile
--   • groupService                  → create_group, join_group_by_code
--   • submissionService             → create_submission, delete_submission
--   • streakService                 → declare_rest_day, consume_streak_shield
--   • all users(...) embeds         → explicit public-column projections
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. HARDENED AUTHORIZATION HELPERS ──────────────────────────────────────

-- Keep these SECURITY DEFINER (they are used inside RLS policies and must not
-- recurse through group_members RLS). Pinning search_path prevents a caller
-- from shadowing `group_members` with a malicious schema.
CREATE OR REPLACE FUNCTION public.is_group_member(gid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = gid AND user_id = auth.uid()::text
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.is_group_admin(gid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = gid AND user_id = auth.uid()::text AND role = 'admin'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = '';

REVOKE ALL ON FUNCTION public.is_group_member(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_group_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_group_member(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_admin(UUID) TO anon, authenticated;

-- ─── 2. USERS ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users are readable by group members" ON public.users;
DROP POLICY IF EXISTS "Users can only update themselves" ON public.users;
DROP POLICY IF EXISTS "Users can insert themselves" ON public.users;
DROP POLICY IF EXISTS "Public profiles are readable" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- Profile rows are readable by everyone, but column grants below hide private
-- fields (email, fcm_token, timezone, notification_preferences).
CREATE POLICY "Public profiles are readable" ON public.users
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE
  USING (id = auth.uid()::text)
  WITH CHECK (id = auth.uid()::text);

-- Reads: only public profile fields.
REVOKE ALL ON TABLE public.users FROM anon, authenticated;
GRANT SELECT (
  id, username, display_name, avatar_url, bio, xp, level,
  total_submissions, longest_streak, shields_available, created_at, updated_at
) ON TABLE public.users TO anon, authenticated;

-- Writes: users may edit only presentation/profile fields. XP, level, streak
-- stats, shields, email, fcm_token, timezone and notification_preferences are
-- server-owned. notification_preferences is deliberately included here
-- because the settings screen is its only editor.
GRANT UPDATE (
  username, display_name, avatar_url, bio, notification_preferences
) ON TABLE public.users TO authenticated;

-- No client INSERT: rows are created by ensure_user_profile().

CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS SETOF public.users
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT * FROM public.users WHERE id = auth.uid()::text;
$$;

CREATE OR REPLACE FUNCTION public.ensure_user_profile(
  p_username     TEXT,
  p_display_name TEXT DEFAULT NULL,
  p_avatar_url   TEXT DEFAULT NULL
)
RETURNS SETOF public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid      TEXT := auth.uid()::text;
  v_email    TEXT;
  v_username TEXT := btrim(COALESCE(p_username, ''));
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF v_username !~ '^[A-Za-z0-9_]{3,20}$' THEN
    RAISE EXCEPTION 'username_invalid';
  END IF;

  -- Email is never supplied by the client. Prefer the verified JWT claim;
  -- fall back to a deterministic internal address for providers without one.
  v_email := COALESCE(
    NULLIF(auth.jwt() ->> 'email', ''),
    v_username || '@users.streakpact.app'
  );

  BEGIN
    INSERT INTO public.users AS u (id, email, username, display_name, avatar_url)
    VALUES (
      v_uid,
      v_email,
      v_username,
      COALESCE(NULLIF(btrim(p_display_name), ''), v_username),
      NULLIF(btrim(p_avatar_url), '')
    )
    ON CONFLICT (id) DO UPDATE
      SET username     = EXCLUDED.username,
          display_name = COALESCE(NULLIF(btrim(p_display_name), ''), u.display_name),
          avatar_url   = COALESCE(NULLIF(btrim(p_avatar_url), ''), u.avatar_url);
  EXCEPTION
    WHEN unique_violation THEN
      RAISE EXCEPTION 'username_taken';
  END;

  RETURN QUERY SELECT * FROM public.users WHERE id = v_uid;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_username_available(p_username TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT NOT EXISTS (
    SELECT 1
      FROM public.users
     WHERE lower(username) = lower(btrim(COALESCE(p_username, '')))
       AND id <> COALESCE(auth.uid()::text, '')
  );
$$;

REVOKE ALL ON FUNCTION public.get_my_profile() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_my_profile() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

REVOKE ALL ON FUNCTION public.ensure_user_profile(TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ensure_user_profile(TEXT, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.ensure_user_profile(TEXT, TEXT, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.is_username_available(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_username_available(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_username_available(TEXT) TO authenticated;

-- ─── 3. GROUPS ──────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Groups visible to members" ON public.groups;
DROP POLICY IF EXISTS "Anyone can join via invite code" ON public.groups;
DROP POLICY IF EXISTS "Only admin can update group" ON public.groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
DROP POLICY IF EXISTS "Members can read their groups" ON public.groups;
DROP POLICY IF EXISTS "Admins can update their group" ON public.groups;

CREATE POLICY "Members can read their groups" ON public.groups
  FOR SELECT USING (is_group_member(id));

CREATE POLICY "Admins can update their group" ON public.groups
  FOR UPDATE
  USING (admin_id = auth.uid()::text AND is_group_admin(id))
  WITH CHECK (admin_id = auth.uid()::text AND is_group_admin(id));

REVOKE ALL ON TABLE public.groups FROM anon, authenticated;
GRANT SELECT (
  id, name, emoji, vibe, goal_description, invite_code,
  submission_window_start, submission_window_end, group_streak_enabled,
  require_photo_default, member_count, admin_id, deleted_at, created_at, updated_at
) ON TABLE public.groups TO authenticated;

-- member_count and admin_id are server-owned.
GRANT UPDATE (
  name, emoji, vibe, goal_description, submission_window_start,
  submission_window_end, group_streak_enabled, require_photo_default,
  invite_code, deleted_at
) ON TABLE public.groups TO authenticated;

-- No client INSERT: rows are created by create_group().

CREATE OR REPLACE FUNCTION public.create_group(
  p_name             TEXT,
  p_emoji            TEXT DEFAULT '⚡',
  p_vibe             TEXT DEFAULT NULL,
  p_goal_description TEXT DEFAULT NULL
)
RETURNS public.groups
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid     TEXT := auth.uid()::text;
  v_code    TEXT;
  v_group   public.groups;
  v_attempt INTEGER := 0;
  v_chars   TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_name IS NULL OR length(btrim(p_name)) = 0 OR length(btrim(p_name)) > 30 THEN
    RAISE EXCEPTION 'invalid_group_name';
  END IF;

  IF p_vibe IS NOT NULL AND p_vibe NOT IN ('hustle', 'study', 'gym', 'custom', 'relaxed') THEN
    RAISE EXCEPTION 'invalid_vibe';
  END IF;

  LOOP
    v_attempt := v_attempt + 1;
    v_code := '';

    FOR i IN 1..6 LOOP
      v_code := v_code || substr(
        v_chars,
        1 + floor(random() * length(v_chars))::int,
        1
      );
    END LOOP;

    BEGIN
      INSERT INTO public.groups (
        name, emoji, vibe, goal_description, invite_code, admin_id, member_count
      )
      VALUES (
        btrim(p_name),
        COALESCE(NULLIF(btrim(p_emoji), ''), '⚡'),
        p_vibe,
        left(NULLIF(btrim(p_goal_description), ''), 200),
        v_code,
        v_uid,
        1
      )
      RETURNING * INTO v_group;

      EXIT;
    EXCEPTION
      WHEN unique_violation THEN
        IF v_attempt >= 5 THEN
          RAISE EXCEPTION 'invite_code_generation_failed';
        END IF;
    END;
  END LOOP;

  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (v_group.id, v_uid, 'admin');

  -- Re-read so the trigger-maintained member_count is current.
  SELECT * INTO v_group FROM public.groups WHERE id = v_group.id;
  RETURN v_group;
END;
$$;

CREATE OR REPLACE FUNCTION public.join_group_by_code(p_code TEXT)
RETURNS public.groups
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid    TEXT := auth.uid()::text;
  v_group  public.groups;
  v_count  INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- FOR UPDATE serializes concurrent joins so the 6-member cap cannot race.
  SELECT * INTO v_group
    FROM public.groups
   WHERE invite_code = upper(btrim(COALESCE(p_code, '')))
     AND deleted_at IS NULL
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_invite_code';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.group_members
     WHERE group_id = v_group.id AND user_id = v_uid
  ) THEN
    RAISE EXCEPTION 'already_member';
  END IF;

  SELECT COUNT(*) INTO v_count
    FROM public.group_members
   WHERE group_id = v_group.id;

  IF v_count >= 6 THEN
    RAISE EXCEPTION 'group_full';
  END IF;

  BEGIN
    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (v_group.id, v_uid, 'member');
  EXCEPTION
    WHEN unique_violation THEN
      RAISE EXCEPTION 'already_member';
  END;

  SELECT * INTO v_group FROM public.groups WHERE id = v_group.id;
  RETURN v_group;
END;
$$;

REVOKE ALL ON FUNCTION public.create_group(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_group(TEXT, TEXT, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_group(TEXT, TEXT, TEXT, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.join_group_by_code(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.join_group_by_code(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.join_group_by_code(TEXT) TO authenticated;

-- ─── 4. GROUP MEMBERS + MEMBER COUNT ────────────────────────────────────────

DROP POLICY IF EXISTS "Members can see group_members" ON public.group_members;
DROP POLICY IF EXISTS "Users can add themselves" ON public.group_members;
DROP POLICY IF EXISTS "Admin can remove members" ON public.group_members;
DROP POLICY IF EXISTS "Members can read group_members" ON public.group_members;
DROP POLICY IF EXISTS "Admins can remove members" ON public.group_members;

CREATE POLICY "Members can read group_members" ON public.group_members
  FOR SELECT USING (is_group_member(group_id) OR user_id = auth.uid()::text);

CREATE POLICY "Admins can remove members" ON public.group_members
  FOR DELETE USING (is_group_admin(group_id) OR user_id = auth.uid()::text);

REVOKE ALL ON TABLE public.group_members FROM anon, authenticated;
GRANT SELECT (group_id, user_id, role, joined_at)
  ON TABLE public.group_members TO authenticated;
GRANT DELETE ON TABLE public.group_members TO authenticated;

-- No client INSERT: membership is created by create_group / join_group_by_code.

CREATE OR REPLACE FUNCTION public.sync_group_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_gid UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_gid := OLD.group_id;
  ELSE
    v_gid := NEW.group_id;
  END IF;

  UPDATE public.groups g
     SET member_count = (
       SELECT COUNT(*)::int
         FROM public.group_members gm
        WHERE gm.group_id = v_gid
     )
   WHERE g.id = v_gid;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_group_member_count() FROM PUBLIC;

DROP TRIGGER IF EXISTS group_members_sync_count ON public.group_members;
CREATE TRIGGER group_members_sync_count
  AFTER INSERT OR DELETE ON public.group_members
  FOR EACH ROW EXECUTE FUNCTION public.sync_group_member_count();

-- Repair any drift accumulated before the trigger existed. This must happen
-- before the constraint is replaced, otherwise a stale value above 6 would
-- make the ALTER TABLE fail.
UPDATE public.groups g
   SET member_count = (
     SELECT COUNT(*)::int FROM public.group_members gm WHERE gm.group_id = g.id
   );

-- A group can be emptied by its last member leaving.
ALTER TABLE public.groups DROP CONSTRAINT IF EXISTS groups_member_count_check;
ALTER TABLE public.groups
  ADD CONSTRAINT groups_member_count_check
  CHECK (member_count BETWEEN 0 AND 6);

-- ─── 5. STREAKS ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "System can manage streaks" ON public.streaks;

REVOKE ALL ON TABLE public.streaks FROM anon, authenticated;
GRANT SELECT (
  id, user_id, activity_id, current_streak, longest_streak,
  last_submission_date, shield_used_dates, rest_day_dates, updated_at
) ON TABLE public.streaks TO authenticated;

-- No client INSERT/UPDATE/DELETE: mutations go through the RPCs below or the
-- service role (edge functions).

CREATE OR REPLACE FUNCTION public.declare_rest_day(
  p_activity_id UUID,
  p_target_date DATE DEFAULT NULL
)
RETURNS public.streaks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid        TEXT := auth.uid()::text;
  v_date       DATE := COALESCE(p_target_date, (now() AT TIME ZONE 'UTC')::date);
  v_group      UUID;
  v_streak     public.streaks;
  v_week_start DATE;
  v_week_end   DATE;
  v_used       INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Accept the caller's local "today" even when UTC has already rolled over
  -- (a user in UTC-5 at 8pm has a UTC date one day ahead).
  IF v_date < (now() AT TIME ZONE 'UTC')::date - 1 THEN
    RAISE EXCEPTION 'rest_day_backdated';
  END IF;

  SELECT a.group_id INTO v_group FROM public.activities a WHERE a.id = p_activity_id;
  IF v_group IS NULL THEN
    RAISE EXCEPTION 'activity_not_found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.group_members
     WHERE group_id = v_group AND user_id = v_uid
  ) THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;

  v_week_start := date_trunc('week', v_date)::date;
  v_week_end := v_week_start + 6;

  SELECT * INTO v_streak
    FROM public.streaks
   WHERE user_id = v_uid AND activity_id = p_activity_id
   FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.streaks (user_id, activity_id)
    VALUES (v_uid, p_activity_id)
    RETURNING * INTO v_streak;
  END IF;

  IF v_date = ANY (COALESCE(v_streak.rest_day_dates, '{}')) THEN
    RETURN v_streak;
  END IF;

  SELECT COUNT(*) INTO v_used
    FROM unnest(COALESCE(v_streak.rest_day_dates, '{}')) AS d
   WHERE d BETWEEN v_week_start AND v_week_end;

  IF v_used >= 2 THEN
    RAISE EXCEPTION 'rest_day_limit';
  END IF;

  UPDATE public.streaks
     SET rest_day_dates = (
       SELECT array_agg(d ORDER BY d)
         FROM unnest(COALESCE(v_streak.rest_day_dates, '{}') || v_date) AS d
     )
   WHERE id = v_streak.id
   RETURNING * INTO v_streak;

  RETURN v_streak;
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_streak_shield(
  p_activity_id UUID,
  p_missed_date DATE
)
RETURNS public.streaks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid     TEXT := auth.uid()::text;
  v_group   UUID;
  v_shields INTEGER;
  v_streak  public.streaks;
  v_recent  INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_missed_date IS NULL
     OR p_missed_date > (now() AT TIME ZONE 'UTC')::date THEN
    RAISE EXCEPTION 'invalid_date';
  END IF;

  SELECT a.group_id INTO v_group FROM public.activities a WHERE a.id = p_activity_id;
  IF v_group IS NULL THEN
    RAISE EXCEPTION 'activity_not_found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.group_members
     WHERE group_id = v_group AND user_id = v_uid
  ) THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;

  SELECT shields_available INTO v_shields
    FROM public.users
   WHERE id = v_uid
   FOR UPDATE;

  IF v_shields IS NULL THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  IF v_shields <= 0 THEN
    RAISE EXCEPTION 'no_shields';
  END IF;

  SELECT * INTO v_streak
    FROM public.streaks
   WHERE user_id = v_uid AND activity_id = p_activity_id
   FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.streaks (user_id, activity_id)
    VALUES (v_uid, p_activity_id)
    RETURNING * INTO v_streak;
  END IF;

  IF p_missed_date = ANY (COALESCE(v_streak.shield_used_dates, '{}')) THEN
    RAISE EXCEPTION 'shield_already_used';
  END IF;

  SELECT COUNT(*) INTO v_recent
    FROM unnest(COALESCE(v_streak.shield_used_dates, '{}')) AS d
   WHERE d >= (now() AT TIME ZONE 'UTC')::date - 7;

  IF v_recent > 0 THEN
    RAISE EXCEPTION 'shield_cooldown';
  END IF;

  UPDATE public.users
     SET shields_available = shields_available - 1
   WHERE id = v_uid;

  UPDATE public.streaks
     SET shield_used_dates = (
       SELECT array_agg(d ORDER BY d)
         FROM unnest(COALESCE(v_streak.shield_used_dates, '{}') || p_missed_date) AS d
     )
   WHERE id = v_streak.id
   RETURNING * INTO v_streak;

  RETURN v_streak;
END;
$$;

REVOKE ALL ON FUNCTION public.declare_rest_day(UUID, DATE) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.declare_rest_day(UUID, DATE) FROM anon;
GRANT EXECUTE ON FUNCTION public.declare_rest_day(UUID, DATE) TO authenticated;

REVOKE ALL ON FUNCTION public.consume_streak_shield(UUID, DATE) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consume_streak_shield(UUID, DATE) FROM anon;
GRANT EXECUTE ON FUNCTION public.consume_streak_shield(UUID, DATE) TO authenticated;

-- ─── 6. SUBMISSIONS ─────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can create own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Users can update own submissions within 1 hour" ON public.submissions;
DROP POLICY IF EXISTS "Users can delete own submissions within 24 hours" ON public.submissions;

CREATE POLICY "Users can update own submissions within 1 hour" ON public.submissions
  FOR UPDATE
  USING (
    user_id = auth.uid()::text
    AND created_at > NOW() - INTERVAL '1 hour'
  )
  WITH CHECK (
    user_id = auth.uid()::text
    AND created_at > NOW() - INTERVAL '1 hour'
  );

REVOKE ALL ON TABLE public.submissions FROM anon, authenticated;
GRANT SELECT (
  id, user_id, activity_id, group_id, photo_url, title, description,
  field_values, xp_earned, client_timestamp, created_at, updated_at
) ON TABLE public.submissions TO authenticated;

-- Owners may edit only content fields. XP, ownership, timestamps and group
-- membership are immutable from the client.
GRANT UPDATE (title, description, field_values, updated_at)
  ON TABLE public.submissions TO authenticated;

-- No client INSERT/DELETE: use create_submission() / delete_submission().

CREATE OR REPLACE FUNCTION public.create_submission(
  p_activity_id            UUID,
  p_group_id               UUID,
  p_photo_url              TEXT DEFAULT NULL,
  p_title                  TEXT DEFAULT NULL,
  p_description            TEXT DEFAULT NULL,
  p_field_values           JSONB DEFAULT '{}'::jsonb,
  p_client_timestamp       TIMESTAMPTZ DEFAULT NULL,
  p_timezone_offset_minutes INTEGER DEFAULT 0
)
RETURNS public.submissions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid             TEXT := auth.uid()::text;
  v_ts              TIMESTAMPTZ := COALESCE(p_client_timestamp, now());
  v_date            DATE;
  v_hour            INTEGER;
  v_activity_group  UUID;
  v_streak          public.streaks;
  v_sub             public.submissions;
  v_new_streak      INTEGER;
  v_new_longest     INTEGER;
  v_last_date       DATE;
  v_shield_dates    DATE[] := '{}';
  v_rest_dates      DATE[] := '{}';
  v_xp              INTEGER := 50;
  v_multiplier      NUMERIC := 1.0;
  v_offset          INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_activity_id IS NULL OR p_group_id IS NULL THEN
    RAISE EXCEPTION 'invalid_activity';
  END IF;

  IF v_ts > now() + INTERVAL '5 minutes'
     OR v_ts < now() - INTERVAL '30 days' THEN
    RAISE EXCEPTION 'invalid_timestamp';
  END IF;

  v_offset := COALESCE(p_timezone_offset_minutes, 0);
  IF v_offset < -840 OR v_offset > 840 THEN
    v_offset := 0;
  END IF;

  IF p_field_values IS NOT NULL AND jsonb_typeof(p_field_values) <> 'object' THEN
    RAISE EXCEPTION 'invalid_field_values';
  END IF;

  IF p_field_values IS NOT NULL
     AND octet_length(p_field_values::text) > 10000 THEN
    RAISE EXCEPTION 'invalid_field_values';
  END IF;

  SELECT a.group_id INTO v_activity_group
    FROM public.activities a
   WHERE a.id = p_activity_id;

  IF v_activity_group IS NULL THEN
    RAISE EXCEPTION 'activity_not_found';
  END IF;

  IF v_activity_group <> p_group_id THEN
    RAISE EXCEPTION 'activity_group_mismatch';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.group_members
     WHERE group_id = p_group_id AND user_id = v_uid
  ) THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;

  v_date := (v_ts AT TIME ZONE 'UTC')::date;
  v_hour := EXTRACT(
    HOUR FROM (v_ts AT TIME ZONE 'UTC') + make_interval(mins => v_offset)
  )::int;

  -- Lock the streak row so two concurrent proofs serialize their math.
  SELECT * INTO v_streak
    FROM public.streaks
   WHERE user_id = v_uid AND activity_id = p_activity_id
   FOR UPDATE;

  IF FOUND THEN
    v_last_date := v_streak.last_submission_date;
    v_shield_dates := COALESCE(v_streak.shield_used_dates, '{}');
    v_rest_dates := COALESCE(v_streak.rest_day_dates, '{}');
  END IF;

  IF NOT FOUND THEN
    v_new_streak := 1;
    v_new_longest := 1;
    v_last_date := v_date;
  ELSE
    IF v_streak.last_submission_date IS NULL THEN
      v_new_streak := 1;
    ELSIF v_date = v_streak.last_submission_date THEN
      v_new_streak := v_streak.current_streak;
    ELSIF v_date < v_streak.last_submission_date THEN
      -- A backdated proof must not break (or inflate) the live streak.
      v_new_streak := v_streak.current_streak;
    ELSE
      -- Continue the streak only when every day between the last proof and
      -- this one was declared a rest day or covered by a shield.
      IF NOT EXISTS (
        SELECT 1
          FROM generate_series(
                 v_streak.last_submission_date + 1,
                 v_date - 1,
                 INTERVAL '1 day'
               ) AS gap(day)
         WHERE gap.day::date <> ALL (v_rest_dates)
           AND gap.day::date <> ALL (v_shield_dates)
      ) THEN
        v_new_streak := v_streak.current_streak + 1;
      ELSE
        v_new_streak := 1;
      END IF;
    END IF;

    v_new_longest := GREATEST(v_new_streak, COALESCE(v_streak.longest_streak, 0));

    -- Never move the streak's anchor backwards for a backdated proof.
    IF v_streak.last_submission_date IS NULL
       OR v_date > v_streak.last_submission_date THEN
      v_last_date := v_date;
    END IF;
  END IF;

  -- XP mirrors the historical client formula, now computed server-side.
  -- Proof photos must live in this user's folder in the public bucket, so a
  -- caller cannot claim the photo bonus with an arbitrary URL.
  IF p_photo_url IS NOT NULL AND length(btrim(p_photo_url)) > 0 THEN
    IF length(p_photo_url) > 2048
       OR p_photo_url NOT LIKE '%/submission-photos/' || v_uid || '/%' THEN
      RAISE EXCEPTION 'invalid_photo_url';
    END IF;
    v_xp := v_xp + 20;
  END IF;

  IF (p_title IS NOT NULL AND length(btrim(p_title)) > 0)
     OR (p_description IS NOT NULL AND length(btrim(p_description)) > 0) THEN
    v_xp := v_xp + 10;
  END IF;

  IF v_hour < 12 THEN
    v_xp := v_xp + 15;
  ELSIF v_hour >= 22 THEN
    v_xp := v_xp + 5;
  END IF;

  IF COALESCE(v_streak.current_streak, 0) >= 30 THEN
    v_multiplier := 2.0;
  ELSIF COALESCE(v_streak.current_streak, 0) >= 14 THEN
    v_multiplier := 1.5;
  ELSIF COALESCE(v_streak.current_streak, 0) >= 7 THEN
    v_multiplier := 1.2;
  END IF;

  v_xp := round(v_xp * v_multiplier)::int;

  BEGIN
    INSERT INTO public.submissions (
      user_id, activity_id, group_id, photo_url, title, description,
      field_values, xp_earned, client_timestamp
    )
    VALUES (
      v_uid,
      p_activity_id,
      p_group_id,
      NULLIF(btrim(p_photo_url), ''),
      left(NULLIF(btrim(p_title), ''), 80),
      left(NULLIF(btrim(p_description), ''), 500),
      COALESCE(p_field_values, '{}'::jsonb),
      v_xp,
      v_ts
    )
    RETURNING * INTO v_sub;
  EXCEPTION
    WHEN unique_violation THEN
      RAISE EXCEPTION 'duplicate_submission';
  END;

  INSERT INTO public.streaks (
    user_id, activity_id, current_streak, longest_streak,
    last_submission_date, shield_used_dates, rest_day_dates
  )
  VALUES (
    v_uid,
    p_activity_id,
    v_new_streak,
    v_new_longest,
    v_last_date,
    v_shield_dates,
    v_rest_dates
  )
  ON CONFLICT (user_id, activity_id) DO UPDATE
    SET current_streak     = EXCLUDED.current_streak,
        longest_streak     = EXCLUDED.longest_streak,
        last_submission_date = EXCLUDED.last_submission_date,
        updated_at         = now();

  -- One shield per completed 7-day milestone, capped at 3.
  IF v_new_streak > 0
     AND v_new_streak % 7 = 0
     AND (
       v_streak.last_submission_date IS NULL
       OR v_date > v_streak.last_submission_date
     ) THEN
    UPDATE public.users
       SET shields_available = LEAST(3, shields_available + 1)
     WHERE id = v_uid;
  END IF;

  UPDATE public.users
     SET xp = GREATEST(0, xp + v_xp),
         total_submissions = total_submissions + 1
   WHERE id = v_uid;

  RETURN v_sub;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_submission(p_submission_id UUID)
RETURNS public.submissions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid TEXT := auth.uid()::text;
  v_sub public.submissions;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT * INTO v_sub
    FROM public.submissions
   WHERE id = p_submission_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found';
  END IF;

  IF v_sub.user_id <> v_uid THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;

  IF v_sub.created_at <= now() - INTERVAL '24 hours' THEN
    RAISE EXCEPTION 'delete_window_expired';
  END IF;

  DELETE FROM public.submissions WHERE id = p_submission_id;

  UPDATE public.users
     SET xp = GREATEST(0, xp - v_sub.xp_earned),
         total_submissions = GREATEST(0, total_submissions - 1)
   WHERE id = v_uid;

  RETURN v_sub;
END;
$$;

REVOKE ALL ON FUNCTION public.create_submission(UUID, UUID, TEXT, TEXT, TEXT, JSONB, TIMESTAMPTZ, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_submission(UUID, UUID, TEXT, TEXT, TEXT, JSONB, TIMESTAMPTZ, INTEGER) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_submission(UUID, UUID, TEXT, TEXT, TEXT, JSONB, TIMESTAMPTZ, INTEGER) TO authenticated;

REVOKE ALL ON FUNCTION public.delete_submission(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_submission(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_submission(UUID) TO authenticated;

-- ─── 7. NOTIFICATIONS ───────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Members can notify co-members" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;

CREATE POLICY "Users can delete their own notifications" ON public.notifications
  FOR DELETE USING (user_id = auth.uid()::text);

REVOKE ALL ON TABLE public.notifications FROM anon, authenticated;
GRANT SELECT (id, user_id, type, title, body, deep_link, is_read, created_at)
  ON TABLE public.notifications TO authenticated;
GRANT UPDATE (is_read) ON TABLE public.notifications TO authenticated;
GRANT DELETE ON TABLE public.notifications TO authenticated;

-- No client INSERT: server triggers (and the service role) create rows.

CREATE OR REPLACE FUNCTION public.notify_new_group_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_admin TEXT;
  v_name  TEXT;
  v_group public.groups;
BEGIN
  SELECT admin_id INTO v_admin
    FROM public.groups
   WHERE id = NEW.group_id;

  -- The founding admin joining their own new group is not an event.
  IF v_admin IS NULL OR v_admin = NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(NULLIF(display_name, ''), username, 'Someone')
    INTO v_name
    FROM public.users
   WHERE id = NEW.user_id;

  SELECT * INTO v_group FROM public.groups WHERE id = NEW.group_id;

  INSERT INTO public.notifications (user_id, type, title, body, deep_link)
  VALUES (
    v_admin,
    'new_group_member',
    'New member!',
    COALESCE(v_name, 'Someone') || ' joined '
      || COALESCE(v_group.emoji, '⚡') || ' ' || COALESCE(v_group.name, 'your pact'),
    'streakpact://group/' || NEW.group_id::text
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- A notification must never block a join.
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_new_group_member() FROM PUBLIC;

DROP TRIGGER IF EXISTS group_members_notify_admin ON public.group_members;
CREATE TRIGGER group_members_notify_admin
  AFTER INSERT ON public.group_members
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_group_member();

CREATE OR REPLACE FUNCTION public.notify_nudge_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_name TEXT;
BEGIN
  SELECT COALESCE(NULLIF(display_name, ''), username, 'A teammate')
    INTO v_name
    FROM public.users
   WHERE id = NEW.sender_id;

  INSERT INTO public.notifications (user_id, type, title, body, deep_link)
  VALUES (
    NEW.recipient_id,
    'nudge_received',
    COALESCE(v_name, 'A teammate') || ' nudged you! ⚡',
    'Keep the momentum going — log your proof for today.',
    'streakpact://group/' || NEW.group_id::text
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- A notification must never block a nudge.
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_nudge_received() FROM PUBLIC;

DROP TRIGGER IF EXISTS nudges_notify_recipient ON public.nudges;
CREATE TRIGGER nudges_notify_recipient
  AFTER INSERT ON public.nudges
  FOR EACH ROW EXECUTE FUNCTION public.notify_nudge_received();

-- ─── 8. NUDGES ──────────────────────────────────────────────────────────────

REVOKE ALL ON TABLE public.nudges FROM anon, authenticated;
GRANT SELECT (
  id, sender_id, recipient_id, group_id, activity_id, sent_at, was_converted
) ON TABLE public.nudges TO authenticated;
-- `was_converted` is a gamification signal owned by the server; clients may
-- only supply the relationship columns.
GRANT INSERT (sender_id, recipient_id, group_id, activity_id)
  ON TABLE public.nudges TO authenticated;

CREATE OR REPLACE FUNCTION public.enforce_nudge_cooldown()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM public.nudges
     WHERE sender_id = NEW.sender_id
       AND recipient_id = NEW.recipient_id
       AND sent_at > now() - INTERVAL '4 hours'
  ) THEN
    RAISE EXCEPTION 'nudge_cooldown';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_nudge_cooldown() FROM PUBLIC;

DROP TRIGGER IF EXISTS nudges_enforce_cooldown ON public.nudges;
CREATE TRIGGER nudges_enforce_cooldown
  BEFORE INSERT ON public.nudges
  FOR EACH ROW EXECUTE FUNCTION public.enforce_nudge_cooldown();

-- ─── 9. STORAGE POLICIES ────────────────────────────────────────────────────

DROP POLICY IF EXISTS "submission-photos owner update" ON storage.objects;
CREATE POLICY "submission-photos owner update" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'submission-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'submission-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "submission-photos owner delete" ON storage.objects;
CREATE POLICY "submission-photos owner delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'submission-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─── 10. RELOAD POSTGREST SCHEMA CACHE ──────────────────────────────────────

NOTIFY pgrst, 'reload schema';

-- ─────────────────────────────────────────────────────────────────────────────
-- Done. Summary of the new client contract:
--
--   Self profile        get_my_profile()
--   Create/update self  ensure_user_profile(username, display_name, avatar)
--   Username check      is_username_available(username)
--   Create group        create_group(name, emoji, vibe, goal_description)
--   Join group          join_group_by_code(code)
--   Log proof           create_submission(activity_id, group_id, photo_url,
--                                        title, description, field_values,
--                                        client_timestamp, tz_offset_minutes)
--   Delete proof        delete_submission(submission_id)
--   Rest day            declare_rest_day(activity_id, target_date)
--   Use shield          consume_streak_shield(activity_id, missed_date)
--
-- Direct writes are still allowed for: user profile presentation columns,
-- group settings (admin), submission content columns (owner, 1h), notification
-- is_read/delete, nudge inserts (members + cooldown trigger), activities
-- (admin), reactions/comments (group members).
-- ─────────────────────────────────────────────────────────────────────────────
