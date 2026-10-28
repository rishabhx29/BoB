-- ─────────────────────────────────────────────────────────────────────────────
-- StreakPact — Push token registration
-- Date: 2026-10-28
--
-- Run AFTER `schema.sql` and `0001`–`0005`. Idempotent: safe to run again.
--
-- What it adds:
--   1. set_push_token(p_token TEXT) — SECURITY DEFINER, self-scoped write of
--      the device Expo push token into `users.fcm_token`, the column
--      `send-push` reads. `fcm_token` is not client-writable by column grant
--      (0005), so the device goes through this RPC.
--   2. `fcm_token` stays hidden from every read; the RPC never returns it.
--
-- Client usage (src/services/pushService.ts):
--   • After sign-in, on native, register the Expo push token.
--   • On sign-out, call with NULL to stop deliveries to this device.
--
-- Token contract (mirrors send-push EXPO_TOKEN_PATTERN):
--   ^Expo(nent)?PushToken\[[^\]]+\]$ — 20..64 chars. Anything else (and any
--   value the device could not produce) is rejected with `invalid_push_token`,
--   so `send-push` never drops a token at delivery time for being malformed.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_push_token(p_token TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid  UUID := auth.uid();
  v_token TEXT := btrim(p_token);
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_token IS NULL THEN
    -- Sign-out path: stop deliveries to this device only.
    UPDATE public.users SET fcm_token = NULL
     WHERE id = v_uid::TEXT;
    RETURN;
  END IF;

  IF v_token IS NULL
     OR length(v_token) < 20
     OR length(v_token) > 64
     OR v_token !~ '^Expo(nent)?PushToken\[[^]]+\]$' THEN
    RAISE EXCEPTION 'invalid_push_token';
  END IF;

  UPDATE public.users SET fcm_token = v_token
   WHERE id = v_uid::TEXT;
END;
$$;

-- Default privileges in Supabase grant EXECUTE to anon/service_role; the
-- token must only be settable by the signed-in device owner.
REVOKE ALL ON FUNCTION public.set_push_token(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_push_token(TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.set_push_token(TEXT) FROM service_role;
GRANT EXECUTE ON FUNCTION public.set_push_token(TEXT) TO authenticated;
