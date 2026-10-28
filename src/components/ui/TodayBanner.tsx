import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from './Text';
import { COLORS, SPACE, RADIUS } from '@/constants/theme';
import { TodayActivityItem } from '@/types';
import { formatDistanceToNow } from 'date-fns';

type Props = {
  items: TodayActivityItem[];
  isLoading: boolean;
  isError: boolean;
  onPressActivity: (activityId: string, groupId: string) => void;
  onExplorePacts: () => void;
};

/**
 * Real "Today" board: the user's activities that are due today (or were
 * already logged today). Tapping a card opens the real activity in the
 * submission flow.
 */
export function TodayBanner({
  items,
  isLoading,
  isError,
  onPressActivity,
  onExplorePacts,
}: Props) {
  const doneCount = items.filter((item) => Boolean(item.submission)).length;

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text variant="headingMd" color={COLORS.textPrimary}>
          Today
        </Text>
        {items.length > 0 && (
          <Text variant="caption" color={COLORS.textTertiary}>
            {doneCount}/{items.length} done
          </Text>
        )}
      </View>

      {isLoading ? (
        <View style={styles.statusCard}>
          <ActivityIndicator color={COLORS.accentBlue} size="small" />
          <Text variant="caption" color={COLORS.textSecondary}>
            Loading today's habits…
          </Text>
        </View>
      ) : isError && items.length === 0 ? (
        <View style={styles.statusCard}>
          <Text style={styles.statusEmoji}>⚠️</Text>
          <Text variant="caption" color={COLORS.textSecondary}>
            Couldn't load today's habits. Pull down to retry.
          </Text>
        </View>
      ) : items.length === 0 ? (
        <Pressable
          onPress={onExplorePacts}
          style={({ pressed }) => [styles.statusCard, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Nothing due today. Open your pacts."
        >
          <Text style={styles.statusEmoji}>🌤️</Text>
          <View style={styles.statusTextBlock}>
            <Text variant="body" color={COLORS.textPrimary}>
              Nothing due today
            </Text>
            <Text variant="caption" color={COLORS.textSecondary}>
              Take the win — or add a new activity to a pact.
            </Text>
          </View>
          <Text variant="caption" color={COLORS.accentBlue} style={styles.statusCta}>
            Open
          </Text>
        </Pressable>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {items.map(({ activity, group, submission, streak }) => {
            const isDone = Boolean(submission);
            const timeAgo = submission
              ? formatRelative(submission.clientTimestamp)
              : null;

            return (
              <Pressable
                key={activity.id}
                onPress={() => onPressActivity(activity.id, group.id)}
                style={({ pressed }) => [styles.activityCard, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`${activity.name}, ${isDone ? 'done' : 'pending'}`}
              >
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: `${activity.color || COLORS.accentBlue}20` },
                    ]}
                  >
                    <Text style={styles.iconText}>{activity.icon || '⚡'}</Text>
                  </View>
                  <View style={styles.nameBlock}>
                    <Text
                      variant="body"
                      color={COLORS.textPrimary}
                      style={styles.activityName}
                      numberOfLines={1}
                    >
                      {activity.name}
                    </Text>
                    <Text variant="caption" color={COLORS.textTertiary} numberOfLines={1}>
                      {group.emoji ? `${group.emoji} ` : ''}
                      {group.name}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: isDone
                          ? `${COLORS.success}15`
                          : `${COLORS.warning}15`,
                      },
                    ]}
                  >
                    <Text
                      variant="caption"
                      style={[
                        styles.statusBadgeText,
                        { color: isDone ? COLORS.success : COLORS.warning },
                      ]}
                    >
                      {isDone ? 'Done' : 'Pending'}
                    </Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <Text variant="caption" color={COLORS.textSecondary} numberOfLines={1}>
                    {isDone
                      ? `${timeAgo}${submission?.xpEarned ? ` • +${submission.xpEarned} XP` : ''}`
                      : streak > 0
                        ? `🔥 ${streak}-day streak on the line`
                        : 'Tap to log proof'}
                  </Text>
                </View>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: isDone ? '100%' : '0%',
                        backgroundColor: COLORS.success,
                      },
                    ]}
                  />
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

function formatRelative(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Logged today';
  try {
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'Logged today';
  }
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACE.md,
    backgroundColor: COLORS.bgBase,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.hairline,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.lg,
    marginBottom: SPACE.sm,
  },
  scrollContent: {
    paddingHorizontal: SPACE.lg,
    gap: SPACE.md,
  },
  activityCard: {
    width: 240,
    backgroundColor: COLORS.bgPanel,
    padding: SPACE.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    gap: SPACE.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 17,
  },
  nameBlock: {
    flex: 1,
  },
  activityName: {
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  statusBadgeText: {
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 10,
  },
  metaRow: {
    minHeight: 18,
  },
  progressTrack: {
    height: 4,
    backgroundColor: COLORS.bgSurface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    marginHorizontal: SPACE.lg,
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.md,
    backgroundColor: COLORS.bgPanel,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.hairline,
  },
  statusEmoji: {
    fontSize: 20,
  },
  statusTextBlock: {
    flex: 1,
  },
  statusCta: {
    fontWeight: '700',
  },
});
