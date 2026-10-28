import type { PostgrestError } from '@supabase/supabase-js';

/**
 * PostgREST is inconsistent about composite-returning functions: `RETURNS
 * SETOF <table>` comes back as an array, while `RETURNS <table>` comes back as
 * a single object. This normalizes both shapes.
 */
export function firstRow<T>(data: T | T[] | null | undefined): T | null {
  if (data == null) return null;
  return Array.isArray(data) ? data[0] ?? null : data;
}

/** Message raised by `RAISE EXCEPTION 'code'` inside a Postgres function. */
export function rpcErrorMessage(error: PostgrestError | null | undefined): string {
  return (error?.message ?? '').trim();
}

/**
 * Match a server-raised error token without coupling callers to PostgREST's
 * wrapper text. Messages are exact tokens today, but `includes` keeps this
 * resilient if a driver starts prefixing them.
 */
export function isRpcError(
  error: PostgrestError | null | undefined,
  code: string
): boolean {
  const message = rpcErrorMessage(error);
  return message === code || message.includes(code);
}
