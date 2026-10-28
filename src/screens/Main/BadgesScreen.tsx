import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { Button, Icon, ScreenHeader, Text } from '@/components/ui';
import { COLORS, RADIUS, SPACE } from '@/constants/theme';
import { useAllBadges, useUserBadges } from '@/hooks/useBadges';
import { useAuthStore } from '@/store/useAuthStore';
import {
  BADGE_CATEGORY_META,
  BADGE_CATEGORY_ORDER,
  badgeColor,
  badgeIcon,
  hexToTint,
} from '@/utils/badgeVisuals';

export default function BadgesScreen({ navigation }: any) {
  const userId = useAuthStore((state) => state.user?.id ?? '');

  const allBadges = useAllBadges();
  const userBadges = useUserBadges(userId);

  const earnedById = useMemo(
    () => new Map((userBadges.data ?? []).map((badge) => [badge.badgeId, badge])),
    [userBadges.data]
  );

  const groups = useMemo(() => {
    const badges = allBadges.data ?? [];
    return BADGE_CATEGORY_ORDER.map((category) => {
      const items = badges
        .filter((badge) => badge.category === category)
        .map((badge) => ({
          badge,
          earnedAt: earnedById.get(badge.id)?.earnedAt ?? null,
        }))
        .sort((a, b) => {
          if (Boolean(a.earnedAt) !== Boolean(b.earnedAt)) {
            return a.earnedAt ? -1 : 1;
          }
          return a.badge.name.localeCompare(b.badge.name);
        });
      return { category, meta: BADGE_CATEGORY_META[category], items };
    }).filter((group) => group.items.length > 0);
  }, [allBadges.data, earnedById]);

  const earnedCount = userBadges.data?.length ?? 0;
  const totalCount = allBadges.data?.length ?? 0;
  const percent = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

  const isInitialLoading =
    (allBadges.isLoading && !allBadges.data) || (userBadges.isLoading && !userBadges.data);
  const hasError =
    (allBadges.isError && !allBadges.data) || (userBadges.isError && !userBadges.data);

  const retry = useCallback(() => {
    void allBadges.refetch();
    void userBadges.refetch();
  }, [allBadges.refetch, userBadges.refetch]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Achievements" onBack={() => navigation.goBack()} />

      {isInitialLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.accentBlue} />
          <Text variant="bodySm" color={COLORS.textSecondary} style={styles.centerText}>
            Loading achievements…
          </Text>
        </View>
      ) : hasError ? (
        <View style={styles.center}>
          <View style={styles.centerIcon}>
            <Icon name="warning-circle" size={24} color={COLORS.warning} />
          </View>
          <Text variant="headingSm" color={COLORS.textPrimary}>
            Couldn't load achievements
          </Text>
          <Text variant="bodySm" color={COLORS.textSecondary} style={styles.centerText}>
            Check your connection and try again.
          </Text>
          <View style={{ height: SPACE.lg }} />
          <Button label="Retry" variant="pill" leadingIcon="arrows-clockwise" onPress={retry} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryTop}>
              <View style={styles.summaryIcon}>
                <Icon name="trophy" size={24} color={COLORS.warning} />
              </View>
              <View style={styles.summaryText}>
                <Text variant="headingSm" color={COLORS.textPrimary}>
                  {earnedCount} of {totalCount} unlocked
                </Text>
                <Text variant="caption" color={COLORS.textSecondary}>
                  Keep showing up — the rare ones take time.
                </Text>
              </View>
              <Text variant="numericLg" color={COLORS.textPrimary}>
                {percent}%
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${percent}%` }]} />
            </View>
          </View>

          {groups.length === 0 ? (
            <View style={styles.center}>
              <Text variant="bodySm" color={COLORS.textSecondary} style={styles.centerText}>
                No achievements are available yet.
              </Text>
            </View>
          ) : (
            groups.map((group) => (
              <View key={group.category} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Icon name={group.meta.icon} size={16} color={COLORS.textSecondary} />
                  <Text variant="eyebrow" color={COLORS.textSecondary} style={styles.sectionTitle}>
                    {group.meta.title}
                  </Text>
                  <Text variant="caption" color={COLORS.textTertiary} style={styles.sectionCount}>
                    {group.items.filter((item) => item.earnedAt).length}/{group.items.length}
                  </Text>
                </View>
                <Text variant="caption" color={COLORS.textTertiary} style={styles.sectionSubtitle}>
                  {group.meta.subtitle}
                </Text>

                <View style={styles.groupCard}>
                  {group.items.map(({ badge, earnedAt }, index) => {
                    const color = badgeColor(badge.id);
                    const earned = Boolean(earnedAt);
                    return (
                      <React.Fragment key={badge.id}>
                        {index > 0 ? <View style={styles.divider} /> : null}
                        <View style={[styles.badgeRow, !earned ? styles.badgeRowLocked : null]}>
                          <View
                            style={[
                              styles.badgeIcon,
                              {
                                backgroundColor: earned
                                  ? hexToTint(color, 0.16)
                                  : COLORS.bgSurface,
                              },
                            ]}
                          >
                            <Icon
                              name={badgeIcon(badge.icon)}
                              size={22}
                              color={earned ? color : COLORS.textTertiary}
                            />
                          </View>
                          <View style={styles.badgeBody}>
                            <Text
                              variant="bodySm"
                              color={earned ? COLORS.textPrimary : COLORS.textSecondary}
                            >
                              {badge.name}
                            </Text>
                            <Text variant="caption" color={COLORS.textTertiary} numberOfLines={2}>
                              {badge.description}
                            </Text>
                          </View>
                          {earnedAt ? (
                            <View style={styles.earnedTag}>
                              <Icon name="check-circle" size={13} color={COLORS.success} />
                              <Text variant="caption" color={COLORS.textSecondary}>
                                {formatBadgeDate(earnedAt)}
                              </Text>
                            </View>
                          ) : (
                            <View style={styles.lockedTag}>
                              <Icon name="lock" size={12} color={COLORS.textTertiary} />
                              <Text variant="caption" color={COLORS.textTertiary}>
                                Locked
                              </Text>
                            </View>
                          )}
                        </View>
                      </React.Fragment>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function formatBadgeDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Earned';
  return format(date, 'MMM d, yyyy');
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bgBase },
  content: { paddingHorizontal: SPACE.lg, paddingBottom: 80 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACE.xxl,
    paddingVertical: SPACE.xxl,
  },
  centerText: { textAlign: 'center', marginTop: 6, maxWidth: 280 },
  centerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgPanel,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    marginBottom: SPACE.md,
  },
  summaryCard: {
    backgroundColor: COLORS.bgPanel,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    borderRadius: RADIUS.xl,
    padding: SPACE.md,
    marginTop: SPACE.sm,
    marginBottom: SPACE.lg,
    gap: SPACE.md,
  },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md },
  summaryIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
  },
  summaryText: { flex: 1, gap: 2 },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.bgSurface,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: COLORS.accentBlue },
  section: { marginBottom: SPACE.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  sectionTitle: { letterSpacing: 1.1 },
  sectionCount: { marginLeft: 'auto' },
  sectionSubtitle: { marginTop: 2, marginBottom: SPACE.sm },
  groupCard: {
    backgroundColor: COLORS.bgPanel,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    paddingHorizontal: SPACE.md,
    paddingVertical: 13,
    minHeight: 64,
  },
  badgeRowLocked: { opacity: 0.72 },
  badgeIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeBody: { flex: 1, gap: 2 },
  earnedTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lockedTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.hairline, marginLeft: 68 },
});
