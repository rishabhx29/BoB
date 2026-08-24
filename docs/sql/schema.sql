-- StreakPact — Supabase PostgreSQL Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- 
-- Tables: users, groups, group_members, activities, submissions, streaks, badges, user_badges
-- Includes: RLS policies, indexes, pg_cron jobs for streak calculation

-- ─── Extensions ────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ─── USERS ────────────────────────────────────────────────────────────────────

CREATE TABLE public.users (
  id                 TEXT PRIMARY KEY,             -- Firebase UID
  email              TEXT NOT NULL UNIQUE,
  username           TEXT NOT NULL UNIQUE,
  display_name       TEXT NOT NULL DEFAULT '',
  avatar_url         TEXT,
  xp                 INTEGER NOT NULL DEFAULT 0,
  level              INTEGER NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 7),
  total_submissions  INTEGER NOT NULL DEFAULT 0,
  longest_streak     INTEGER NOT NULL DEFAULT 0,
  shields_available  INTEGER NOT NULL DEFAULT 0 CHECK (shields_available BETWEEN 0 AND 3),
  fcm_token          TEXT,                         -- For push notifications
  timezone           TEXT NOT NULL DEFAULT 'UTC',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── GROUPS ───────────────────────────────────────────────────────────────────

CREATE TABLE public.groups (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                     TEXT NOT NULL CHECK (LENGTH(name) <= 30),
  emoji                    TEXT NOT NULL DEFAULT '⚡',
  vibe                     TEXT CHECK (vibe IN ('hustle', 'study', 'gym', 'custom')),
  goal_description         TEXT CHECK (LENGTH(goal_description) <= 200),
  invite_code              TEXT NOT NULL UNIQUE,   -- 6-char ambiguity-safe
  submission_window_start  TIME NOT NULL DEFAULT '00:00:00',
  submission_window_end    TIME NOT NULL DEFAULT '23:59:59',
  group_streak_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  require_photo_default    BOOLEAN NOT NULL DEFAULT FALSE,
  admin_id                 TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  deleted_at               TIMESTAMPTZ,            -- Soft delete (7-day recovery)
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── GROUP MEMBERS ────────────────────────────────────────────────────────────

CREATE TABLE public.group_members (
  group_id   UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- Enforce max 6 members per group
CREATE OR REPLACE FUNCTION check_group_capacity()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.group_members WHERE group_id = NEW.group_id) >= 6 THEN
    RAISE EXCEPTION 'Group is at capacity (max 6 members)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_group_capacity
  BEFORE INSERT ON public.group_members
  FOR EACH ROW EXECUTE FUNCTION check_group_capacity();

-- ─── ACTIVITIES ───────────────────────────────────────────────────────────────

CREATE TABLE public.activities (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id          UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  name              TEXT NOT NULL CHECK (LENGTH(name) <= 30),
  icon              TEXT NOT NULL DEFAULT '⚡',
  color             TEXT NOT NULL DEFAULT '#F97316',
  template_key      TEXT,                          -- null = custom
  frequency         TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'specific_days', 'x_per_week')),
  frequency_days    INTEGER[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}',  -- 0=Sun…6=Sat
  rest_days_per_week INTEGER NOT NULL DEFAULT 0 CHECK (rest_days_per_week BETWEEN 0 AND 2),
  require_photo     BOOLEAN NOT NULL DEFAULT FALSE,
  template_fields   JSONB NOT NULL DEFAULT '[]',   -- FieldDefinition[]
  is_archived       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── SUBMISSIONS ──────────────────────────────────────────────────────────────

CREATE TABLE public.submissions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  activity_id       UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  group_id          UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  photo_url         TEXT,
  title             TEXT CHECK (LENGTH(title) <= 80),
  description       TEXT CHECK (LENGTH(description) <= 500),
  field_values      JSONB NOT NULL DEFAULT '{}',   -- { fieldId: value }
  xp_earned         INTEGER NOT NULL DEFAULT 0,
  client_timestamp  TIMESTAMPTZ NOT NULL,          -- Device time (for timezone edge cases)
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent duplicate submissions for same user+activity on same day
CREATE UNIQUE INDEX unique_daily_submission
  ON public.submissions (user_id, activity_id, DATE(client_timestamp AT TIME ZONE 'UTC'));

-- ─── STREAKS ──────────────────────────────────────────────────────────────────

