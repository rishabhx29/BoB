import React from 'react';
import { View, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { Text, Avatar, Card } from '@/components/ui';
import { COLORS, SIZES, TYPOGRAPHY } from '@/constants/theme';

// Mock Leaderboard Data
const MOCK_LEADERBOARD = [
  { id: '1', rank: 1, name: 'Alex', avatarUrl: 'https://i.pravatar.cc/150?u=alex', xp: 4250, level: 4 },
  { id: '2', rank: 2, name: 'You', avatarUrl: 'https://i.pravatar.cc/150?u=you', xp: 3800, level: 4 },
  { id: '3', rank: 3, name: 'Sarah', avatarUrl: 'https://i.pravatar.cc/150?u=sarah', xp: 2900, level: 3 },
  { id: '4', rank: 4, name: 'Mike', avatarUrl: 'https://i.pravatar.cc/150?u=mike', xp: 1200, level: 2 },
  { id: '5', rank: 5, name: 'Jessica', avatarUrl: 'https://i.pravatar.cc/150?u=jessica', xp: 850, level: 2 },
];

const MAX_XP = MOCK_LEADERBOARD[0].xp;

export default function LeaderboardScreen() {
  const renderItem = ({ item }: { item: typeof MOCK_LEADERBOARD[0] }) => {
    const isTop3 = item.rank <= 3;
    const isYou = item.name === 'You';
    const fillPercentage = (item.xp / MAX_XP) * 100;

    let rankColor = COLORS.textSecondary;
    if (item.rank === 1) rankColor = '#FBBF24'; // Gold
    else if (item.rank === 2) rankColor = '#9CA3AF'; // Silver
    else if (item.rank === 3) rankColor = '#B45309'; // Bronze

    return (
      <Card 
        elevation={isYou ? 'medium' : 'soft'} 
        padding={16} 
        style={[styles.card, isYou && styles.yourCard]}
      >
        <View style={styles.cardHeader}>
          <Text variant="headingMd" style={[styles.rank, { color: rankColor }]}>
            #{item.rank}
          </Text>
          <Avatar src={item.avatarUrl} size="md" />
          <View style={styles.userInfo}>
            <Text variant="headingMd">{item.name}</Text>
            <Text variant="caption">Level {item.level}</Text>
          </View>
          <View style={styles.xpBox}>
            <Text style={styles.xpText}>{item.xp} XP</Text>
          </View>
        </View>

        <View style={styles.barBackground}>
          <View style={[styles.barFill, { width: `${fillPercentage}%`, backgroundColor: isYou ? COLORS.brandPrimary : COLORS.success }]} />
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text variant="headingLg">Leaderboard</Text>
        <Text variant="body" color={COLORS.textSecondary}>This Month's Champions</Text>
      </View>
      <FlatList
        data={MOCK_LEADERBOARD}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.surfaceBase,
  },
  header: {
    paddingHorizontal: SIZES.padding,
    paddingTop: 16,
    paddingBottom: 24,
  },
  listContent: {
    paddingHorizontal: SIZES.padding,
    paddingBottom: 100, // Space for bottom tabs
    gap: 12,
  },
  card: {
    marginBottom: 0,
  },
  yourCard: {
    borderWidth: 2,
    borderColor: COLORS.brandPrimary,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  rank: {
    width: 32,
    textAlign: 'center',
  },
  userInfo: {
    flex: 1,
  },
  xpBox: {
    backgroundColor: COLORS.surfaceDark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: SIZES.radiusPill,
  },
  xpText: {
    ...TYPOGRAPHY.digitalDisplay,
    fontSize: 16,
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
    borderRadius: 4,
  }
});
