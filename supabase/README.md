# Supabase Edge Functions

Deno functions deployed to the Supabase edge runtime. All business logic that
must not trust the client lives here or in a database RPC.

## Structure

```
supabase/
├── config.toml
└── functions/
    ├── _shared/               # CORS, responses, clients, gamification
    ├── award-xp/              # service role, idempotent XP
    ├── evaluate-badges/       # user JWT (self) or service role (batch)
    ├── evaluate-streaks/      # service role, daily cron
    ├── send-push/             # service role, Expo push + preferences
    ├── weekly-wrapup/         # service role, Sunday cron
    ├── seed-dev/              # optional, x-seed-secret gated
    └── hello/                 # public deployment check
```

## Auth model

| Function | Required caller |
|---|---|
| `award-xp` | `Authorization: Bearer <service-role-key>` |
| `evaluate-streaks` | service role |
| `send-push` | service role |
| `weekly-wrapup` | service role |
| `evaluate-badges` | user JWT (self) or service role (batch) |
| `seed-dev` | `x-seed-secret: <SEED_DEV_SECRET>` |
| `hello` | none |

The service-role checks compare the header to `SUPABASE_SERVICE_ROLE_KEY`
exactly. pg_cron sends that header through `public.invoke_edge_function()`.

## Deploy

```powershell
supabase login
supabase link --project-ref <project-ref>

supabase functions deploy hello --no-verify-jwt
supabase functions deploy award-xp
supabase functions deploy evaluate-badges
supabase functions deploy evaluate-streaks
supabase functions deploy send-push
supabase functions deploy weekly-wrapup

# Optional demo seed — never deploy without a secret.
supabase functions deploy seed-dev --no-verify-jwt
supabase secrets set SEED_DEV_SECRET=<long-random-value>
```

## Local development

```bash
supabase start
supabase functions serve evaluate-badges --env-file .env.local
```

Cron scheduled functions can be invoked locally with a normal POST and the
service-role key from `supabase status`.

## Environment

Supabase injects `SUPABASE_URL`, `SUPABASE_ANON_KEY` and
`SUPABASE_SERVICE_ROLE_KEY`. `seed-dev` additionally reads `SEED_DEV_SECRET`.
Cron credentials (`project_url`, `service_role_key`) live in Vault, with
`app.settings.*` fallbacks — see `docs/sql/0003_gamification.sql`.

## Adding a function

1. Create `supabase/functions/<name>/index.ts`.
2. Import CORS/response helpers and the service or user client from
   `_shared/`.
3. Decide the auth model first: service role, user JWT or an explicit secret.
4. `npx -y deno check supabase/functions/<name>/index.ts`.
5. Deploy and update this table plus `README.md`.