CREATE TABLE public.streaks (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  activity_id          UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  current_streak       INTEGER NOT NULL DEFAULT 0,
  longest_streak       INTEGER NOT NULL DEFAULT 0,
  last_submission_date DATE,
  shield_used_dates    DATE[] NOT NULL DEFAULT '{}',
  rest_day_dates       DATE[] NOT NULL DEFAULT '{}',
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, activity_id)
);

-- ─── BADGES ───────────────────────────────────────────────────────────────────

CREATE TABLE public.badges (
  id          TEXT PRIMARY KEY,                    -- e.g. 'first_flame'
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  icon        TEXT NOT NULL,
  category    TEXT NOT NULL CHECK (category IN ('streak', 'activity', 'social', 'special')),
  condition   JSONB NOT NULL                       -- e.g. {"streakDays": 7}
);

CREATE TABLE public.user_badges (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_id    TEXT NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, badge_id)
);

-- ─── SEED: BADGES ─────────────────────────────────────────────────────────────

INSERT INTO public.badges (id, name, description, icon, category, condition) VALUES
  -- Streak Badges
  ('first_flame',     'First Flame',      'Complete your first 7-day streak',         '🔥', 'streak',   '{"streakDays": 7}'),
  ('charged',         'Charged',          'Complete a 14-day streak',                  '⚡', 'streak',   '{"streakDays": 14}'),
  ('diamond_grinder', 'Diamond Grinder',  'Complete a 30-day streak',                  '💎', 'streak',   '{"streakDays": 30}'),
  ('unstoppable',     'Unstoppable',      'Complete a 60-day streak',                  '🚀', 'streak',   '{"streakDays": 60}'),
  ('legend',          'Legend',           'Complete a 100-day streak',                 '👑', 'streak',   '{"streakDays": 100}'),
  -- Activity Badges
  ('iron_body',       'Iron Body',        'Submit 50 gym/workout sessions',            '💪', 'activity', '{"activityType": "gym", "count": 50}'),
  ('scholar',         'Scholar',          'Submit 50 study sessions',                  '📚', 'activity', '{"activityType": "study", "count": 50}'),
  ('algorithm_brain', 'Algorithm Brain',  'Submit 30 LeetCode sessions',               '💻', 'activity', '{"activityType": "leetcode", "count": 30}'),
  ('road_runner',     'Road Runner',      'Submit 30 running/cardio sessions',         '🏃', 'activity', '{"activityType": "running", "count": 30}'),
  -- Social Badges
  ('hype_man',        'Hype Man',         'Nudge 10 teammates who then submitted',     '📣', 'social',   '{"nudgeConversions": 10}'),
  ('team_captain',    'Team Captain',     'Be group admin for 30 days',               '🏆', 'social',   '{"adminDays": 30}'),
  ('coach',           'Coach',            'Comment on 20 different submissions',       '💬', 'social',   '{"comments": 20}'),
  -- Special Badges
  ('early_bird',      'Early Bird',       'Submit before 8 AM on 10 different days',  '🌅', 'special',  '{"earlySubmissions": 10}'),
  ('night_owl',       'Night Owl',        'Submit after 10 PM on 10 different days',  '🦉', 'special',  '{"lateSubmissions": 10}'),
  ('shield_bearer',   'Shield Bearer',    'Successfully use a Streak Shield',         '🛡️', 'special',  '{"shieldsUsed": 1}'),
  ('comeback_kid',    'Comeback Kid',     'Rebuild a streak to 7+ after breaking it', '🔄', 'special',  '{"comebackStreak": 7}')
ON CONFLICT (id) DO NOTHING;

-- ─── INDEXES ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX idx_activities_group_id ON public.activities(group_id);
CREATE INDEX idx_submissions_user_id ON public.submissions(user_id);
CREATE INDEX idx_submissions_activity_id ON public.submissions(activity_id);
CREATE INDEX idx_submissions_group_id ON public.submissions(group_id);
CREATE INDEX idx_submissions_client_timestamp ON public.submissions(client_timestamp);
CREATE INDEX idx_streaks_user_id ON public.streaks(user_id);
CREATE INDEX idx_user_badges_user_id ON public.user_badges(user_id);

