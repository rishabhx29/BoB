import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Text, Icon, Avatar, Button } from '@/components/ui';
import { COLORS, RADIUS, SPACE } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { useUserGroups, useUnreadNotificationCount } from '@/hooks';
import { useFeed } from '@/hooks/useFeed';
import { useHomeData } from '@/hooks/useHomeData';
import { FeedCard } from '@/components/ui/FeedCard';
import { TodayBanner } from '@/components/ui/TodayBanner';
import { useNavigation } from '@react-navigation/native';
import { FeedItem } from '@/types';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const [feedFilter, setFeedFilter] = useState<'all' | 'mine'>('all');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const unread = useUnreadNotificationCount(user?.id ?? '');

  const { data: userGroups = [], isLoading: groupsLoading } = useUserGroups();
  const groupIds = useMemo(() => userGroups.map((group) => group.id), [userGroups]);

  // Drop a stale pact filter if the user left that pact.
  const activeGroupId =
    selectedGroupId && groupIds.includes(selectedGroupId) ? selectedGroupId : null;

  const feed = useFeed({
    groupIds,
    selectedGroupId: activeGroupId,
    userId: feedFilter === 'mine' ? user?.id : undefined,
  });
  const home = useHomeData(userGroups, user?.id);

  const feedItems = useMemo(
    () => feed.data?.pages.flatMap((page) => page.items) ?? [],
    [feed.data]
  );

  const handleRefresh = useCallback(() => {
    void Promise.all([feed.refetch(), home.refetch()]);
  }, [feed.refetch, home.refetch]);

  const handleEndReached = useCallback(() => {
    if (feed.hasNextPage && !feed.isFetchingNextPage) {
      void feed.fetchNextPage();
    }
  }, [feed.hasNextPage, feed.isFetchingNextPage, feed.fetchNextPage]);

  const openPacts = useCallback(() => {
    navigation.navigate('Main', { screen: 'Groups' });
  }, [navigation]);

  const openActivity = useCallback(
    (activityId: string, groupId: string) => {
      navigation.navigate('SubmissionFlow', { activityId, groupId });
    },
    [navigation]
  );

  const renderItem = ({ item }: { item: FeedItem }) => (
    <View style={styles.cardWrapper}>
      <FeedCard item={item} />
    </View>
  );

  const renderEmpty = () => {
    if (groupsLoading || feed.isLoading) {
      return (
        <View style={styles.loadingState}>
          <ActivityIndicator color={COLORS.accentBlue} size="small" />
          <Text variant="caption" color={COLORS.textSecondary}>
            Loading squad proofs…
          </Text>
        </View>
      );
    }

    if (feed.isError) {
      return (
        <View style={styles.empty}>
          <View style={styles.emptyIconCircle}>
            <Icon name="warning-circle" size={24} color={COLORS.warning} />
          </View>
          <Text variant="headingSm" color={COLORS.textPrimary} style={styles.emptyTitle}>
            Couldn't Load Proofs
          </Text>
          <Text variant="bodySm" color={COLORS.textSecondary} style={styles.emptySub}>
            Check your connection and try again.
          </Text>
          <View style={{ height: 18 }} />
          <Button
            label="Retry"
            variant="pill"
            leadingIcon="arrows-clockwise"
            onPress={() => void feed.refetch()}
          />
        </View>
      );
    }

    if (userGroups.length === 0) {
      return (
        <View style={styles.empty}>
          <View style={styles.emptyIconCircle}>
            <Icon name="users" size={24} color={COLORS.accentBlue} />
          </View>
          <Text variant="headingSm" color={COLORS.textPrimary} style={styles.emptyTitle}>
            Your Feed Is Waiting
          </Text>
          <Text variant="bodySm" color={COLORS.textSecondary} style={styles.emptySub}>
            Create or join a pact to start collecting proofs together.
          </Text>
          <View style={{ height: 18 }} />
          <Button
            label="Find Your Pact"
            variant="pill"
            leadingIcon="users"
            onPress={openPacts}
          />
        </View>
      );
    }

    return (
      <View style={styles.empty}>
        <View style={styles.emptyIconCircle}>
          <Icon name="fire" size={24} color={COLORS.accentRed} />
        </View>
        <Text variant="headingSm" color={COLORS.textPrimary} style={styles.emptyTitle}>
          No Proofs Yet Today
        </Text>
        <Text variant="bodySm" color={COLORS.textSecondary} style={styles.emptySub}>
          Complete your habits or cheer on your pact members to see activity here.
        </Text>
        <View style={{ height: 18 }} />
        <Button
          label="Explore Pacts"
          variant="pill"
          leadingIcon="users"
          onPress={openPacts}
        />
      </View>
    );
  };

  const renderFooter = () => {
    if (feed.isFetchingNextPage) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator color={COLORS.accentBlue} size="small" />
        </View>
      );
    }
    if (feed.isError && feedItems.length > 0) {
      return (
        <View style={styles.footer}>
          <Text variant="caption" color={COLORS.textTertiary}>
            Couldn't load more proofs. Pull down to retry.
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={feedItems}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <HomeHeader
              name={user?.displayName || 'there'}
              avatarUrl={user?.avatarUrl}
              pactsCount={userGroups.length}
              streakDays={home.streakDays}
              doneToday={home.doneToday}
              unreadCount={unread.data ?? 0}
              onPressNotifications={() => navigation.navigate('Notifications')}
            />
            <TodayBanner
              items={home.todayItems}
              isLoading={home.isLoading}
              isError={home.isError}
              onPressActivity={openActivity}
              onExplorePacts={openPacts}
            />
            <View style={styles.feedHeaderRow}>
              <Text variant="headingSm" color={COLORS.textPrimary}>
                Squad Proofs
              </Text>
              <View style={styles.filterPills}>
                <Pressable
                  onPress={() => setFeedFilter('all')}
                  style={[
                    styles.filterPill,
                    feedFilter === 'all' ? styles.filterPillActive : styles.filterPillInactive,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: feedFilter === 'all' }}
                >
                  <Text
                    variant="caption"
                    color={feedFilter === 'all' ? '#FFFFFF' : COLORS.textTertiary}
                  >
                    All Pacts
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setFeedFilter('mine')}
                  style={[
                    styles.filterPill,
                    feedFilter === 'mine' ? styles.filterPillActive : styles.filterPillInactive,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: feedFilter === 'mine' }}
                >
                  <Text
                    variant="caption"
                    color={feedFilter === 'mine' ? '#FFFFFF' : COLORS.textTertiary}
                  >
                    My Activity
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Horizontal Squad Selector Pills */}
            {userGroups.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.groupFilterScroll}
              >
                <Pressable
                  onPress={() => setSelectedGroupId(null)}
                  style={[
                    styles.groupFilterChip,
                    activeGroupId === null
                      ? styles.groupFilterChipActive
                      : styles.groupFilterChipInactive,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activeGroupId === null }}
                >
                  <Text
                    variant="caption"
                    color={activeGroupId === null ? '#FFFFFF' : COLORS.textSecondary}
                    style={styles.groupFilterText}
                  >
                    ✨ All Squads
                  </Text>
                </Pressable>
                {userGroups.map((group) => {
                  const isSelected = activeGroupId === group.id;
                  return (
                    <Pressable
                      key={group.id}
                      onPress={() => setSelectedGroupId(isSelected ? null : group.id)}
                      style={[
                        styles.groupFilterChip,
                        isSelected
                          ? styles.groupFilterChipActive
                          : styles.groupFilterChipInactive,
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                    >
                      <Text
                        variant="caption"
                        color={isSelected ? '#FFFFFF' : COLORS.textSecondary}
                        style={styles.groupFilterText}
                      >
                        {group.emoji || '⚡'} {group.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </>
        }
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty()}
        ListFooterComponent={renderFooter()}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={feed.isRefetching || home.isRefetching}
            onRefresh={handleRefresh}
            tintColor={COLORS.accentBlue}
            colors={[COLORS.accentBlue]}
          />
        }
      />
    </SafeAreaView>
  );
}

function HomeHeader({
  name,
  avatarUrl,
  pactsCount,
  streakDays,
  doneToday,
  unreadCount,
  onPressNotifications,
}: {
  name: string;
  avatarUrl?: string | null;
  pactsCount: number;
  streakDays: number;
  doneToday: number;
  unreadCount: number;
  onPressNotifications: () => void;
}) {
  const firstName = name.split(' ')[0] || 'there';

  return (
    <View style={styles.header}>
      {/* Top Greeting & Profile Bar */}
      <View style={styles.topGreetingBar}>
        <View style={styles.greetingText}>
          <Text variant="caption" color={COLORS.textTertiary} style={styles.greetingEyebrow}>
            DAILY ACCOUNTABILITY
          </Text>
          <Text variant="headingLg" color={COLORS.textPrimary} style={styles.greetingTitle}>
            Hey, {firstName}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={onPressNotifications}
            style={({ pressed }) => [styles.bellButton, pressed ? styles.bellButtonPressed : null]}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={
              unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'
            }
          >
            <Icon name="bell" size={20} color={COLORS.textPrimary} />
            {unreadCount > 0 ? (
              <View style={styles.bellBadge}>
                <Text variant="caption" color="#FFFFFF" style={styles.bellBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
          <Avatar name={name} size={48} url={avatarUrl ?? null} />
        </View>
      </View>

      {/* Stats Card */}
      <View style={styles.statsCard}>
        <View style={styles.statBox}>
          <View style={styles.statHeaderRow}>
            <View style={styles.statIconBadge}>
              <Icon name="fire" size={14} color={COLORS.accentRed} />
            </View>
            <Text variant="caption" color={COLORS.textSecondary}>Streak</Text>
          </View>
          <Text variant="numericMd" color={COLORS.textPrimary} style={styles.statVal}>
            {streakDays}d
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statBox}>
          <View style={styles.statHeaderRow}>
            <View style={[styles.statIconBadge, { backgroundColor: 'rgba(46, 157, 106, 0.15)' }]}>
              <Icon name="check" size={14} color={COLORS.positive} />
            </View>
            <Text variant="caption" color={COLORS.textSecondary}>Today</Text>
          </View>
          <Text variant="numericMd" color={COLORS.textPrimary} style={styles.statVal}>
            {doneToday} done
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statBox}>
          <View style={styles.statHeaderRow}>
            <View style={[styles.statIconBadge, { backgroundColor: 'rgba(58, 130, 247, 0.15)' }]}>
              <Icon name="users" size={14} color={COLORS.accentBlue} />
            </View>
            <Text variant="caption" color={COLORS.textSecondary}>Pacts</Text>
          </View>
          <Text variant="numericMd" color={COLORS.textPrimary} style={styles.statVal}>
            {pactsCount}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgBase,
  },
  listContent: {
    paddingBottom: 120,
  },
  cardWrapper: {
    paddingHorizontal: 16,
  },
  header: {
    paddingHorizontal: SPACE.lg,
    paddingTop: SPACE.md,
    paddingBottom: SPACE.sm,
  },
  topGreetingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACE.sm,
  },
  greetingText: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.bgPanel,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellButtonPressed: {
    backgroundColor: COLORS.bgSurface,
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: COLORS.accentRed,
    borderWidth: 2,
    borderColor: COLORS.bgBase,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeText: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '700',
  },
  greetingEyebrow: {
    letterSpacing: 1.2,
    fontSize: 10,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  greetingTitle: {
    letterSpacing: -0.5,
  },
  feedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACE.xl,
    marginBottom: SPACE.md,
    paddingHorizontal: SPACE.lg,
  },
  filterPills: {
    flexDirection: 'row',
    gap: SPACE.xs,
  },
  filterPill: {
    paddingHorizontal: SPACE.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  filterPillActive: {
    backgroundColor: COLORS.accentBlue,
  },
  filterPillInactive: {
    backgroundColor: COLORS.bgPanel,
    borderWidth: 1,
    borderColor: COLORS.hairline,
  },
  groupFilterScroll: {
    paddingHorizontal: SPACE.lg,
    paddingBottom: SPACE.md,
    gap: SPACE.xs,
  },
  groupFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupFilterChipActive: {
    backgroundColor: COLORS.accentMuted,
    borderWidth: 1,
    borderColor: COLORS.accentBlue,
  },
  groupFilterChipInactive: {
    backgroundColor: COLORS.bgPanel,
    borderWidth: 1,
    borderColor: COLORS.hairline,
  },
  groupFilterText: {
    fontWeight: '600',
  },
  loadingState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
    paddingVertical: SPACE.xl,
  },
  empty: {
    paddingHorizontal: SPACE.lg,
    marginTop: SPACE.xl,
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${COLORS.accentRed}15`,
    borderWidth: 1,
    borderColor: `${COLORS.accentRed}30`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACE.md,
  },
  emptyTitle: {
    marginBottom: SPACE.xs,
  },
  emptySub: {
    textAlign: 'center',
  },
  footer: {
    paddingVertical: SPACE.lg,
    alignItems: 'center',
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgPanel,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    marginBottom: SPACE.lg,
  },
  statBox: {
    flex: 1,
    alignItems: 'flex-start',
    paddingHorizontal: 4,
  },
  statHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  statIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 51, 75, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statVal: {
    fontSize: 16,
    lineHeight: 20,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.hairline,
    marginHorizontal: 8,
  },
});
