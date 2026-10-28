import { NotificationPreferences } from '@/types';

/**
 * Defaults used when `users.notification_preferences` is missing or partial.
 * Push is opt-out: an existing account keeps receiving the notifications it
 * already had until the user explicitly turns them off.
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  pushEnabled: true,
  streakReminders: true,
  socialActivity: true,
  nudges: true,
  weeklyRecap: true,
};

export function normalizeNotificationPreferences(raw: unknown): NotificationPreferences {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }

  const value = raw as Record<string, unknown>;
  return {
    pushEnabled:
      typeof value.pushEnabled === 'boolean'
        ? value.pushEnabled
        : DEFAULT_NOTIFICATION_PREFERENCES.pushEnabled,
    streakReminders:
      typeof value.streakReminders === 'boolean'
        ? value.streakReminders
        : DEFAULT_NOTIFICATION_PREFERENCES.streakReminders,
    socialActivity:
      typeof value.socialActivity === 'boolean'
        ? value.socialActivity
        : DEFAULT_NOTIFICATION_PREFERENCES.socialActivity,
    nudges:
      typeof value.nudges === 'boolean'
        ? value.nudges
        : DEFAULT_NOTIFICATION_PREFERENCES.nudges,
    weeklyRecap:
      typeof value.weeklyRecap === 'boolean'
        ? value.weeklyRecap
        : DEFAULT_NOTIFICATION_PREFERENCES.weeklyRecap,
  };
}
