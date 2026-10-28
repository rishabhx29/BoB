# StreakPact — Completion Tickets

Work is done one ticket at a time. A ticket is complete only when its acceptance
criteria pass and `npx tsc --noEmit` is clean.

| # | Ticket | Status |
|---|--------|--------|
| 1 | Home screen reality pass | Done (code + build) |
| 2 | Social persistence (reactions + comments + realtime) | Done (code + build; migration pending) |
| 3 | Offline sync wiring | Done (code + build) |
| 4 | Gamification backend (streak evaluation, XP, badges, cron) | Done (code + typecheck; migration/deploy pending) |
| 5 | Notifications + profile completion | Done (code + build; migration/deploy pending) |
| 6 | Security hardening (RLS, deep links, auth) | Done (code + build + migration dry-run; deploy pending) |
| 7 | Polish + smoke testing | Done (code + build + smoke; deploy pending) |
| 8 | Device push token registration | Done (code + build + migration dry-run; deploy pending) |

---

## Ticket 1 — Home screen reality pass

### Problem
- `HomeScreen` renders mock submissions whenever the real feed is empty.
- Home stats (`14d`, `2 done`) are hardcoded.
- `TodayBanner` renders `act1`–`act4` mock activities that do not exist in the DB,
  so tapping them opens a broken submission flow.
- The feed has no pagination and fails silently.
- `SubmissionFlowScreen` offers fake preset activities whose IDs are not in the
  `activities` table, so submissions fail.

### Acceptance criteria
- [x] Home feed is Supabase-only. No mock fallback, no fake IDs.
- [x] Feed is scoped to the user's pacts, supports "All Pacts" / "My Activity" /
      per-pact filters, and paginates with `onEndReached`.
- [x] Feed loading, error + retry, and empty states are distinct.
- [x] "Today" banner lists real activities from the user's pacts, marks the ones
      already submitted today, and opens the real activity in the submission flow.
- [x] Home stats are derived: best active streak, proofs logged today, pact count.
- [x] Pull-to-refresh refreshes both the feed and today data.
- [x] `useMockFeed` / `MockFeedItem` / `mockTodayActivities` are deleted.
- [x] Submission flow no longer offers fake preset activities.
- [x] `npx tsc --noEmit` passes.

### Verification
1. Typecheck.
2. Cold start with no submissions → real empty state, no fake cards.
3. Submit proof → feed and Today banner update without restart.
4. Tap a Today activity → submission flow opens with that activity.
5. Scroll to the bottom of the feed → next page loads.
6. Disconnect network → error state with retry (not a fake feed).

**Verification log:** `npx tsc --noEmit` passed; `npx expo export --platform web`
bundled successfully (4767 modules). Steps 2–6 require a reachable Supabase
project; `jvnzbnoljomuxzokwogo.supabase.co` does not resolve from this machine,
so live-data checks remain pending.

---

## Ticket 2 — Social persistence

### Problem
- Reactions, comments and nudges wrote to Firestore, but Firebase was never
  configured (`EXPO_PUBLIC_FIREBASE_*` empty), so every write was a no-op.
- The feed had no social counts, so cards always rendered zero reactions.
- Submission create/update/delete carried Firestore mirror calls for a database
  that does not exist.

### Acceptance criteria
- [x] `reactions`, `comments` and `nudges` tables exist in
      `docs/sql/0002_social.sql` with cascading FKs, indexes and RLS.
- [x] Reaction and comment services are Supabase-only (no Firestore imports).
- [x] Feed loads reaction rows and comment counts via embedded resources in the
      existing submissions query — one round trip, no N+1.
- [x] Feed cards update optimistically and roll back + alert on failure.
- [x] Realtime: one reactions channel per visible card; comments subscribe only
      while the thread sheet is open; "Who reacted" stays live while open.
- [x] Nudges persist in Supabase with the 4-hour per-recipient cooldown.
- [x] `src/services/firebase.ts` deleted; no `firebase/firestore` imports remain.
- [x] `src/services/env.ts` no longer advertises Firebase configuration.
- [x] `npx tsc --noEmit` passes.

