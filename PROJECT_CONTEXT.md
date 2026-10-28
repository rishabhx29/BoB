# StreakPact — AI Agent Context

Read this before changing the data layer. It describes the code that exists
today, not the original plan. Superseded planning docs live in `docs/archive/`.

## 1. Product

StreakPact is a social accountability app. Up to six people form a pact, pick
daily activities, post proof before the day ends, and keep streaks alive.
Proofs appear in a shared feed with reactions and comments. Consistency earns
XP, levels, shields and badges.

Core loop: create/join pact → submit proof → keep streak → react/comment/nudge
→ earn XP/badges → weekly recap.

## 2. Stack (current)

- Expo SDK ~57, React Native 0.86, React 19, TypeScript.
- React Navigation v7 (auth stack + main tabs), TanStack Query, Zustand.
- Supabase only: Postgres, Auth, Storage, Realtime, Edge Functions (Deno).
- **No Firebase/Firestore.** The `firebase` package and all client code are gone.
- Auth sessions: chunked `expo-secure-store` on native (`src/utils/storage.ts`),
  AsyncStorage on web.

## 3. Backend contract

### Tables

`users`, `groups`, `group_members`, `activities`, `submissions`, `streaks`,
`badges`, `user_badges`, `notifications`, `reactions`, `comments`, `nudges`,
`xp_events`.

`users.id` is TEXT and holds the stringified Supabase auth UUID.
`groups.member_count` is maintained by an `AFTER INSERT OR DELETE` trigger on
`group_members` and constrained to `0..6`.

### Migrations

Apply **in order** (all idempotent, but `0005` assumes the earlier ones):

1. `docs/sql/schema.sql`
2. `docs/sql/0001_phase_1_5_fixes.sql`
3. `docs/sql/0002_social.sql`
4. `docs/sql/0003_gamification.sql`
5. `docs/sql/0004_notifications_profile.sql`
6. `docs/sql/0005_security.sql`
7. `docs/sql/0006_push_tokens.sql`

### Read rules

- `users` is public-read but **column-restricted**. Use
  `PUBLIC_USER_COLUMNS` from `src/services/userColumns.ts`. Never `select('*')`
  or `users(*)` — `email`, `fcm_token`, `timezone` and
  `notification_preferences` are revoked.
- Self profile (including private columns) comes from `get_my_profile()`.
- Feed projections explicitly embed public user columns plus reactions and
  comment counts (`src/services/feedService.ts`).

### Write rules

Clients do **not** write server-owned tables directly. RPCs:

| RPC | Purpose |
|---|---|
| `ensure_user_profile(username, display_name, avatar)` | Create/update own profile |
| `is_username_available(name)` | Self-aware availability |
| `create_group(...)` | Group + admin membership + invite code |
| `join_group_by_code(code)` | Join with code, trigger owns count |
| `create_submission(...)` | XP/streak/validation in one transaction |
| `delete_submission(id)` | Ownership + 24h window + XP reversal |
| `declare_rest_day(activity, date)` | Two per week, one-day UTC skew allowed |
| `consume_streak_shield(activity, missed)` | Balance, duplicate and 7-day cooldown |
| `set_push_token(token \| null)` | Store/clear own Expo push token (`users.fcm_token`) |

RPC errors are plain tokens (`invalid_invite_code`, `group_full`,
`duplicate_submission`, `nudge_cooldown`, `invalid_photo_url`, …). Map them to
`AppError` codes in the service layer; do not surface raw Postgres text.

Notifications are created by database triggers for joins/reactions/comments/
nudges. Clients may only SELECT, UPDATE `is_read` and DELETE their own rows.
Nudge `was_converted` is server-owned. Never re-add client notification inserts.

### Storage

Buckets: `avatars`, `submission-photos`. Writes are scoped to `<uid>/…` by
policy; reads are public. `create_submission` rejects photo URLs that are not on
the project host inside the caller's `submission-photos` folder.

### Edge functions

- `award-xp` — service role only, idempotent via `(userId, reason, sourceId)`.
- `evaluate-badges` — caller JWT evaluates self; service role can batch.
- `evaluate-streaks` — service role only (pg_cron), daily 00:05 UTC.
- `send-push` — service role only, filters by notification preferences.
- `weekly-wrapup` — service role only (pg_cron), Sundays 19:00 UTC.
- `seed-dev` — disabled unless `SEED_DEV_SECRET` matches `x-seed-secret`.
- `hello` — public health check.

