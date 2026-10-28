-- ─────────────────────────────────────────────────────────────────────────────
-- StreakPact — Phase 5: Notifications + profile completion
-- Date: 2026-10-27
--
-- Run AFTER `schema.sql`, `0001_phase_1_5_fixes.sql`, `0002_social.sql` and
-- `0003_gamification.sql`. Idempotent: safe to run more than once.
--
-- Adds:
--   1. users.bio + users.notification_preferences
--   2. Reaction / comment notification triggers (server-side, no client round trip)
--   3. Notification delete policy + realtime publication
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. PROFILE FIELDS ───────────────────────────────────────────────────────

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS bio TEXT CHECK (bio IS NULL OR LENGTH(bio) <= 160);

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB NOT NULL DEFAULT jsonb_build_object(
    'pushEnabled', TRUE,
    'streakReminders', TRUE,
    'socialActivity', TRUE,
    'nudges', TRUE,
    'weeklyRecap', TRUE
  );

-- ─── 2. NOTIFICATION TRIGGERS ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_reaction_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author_id TEXT;
  v_actor_name TEXT;
  v_activity_name TEXT;
BEGIN
  SELECT s.user_id, COALESCE(a.name, 'proof')
    INTO v_author_id, v_activity_name
    FROM public.submissions s
    LEFT JOIN public.activities a ON a.id = s.activity_id
   WHERE s.id = NEW.submission_id;

  -- No author, or reacting to your own proof: nothing to notify.
  IF v_author_id IS NULL OR v_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(display_name, username, 'A teammate')
    INTO v_actor_name
    FROM public.users
   WHERE id = NEW.user_id;

  INSERT INTO public.notifications (user_id, type, title, body, deep_link, is_read)
  VALUES (
    v_author_id,
    'reaction_received',
    COALESCE(v_actor_name, 'A teammate') || ' reacted ' || NEW.emoji,
    'Your ' || v_activity_name || ' proof got some love.',
    'streakpact://submission/' || NEW.submission_id,
    FALSE
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- A notification must never block a reaction.
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reactions_notify_author ON public.reactions;
CREATE TRIGGER reactions_notify_author
  AFTER INSERT ON public.reactions
  FOR EACH ROW EXECUTE FUNCTION public.notify_reaction_received();

CREATE OR REPLACE FUNCTION public.notify_comment_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author_id TEXT;
  v_actor_name TEXT;
  v_activity_name TEXT;
  v_excerpt TEXT;
BEGIN
  SELECT s.user_id, COALESCE(a.name, 'proof')
    INTO v_author_id, v_activity_name
    FROM public.submissions s
    LEFT JOIN public.activities a ON a.id = s.activity_id
   WHERE s.id = NEW.submission_id;

  IF v_author_id IS NULL OR v_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(display_name, username, 'A teammate')
    INTO v_actor_name
    FROM public.users
   WHERE id = NEW.user_id;

  v_excerpt := LEFT(NEW.text, 90);
  IF LENGTH(NEW.text) > 90 THEN
    v_excerpt := v_excerpt || '…';
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, deep_link, is_read)
  VALUES (
    v_author_id,
    'comment_received',
    COALESCE(v_actor_name, 'A teammate') || ' commented on your proof',
    v_excerpt || ' · ' || v_activity_name,
    'streakpact://submission/' || NEW.submission_id,
    FALSE
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- A notification must never block a comment.
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS comments_notify_author ON public.comments;
CREATE TRIGGER comments_notify_author
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_comment_received();

-- ─── 3. NOTIFICATION POLICIES + REALTIME ─────────────────────────────────────

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications" ON public.notifications
  FOR DELETE USING (user_id = auth.uid()::text);

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;
