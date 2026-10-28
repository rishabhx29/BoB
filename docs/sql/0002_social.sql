-- ─────────────────────────────────────────────────────────────────────────────
-- StreakPact — Phase 2: Social persistence
-- Date: 2026-10-27
--
-- Run AFTER `docs/sql/schema.sql` and `docs/sql/0001_phase_1_5_fixes.sql`.
-- Idempotent: safe to run more than once.
--
-- Adds:
--   1. reactions  — one emoji reaction per user per submission
--   2. comments   — submission comment threads
--   3. nudges     — persistent nudge log / cooldown source (replaces Firestore)
--   4. RLS policies for all three tables
--   5. Realtime publication for reactions + comments
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. REACTIONS ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.reactions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  user_id       TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji         TEXT NOT NULL CHECK (emoji IN ('🔥', '💪', '👏', '❤️', '💯')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (submission_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reactions_submission
  ON public.reactions(submission_id);

ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Group members can read reactions" ON public.reactions;
CREATE POLICY "Group members can read reactions" ON public.reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.submissions s
      WHERE s.id = reactions.submission_id
        AND public.is_group_member(s.group_id)
    )
  );

DROP POLICY IF EXISTS "Users can add own reactions" ON public.reactions;
CREATE POLICY "Users can add own reactions" ON public.reactions
  FOR INSERT WITH CHECK (
    user_id = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM public.submissions s
      WHERE s.id = reactions.submission_id
        AND public.is_group_member(s.group_id)
    )
  );

DROP POLICY IF EXISTS "Users can change own reactions" ON public.reactions;
CREATE POLICY "Users can change own reactions" ON public.reactions
  FOR UPDATE USING (
    user_id = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM public.submissions s
      WHERE s.id = reactions.submission_id
        AND public.is_group_member(s.group_id)
    )
  ) WITH CHECK (
    user_id = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM public.submissions s
      WHERE s.id = reactions.submission_id
        AND public.is_group_member(s.group_id)
    )
  );

DROP POLICY IF EXISTS "Users can remove own reactions" ON public.reactions;
CREATE POLICY "Users can remove own reactions" ON public.reactions
  FOR DELETE USING (user_id = auth.uid()::text);

-- ─── 2. COMMENTS ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.comments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  user_id       TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  text          TEXT NOT NULL CHECK (CHAR_LENGTH(text) BETWEEN 1 AND 500),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_submission
  ON public.comments(submission_id, created_at ASC);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Group members can read comments" ON public.comments;
CREATE POLICY "Group members can read comments" ON public.comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.submissions s
      WHERE s.id = comments.submission_id
        AND public.is_group_member(s.group_id)
    )
  );

DROP POLICY IF EXISTS "Users can add own comments" ON public.comments;
CREATE POLICY "Users can add own comments" ON public.comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM public.submissions s
      WHERE s.id = comments.submission_id
        AND public.is_group_member(s.group_id)
    )
  );

DROP POLICY IF EXISTS "Authors and admins can delete comments" ON public.comments;
CREATE POLICY "Authors and admins can delete comments" ON public.comments
  FOR DELETE USING (
    user_id = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.submissions s
      WHERE s.id = comments.submission_id
        AND public.is_group_admin(s.group_id)
    )
  );

-- ─── 3. NUDGES ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.nudges (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id     TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_id  TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  group_id      UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  activity_id   UUID REFERENCES public.activities(id) ON DELETE SET NULL,
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  was_converted BOOLEAN NOT NULL DEFAULT FALSE,
  CHECK (sender_id <> recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_nudges_cooldown
  ON public.nudges(sender_id, recipient_id, sent_at DESC);

ALTER TABLE public.nudges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their nudges" ON public.nudges;
CREATE POLICY "Users can read their nudges" ON public.nudges
  FOR SELECT USING (
    sender_id = auth.uid()::text OR recipient_id = auth.uid()::text
  );

DROP POLICY IF EXISTS "Members can send nudges" ON public.nudges;
CREATE POLICY "Members can send nudges" ON public.nudges
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = nudges.group_id
        AND gm.user_id = auth.uid()::text
    )
    AND EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = nudges.group_id
        AND gm.user_id = nudges.recipient_id
    )
  );

-- ─── 4. REALTIME ─────────────────────────────────────────────────────────────

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.reactions;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;
