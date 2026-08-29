import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Icon, IconName } from '@/components/ui';
import { COLORS, RADIUS } from '@/constants/theme';
import * as Linking from 'expo-linking';
import { useAuthStore } from '@/store/useAuthStore';
import { firebaseAuth } from '@/services/firebase';

interface Choice {
  id: 'create' | 'join' | 'skip';
  title: string;
  description: string;
  icon: IconName;
  iconBg: string;
  iconColor: string;
}

const CHOICES: Choice[] = [
  {
    id: 'create',
    title: 'Start a pact',
    description: 'Create a new group and invite friends with a code.',
    icon: 'sparkle',
    iconBg: COLORS.accentTint,
    iconColor: COLORS.accent,
  },
  {
    id: 'join',
    title: 'Join a pact',
    description: 'Enter an invite code from a friend.',
    icon: 'users',
    iconBg: COLORS.positiveTint,
    iconColor: COLORS.positive,
  },
];

export default function JoinOrCreateScreen({ navigation }: any) {
  const { setUser } = useAuthStore();
  const s1 = useRef(new Animated.Value(0)).current;
  const s2 = useRef(new Animated.Value(0)).current;
  const s3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Linking.getInitialURL().then(url => { if (url) handleDeepLink({ url }); });
    const sub = Linking.addEventListener('url', handleDeepLink);

    Animated.stagger(80, [
      Animated.spring(s1, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 200 }),
      Animated.spring(s2, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 200 }),
      Animated.spring(s3, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 200 }),
    ]).start();

    return () => sub.remove();
  }, []);

  const completeAuth = () => {
    const user = firebaseAuth.currentUser;
    setUser({
      id: user?.uid || 'new-user',
      email: user?.email || '',
      displayName: user?.displayName || 'You',
      username: 'You',
      avatarUrl: user?.photoURL || null,
      level: 1, xp: 0, shieldsAvailable: 3,
      totalSubmissions: 0, longestStreak: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeepLink = (e: { url: string }) => {
    const data = Linking.parse(e.url);
    if (data.path === 'invite' && data.queryParams?.code) {
      completeAuth();
      navigation.replace('JoinGroup', { code: data.queryParams.code });
    }
  };

  const handleSelect = (choice: Choice['id']) => {
    completeAuth();
    if (choice === 'create') navigation.replace('CreateGroup');
    else if (choice === 'join') navigation.replace('JoinGroup');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="eyebrow" color={COLORS.inkSecondary}>Almost there</Text>
        <Text variant="displaySm" color={COLORS.inkDisplay} style={styles.title}>
          Join a pact
        </Text>
        <Text variant="body" color={COLORS.inkSecondary} style={styles.description}>
          StreakPact works best with a small group. Pick how you want to start.
        </Text>
      </View>

      <View style={styles.cards}>
        {CHOICES.map((c, i) => (
          <Animated.View
            key={c.id}
            style={{
              opacity: i === 0 ? s1 : i === 1 ? s2 : s3,
              transform: [
                {
                  translateY: (i === 0 ? s1 : i === 1 ? s2 : s3).interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            }}
          >
            <Pressable
              style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
              onPress={() => handleSelect(c.id)}
              accessibilityRole="button"
              accessibilityLabel={c.title}
            >
              <View style={[styles.cardIcon, { backgroundColor: c.iconBg }]}>
                <Icon name={c.icon} size={28} color={c.iconColor} />
              </View>
              <View style={styles.cardBody}>
                <Text variant="headingMd" color={COLORS.inkDisplay}>{c.title}</Text>
                <Text variant="bodySm" color={COLORS.inkSecondary} style={styles.cardDesc}>
                  {c.description}
                </Text>
              </View>
              <Icon name="caret-right" size={18} color={COLORS.inkTertiary} />
            </Pressable>
          </Animated.View>
        ))}
      </View>

      <Animated.View style={[styles.footer, { opacity: s3 }]}>
        <Pressable onPress={completeAuth} hitSlop={8}>
          <Text variant="label" color={COLORS.inkSecondary}>Skip for now</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surfaceBase, paddingHorizontal: 24 },
  header: { marginTop: 24, marginBottom: 32 },
  title: { marginTop: 8, marginBottom: 8 },
  description: { lineHeight: 24, maxWidth: 360 },
  cards: { flex: 1, gap: 14 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    gap: 16,
  },
  cardPressed: {
    backgroundColor: COLORS.surfaceSunken,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardDesc: { marginTop: 4, lineHeight: 20 },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
});
