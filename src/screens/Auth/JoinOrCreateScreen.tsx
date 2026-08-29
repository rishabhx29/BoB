import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';
import { COLORS, SHADOWS } from '@/constants/theme';
import * as Linking from 'expo-linking';
import { useAuthStore } from '@/store/useAuthStore';
import { firebaseAuth } from '@/services/firebase';

export default function JoinOrCreateScreen({ navigation }: any) {
  const { setUser } = useAuthStore();
  const slideAnim1 = useRef(new Animated.Value(50)).current;
  const slideAnim2 = useRef(new Animated.Value(50)).current;
  const fadeAnim1 = useRef(new Animated.Value(0)).current;
  const fadeAnim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Check for initial deep link invite code
    Linking.getInitialURL().then(url => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Staggered animated entrance
    Animated.stagger(200, [
      Animated.parallel([
        Animated.spring(slideAnim1, { toValue: 0, useNativeDriver: true }),
        Animated.timing(fadeAnim1, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(slideAnim2, { toValue: 0, useNativeDriver: true }),
        Animated.timing(fadeAnim2, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();

    return () => {
      subscription.remove();
    };
  }, []);

  const completeAuth = () => {
    const user = firebaseAuth.currentUser;
    setUser({
      id: user?.uid || 'new-user',
      email: user?.email || '',
      displayName: user?.displayName || 'New User',
      username: 'NewUser',
      avatarUrl: user?.photoURL || null,
      level: 1,
      xp: 0,
      shieldsAvailable: 3,
      totalSubmissions: 0,
      longestStreak: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeepLink = (event: { url: string }) => {
    let data = Linking.parse(event.url);
    if (data.path === 'invite' && data.queryParams?.code) {
      // TODO: Handle invite code logic directly
      // navigate to Join with code
      completeAuth(); // Fallback for now
    }
  };

  const handleJoin = () => {
    // Ideally this goes to a "JoinGroup" modal or flow, but we can navigate to Main for now
    completeAuth();
  };

  const handleCreate = () => {
    // Ideally this goes to a "CreateGroup" modal or flow, but we can navigate to Main for now
    completeAuth();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headingLg" style={styles.title}>Join a Pact</Text>
        <Text variant="body" color={COLORS.textSecondary} style={styles.description}>
          StreakPact is better with friends. Choose how you want to start.
        </Text>
      </View>

      <View style={styles.cardsContainer}>
        <Animated.View style={{ opacity: fadeAnim1, transform: [{ translateY: slideAnim1 }] }}>
          <Pressable style={styles.card} onPress={handleCreate}>
            <View style={[styles.iconContainer, { backgroundColor: COLORS.brandPrimary + '20' }]}>
              <Text style={styles.icon}>✨</Text>
            </View>
            <View style={styles.cardText}>
              <Text variant="headingLg">Start a Pact</Text>
              <Text variant="body" color={COLORS.textSecondary}>Create a new group and invite friends</Text>
            </View>
          </Pressable>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim2, transform: [{ translateY: slideAnim2 }] }}>
          <Pressable style={styles.card} onPress={handleJoin}>
            <View style={[styles.iconContainer, { backgroundColor: COLORS.success + '20' }]}>
              <Text style={styles.icon}>🤝</Text>
            </View>
            <View style={styles.cardText}>
              <Text variant="headingLg">Join a Pact</Text>
              <Text variant="body" color={COLORS.textSecondary}>Enter an invite code from a friend</Text>
            </View>
          </Pressable>
        </Animated.View>
      </View>
      
      <View style={styles.footer}>
        <Pressable onPress={completeAuth}>
          <Text variant="body" color={COLORS.textSecondary}>Skip for now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surfaceBase,
    paddingHorizontal: 24,
  },
  header: {
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    marginBottom: 8,
  },
  description: {
    lineHeight: 24,
  },
  cardsContainer: {
    flex: 1,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceBase,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    ...SHADOWS.mediumElevation,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  icon: {
    fontSize: 32,
  },
  cardText: {
    flex: 1,
  },
  footer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
});
