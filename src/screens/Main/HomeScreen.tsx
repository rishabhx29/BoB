import React, { useRef } from 'react';
import { View, FlatList, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolate } from 'react-native-reanimated';
import { FeedCard, TodayBanner, Text, Icon, Avatar } from '@/components/ui';
import { COLORS, RADIUS } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { TodayActivity } from '@/components/feed/TodayBanner';
import { IconName } from '@/components/ui/Icon';

// Mock data — replaced when feed goes live
const MOCK_TODAY: TodayActivity[] = [
  { id: '1', name: 'Gym', icon: 'barbell', color: '#8B5CF6', status: 'pending' },
  { id: '2', name: 'Read', icon: 'book', color: '#2E9D6A', status: 'submitted' },
  { id: '3', name: 'Code', icon: 'code', color: '#FF5B1F', status: 'rest' },
  { id: '4', name: 'Meditate', icon: 'leaf', color: '#0EA5E9', status: 'pending' },
];

const MOCK_FEED = [
  {
    id: 'f1',
    user: { id: 'u1', name: 'Alex Rivera', avatarUrl: 'https://i.pravatar.cc/200?u=alex', groupName: 'Morning Hustle' },
    activity: { id: 'a1', name: 'Gym', icon: 'barbell' as IconName, color: '#8B5CF6' },
    submission: {
      id: 's1',
      photoUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop',
      title: 'Leg day, crushed',
      description: 'Squats felt heavy today, but pushed through the final set. New PR on the leg press.',
      summaryText: 'Squats, leg press, calves · 60 min',
      timestamp: '2h ago',
      streakCount: 14,
      reactions: 5,
      comments: 2,
    },
  },
  {
    id: 'f2',
    user: { id: 'u2', name: 'Sarah Kim', avatarUrl: 'https://i.pravatar.cc/200?u=sarah', groupName: 'Bookworms' },
    activity: { id: 'a2', name: 'Read', icon: 'book' as IconName, color: '#2E9D6A' },
    submission: {
      id: 's2',
      title: 'Atomic Habits, ch. 4',
      description: 'The cue, craving, response, reward loop is so real. The 2-minute rule changed how I start tasks.',
      summaryText: 'Atomic Habits · 30 min',
      timestamp: '4h ago',
      streakCount: 5,
      reactions: 3,
      comments: 0,
    },
  },
];

export default function HomeScreen() {
  const { user } = useAuthStore();

  const handleActivityPress = (_act: TodayActivity) => {
    // Navigate to submission flow
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={MOCK_FEED}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <GreetingHeader name={user?.displayName || 'You'} onActivityPress={handleActivityPress} />
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <FeedCard
              user={item.user}
              activity={item.activity}
              submission={item.submission}
            />
          </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function GreetingHeader({ name, onActivityPress }: { name: string; onActivityPress: (act: TodayActivity) => void }) {
  return (
    <View style={styles.header}>
      <View style={styles.greeting}>
        <View style={styles.greetingText}>
          <Text variant="eyebrow" color={COLORS.inkSecondary}>Today</Text>
          <Text variant="displaySm" color={COLORS.inkDisplay} style={styles.greetingTitle}>
            Hey, {name.split(' ')[0]}.
          </Text>
        </View>
        <Avatar name={name} size="md" />
      </View>

      <TodayBanner activities={MOCK_TODAY} onActivityPress={onActivityPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.surfaceBase,
  },
  listContent: {
    paddingBottom: 120,
  },
  cardWrapper: {
    paddingHorizontal: 16,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
  },
  greeting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  greetingText: { flex: 1 },
  greetingTitle: {
    marginTop: 6,
  },
});
