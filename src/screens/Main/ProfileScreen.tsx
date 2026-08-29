import React from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Text, Avatar, Card, Badge, Button } from '@/components/ui';
import { COLORS, SIZES } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

// Mock User Data
const MOCK_USER = {
  name: 'Saumya',
  username: '@saumya_codes',
  avatarUrl: 'https://i.pravatar.cc/150?u=saumya',
  level: 4,
  xp: 3800,
  nextLevelXp: 7000,
  shields: 2,
  stats: {
    submissions: 142,
    longestStreak: 45,
    totalXp: 3800,
    badges: 12,
  }
};

export default function ProfileScreen() {
  const xpProgress = (MOCK_USER.xp / MOCK_USER.nextLevelXp) * 100;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text variant="headingLg">Profile</Text>
            <TouchableOpacity style={styles.settingsBtn}>
              <Ionicons name="settings-outline" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.profileCard}>
            <Avatar src={MOCK_USER.avatarUrl} size="lg" />
            <View style={styles.profileInfo}>
              <Text variant="headingMd">{MOCK_USER.name}</Text>
              <Text variant="caption">{MOCK_USER.username}</Text>
              
              <View style={styles.levelRow}>
                <Badge text={`Level ${MOCK_USER.level} Hustler`} variant="primary" />
                <View style={styles.shieldBadge}>
                  <Text variant="caption">🛡️ {MOCK_USER.shields}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* XP Progress */}
          <View style={styles.xpContainer}>
            <View style={styles.xpTextRow}>
              <Text variant="caption">{MOCK_USER.xp} XP</Text>
              <Text variant="caption">{MOCK_USER.nextLevelXp} XP</Text>
            </View>
            <View style={styles.barBackground}>
              <View style={[styles.barFill, { width: `${xpProgress}%` }]} />
            </View>
          </View>
          
          <Button label="Edit Profile" variant="secondary" style={styles.editBtn} />
        </View>

        {/* Stats Grid */}
        <View style={styles.section}>
          <Text variant="headingMd" style={styles.sectionTitle}>Stats</Text>
          <View style={styles.statsGrid}>
            <Card elevation="soft" style={styles.statCard} padding={16}>
              <Text variant="headingLg" style={styles.statValue}>{MOCK_USER.stats.submissions}</Text>
              <Text variant="caption">Submissions</Text>
            </Card>
            <Card elevation="soft" style={styles.statCard} padding={16}>
              <Text variant="headingLg" style={styles.statValue}>{MOCK_USER.stats.longestStreak}</Text>
              <Text variant="caption">Longest Streak</Text>
            </Card>
            <Card elevation="soft" style={styles.statCard} padding={16}>
              <Text variant="headingLg" style={styles.statValue}>{MOCK_USER.stats.totalXp}</Text>
              <Text variant="caption">Total XP</Text>
            </Card>
            <Card elevation="soft" style={styles.statCard} padding={16}>
              <Text variant="headingLg" style={styles.statValue}>{MOCK_USER.stats.badges}</Text>
              <Text variant="caption">Badges</Text>
            </Card>
          </View>
        </View>

        {/* Recent Achievements */}
        <View style={styles.section}>
          <Text variant="headingMd" style={styles.sectionTitle}>Recent Achievements</Text>
          <View style={styles.achievementsRow}>
            <View style={styles.badgePlaceholder}>
              <Text style={styles.badgeIcon}>🔥</Text>
              <Text variant="caption">First Flame</Text>
            </View>
            <View style={styles.badgePlaceholder}>
              <Text style={styles.badgeIcon}>🏋️</Text>
              <Text variant="caption">Iron Body</Text>
            </View>
            <View style={styles.badgePlaceholder}>
              <Text style={styles.badgeIcon}>🛡️</Text>
              <Text variant="caption">Shield Bearer</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.surfaceBase,
  },
  scrollContent: {
    paddingBottom: 100, // Bottom tab space
  },
  header: {
    paddingHorizontal: SIZES.padding,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: COLORS.surfaceBase,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceDark,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  settingsBtn: {
    padding: 8,
    backgroundColor: COLORS.surfaceDark,
    borderRadius: SIZES.radiusPill,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  profileInfo: {
    flex: 1,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  shieldBadge: {
    backgroundColor: COLORS.surfaceDark,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: SIZES.radiusPill,
  },
  xpContainer: {
    marginBottom: 24,
  },
  xpTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  barBackground: {
    height: 8,
    backgroundColor: COLORS.surfaceDark,
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: COLORS.brandPrimary,
    borderRadius: 4,
  },
  editBtn: {
    width: '100%',
  },
  section: {
    padding: SIZES.padding,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
  },
  statValue: {
    color: COLORS.brandPrimary,
    marginBottom: 4,
  },
  achievementsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  badgePlaceholder: {
    alignItems: 'center',
    backgroundColor: COLORS.surfaceDark,
    padding: 16,
    borderRadius: SIZES.radiusCard,
    width: 100,
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: 8,
  }
});