Cron reads `project_url` / `service_role_key` from Vault, falling back to
`app.settings.supabase_url` / `app.settings.service_role_key`.

## 4. Client architecture

- `App.tsx`: QueryClient, fonts, navigation, `NotificationSync`,
  `SyncStatusPill`, `useAuthSync`.
- Auth gate (`src/store/useAuthStore.ts` + `src/navigation/index.tsx`): session
  and profile are separate facts. States are no session → Auth; session with
  `profileStatus === 'missing'` → root-level `SetupProfile`; session with
  `'ready'` → Main; `'unknown'` → `ProfileLoadingScreen`. A session alone never
  opens Main because every write has an FK to `public.users`.
- Onboarding is a single profile step; walking the app (Onboarding → Login →
  Register → SetupProfile) happens automatically from store state. There is no
  biometric gate and no separate join/create onboarding screen.
- `src/navigation/pendingInvite.ts` + `usePendingInvite` park an invite code
  opened before sign-in (24-hour expiry) and replay it to `JoinGroup` once the
  gate reaches Main. A warm link while ready is owned by React Navigation.
- `src/navigation/linking.ts`: single source of truth for deep links.
  `streakpact://invite/<code>` aliases `join/<code>`.
- `src/services/queryClient.ts`: query keys and stale times. Feed mutations
  invalidate keys starting with `['feed']`.
- `src/hooks/useFeed.ts`: `useFeed` (home, paginated), `useGroupFeed` (one pact,
  same projection), `useSubmissionFeedItem` (deep-link detail).
- Offline: `useSubmissionQueue` + `useOfflineSync` + NetInfo/AppState; queue is
  scoped by `ownerId`; photos are uploaded once and reused on retry.
- Realtime: one channel per visible feed card for reactions; comments only while
  a thread is open; one user-scoped channel for notifications.
- `src/components/ui/FeedCard.tsx` is the only feed card. The legacy
  `components/feed` duplicate and `utils/feedAdapters.ts` were removed.

## 5. Current state (October 2026)

Tickets 1–7 are complete in code: home feed, social persistence, offline sync,
gamification backend, notifications/profile, security hardening and the polish
pass. Evidence is in `docs/TICKETS.md`.

Verification commands:

```powershell
npm run typecheck
npm run export:web
npx -y deno check supabase/functions/*/index.ts
```

A Playwright smoke suite exercises the exported web build with PostgREST mocked:
signed-out onboarding → login, session without a profile → SetupProfile,
session with a profile → Main, and a signed-out `/join/<code>` link that is
replayed to `JoinGroup` after a session appears. It lives outside the repo at
`%TEMP%/opencode/streakpact-smoke/smoke.mjs`.

The full migration chain was exercised in an in-memory PGlite Postgres (84
checks: profile creation, column grants, group create/join, member counts,
submissions/XP, rest days, shields, backdated proofs, deletion, nudges,
notification RLS, storage policies and idempotency). Harness:
`%TEMP%/opencode/pglite-streakpact/run.mjs` (outside the repo).

## 6. Known gaps / next steps

1. **Deployment blocked:** the original Supabase project
   (`jvnzbnoljomuxzokwogo.supabase.co`) does not resolve. Apply migrations
   `0001`–`0006`, deploy the seven edge functions, set Vault secrets and verify
   cron on a reachable project.
2. **Device push delivery:** token registration is complete
   (`expo-notifications` + `set_push_token`). Delivery additionally needs an
   `extra.eas.projectId` and APNs/FCM credentials uploaded to Expo.
3. **Leaderboard:** monthly XP is aggregated from `submissions.xp_earned`.
4. **Seed:** `seed-dev` needs `SEED_DEV_SECRET`; never deploy it without one.
   Demo login is hidden in production builds (`__DEV__` only).

## 7. Rules of thumb

- One ticket at a time; a ticket is done only when its acceptance criteria pass
  and `npx tsc --noEmit` is clean.
- Prefer the RPC/column contract over ad-hoc queries. If a write needs a new
  table column, add an RPC and an RLS test.
- Do not reintroduce `users(*)`, client-owned XP/counts, client notification
  inserts or direct `group_members` writes.
- Keep deep links in `src/navigation/linking.ts`.
- Update `docs/TICKETS.md` with evidence when a ticket changes.
