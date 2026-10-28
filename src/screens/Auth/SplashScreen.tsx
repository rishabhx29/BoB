import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';
import { COLORS } from '@/constants/theme';
import { VoltMark } from '@/components/brand/VoltMark';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/store/useAuthStore';
import Constants from 'expo-constants';

const { width } = Dimensions.get('window');

const BOOT_POLL_MS = 250;
const BOOT_POLL_ATTEMPTS = 20;

export default function SplashScreen({ navigation }: any) {
  const markScale = useSharedValue(0.6);
  const markOpacity = useSharedValue(0);
  const markRotate = useSharedValue(-15);
  const wordOpacity = useSharedValue(0);
  const wordY = useSharedValue(8);
  const tagOpacity = useSharedValue(0);
  const cancelled = useRef(false);

  useEffect(() => {
    // Mark entrance: scale + rotate, settle
    markScale.value = withSequence(
      withSpring(1.08, { damping: 10, stiffness: 220, mass: 0.8 }),
      withSpring(1, { damping: 14, stiffness: 200 })
    );
    markOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
    markRotate.value = withSpring(0, { damping: 14, stiffness: 180 });

    // Wordmark
    wordOpacity.value = withDelay(420, withTiming(1, { duration: 380 }));
    wordY.value = withDelay(420, withSpring(0, { damping: 16, stiffness: 200 }));

    // Tag
    tagOpacity.value = withDelay(700, withTiming(0.6, { duration: 320 }));

    const timeout = setTimeout(() => void finishSplash(), 1500);
    return () => {
      cancelled.current = true;
      clearTimeout(timeout);
    };
  }, []);

  /**
   * Session restoration belongs to `useAuthSync`; the root navigator swaps to
   * Main or SetupProfile on its own. This screen only decides which
   * unauthenticated screen comes first.
   */
  const finishSplash = async () => {
    // Give the boot-time session restore a moment to finish, so a returning
    // user sees the splash instead of a flash of the login form.
    for (let attempt = 0; attempt < BOOT_POLL_ATTEMPTS; attempt += 1) {
      const { isLoading, session } = useAuthStore.getState();
      if (!isLoading) {
        if (session) return;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, BOOT_POLL_MS));
      if (cancelled.current) return;
    }

    if (cancelled.current) return;

    try {
      const onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');
      if (cancelled.current) return;
      navigation.replace(onboardingCompleted === 'true' ? 'Login' : 'Onboarding');
    } catch {
      if (!cancelled.current) navigation.replace('Onboarding');
    }
  };

  const markStyle = useAnimatedStyle(() => ({
    opacity: markOpacity.value,
    transform: [
      { scale: markScale.value },
      { rotate: `${markRotate.value}deg` },
    ],
  }));

  const wordStyle = useAnimatedStyle(() => ({
    opacity: wordOpacity.value,
    transform: [{ translateY: wordY.value }],
  }));

  const tagStyle = useAnimatedStyle(() => ({
    opacity: tagOpacity.value,
  }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.markWrap, markStyle]}>
          <VoltMark size={88} withHalo />
        </Animated.View>

        <Animated.View style={[styles.wordWrap, wordStyle]}>
          <Text style={styles.wordmark}>
            Streak<Text style={styles.wordmarkAccent}>Pact</Text>
          </Text>
        </Animated.View>

        <Animated.View style={[styles.tagWrap, tagStyle]}>
          <Text variant="eyebrow" color={COLORS.textSecondary}>
            Show up. Together.
          </Text>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <Text variant="caption" color={COLORS.textTertiary} style={styles.version}>
          v{Constants.expoConfig?.version || '1.0.0'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgBase,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markWrap: {
    marginBottom: 28,
  },
  wordWrap: {
    alignItems: 'center',
  },
  wordmark: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -1.0,
    color: COLORS.textPrimary,
  },
  wordmarkAccent: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -1.0,
    color: COLORS.accentBlue,
  },
  tagWrap: {
    marginTop: 12,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  version: {
    letterSpacing: 1.2,
  },
});