### Verification
1. Typecheck.
2. Apply `0002_social.sql` to the project.
3. React to a card → count and highlight update instantly; second tap removes.
4. Open comments → existing thread loads; a comment from another session
   appears without reopening the sheet.
5. Open "Who reacted" → new reactions from another session append live.
6. Nudge a teammate twice → second attempt is rejected by the cooldown.

**Verification log:** `npx tsc --noEmit` passed; `npx expo export --platform web`
bundled successfully. Steps 2–6 are blocked: `jvnzbnoljomuxzokwogo.supabase.co`
does not resolve (project paused/deleted), and Docker is unavailable for a local
Supabase instance. Apply `docs/sql/0002_social.sql` after restoring the project.

## Ticket 3 — Offline sync

### Problem
- `syncQueue()` existed but was never called: proofs queued offline stayed in
  AsyncStorage forever.
- Every retry re-uploaded the photo, and a killed app could restore items stuck
  in `syncing`, which the sync loop then skipped permanently.
- The offline "success" screen claimed "Proof Locked In" and awarded a fake 60 XP
  for a proof that never reached the server.
- The queue was global, so switching accounts could attempt to upload another
  user's proofs.

### Acceptance criteria
- [x] Sync runs on boot/sign-in, on connectivity regain (NetInfo), and when the
      app returns to the foreground.
- [x] A global status pill reports: syncing / waiting for connection / failed
      with Retry / "N proofs synced" (4s confirmation).
- [x] Offline submissions get a distinct success screen ("Proof Saved Offline")
      with no confetti and no XP claim.
- [x] `DUPLICATE_SUBMISSION` is discarded without blocking the queue, and the
      orphaned upload is deleted.
- [x] Permanent failures (validation, missing activity) stop auto-retrying; the
      Retry action clears the flag and tries again.
- [x] Photos upload once and the remote URL is persisted for later retries.
- [x] Queue items store `ownerId`; only the signed-in account's items are
      counted or synced, and the queue survives logout.
- [x] Stale `syncing` items reset to `pending` on rehydrate.
- [x] `npx tsc --noEmit` passes.

### Verification
1. Airplane mode → submit proof → "Proof Saved Offline"; pill shows
   "1 proof waiting to sync".
2. Restore network → pill shows syncing then "1 proof synced"; feed, Today
   banner, streak and XP refresh without a restart.
3. Kill and relaunch while offline → the queued proof is still there.
4. Force a failure → pill shows Retry; fix the cause and tap Retry → syncs.
5. Queue the same proof twice offline → the duplicate is discarded and the queue
   drains.

**Verification log:** `npx tsc --noEmit` passed; `npx expo export --platform web`
bundled successfully with NetInfo. Steps 1–5 require a device/emulator with
network toggling; they remain pending until the Supabase project is reachable.

## Ticket 4 — Gamification backend

### Problem
- Streaks were never evaluated: a missed day left `current_streak` untouched, so
  every streak grew forever. The cron block in `schema.sql` was commented out and
  pointed at a function that did not exist.
- `award-xp`, `evaluate-badges` and `send-push` were referenced by the client but
  never implemented, so badges and push notifications never happened.
- Badge awarding had no server-side condition evaluation.
- The leaderboard said "This month" but ranked by lifetime XP.
- `users.level` and `users.longest_streak` were stale profile stats.

### Acceptance criteria
- [x] `docs/sql/0003_gamification.sql` adds `xp_events`, atomic
      `award_user_xp()`, level sync trigger, longest-streak sync trigger,
      `user_badge_metrics()`, and `invoke_edge_function()`.
- [x] XP can only be granted through the database function, which is revoked from
      `anon`/`authenticated` and granted to `service_role` only.
- [x] Levels are derived from XP by trigger and backfilled, matching
      `src/utils/progression.ts` thresholds.
