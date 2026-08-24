/**
 * Environment variable validation for Supabase + Firebase.
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

  // ─── Firebase ─────────────────────────────────────────────────────────────
  FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
  FIREBASE_MEASUREMENT_ID: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID ?? '',
};

// Validate in development that keys are present
if (__DEV__) {
  const missing = Object.entries(ENV)
    .filter(([, val]) => val === '')
    .map(([key]) => key);
  
  if (missing.length > 0) {
    console.warn(
      `[StreakPact] Missing environment variables:\n${missing.map(k => `  EXPO_PUBLIC_${k}`).join('\n')}\n\nCreate a .env file at the project root. See .env.example.`
    );
  }
}

export default ENV;
