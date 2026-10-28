import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationRealtime } from '@/hooks/useNotifications';

/**
 * Headless component mounted once inside the query provider. Keeps the
 * notification list and unread badge in sync while the app is running.
 */
export function NotificationSync(): null {
  const userId = useAuthStore((state) => state.user?.id ?? '');
  useNotificationRealtime(userId);
  return null;
}