- [x] `users.longest_streak` stays in sync from `streaks` (trigger + backfill).
- [x] Badge conditions are evaluated server-side in
      `supabase/functions/_shared/gamification.ts`, with idempotent inserts.
- [x] `award-xp` requires the service-role bearer token and validates amounts,
      reason format, and idempotency keys.
- [x] `evaluate-badges` works for the caller with a user JWT and for
      `{ userId }` / `{ all: true }` with the service role.
- [x] `send-push` delivers Expo push notifications and skips users without a
      valid Expo token.
- [x] `evaluate-streaks` applies shields, resets broken streaks, writes
      notifications, and evaluates badges for shielded users.
- [x] `pg_cron` schedules `evaluate-streaks` daily at 00:05 UTC and
      `weekly-wrapup` Sundays at 19:00 UTC through `invoke_edge_function()`.
- [x] `weekly-wrapup` selects the real `xp_earned` column.
- [x] Submission success evaluates badges best-effort and shows unlocked badge
      chips without delaying the success screen.
- [x] Leaderboard ranks by XP earned this month and displays monthly XP.
- [x] `npx tsc --noEmit` and `npx -y deno check` pass for all edge functions.

### Verification
1. Typecheck the app and all five edge functions.
2. Apply `0003_gamification.sql` after `schema.sql`, `0001…`, `0002…`.
3. Set Vault secrets `project_url` + `service_role_key`, then confirm both cron
   jobs exist in `cron.job`.
4. Submit proof that satisfies `first_flame` → badge chip appears on success and
   a `badge_earned` notification is written.
5. Call `award-xp` with the service key twice with the same `sourceId` → second
   call returns `awarded: false` and XP does not move.
6. Advance a streak's `last_submission_date` by two days and run
   `evaluate-streaks` → streak resets (or a shield is consumed once).
7. Leaderboard shows monthly XP and re-ranks after a submission.

**Verification log:** `npx tsc --noEmit` passed (no output); `npx -y deno check`
passed for `award-xp`, `evaluate-badges`, `send-push`, `evaluate-streaks` and
`weekly-wrapup`. Steps 2–7 are blocked on the unreachable Supabase project
(`jvnzbnoljomuxzokwogo.supabase.co`): migrations, function deploys and Vault
secrets cannot be applied from this machine.

## Ticket 5 — Notifications + profile

### Problem
- The bell, notification center and read/unread state did not exist; the
  `notifications` table was only written to and never read.
- Reactions and comments produced no notification because the client never
  inserted one.
- `ProfileScreen` still had “Phase 9” placeholder alerts for Settings and Edit
  profile. Bio, settings and a full achievements view were missing.
- `send-push` ignored `notification_preferences`, so muting a category in the
  app would not have muted the push.
- Deep-link handling lived inline in `App.tsx` and only understood
  `streakpact://join/<code>`, while share sheets emitted `invite/<code>`.

### Acceptance criteria
- [x] `docs/sql/0004_notifications_profile.sql` adds `users.bio` (≤160 chars)
      and `users.notification_preferences` (JSONB, default all-on).
- [x] Reaction and comment inserts create `reaction_received` /
      `comment_received` notifications through `SECURITY DEFINER` triggers.
      Self-actions are ignored and a notification failure never blocks the
      social write.
- [x] Notifications can be deleted by their owner, and the table is in the
      `supabase_realtime` publication.
- [x] `notificationService` provides paginated fetch, unread count, read /
      unread / all-read / delete mutations, row mapping and a user-scoped
      realtime subscription.
- [x] `useNotifications` provides an infinite list, unread badge count,
      optimistic mutations with rollback, and realtime invalidation.
- [x] `NotificationSync` is mounted once at app root so the Home bell stays
      live even when the notification screen is closed.
- [x] `HomeScreen` shows a bell with an unread count that opens
      `NotificationsScreen`.
- [x] `NotificationsScreen` groups by Today / Yesterday / This week / Earlier,
      shows unread styling, supports mark-all-read, long-press read/unread and
      delete, paginates, pulls to refresh, and handles empty/error states.
