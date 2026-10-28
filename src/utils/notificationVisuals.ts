import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns';
import { IconName } from '@/components/ui/Icon';
import { COLORS } from '@/constants/theme';
import { NotificationType } from '@/types';

export interface NotificationVisual {
  icon: IconName;
  color: string;
  tint: string;
}

const VISUALS: Record<NotificationType, NotificationVisual> = {
  daily_reminder: {
    icon: 'bell',
    color: COLORS.accentBlue,
    tint: 'rgba(58, 130, 247, 0.14)',
  },
  teammate_submitted: {
    icon: 'users',
    color: COLORS.accentBlue,
    tint: 'rgba(58, 130, 247, 0.14)',
  },
  streak_at_risk: {
    icon: 'fire',
    color: COLORS.warning,
    tint: 'rgba(245, 158, 11, 0.14)',
  },
  streak_broken: {
    icon: 'fire',
    color: COLORS.accentRed,
    tint: 'rgba(255, 51, 75, 0.14)',
  },
  streak_milestone: {
    icon: 'trophy',
    color: COLORS.warning,
    tint: 'rgba(245, 158, 11, 0.14)',
  },
  nudge_received: {
    icon: 'hand-waving',
    color: COLORS.warning,
    tint: 'rgba(245, 158, 11, 0.14)',
  },
  reaction_received: {
    icon: 'heart',
    color: COLORS.accentRed,
    tint: 'rgba(255, 51, 75, 0.14)',
  },
  comment_received: {
    icon: 'chat-circle',
    color: COLORS.accentBlue,
    tint: 'rgba(58, 130, 247, 0.14)',
  },
  new_group_member: {
    icon: 'user-plus',
    color: COLORS.accentBlue,
    tint: 'rgba(58, 130, 247, 0.14)',
  },
  weekly_wrapup: {
    icon: 'calendar-check',
    color: COLORS.accentBlue,
    tint: 'rgba(58, 130, 247, 0.14)',
  },
  badge_earned: {
    icon: 'medal',
    color: COLORS.warning,
    tint: 'rgba(245, 158, 11, 0.14)',
  },
  level_up: {
    icon: 'lightning',
    color: COLORS.accentBlue,
    tint: 'rgba(58, 130, 247, 0.14)',
  },
  shield_earned: {
    icon: 'shield-check',
    color: COLORS.success,
    tint: 'rgba(46, 157, 106, 0.14)',
  },
  system: {
    icon: 'bell',
    color: COLORS.textSecondary,
    tint: 'rgba(255, 255, 255, 0.06)',
  },
};

export function notificationVisual(type: NotificationType): NotificationVisual {
  return VISUALS[type] ?? VISUALS.system;
}

export function notificationTimeLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return formatDistanceToNow(date, { addSuffix: true });
}

/** Section label for the notification list. */
export function notificationDayLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Earlier';
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  if (isThisWeek(date)) return 'This week';
  return 'Earlier';
}
