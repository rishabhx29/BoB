import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Invite links opened before sign-in.
 *
 * React Navigation can only route a deep link to screens that exist in the
 * current state. A signed-out invite (`streakpact://invite/ABC123`) resolves to
 * `JoinGroup`, which is not mounted until the user has a session *and* a
 * profile. Without this hand-off the code would be dropped and the invitee
 * would land on Home with no trace of the pact they tapped.
 *
 * The code is written when the URL arrives and consumed once the auth gate
 * reaches Main. Entries expire so a link opened days ago cannot surprise the
 * user after a later sign-in.
 */

const STORAGE_KEY = 'streakpact:pending_invite';
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

// Matches `…/join/ABC123`, `…/invite/ABC123` and the same paths in `exp://`
// dev links. Codes are the 6-character ambiguity-safe alphabet used by
// `create_group` (no 0, 1, I or O).
const INVITE_PATH = /(?:^|\/)(?:invite|join)\/([A-HJ-NP-Z2-9]{6})(?:[/?#]|$)/i;

export function extractInviteCode(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(INVITE_PATH);
  return match?.[1] ? match[1].toUpperCase() : null;
}

export async function rememberPendingInvite(code: string): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ code: code.toUpperCase(), at: Date.now() })
    );
  } catch {
    // Dropping the hand-off is preferable to breaking the link handler.
  }
}

export async function readPendingInvite(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { code?: unknown; at?: unknown };
    if (typeof parsed.code !== 'string' || typeof parsed.at !== 'number') {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return null;
    }

    if (Date.now() - parsed.at > MAX_AGE_MS) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed.code;
  } catch {
    return null;
  }
}

export async function clearPendingInvite(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do — the next read treats unreadable data as absent.
  }
}