- [x] Tapping a notification routes through `resolveDeepLink`:
      `submission/<id>`, `group/<id>`, `badges`, `profile`, `join|invite/<code>`
      and `submit` are understood.
- [x] `SubmissionDetailScreen` renders the same `FeedCard` as the feed using the
      shared `fetchSubmissionFeedItem` projection; deleting a proof leaves the
      screen.
- [x] `SettingsScreen` shows identity, edit profile, notification center, push
      preference switches, appearance/about rows and sign out. Signing out lets
      the auth gate swap stacks rather than racing a manual reset.
- [x] `EditProfileScreen` edits display name, username (self-aware availability),
      bio and avatar. Avatar upload reuses `uploadAvatarPhoto`; a duplicate
      username (`23505`) surfaces as a validation error.
- [x] `BadgesScreen` groups every definition by category, shows earned date and
      locked state, and is reachable from the Profile achievements block.
- [x] Profile shows the bio and opens Settings / Edit profile / Badges instead of
      placeholder alerts.
- [x] `send-push` honours the master switch and maps notification types to
      `streakReminders`, `socialActivity`, `nudges` and `weeklyRecap`.
- [x] Navigation linking is centralised in `src/navigation/linking.ts`;
      `invite/<code>` is accepted as an alias for `join/<code>`.
- [x] `npx tsc --noEmit`, `npx expo export --platform web` and
      `npx -y deno check` on the touched functions pass.

### Verification
1. Apply `0004_notifications_profile.sql` after `0001`–`0003`.
2. As user A, react to and comment on user B's proof → B receives both
   notifications in-app and via realtime; B's Home bell increments without a
   refresh.
3. Open Notifications → unread rows are highlighted; “Mark all read” clears the
   bell; long-press toggles read/unread and deletes.
4. Tap a reaction notification → `SubmissionDetail` shows the same card; react
   and comment from the detail screen.
5. Open Settings → toggle a push category → reload → the toggle persists.
   Call `send-push` for a muted type with the service key → response reports
   `muted` and no ticket is sent.
6. Edit profile → change name, username and bio, upload an avatar → Profile and
   Home header update immediately; reusing the existing username is allowed,
   another user's username is rejected.
7. Open Profile → Achievements → all badges are grouped, earned ones show a
   date, locked ones show a lock.
8. Open `streakpact://invite/ABC234` and `streakpact://join/ABC234` → both land
   on JoinGroup with the code prefilled.

**Verification log:** `npx tsc --noEmit` passed (no output);
`npx expo export --platform web` bundled successfully (4,777 modules);
`npx -y deno check` passed for `send-push` and `_shared/gamification.ts`.
Steps 1–7 are blocked on the unreachable Supabase project
(`jvnzbnoljomuxzokwogo.supabase.co`): the migration and function deploy cannot
be applied from this machine.

**Known limitation:** no client push-token registration exists yet
(`expo-notifications` is not installed and no EAS project id is configured), so
`send-push` has no `users.fcm_token` values to deliver to. In-app notifications
are complete; device push is blocked on EAS project setup.

## Ticket 6 — Security hardening

### Problem
- `users` was readable with `select('*')` by any signed-in user, exposing
  `email`, `fcm_token`, `timezone` and notification preferences.
- Clients could write server-owned state directly: `xp`, `level`,
  `shields_available`, `member_count`, streak rows and `notifications`.
- `groups` and `group_members` were writable in ways that bypassed the join
  flow, and `member_count` had no owner.
- Submission creation trusted the client for XP, timestamps, photo URLs and
  field payloads.
- Nudges could be inserted with `was_converted` already true and had no
  server-side cooldown.
- Auth sessions were persisted with plain `AsyncStorage` on native, which is
  not encrypted at rest.

### Acceptance criteria
- [x] `docs/sql/0005_security.sql` adds `PUBLIC_USER_COLUMNS`-aligned column
      grants: `email`, `fcm_token`, `timezone` and
      `notification_preferences` are not selectable by `anon` or
      `authenticated`. Self reads go through `get_my_profile()`.
