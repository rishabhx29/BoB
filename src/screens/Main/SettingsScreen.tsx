import React, { useCallback } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar, Button, Icon, IconName, ScreenHeader, Text } from '@/components/ui';
import { COLORS, RADIUS, SPACE } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/services/supabase';
import { useCurrentUser, useUpdateNotificationPreferences } from '@/hooks/useCurrentUser';
import { useUnreadNotificationCount } from '@/hooks/useNotifications';
import { NotificationPreferences } from '@/types';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@/utils/notificationPreferences';
import { clearStoredPushToken } from '@/services/pushService';

const PREFERENCE_ROWS: Array<{
  key: keyof NotificationPreferences;
  title: string;
  subtitle: string;
}> = [
  {
    key: 'streakReminders',
    title: 'Streak reminders',
    subtitle: 'A gentle nudge before a streak is at risk.',
  },
  {
    key: 'socialActivity',
    title: 'Reactions & comments',
    subtitle: 'When pact members react to or comment on your proofs.',
  },
  {
    key: 'nudges',
    title: 'Nudges from your pact',
    subtitle: 'When a teammate nudges you to log proof.',
  },
  {
    key: 'weeklyRecap',
    title: 'Weekly recap',
    subtitle: 'Your pact’s Sunday wrap-up: MVP, consistency and streaks.',
  },
];

