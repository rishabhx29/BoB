import { supabase } from './supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { AppError } from './errors';
import { isRpcError } from './rpc';

const LOG_PREFIX = '[nudgeService]';
const NUDGE_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours

/**
 * Send a streak nudge to a teammate.
 * Enforces:
 *   - Current user is logged in
 *   - 4-hour cooldown per recipient (persisted in the `nudges` table)
 */
export async function sendNudge(
  recipientId: string,
  groupId: string,
  activityId?: string
): Promise<{ success: boolean; message: string }> {
  const user = useAuthStore.getState().user;
  if (!user?.id) {
    throw new AppError('NOT_AUTHENTICATED', 'You must be logged in to send a nudge');
  }

  if (user.id === recipientId) {
    throw new AppError('NOT_ALLOWED', 'You cannot nudge yourself');
  }

  const cutoff = new Date(Date.now() - NUDGE_COOLDOWN_MS).toISOString();

  const { data: recent, error: cooldownError } = await supabase
    .from('nudges')
    .select('id')
    .eq('sender_id', user.id)
    .eq('recipient_id', recipientId)
    .gte('sent_at', cutoff)
    .limit(1);

  if (cooldownError) {
    console.error(`${LOG_PREFIX} Failed to check cooldown:`, cooldownError);
    throw new AppError('NETWORK', 'Could not check nudge cooldown');
  }

  if (recent && recent.length > 0) {
    throw new AppError(
      'NOT_ALLOWED',
      'You can only nudge a teammate once every 4 hours.'
    );
  }

  const { error: insertError } = await supabase.from('nudges').insert({
    sender_id: user.id,
    recipient_id: recipientId,
    group_id: groupId,
    activity_id: activityId ?? null,
  });

  if (insertError) {
    if (isRpcError(insertError, 'nudge_cooldown')) {
      throw new AppError(
        'NOT_ALLOWED',
        'You can only nudge a teammate once every 4 hours.'
      );
    }
    console.error(`${LOG_PREFIX} Failed to persist nudge:`, insertError);
    throw new AppError('NETWORK', 'Failed to send nudge');
  }

  // The `nudges_notify_recipient` trigger creates the in-app notification
  // server-side, so clients cannot spoof notifications for other users.

  return { success: true, message: 'Nudged teammate!' };
}
