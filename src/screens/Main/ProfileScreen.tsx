import React from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import { Text, Avatar, Card, Badge, Button, Icon, IconName } from '@/components/ui';
import { COLORS, RADIUS } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';

const MOCK_USER = {
  name: 'You',
  username: '@you',
  avatarUrl: null,
  level: 4,
  levelName: 'Hustler',
  xp: 3800,
  nextLevelXp: 7000,
  shields: 2,
  stats: {
    submissions: 142,
    longestStreak: 45,
    totalXp: 3800,
    badges: 8,
  },
  achievements: [
    { id: 'a1', icon: 'flame' as IconName, label: 'First Flame', color: '#FF5B1F', earned: true },
    { id: 'a2', icon: 'barbell' as IconName, label: 'Iron Body', color: '#8B5CF6', earned: true },
    { id: 'a3', icon: 'shield-check' as IconName, label: 'Shield Bearer', color: '#0EA5E9', earned: true },
    { id: 'a4', icon: 'lightning' as IconName, label: 'Speed', color: '#F59E0B', earned: false },
    { id: 'a5', icon: 'crown' as IconName, label: 'Champion', color: '#2E9D6A', earned: false },
  ],
};

export default function ProfileScreen() {
  const xpProgress = (MOCK_USER.xp / MOCK_USER.nextLevelXp) * 100;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text variant="eyebrow" color={COLORS.inkSecondary}>Profile</Text>
            <Pressable hitSlop={8} style={styles.settingsBtn}>
              <Icon name="gear" size={20} color={COLORS.inkPrimary} />
            </Pressable>
          </View>

          <View style={styles.identity}>
            <Avatar src={MOCK_USER.avatarUrl} name={MOCK_USER.name} size="xl" status="online" />
            <View style={styles.identityText}>
              <Text variant="displaySm" color={COLORS.inkDisplay}>{MOCK_USER.name}</Text>
              <Text variant="body" color={COLORS.inkSecondary} style={styles.handle}>
                {MOCK_USER.username}
              </Text>
              <View style={styles.badgeRow}>
                <Badge
                  label={`Level ${MOCK_USER.level} ${MOCK_USER.levelName}`}
                  icon="lightning"
                  variant="primary"
                />
                <Badge
                  label={`${MOCK_USER.shields} shields`}
                  icon="shield-check"
                  variant="neutral"
                />
              </View>
            </View>
          </View>

          <View style={styles.xpBlock}>
            <View style={styles.xpHeader}>
              <Text variant="caption" color={COLORS.inkSecondary}>XP to Level {MOCK_USER.level + 1}</Text>
              <Text variant="numericSm" color={COLORS.inkDisplay}>
                {MOCK_USER.xp.toLocaleString()} / {MOCK_USER.nextLevelXp.toLocaleString()}
              </Text>
            </View>
            <View style={styles.xpTrack}>
              <View style={[styles.xpFill, { width: `${xpProgress}%` }]} />
            </View>
          </View>

          <Button
            label="Edit profile"
            variant="secondary"
            fullWidth
            leadingIcon="pencil-simple"
          />
        </View>

        {/* Stats grid */}
        <View style={styles.section}>
          <Text variant="eyebrow" color={COLORS.inkSecondary} style={styles.sectionEyebrow}>
            Stats
          </Text>
          <View style={styles.statsGrid}>
            <StatCard value={MOCK_USER.stats.submissions} label="Submissions" icon="paper-plane-tilt" />
            <StatCard value={MOCK_USER.stats.longestStreak} label="Longest streak" icon="flame" accent />
            <StatCard value={MOCK_USER.stats.totalXp.toLocaleString()} label="Total XP" icon="lightning" />
            <StatCard value={MOCK_USER.stats.badges} label="Badges" icon="medal" />
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="eyebrow" color={COLORS.inkSecondary}>Recent achievements</Text>
            <Pressable hitSlop={6}>
              <Text variant="label" color={COLORS.accent}>See all</Text>
            </Pressable>
          </View>
          <View style={styles.achGrid}>
            {MOCK_USER.achievements.map(a => (
              <View key={a.id} style={[styles.achCell, !a.earned && styles.achCellLocked]}>
                <View style={[styles.achIcon, { backgroundColor: hexToTint(a.color, 0.14) }]}>
                  <Icon name={a.icon} size={24} color={a.earned ? a.color : COLORS.inkTertiary} />
                </View>
                <Text variant="caption" color={a.earned ? COLORS.inkDisplay : COLORS.inkTertiary} numberOfLines={1}>
                  {a.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ value, label, icon, accent }: { value: string | number; label: string; icon: IconName; accent?: boolean }) {
  return (
    <Card variant="flat" padding="lg" style={styles.statCard}>
      <View style={[styles.statIcon, accent ? styles.statIconAccent : null]}>
        <Icon name={icon} size={18} color={accent ? COLORS.accent : COLORS.inkSecondary} />
      </View>
      <Text variant="numericLg" color={COLORS.inkDisplay} style={styles.statValue}>
        {value}
      </Text>
      <Text variant="caption" color={COLORS.inkSecondary}>{label}</Text>
    </Card>
  );
}

function hexToTint(hex: string, alpha: number) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surfaceBase },
  scroll: { paddingBottom: 120 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingsBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.hairline,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginBottom: 20,
  },
  identityText: { flex: 1 },
  handle: { marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  xpBlock: { marginBottom: 16 },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  xpTrack: {
    height: 8,
    backgroundColor: COLORS.surfaceSunken,
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpFill: { height: '100%', backgroundColor: COLORS.accent, borderRadius: 4 },
  section: { paddingHorizontal: 24, paddingVertical: 12 },
  sectionEyebrow: { marginBottom: 14 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '48%', gap: 6 },
  statIcon: {
    width: 32, height: 32, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceSunken,
    alignItems: 'center', justifyContent: 'center',
  },
  statIconAccent: { backgroundColor: COLORS.accentTint },
  statValue: { marginTop: 2 },
  achGrid: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  achCell: {
    alignItems: 'center',
    width: 84,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.hairline,
  },
  achCellLocked: { opacity: 0.6 },
  achIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
});
