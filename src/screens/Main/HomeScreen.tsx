import React from 'react';
import { View, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { FeedCard, TodayActivity, TodayBanner } from '@/components/feed';
import { COLORS, SIZES } from '@/constants/theme';
import { Text } from '@/components/ui';

// Mock Data
const MOCK_TODAY_ACTIVITIES: TodayActivity[] = [
  { id: '1', name: 'Gym', icon: '🏋️', color: '#3b82f6', status: 'pending' },
  { id: '2', name: 'Read', icon: '📚', color: '#10b981', status: 'submitted' },
  { id: '3', name: 'Code', icon: '💻', color: '#8b5cf6', status: 'rest' },
];

const MOCK_FEED = [
  {
    id: 'f1',
    user: { name: 'Alex', avatarUrl: 'https://i.pravatar.cc/150?u=alex', groupName: 'Morning Hustle' },
    activity: { name: 'Gym', icon: '🏋️', color: '#3b82f6' },
    submission: {
      photoUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop',
      title: 'Leg day crushed! 🦵',
      description: 'Squats felt heavy today but pushed through the final set.',
      summaryText: 'Squats, Leg Press, Calves - 60 min',
      timestamp: '2 hrs ago',
      streakCount: 14,
      reactions: 5,
      comments: 2,
    }
  },
  {
    id: 'f2',
    user: { name: 'Sarah', avatarUrl: 'https://i.pravatar.cc/150?u=sarah', groupName: 'Bookworms' },
    activity: { name: 'Read', icon: '📚', color: '#10b981' },
    submission: {
      title: 'Atomic Habits - Chap 4',
      description: 'The cue, craving, response, reward loop is so real.',
      summaryText: 'Atomic Habits - 30 mins',
      timestamp: '4 hrs ago',
      streakCount: 5,
      reactions: 3,
      comments: 0,
    }
  }
];

export default function HomeScreen() {
  const handleActivityPress = (act: TodayActivity) => {
    // Navigate to submission flow
    console.log('Pressed', act.name);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text variant="headingLg">Feed</Text>
      </View>
      <FlatList
        data={MOCK_FEED}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<TodayBanner activities={MOCK_TODAY_ACTIVITIES} onActivityPress={handleActivityPress} />}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <FeedCard user={item.user} activity={item.activity} submission={item.submission} />
          </View>
        )}
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
    paddingBottom: 8,
  },
  listContent: {
    paddingBottom: 100, // Space for bottom tabs
  },
  cardWrapper: {
    paddingHorizontal: SIZES.padding,
  }
});
