import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert, Pressable, Animated } from 'react-native';
import AnimatedLib, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Text, Button, BottomSheet, Icon, IconName } from '@/components/ui';
import { GroupCard } from '@/components/groups/GroupCard';
import { COLORS, RADIUS } from '@/constants/theme';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store/useAuthStore';
import { VoltPeek } from '@/components/brand/VoltMark';

const MOCK_GROUPS = [
  {
    id: 'g1',
    name: 'Morning Hustle',
    icon: 'sun' as IconName,
    iconColor: '#F59E0B',
    activitiesCount: 3,
    allSubmitted: false,
    streakDays: 47,
    members: [
      { avatarUrl: 'https://i.pravatar.cc/100?u=alex', displayName: 'Alex' },
      { avatarUrl: 'https://i.pravatar.cc/100?u=sarah', displayName: 'Sarah' },
      { avatarUrl: 'https://i.pravatar.cc/100?u=mike', displayName: 'Mike' },
      { avatarUrl: 'https://i.pravatar.cc/100?u=jessica', displayName: 'Jessica' },
      { avatarUrl: null, displayName: 'You' },
    ],
  },
  {
    id: 'g2',
    name: 'Bookworms',
    icon: 'book' as IconName,
    iconColor: '#2E9D6A',
    activitiesCount: 1,
    allSubmitted: true,
    streakDays: 12,
    members: [
      { avatarUrl: 'https://i.pravatar.cc/100?u=sarah', displayName: 'Sarah' },
      { avatarUrl: null, displayName: 'You' },
    ],
  },
  {
    id: 'g3',
    name: 'Code & Lift',
    icon: 'code' as IconName,
    iconColor: '#FF5B1F',
    activitiesCount: 2,
    allSubmitted: false,
    streakDays: 89,
    members: [
      { avatarUrl: 'https://i.pravatar.cc/100?u=mike', displayName: 'Mike' },
      { avatarUrl: 'https://i.pravatar.cc/100?u=alex', displayName: 'Alex' },
      { avatarUrl: 'https://i.pravatar.cc/100?u=jessica', displayName: 'Jessica' },
    ],
  },
];

export default function GroupsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [groups, setGroups] = useState(MOCK_GROUPS);
  const [actionSheet, setActionSheet] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 900);
  };

  const handleLongPress = (id: string, name: string) => {
    Alert.alert(
      'Leave pact?',
      `You'll lose your streak in ${name}. You can be re-invited.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => setGroups(g => g.filter(x => x.id !== id)) },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="eyebrow" color={COLORS.inkSecondary}>Your pacts</Text>
        <Text variant="displaySm" color={COLORS.inkDisplay} style={styles.headerTitle}>
          {groups.length} {groups.length === 1 ? 'pact' : 'pacts'}
        </Text>
      </View>

      <FlatList
        data={groups}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
          />
        }
        ListEmptyComponent={<EmptyState />}
        renderItem={({ item }) => (
          <GroupCard
            id={item.id}
            name={item.name}
            icon={item.icon}
            iconColor={item.iconColor}
            members={item.members}
            activitiesCount={item.activitiesCount}
            allSubmitted={item.allSubmitted}
            streakDays={item.streakDays}
            onPress={() => navigation.navigate('GroupHome', { groupId: item.id })}
            onLongPress={() => handleLongPress(item.id, item.name)}
          />
        )}
      />

      <View style={styles.fabWrap}>
        <Pressable
          onPress={() => setActionSheet(true)}
          style={({ pressed }) => [styles.fab, pressed ? styles.fabPressed : null]}
          accessibilityRole="button"
          accessibilityLabel="Add pact"
        >
          <Icon name="plus" size={26} color="#FFFFFF" />
        </Pressable>
      </View>

      <BottomSheet isVisible={actionSheet} onClose={() => setActionSheet(false)}>
        <Text variant="headingMd" color={COLORS.inkDisplay} style={styles.sheetTitle}>
          Add a pact
        </Text>
        <Text variant="body" color={COLORS.inkSecondary} style={styles.sheetSub}>
          Start a new one, or join with a code from a friend.
        </Text>

        <View style={{ height: 24 }} />
        <Button
          label="Start a new pact"
          fullWidth
          size="lg"
          trailingIcon="arrow-right"
          onPress={() => {
            setActionSheet(false);
            navigation.navigate('CreateGroup');
          }}
        />
        <View style={{ height: 10 }} />
        <Button
          label="Join with code"
          fullWidth
          size="lg"
          variant="secondary"
          leadingIcon="key"
          onPress={() => {
            setActionSheet(false);
            navigation.navigate('JoinGroup');
          }}
        />
      </BottomSheet>
    </View>
  );
}

function EmptyState() {
  const breathe = useSharedValue(1);
  useEffect(() => {
    breathe.value = withRepeat(
      withTiming(1.06, { duration: 1400, easing: Easing.inOut(Easing.cubic) }),
      -1,
      true
    );
  }, []);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: breathe.value }] }));

  return (
    <View style={styles.empty}>
      <AnimatedLib.View style={animStyle}>
        <VoltPeek size={100} />
      </AnimatedLib.View>
      <Text variant="headingLg" color={COLORS.inkDisplay} style={styles.emptyTitle}>
        No pacts yet
      </Text>
      <Text variant="body" color={COLORS.inkSecondary} style={styles.emptySub}>
        Create a pact or join one with an invite code. Show up together.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surfaceBase },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerTitle: { marginTop: 4 },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 140,
  },
  fabWrap: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  fabPressed: {
    transform: [{ scale: 0.96 }],
    shadowOpacity: 0.15,
  },
  sheetTitle: { textAlign: 'center' },
  sheetSub: { textAlign: 'center', marginTop: 6, lineHeight: 22 },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: { marginTop: 24, marginBottom: 8, textAlign: 'center' },
  emptySub: { textAlign: 'center', lineHeight: 22, maxWidth: 280 },
});
