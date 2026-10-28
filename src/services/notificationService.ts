import { supabase } from './supabase';
import { AppError } from './errors';
import { AppNotification, NotificationType } from '@/types';

const LOG_PREFIX = '[notificationService]';

export const NOTIFICATION_PAGE_SIZE = 30;

export interface NotificationPage {
  items: AppNotification[];
  hasMore: boolean;
}

const KNOWN_TYPES: NotificationType[] = [
  'daily_reminder',
  'teammate_submitted',
  'streak_at_risk',
  'streak_broken',
  'streak_milestone',
  'nudge_received',
  'reaction_received',
  'comment_received',
  'new_group_member',
  'weekly_wrapup',
  'badge_earned',
  'level_up',
  'shield_earned',
  'system',
];

function mapType(value: unknown): NotificationType {
  return KNOWN_TYPES.includes(value as NotificationType)
    ? (value as NotificationType)
    : 'system';
}

function mapNotificationRow(row: any): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    type: mapType(row.type),
    title: row.title ?? 'Notification',
    body: row.body ?? '',
    deepLink: row.deep_link ?? null,
    isRead: row.is_read === true,
    createdAt: row.created_at,
  };
}

/**
 * One page of the current user's notifications, newest first.
 * RLS scopes every query to `auth.uid()`.
 */
export async function fetchNotifications({
  offset = 0,
  limit = NOTIFICATION_PAGE_SIZE,
}: {
  offset?: number;
  limit?: number;
} = {}): Promise<NotificationPage> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, user_id, type, title, body, deep_link, is_read, created_at')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(offset, offset + limit);

  if (error) {
    console.error(`${LOG_PREFIX} Failed to load notifications:`, error);
    throw new AppError('NETWORK', 'Failed to load notifications');
  }

  const rows = (data ?? []) as any[];
  const hasMore = rows.length > limit;

  return {
    items: (hasMore ? rows.slice(0, limit) : rows).map(mapNotificationRow),
    hasMore,
  };
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false);

  if (error) {
    console.error(`${LOG_PREFIX} Failed to count unread notifications:`, error);
    throw new AppError('NETWORK', 'Failed to count unread notifications');
  }

  return count ?? 0;
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('is_read', false);

  if (error) {
    console.error(`${LOG_PREFIX} Failed to mark notification read:`, error);
    throw new AppError('NETWORK', 'Failed to update notification');
  }
}

export async function markNotificationUnread(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: false })
    .eq('id', notificationId)
    .eq('is_read', true);

  if (error) {
    console.error(`${LOG_PREFIX} Failed to mark notification unread:`, error);
    throw new AppError('NETWORK', 'Failed to update notification');
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('is_read', false);

  if (error) {
    console.error(`${LOG_PREFIX} Failed to mark all notifications read:`, error);
    throw new AppError('NETWORK', 'Failed to update notifications');
  }
}

export async function deleteNotification(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) {
    console.error(`${LOG_PREFIX} Failed to delete notification:`, error);
    throw new AppError('NETWORK', 'Failed to delete notification');
  }
}

/**
 * Live notification inserts/updates for one user. Returns an unsubscribe fn.
 * The callback receives the changed row so callers can decide whether to
 * invalidate caches or show a toast.
 */
export function subscribeToNotifications(
  userId: string,
  onChange: (payload: { eventType: string; row: any }) => void
): () => void {
  const channel = supabase
    .channel(`notifications-${userId}-${Math.random().toString(36).slice(2, 8)}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onChange({
          eventType: payload.eventType,
          row: (payload as any).new ?? null,
        });
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export { mapNotificationRow };