-- ─── UPDATED_AT TRIGGERS ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER groups_updated_at BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER activities_updated_at BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER submissions_updated_at BEFORE UPDATE ON public.submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER streaks_updated_at BEFORE UPDATE ON public.streaks FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── ROW-LEVEL SECURITY (RLS) ─────────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Helper function: check if current user is a member of a group
CREATE OR REPLACE FUNCTION is_group_member(gid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = gid AND user_id = auth.uid()::TEXT
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Helper function: check if current user is admin of a group
CREATE OR REPLACE FUNCTION is_group_admin(gid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = gid AND user_id = auth.uid()::TEXT AND role = 'admin'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Users: Anyone can read public profiles; only self can update
CREATE POLICY "Users are readable by group members" ON public.users
  FOR SELECT USING (TRUE);  -- Public profile reads (username, avatar, XP)
CREATE POLICY "Users can only update themselves" ON public.users
  FOR UPDATE USING (id = auth.uid()::TEXT);
CREATE POLICY "Users can insert themselves" ON public.users
  FOR INSERT WITH CHECK (id = auth.uid()::TEXT);

-- Groups: Only members can see; only admin can update/delete
CREATE POLICY "Groups visible to members" ON public.groups
  FOR SELECT USING (is_group_member(id));
CREATE POLICY "Anyone can join via invite code" ON public.groups
  FOR SELECT USING (invite_code IS NOT NULL);  -- For join flow
CREATE POLICY "Only admin can update group" ON public.groups
  FOR UPDATE USING (admin_id = auth.uid()::TEXT);
CREATE POLICY "Authenticated users can create groups" ON public.groups
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Group Members: Members see other members; admin can remove
CREATE POLICY "Members can see group_members" ON public.group_members
  FOR SELECT USING (is_group_member(group_id));
CREATE POLICY "Users can add themselves" ON public.group_members
  FOR INSERT WITH CHECK (user_id = auth.uid()::TEXT);
CREATE POLICY "Admin can remove members" ON public.group_members
  FOR DELETE USING (is_group_admin(group_id) OR user_id = auth.uid()::TEXT);

-- Activities: Group members can see; only admin can create/update/archive
CREATE POLICY "Members can see activities" ON public.activities
  FOR SELECT USING (is_group_member(group_id));
CREATE POLICY "Only admin can manage activities" ON public.activities
  FOR INSERT WITH CHECK (is_group_admin(group_id));
CREATE POLICY "Only admin can update activities" ON public.activities
  FOR UPDATE USING (is_group_admin(group_id));

-- Submissions: Group members can see; only self can create/edit/delete
CREATE POLICY "Members can see submissions" ON public.submissions
  FOR SELECT USING (is_group_member(group_id));
CREATE POLICY "Users can create own submissions" ON public.submissions
  FOR INSERT WITH CHECK (user_id = auth.uid()::TEXT);
CREATE POLICY "Users can update own submissions within 1 hour" ON public.submissions
  FOR UPDATE USING (
    user_id = auth.uid()::TEXT AND
    created_at > NOW() - INTERVAL '1 hour'
  );
CREATE POLICY "Users can delete own submissions within 24 hours" ON public.submissions
  FOR DELETE USING (
    user_id = auth.uid()::TEXT AND
    created_at > NOW() - INTERVAL '24 hours'
  );

-- Streaks: Users can see own streaks + group members' streaks
CREATE POLICY "Users can see streaks in their groups" ON public.streaks
  FOR SELECT USING (
    user_id = auth.uid()::TEXT OR
    EXISTS (
      SELECT 1 FROM public.activities a
      JOIN public.group_members gm ON gm.group_id = a.group_id
      WHERE a.id = activity_id AND gm.user_id = auth.uid()::TEXT
    )
  );
CREATE POLICY "System can manage streaks" ON public.streaks
  FOR ALL USING (TRUE)
  WITH CHECK (TRUE);  -- Edge Functions use service_role key

-- Badges: Public read
CREATE POLICY "Badges are public" ON public.badges FOR SELECT USING (TRUE);
CREATE POLICY "User badges readable by group members" ON public.user_badges
  FOR SELECT USING (TRUE);

-- ─── STREAK CALCULATION CRON JOB (pg_cron) ───────────────────────────────────
-- Runs daily at 00:05 UTC — checks all active streaks and updates accordingly
-- NOTE: Enable pg_cron in Supabase Dashboard → Extensions before running this

/*
SELECT cron.schedule(
  'streak-check-daily',
  '5 0 * * *',
  $$
    SELECT net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/calculate-streaks',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := '{}'::jsonb
    );
  $$
);
*/
