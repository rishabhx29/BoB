import React from 'react';
import { View, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { Text, Avatar, Card, Badge, Icon, IconName } from '@/components/ui';
import { COLORS, RADIUS } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';

const MOCK_LEADERBOARD = [
  { id: '1', rank: 1, name: 'Alex Rivera', avatarUrl: 'https://i.pravatar.cc/200?u=alex', xp: 4250, level: 4, you: false },
  { id: '2', rank: 2, name: 'You', avatarUrl: null, xp: 3800, level: 4, you: true },
  { id: '3', rank: 3, name: 'Sarah Kim', avatarUrl: 'https://i.pravatar.cc/200?u=sarah', xp: 2900, level: 3, you: false },
  { id: '4', rank: 4, name: 'Mike Chen', avatarUrl: 'https://i.pravatar.cc/200?u=mike', xp: 1200, level: 2, you: false },
  { id: '5', rank: 5, name: 'Jessica Lee', avatarUrl: 'https://i.pravatar.cc/200?u=jessica', xp: 850, level: 2, you: false },
  { id: '6', rank: 6, name: 'Sam Patel', avatarUrl: null, xp: 420, level: 1, you: false },
];

const MAX_XP = MOCK_LEADERBOARD[0].xp;
const RANK_COLORS: Record<number, string> = {
  1: '#FBBF24',
  2: '#9CA3AF',
  3: '#B45309',
};

export default function LeaderboardScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text variant="eyebrow" color={COLORS.inkSecondary}>This month</Text>
        <Text variant="displaySm" color={COLORS.inkDisplay} style={styles.title}>
          Leaderboard
        </Text>
        <Text variant="body" color={COLORS.inkSecondary} style={styles.subtitle}>
          Who's showing up. Top 3 take the podium.
        </Text>
      </View>

      <FlatList
        data={MOCK_LEADERBOARD}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <Row item={item} maxXp={MAX_XP} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </SafeAreaView>
  );
}

function Row({ item, maxXp }: { item: typeof MOCK_LEADERBOARD[number]; maxXp: number }) {
  const fill = (item.xp / maxXp) * 100;
  const rankColor = RANK_COLORS[item.rank] ?? COLORS.inkTertiary;

  return (
    <Card variant={item.you ? 'elevated' : 'flat'} padding="lg" style={item.you ? styles.you : null}>
      <View style={styles.row}>
        <View style={[styles.rankBox, { backgroundColor: hexToTint(rankColor, 0.14) }]}>
          {item.rank <= 3 ? (
            <Icon name="crown" size={20} color={rankColor} bold />
          ) : (
            <Text variant="numericMd" color={COLORS.inkDisplay}>{item.rank}</Text>
          )}
        </View>
        <Avatar src={item.avatarUrl} name={item.name} size="md" />
        <View style={styles.userInfo}>
          <Text variant="headingSm" color={COLORS.inkDisplay} numberOfLines={1}>
            {item.name}
          </Text>
          <Text variant="caption" color={COLORS.inkSecondary}>
            Level {item.level}
          </Text>
        </View>
        <View style={styles.xpBox}>
          <Text variant="numericMd" color={COLORS.inkDisplay}>{item.xp.toLocaleString()}</Text>
          <Text variant="caption" color={COLORS.inkTertiary}>XP</Text>
        </View>
      </View>

      <View style={styles.barBg}>
        <View
          style={[
            styles.barFill,
            {
              width: `${fill}%`,
              backgroundColor: item.you ? COLORS.accent : COLORS.positive,
            },
          ]}
        />
      </View>
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
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  title: { marginTop: 4 },
  subtitle: { marginTop: 6, lineHeight: 22 },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  rankBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: { flex: 1 },
  xpBox: {
    alignItems: 'flex-end',
  },
  barBg: {
    height: 6,
    backgroundColor: COLORS.surfaceSunken,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  you: {
    borderWidth: 1.5,
    borderColor: COLORS.accent,
  },
});
