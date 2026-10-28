# StreakPact — one-shot setup

Everything needed to take a fresh checkout to a working app. Commands are
PowerShell; the SQL is copy-paste friendly.

## 1. Requirements

- Node 20+ and npm
- A Supabase project (free tier is enough)
- Optional: Supabase CLI for deploying edge functions

```powershell
npm install
```

## 2. Environment

```powershell
Copy-Item .env.example .env
```

Fill in `.env`:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
EXPO_PUBLIC_SUPABASE_PROJECT_REF=<project-ref>
```

Google sign-in is optional; see `.env.example` for the three client ids. Leave
them blank to hide nothing — the Login screen will explain that Google is not
configured if tapped.

## 3. Database

In the Supabase dashboard go to **SQL Editor** and run these files **in order**
(copy the whole file, one at a time):

1. `docs/sql/schema.sql`
2. `docs/sql/0001_phase_1_5_fixes.sql`
3. `docs/sql/0002_social.sql`
4. `docs/sql/0003_gamification.sql`
5. `docs/sql/0004_notifications_profile.sql`
6. `docs/sql/0005_security.sql`
7. `docs/sql/0006_push_tokens.sql`

All migrations are idempotent, but `0005` assumes `0001`–`0004` exist. If you
have `psql`:

```powershell
$env:PGPASSWORD = '<database-password>'
psql "postgresql://postgres@db.<project-ref>.supabase.co:5432/postgres" `
  -f docs/sql/schema.sql `
  -f docs/sql/0001_phase_1_5_fixes.sql `
  -f docs/sql/0002_social.sql `
  -f docs/sql/0003_gamification.sql `
  -f docs/sql/0004_notifications_profile.sql `
  -f docs/sql/0005_security.sql `
  -f docs/sql/0006_push_tokens.sql
```

Verify: 13 tables (`users`, `groups`, `group_members`, `activities`,
`submissions`, `streaks`, `badges`, `user_badges`, `notifications`, `reactions`,
`comments`, `nudges`, `xp_events`), two storage buckets (`avatars`,
`submission-photos`) and the cron jobs from `0003`.

## 4. Edge functions

```powershell
supabase login
supabase link --project-ref <project-ref>
supabase functions deploy hello --no-verify-jwt
supabase functions deploy award-xp
supabase functions deploy evaluate-badges
supabase functions deploy evaluate-streaks
supabase functions deploy send-push
supabase functions deploy weekly-wrapup
```

Optional demo seed (do not deploy this to production):

```powershell
supabase functions deploy seed-dev --no-verify-jwt
supabase secrets set SEED_DEV_SECRET=<long-random-value>
```

`seed-dev` returns 403 unless the request carries
`x-seed-secret: <long-random-value>`. The other functions verify the caller
themselves (service role for `award-xp`, `evaluate-streaks`, `send-push`,
`weekly-wrapup`; user JWT or service role for `evaluate-badges`).

## 5. Cron secrets

`0003_gamification.sql` creates `invoke_edge_function()` and schedules:

- `evaluate-streaks-daily` — 00:05 UTC
- `weekly-wrapup-sunday` — Sunday 19:00 UTC

The helper reads credentials from Vault, then from database settings. Set one
pair in the SQL editor:

```sql
SELECT vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
SELECT vault.create_secret('<service-role-key>', 'service_role_key');
```

Or, without Vault:

```sql
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://<project-ref>.supabase.co';
ALTER DATABASE postgres SET app.settings.service_role_key = '<service-role-key>';
```

Check the schedules:

```sql
SELECT jobid, jobname, schedule, active FROM cron.job;
```

Both functions now return 403 unless called with
`Authorization: Bearer <service-role-key>`, which is what
`invoke_edge_function()` sends.

## 6. Run

```powershell
npm start          # Expo dev server
npm run web        # browser preview
npm run android    # emulator/device
npm run ios
```

First run goes Onboarding → Login/Register. Registering (or a first Google
sign-in) lands on the profile step; the app enters Main as soon as the
`public.users` row exists. The demo shortcut on Login is `__DEV__`-only.

## 7. Optional demo seed

With `SEED_DEV_SECRET` set:

```powershell
Invoke-RestMethod -Method Post `
  -Uri "https://<project-ref>.supabase.co/functions/v1/seed-dev" `
  -Headers @{ 'x-seed-secret' = '<long-random-value>' }
```

This creates `alex@streakpact.app`, `sarah@streakpact.app` and
`mike@streakpact.app` (password `streakdev123`), the "Morning Hustle" pact and
a week of proofs.

## 8. Smoke test

1. Register a user → complete profile → land on Home with an empty state.
2. Create a pact, add an activity, invite a second account by code → member
   count becomes 2 and the invitee sees the pact.
3. Submit proof (photo and/or fields) → success card, XP increases, feed shows
   the proof with a streak chip.
4. React and comment from a second account → author sees counts update live and
   a notification appears; the Home bell increments without a refresh.
5. Declare a rest day → streak survives the missed day. Consume a shield →
   count drops and a second use in seven days is rejected.
6. Enable airplane mode, submit proof → sync pill shows queued; reconnect →
   proof uploads once and the queue clears.
7. Open a notification → deep link lands on the submission/pact/badges screen.
8. Settings → edit profile, toggle a push category, sign out and back in.
9. On a device build (`extra.eas.projectId` configured): grant notification
   permission → `users.fcm_token` holds an `ExpoPushToken[…]`; tapping a pushed
   `data.link` opens the routed screen; signing out clears the token.

## 9. Checks

```powershell
npm run typecheck
npm run export:web
npx -y deno check supabase/functions/*/index.ts
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| `permission denied for table users` | A query is selecting private columns. Use `PUBLIC_USER_COLUMNS` or `get_my_profile()`. |
| `function ... does not exist` | Migrations were applied out of order; run `0001`–`0005`. |
| Cron functions return 401/403 | Set both `project_url` and `service_role_key`; redeploy the functions. |
| `seed_dev_disabled` | Set `SEED_DEV_SECRET` and send `x-seed-secret`. |
| Login says “JWT issued at future” | Device clock is ahead of Supabase. Fix the device clock and sign in again. |
| Push never arrives | Pushed tickets are only sent by `send-push` callers; check the user granted permission, `extra.eas.projectId` is set and APNs/FCM credentials are uploaded. `users.fcm_token` should hold an `ExpoPushToken[…]`. |
| Feed is empty for a new account | Join or create a pact first; the feed is scoped to your groups. |

The current Supabase project referenced by the original `.env` is unreachable
from this environment, so the live deployment steps above are still pending.