- [x] `src/services/userColumns.ts` is the single public-column allow-list used
      by `userService` and `feedService`; every `users(*)` embed is gone.
- [x] Direct profile inserts are denied; `ensure_user_profile(p_username,
      p_display_name, p_avatar_url)` creates or updates the caller's row, takes
      email from the JWT and rejects duplicate usernames with
      `username_taken`.
- [x] `is_username_available(text)` is self-aware and callable by signed-in
      users only.
- [x] Group creation and joining move behind `create_group` and
      `join_group_by_code`; clients can no longer insert `group_members` or
      write `member_count`. A trigger maintains `member_count` on insert and
      delete, and the constraint allows `0..6`.
- [x] `create_submission` owns XP, streaks and timestamps. It validates:
      membership, activity/group match, duplicate same-day proof, photo URL
      host + caller folder, object-shaped and size-limited field values,
      no future timestamps and a 30-day backdate window.
- [x] `delete_submission` enforces ownership and the 24-hour window, reverses
      XP and `total_submissions`, and leaves streak rows intact.
- [x] `declare_rest_day` enforces the two-per-week limit, tolerates one day of
      UTC/local-date skew, and is idempotent for an already-declared date.
- [x] `consume_streak_shield` enforces balance, duplicates, a seven-day cooldown
      and membership; shield dates live on the streak row.
- [x] Streak math treats every day between proofs as streak-preserving when it
      is covered by a declared rest day or a shield, and a backdated proof never
      inflates the streak or moves `last_submission_date` backwards.
- [x] Client comment, reaction, join and nudge notification inserts are removed.
      Join and nudge notifications are written by `SECURITY DEFINER` triggers
      with exception guards so a notification failure cannot block the action.
- [x] Nudge `was_converted` is server-owned; clients may only insert
      `sender_id`, `recipient_id`, `group_id` and `activity_id`, and the
      cooldown trigger returns `nudge_cooldown`.
- [x] Storage policies scope avatar and submission-photo writes to
      `<uid>/...`; objects remain publicly readable.
- [x] `src/utils/storage.ts` persists Supabase auth with chunked SecureStore on
      native (1800-char chunks, legacy fallback) and AsyncStorage on web.
- [x] RPC errors are plain tokens (`invalid_invite_code`, `group_full`,
      `duplicate_submission`, `nudge_cooldown`, `invalid_photo_url`,
      `delete_window_expired`, …) mapped to `AppError` codes client-side.
- [x] `0005` is idempotent: every policy it replaces is dropped first and the
      member-count repair runs before the replacement constraint.
- [x] `npx tsc --noEmit` and `npx expo export --platform web` pass.

### Verification
1. Apply `0001`–`0005` to a project; confirm every RPC exists and the five edge
   functions are deployed.
2. As user A, `select('*')` on `users` → denied; public profile embeds still
   render. `get_my_profile()` returns A's email and preferences.
3. Create a group → A is admin and `member_count = 1`; join with B and C →
   count follows the trigger; a fourth-to-seventh member is rejected at 6.
4. Submit a proof → XP, `total_submissions`, streak and level move once; repeat
   the same day → `duplicate_submission`. Submit with another user's photo path
   → `invalid_photo_url`.
5. Declare a rest day yesterday → streak survives; a third rest day in the week
   → `rest_day_limit`; a rest day two days back → `rest_day_backdated`.
6. Consume a shield → count decrements; consume again → `shield_cooldown`; with
   none left → `no_shields`.
7. Nudge a teammate twice → second insert → `nudge_cooldown`; recipient gets one
   `nudge_received` row and a client insert into `notifications` is denied.
8. Upload to `<other-uid>/x.jpg` → RLS denies; upload to `<own-uid>/x.jpg`
   succeeds.

