/**
 * Application error taxonomy shared across services.
 *
 * Services throw `AppError` instead of raw library errors so UI layers can
 * branch on a stable `code` instead of parsing provider-specific messages.
 */

// ─── Error Codes ─────────────────────────────────────────────────────────────

export type AppErrorCode =
  | 'NOT_FOUND'
  | 'GROUP_FULL'
  | 'ALREADY_MEMBER'
  | 'NOT_ADMIN'
  | 'NOT_ALLOWED'
  | 'NETWORK';

// ─── AppError ────────────────────────────────────────────────────────────────

export class AppError extends Error {
  readonly code: AppErrorCode;

  constructor(code: AppErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'AppError';
    this.code = code;
  }
}

// ─── Type Guard ──────────────────────────────────────────────────────────────

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
