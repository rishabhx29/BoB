/**
 * Environment variable validation for Supabase.
 *
 * HOW TO USE:
 * 1. Create a `.env` file at the project root.
 * 2. Add the variables listed in `.env.example`.
 * 3. These are accessed via `process.env.EXPO_PUBLIC_*` (Expo SDK 49+).
 *
 * All keys are prefixed with EXPO_PUBLIC_ so they are bundled client-side.
 * DO NOT put secret keys here — these are all public-facing config values.
 */

const ENV = {
  // ─── Supabase ─────────────────────────────────────────────────────────────
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  SUPABASE_PROJECT_REF: process.env.EXPO_PUBLIC_SUPABASE_PROJECT_REF ?? '',
};

// Warn about missing Supabase (required).
if (__DEV__) {
  const supabaseMissing = [ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY].filter((v) => v === '');
  if (supabaseMissing.length > 0) {
    console.warn(
      '[StreakPact] Supabase env vars missing — auth + data calls will fail.\n' +
        'Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env'
    );
  }
}

export default ENV;