**Verification log:** `npx tsc --noEmit` passed (no output);
`npx expo export --platform web` bundled successfully (4,779 modules).
The full migration chain (`schema.sql` + `0001`–`0005`) was executed in an
in-memory PGlite Postgres with `auth`, `storage`, `vault` and `net` stubs and
Supabase default privileges. All **84 checks** passed, covering profile
creation, column privileges, group create/join, trigger-owned member counts,
submission and XP rules, rest days, shields, backdated proofs, deletion,
nudges, notification RLS, storage policies, service-role-only functions and a
second `0005` run (idempotency). The harness lives outside the repo at
`%TEMP%/opencode/pglite-streakpact/run.mjs`.

**Deployment pending:** steps 1–8 are blocked on the unreachable Supabase
project (`jvnzbnoljomuxzokwogo.supabase.co`). The migration has been validated
against real Postgres but not applied to the live database.

## Ticket 7 — Polish + smoke testing

### Problem
- The group screen still rendered the legacy `components/feed` duplicate, so
  reactions and comments worked on Home but not inside a pact.
- `useGroupSubmissions` / `fetchGroupSubmissions` duplicated the feed query and
  were unused after the social migration.
- Placeholder and “Phase N” comments described work that had already shipped.
- The `firebase` package, Firestore rules and Firebase-era docs were still in
  the repo even though no client code imported them.
- `seed-dev` could be triggered with no shared secret; `evaluate-streaks` and
  `weekly-wrapup` accepted unauthenticated calls.
- The production login screen still offered “Continue as guest” and a demo
  shortcut, both of which could create unusable sessions.
- Auth was gated on `user !== null`, so a Google/OAuth user with a session but
  no `public.users` row was pushed into the Auth stack; profile setup, biometric
  opt-in and pact join/create were tangled across three onboarding screens.
- Onboarding/hydration copy in the docs no longer matched the code.

### Acceptance criteria
- [x] Home and group feeds use the same `FeedCard` and projection; the legacy
      `components/feed` folder and `utils/feedAdapters.ts` are deleted.
- [x] Group feed refetches on pull-to-refresh and the activity submit button
      opens `SubmissionFlow` instead of doing nothing.
- [x] Unused group-submission hooks/services are removed.
- [x] Placeholder/phase comments are replaced with accurate descriptions.
- [x] `firebase` and `expo-local-authentication` are uninstalled; no Firebase
      env keys, Firestore rules or Firestore imports remain.
- [x] `seed-dev` returns 403 unless `x-seed-secret` matches `SEED_DEV_SECRET`;
      `evaluate-streaks` and `weekly-wrapup` require the service-role bearer.
- [x] Production builds hide guest and demo login; demo login is `__DEV__`-only.
- [x] The root navigator has explicit states: no session → Auth; session with no
      profile → SetupProfile; session with a profile → Main; profile unknown →
      loading.
- [x] Onboarding is one profile step. `BiometricSetupScreen`,
      `JoinOrCreateScreen` and the dev auth bypass are deleted; join/create
      lives on the Groups tab.
- [x] `SetupProfileScreen` completes the gate via `setUser(saved)` rather than
      navigating, and surfaces username/session errors.
- [x] `SplashScreen` no longer duplicates session restore; it only chooses
      Onboarding vs Login and waits for the boot restore to settle.
- [x] `README.md`, `PROJECT_CONTEXT.md`, `SETUP.md`, `supabase/README.md` and
      `docs/sql/schema.sql` match the current architecture; superseded plans are
      in `docs/archive/`.
- [x] A signed-out invite link survives sign-in: the code is stored for up to
      24 hours and replayed to `JoinGroup` once Main is reachable.
- [x] `npm run typecheck`, `npm run export:web`, all seven `deno check` calls and
      the four-scenario Playwright smoke suite pass.

### Verification log
- `npx tsc --noEmit` — clean (no output), run after the auth-gate rework.
- `npx expo export --platform web` — exported to `dist`; 2 bundles (AppEntry +
  static index).