export default function SettingsScreen({ navigation }: any) {
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();
  const { data: currentUser, isLoading } = useCurrentUser();
  const unread = useUnreadNotificationCount(user?.id ?? '');
  const updatePreferences = useUpdateNotificationPreferences();

  const preferences = currentUser?.notificationPreferences ?? DEFAULT_NOTIFICATION_PREFERENCES;
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const togglePreference = useCallback(
    (key: keyof NotificationPreferences) => {
      const next: NotificationPreferences = {
        ...preferences,
        [key]: !preferences[key],
      };
      updatePreferences.mutate(next, {
        onError: () => Alert.alert('Could not save', 'Check your connection and try again.'),
      });
    },
    [preferences, updatePreferences]
  );

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign out?', 'You can sign back in anytime.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          try {
            // Stop deliveries to this device while the session is still valid.
            await clearStoredPushToken();
          } catch {
            // Push cleanup is best-effort and must not block sign-out.
          }
          try {
            await supabase.auth.signOut();
          } catch {
            // Local cleanup still runs if the network request fails.
          }
          logout();
          queryClient.clear();
          // The auth gate in RootNavigator swaps to the Auth stack as soon as
          // the session clears; resetting here would race that unmount.
        },
      },
    ]);
  }, [logout, navigation, queryClient]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Settings" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.identityCard}>
          <Avatar
            src={currentUser?.avatarUrl ?? user?.avatarUrl ?? null}
            name={currentUser?.displayName || user?.displayName || 'You'}
            size="lg"
          />
          <View style={styles.identityText}>
            <Text variant="headingSm" color={COLORS.textPrimary} numberOfLines={1}>
              {currentUser?.displayName || user?.displayName || 'You'}
            </Text>
            <Text variant="caption" color={COLORS.textSecondary} numberOfLines={1}>
              @{currentUser?.username || user?.username || 'you'}
            </Text>
            {currentUser?.email || user?.email ? (
              <Text variant="caption" color={COLORS.textTertiary} numberOfLines={1}>
                {currentUser?.email || user?.email}
              </Text>
            ) : null}
          </View>
          <Button
            label="Edit"
            variant="secondary"
            size="sm"
            onPress={() => navigation.navigate('EditProfile')}
          />
        </View>

        <SectionLabel>Account</SectionLabel>
        <View style={styles.group}>
          <SettingRow
            icon="pencil-simple"
            title="Edit profile"
            subtitle="Name, username, bio and avatar"
            onPress={() => navigation.navigate('EditProfile')}
          />
          <Divider />
          <SettingRow
            icon="bell"
            title="Notifications"
            subtitle="Your in-app notification center"
            badge={unread.data && unread.data > 0 ? String(unread.data) : undefined}
            onPress={() => navigation.navigate('Notifications')}
          />
        </View>

        <SectionLabel>Push notifications</SectionLabel>
        <View style={styles.group}>
          <View style={styles.switchRow}>
            <View style={styles.rowIcon}>
              <Icon name="bell-ringing" size={18} color={COLORS.accentBlue} />
            </View>
            <View style={styles.switchText}>
              <Text variant="bodySm" color={COLORS.textPrimary}>
                Push notifications
              </Text>
              <Text variant="caption" color={COLORS.textSecondary}>
                Master switch for notifications on your device.
              </Text>
            </View>
            <Switch
              value={preferences.pushEnabled}
              onValueChange={() => togglePreference('pushEnabled')}
              disabled={updatePreferences.isPending || isLoading}
              trackColor={{ false: COLORS.bgSurface, true: `${COLORS.accentBlue}88` }}
              thumbColor={preferences.pushEnabled ? COLORS.accentBlue : COLORS.textTertiary}
              accessibilityLabel="Push notifications"
            />
          </View>

          {PREFERENCE_ROWS.map((row) => (
            <React.Fragment key={row.key}>
              <Divider />
              <View
                style={[
                  styles.switchRow,
                  !preferences.pushEnabled ? styles.switchRowDisabled : null,
                ]}
              >
                <View style={styles.switchText}>
                  <Text variant="bodySm" color={COLORS.textPrimary}>
                    {row.title}
                  </Text>
                  <Text variant="caption" color={COLORS.textSecondary}>
                    {row.subtitle}
                  </Text>
                </View>
                <Switch
                  value={preferences[row.key]}
                  onValueChange={() => togglePreference(row.key)}
                  disabled={
                    !preferences.pushEnabled || updatePreferences.isPending || isLoading
                  }
                  trackColor={{ false: COLORS.bgSurface, true: `${COLORS.accentBlue}88` }}
                  thumbColor={
                    preferences[row.key] && preferences.pushEnabled
                      ? COLORS.accentBlue
                      : COLORS.textTertiary
                  }
                  accessibilityLabel={row.title}
                />
              </View>
            </React.Fragment>
          ))}
        </View>
        <Text variant="caption" color={COLORS.textTertiary} style={styles.note}>
          In-app notifications always stay on. These preferences control push delivery.
        </Text>

        <SectionLabel>Appearance</SectionLabel>
        <View style={styles.group}>
          <SettingRow
            icon="moon-stars"
            title="Dark cosmos"
            subtitle="The only theme — built for late-night accountability."
            right={<Text variant="caption" color={COLORS.textTertiary}>Always on</Text>}
          />
        </View>

        <SectionLabel>About</SectionLabel>
        <View style={styles.group}>
          <SettingRow
            icon="info"
            title="StreakPact"
            subtitle="Accountability that actually sticks."
            right={<Text variant="caption" color={COLORS.textTertiary}>v{version}</Text>}
          />
          <Divider />
          <SettingRow
            icon="lock"
            title="Privacy"
            subtitle="Your proofs are visible to your pacts only."
            right={<Icon name="shield-check" size={16} color={COLORS.success} />}
          />
        </View>

        <View style={styles.signOutWrap}>
          <Button
            label="Sign out"
            variant="ghost"
            fullWidth
            leadingIcon="sign-out"
            onPress={handleSignOut}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text variant="eyebrow" color={COLORS.textSecondary} style={styles.sectionLabel}>
      {children}
    </Text>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function SettingRow({
  icon,
  title,
  subtitle,
  right,
  badge,
  onPress,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  badge?: string;
  onPress?: () => void;
}) {
  const content = (
    <>
      <View style={styles.rowIcon}>
        <Icon name={icon} size={18} color={COLORS.textSecondary} />
      </View>
      <View style={styles.rowText}>
        <Text variant="bodySm" color={COLORS.textPrimary}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color={COLORS.textSecondary}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {badge ? (
        <View style={styles.countBadge}>
          <Text variant="caption" color="#FFFFFF" style={styles.countBadgeText}>
            {badge}
          </Text>
        </View>
      ) : null}
      {right ?? (onPress ? <Icon name="caret-right" size={16} color={COLORS.textTertiary} /> : null)}
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bgBase },
  content: { paddingHorizontal: SPACE.lg, paddingBottom: 80 },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    backgroundColor: COLORS.bgPanel,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    borderRadius: RADIUS.xl,
    padding: SPACE.md,
    marginTop: SPACE.sm,
    marginBottom: SPACE.lg,
  },
  identityText: { flex: 1, gap: 1 },
  sectionLabel: { marginTop: SPACE.lg, marginBottom: SPACE.sm, letterSpacing: 1.1 },
  group: {
    backgroundColor: COLORS.bgPanel,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    paddingHorizontal: SPACE.md,
    paddingVertical: 14,
    minHeight: 58,
  },
  rowPressed: { backgroundColor: COLORS.bgOverlay },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgSurface,
  },
  rowText: { flex: 1, gap: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.hairline, marginLeft: 58 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    paddingHorizontal: SPACE.md,
    paddingVertical: 14,
    minHeight: 58,
  },
  switchRowDisabled: { opacity: 0.55 },
  switchText: { flex: 1, gap: 2 },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accentRed,
  },
  countBadgeText: { fontWeight: '700' },
  note: {
    marginTop: SPACE.sm,
    marginHorizontal: SPACE.sm,
    lineHeight: 17,
  },
  signOutWrap: { marginTop: SPACE.xxl },
});
