/**
 * Columns of `public.users` that are safe to expose to other members.
 *
 * The database revokes table-wide SELECT and grants only these columns, so
 * every client projection — including embedded `users(...)` resources — must
 * use this list. `email`, `fcm_token`, `timezone` and
 * `notification_preferences` are intentionally absent.
 */
export const PUBLIC_USER_COLUMNS = [
  'id',
  'username',
  'display_name',
  'avatar_url',
  'bio',
  'xp',
  'level',
  'total_submissions',
  'longest_streak',
  'shields_available',
  'created_at',
  'updated_at',
].join(', ');