- `npx -y deno check supabase/functions/*/index.ts` — all seven functions pass.
- Playwright smoke (`smoke.mjs`, headless Chrome against the exported `dist`,
  PostgREST mocked, session injected into localStorage):
  1. Signed out → onboarding renders → Skip → login form, no guest/demo buttons.
  2. Session + `get_my_profile` returns `[]` → SetupProfile, not Main.
  3. Session + profile row → Main (“Hey, Tester”, squad proofs).
  4. Signed out `/join/ABC234` → onboarding renders; after injecting a session
     and booting from `/`, `JoinGroup` opens with the code still prefilled.
  Result: **10/10 checks passed**, zero page errors. The only console error is
  the expected realtime WebSocket failure because the Supabase host does not
  resolve in this environment.
- Migration chain previously validated in PGlite: 84/84 checks.

**Deployment pending:** applying `0001`–`0005`, deploying the seven edge
functions, setting Vault secrets and verifying cron remain blocked on the
unreachable Supabase project (`jvnzbnoljomuxzokwogo.supabase.co`). Device push
still needs `expo-notifications` and an EAS project id.


## Ticket 8 — Device push token registration

### Problem
- No client registered a push token, so `users.fcm_token` stayed null and
  `send-push` always delivered zero tickets: in-app notifications worked, but a
  device never received one.
- `fcm_token` is server-owned (`0005` revoked client writes), so a device could
  not even store its token without an RPC.
- The only push plumbing was the `send-push` edge function itself.

### Acceptance criteria
- [x] `docs/sql/0006_push_tokens.sql` adds `set_push_token(p_token)`:
      SECURITY DEFINER, self-scoped (writes the caller's row only), rejects
      malformed tokens with `invalid_push_token` using the exact shape
      `send-push` accepts, and clears the token with `NULL`.
- [x] Execute is granted to `authenticated` only; anon and service_role are
      revoked. The token is never readable back (column grant unchanged).
- [x] `expo-notifications` is installed and `src/services/pushService.ts`
      owns the device side: EAS project id lookup, permission prompt, token
      mint, `set_push_token` RPC, and an "already synced" cache so a token is
      uploaded once per rotation.
- [x] Registration runs when the auth gate reaches Main and retries on app
      foreground; a failed attempt never blocks the UI.
- [x] Sign-out clears the device token (`set_push_token(NULL)`) while the
      session is still valid, then drops the local cache.
- [x] Foreground notifications are presented (banner + list) instead of being
      silently dropped; pushed payloads with `data.link` route through the
      same deep-link resolver as in-app notifications, including a tap that
      cold-launches the app before the gate is ready.
- [x] Web never registers or prompts: Expo push is a native channel.
- [x] Validation in the PGlite harness: token stored for the caller, malformed
      and empty tokens rejected, anon denied, self-scoping proven, `NULL`
      clears, and a second `0006` run leaves the RPC working.
- [x] `npx tsc --noEmit` and `npx expo export --platform web` pass.

### Notes
- Registration requires `extra.eas.projectId` — run `npx eas init` (or set the
  key in `app.json`) and rebuild. Without it the hook no-ops with a warning.
- Real device delivery additionally needs APNs keys (iOS) / FCM credentials
  (Android) uploaded to Expo.
- `send-push` callers should put a `streakpact://…` route in `data.link`; the
  tap handler in `PushSync` resolves it with `navigateDeepLink`.

### Verification log
- `npx tsc --noEmit` — clean.
- `npx expo export --platform web` — succeeded (2 bundles). The web export
  proves the push modules bundle safely and no-op on web.
- `npx -y deno check supabase/functions/*/index.ts` — all seven functions pass.
- PGlite harness: **91/91 checks** including the seven new push-token checks
  and a second `0006` run.
- Playwright smoke: **10/10 checks passed** (unchanged scenarios; web path is
  push-free).

**Deployment pending:** applying `0006` with the rest of the chain, deploying
`send-push`, configuring an EAS project id and APNs/FCM credentials remain
blocked on the unreachable Supabase project / EAS setup.
