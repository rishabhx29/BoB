import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Icon, ScreenHeader, Text } from '@/components/ui';
import { COLORS, RADIUS, SPACE } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMarkNotificationUnread,
  useNotifications,
  useUnreadNotificationCount,
} from '@/hooks/useNotifications';
import { AppNotification } from '@/types';
import { navigateDeepLink } from '@/navigation/deepLinks';
import {
  notificationDayLabel,
  notificationTimeLabel,
  notificationVisual,
} from '@/utils/notificationVisuals';

export default function NotificationsScreen({ navigation }: any) {
  const userId = useAuthStore((state) => state.user?.id ?? '');

  const notifications = useNotifications(userId);
  const unread = useUnreadNotificationCount(userId);

  const markRead = useMarkNotificationRead(userId);
  const markUnread = useMarkNotificationUnread(userId);
  const markAllRead = useMarkAllNotificationsRead(userId);
  const remove = useDeleteNotification(userId);

  const items = useMemo(
    () => notifications.data?.pages.flatMap((page) => page.items) ?? [],
    [notifications.data]
  );

  const sections = useMemo(() => {
    const grouped = new Map<string, AppNotification[]>();
    for (const item of items) {
      const label = notificationDayLabel(item.createdAt);
      const bucket = grouped.get(label);
      if (bucket) bucket.push(item);
      else grouped.set(label, [item]);
    }
    return Array.from(grouped, ([title, data]) => ({ title, data }));
  }, [items]);

  const handlePress = useCallback(
    (notification: AppNotification) => {
      if (!notification.isRead) {
        markRead.mutate(notification.id);
      }
      const navigated = navigateDeepLink(navigation, notification.deepLink);
      if (!navigated) {
        Alert.alert('Nothing to open', 'This notification is no longer linked to a screen.');
      }
    },
    [markRead, navigation]
  );

  const handleLongPress = useCallback(
    (notification: AppNotification) => {
      const options: Array<{
        text: string;
        style?: 'cancel' | 'destructive' | 'default';
        onPress?: () => void;
      }> = [];

      if (notification.isRead) {
        options.push({
          text: 'Mark as unread',
          onPress: () => markUnread.mutate(notification.id),
        });
      } else {
        options.push({
          text: 'Mark as read',
          onPress: () => markRead.mutate(notification.id),
        });
      }

      options.push({
        text: 'Delete',
        style: 'destructive',
        onPress: () => remove.mutate(notification.id),
      });
      options.push({ text: 'Cancel', style: 'cancel' });

      Alert.alert(notification.title, notification.body, options);
    },
    [markRead, markUnread, remove]
  );

  const handleRefresh = useCallback(() => {
    void notifications.refetch();
    void unread.refetch();
  }, [notifications.refetch, unread.refetch]);

  const handleEndReached = useCallback(() => {
    if (notifications.hasNextPage && !notifications.isFetchingNextPage) {
      void notifications.fetchNextPage();
    }
  }, [notifications.hasNextPage, notifications.isFetchingNextPage, notifications.fetchNextPage]);

  const unreadCount = unread.data ?? 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Notifications"
        eyebrow={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        onBack={() => navigation.goBack()}
        right={
          unreadCount > 0 ? (
            <Pressable
              hitSlop={8}
              onPress={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              accessibilityRole="button"
              accessibilityLabel="Mark all notifications as read"
            >
              {markAllRead.isPending ? (
                <ActivityIndicator size="small" color={COLORS.accentBlue} />
              ) : (
                <Text variant="caption" color={COLORS.accentBlue}>
                  Mark all read
                </Text>
              )}
            </Pressable>
          ) : null
        }
      />

      {notifications.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.accentBlue} />
          <Text variant="bodySm" color={COLORS.textSecondary} style={styles.centerText}>
            Loading notifications…
          </Text>
        </View>
      ) : notifications.isError && items.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <Icon name="warning-circle" size={24} color={COLORS.warning} />
          </View>
          <Text variant="headingSm" color={COLORS.textPrimary}>
            Couldn't load notifications
          </Text>
          <Text variant="bodySm" color={COLORS.textSecondary} style={styles.centerText}>
            Check your connection and try again.
          </Text>
          <View style={{ height: SPACE.lg }} />
          <Button
            label="Retry"
            variant="pill"
            leadingIcon="arrows-clockwise"
            onPress={() => void notifications.refetch()}
          />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={notifications.isRefetching && !notifications.isFetchingNextPage}
              onRefresh={handleRefresh}
              tintColor={COLORS.textSecondary}
            />
          }
          renderSectionHeader={({ section }) => (
            <Text
              variant="eyebrow"
              color={COLORS.textSecondary}
              style={styles.sectionHeader}
            >
              {section.title}
            </Text>
          )}
          renderItem={({ item }) => (
            <NotificationRow
              notification={item}
              onPress={() => handlePress(item)}
              onLongPress={() => handleLongPress(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <View style={styles.emptyIcon}>
                <Icon name="bell" size={24} color={COLORS.accentBlue} />
              </View>
              <Text variant="headingSm" color={COLORS.textPrimary}>
                You're all caught up
              </Text>
              <Text variant="bodySm" color={COLORS.textSecondary} style={styles.centerText}>
                Nudges, reactions and streak updates will show up here.
              </Text>
            </View>
          }
          ListFooterComponent={
            notifications.isFetchingNextPage ? (
              <View style={styles.footer}>
                <ActivityIndicator size="small" color={COLORS.accentBlue} />
              </View>
            ) : items.length > 0 && !notifications.hasNextPage ? (
              <Text
                variant="caption"
                color={COLORS.textTertiary}
                style={styles.footerText}
              >
                That's everything.
              </Text>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

function NotificationRow({
  notification,
  onPress,
  onLongPress,
}: {
  notification: AppNotification;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const visual = notificationVisual(notification.type);
  const unread = !notification.isRead;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      style={({ pressed }) => [
        styles.row,
        unread ? styles.rowUnread : null,
        pressed ? styles.rowPressed : null,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${unread ? 'Unread. ' : ''}${notification.title}. ${notification.body}`}
      accessibilityHint="Opens the related screen. Long press for more actions."
    >
      <View style={[styles.iconCircle, { backgroundColor: visual.tint }]}>
        <Icon name={visual.icon} size={18} color={visual.color} />
      </View>

      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text
            variant="bodySm"
            color={COLORS.textPrimary}
            numberOfLines={1}
            style={unread ? styles.rowTitleUnread : undefined}
          >
            {notification.title}
          </Text>
          <Text variant="caption" color={COLORS.textTertiary} style={styles.time}>
            {notificationTimeLabel(notification.createdAt)}
          </Text>
        </View>
        <Text variant="caption" color={COLORS.textSecondary} numberOfLines={2}>
          {notification.body}
        </Text>
      </View>

      {unread ? <View style={styles.unreadDot} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bgBase },
  listContent: { paddingHorizontal: SPACE.lg, paddingBottom: 120 },
  sectionHeader: { marginTop: SPACE.lg, marginBottom: SPACE.sm, letterSpacing: 1.1 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACE.md,
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    backgroundColor: COLORS.bgPanel,
    marginBottom: 8,
  },
  rowUnread: {
    borderColor: 'rgba(58, 130, 247, 0.28)',
  },
  rowPressed: { opacity: 0.82 },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 3 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  rowTitleUnread: { fontWeight: '700' },
  time: { marginLeft: 'auto', flexShrink: 0 },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.accentBlue,
    marginTop: 8,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACE.xxl,
    paddingVertical: SPACE.xxl,
  },
  centerText: { textAlign: 'center', marginTop: 6, maxWidth: 280 },
  emptyIcon: {
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
  footer: { paddingVertical: SPACE.lg, alignItems: 'center' },
  footerText: { textAlign: 'center', paddingVertical: SPACE.lg },
});
