import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet, Dimensions, Platform, Easing } from 'react-native';
import { Text } from '@/components/ui';
import { COLORS, SHADOWS, SIZES } from '../../../constants/theme';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/services/supabase'; // Assuming supabase is here, or we just handle JWT for now

const { width, height } = Dimensions.get('window');

// Lottie mascot alternative using purely React Native animations
const Mascot = ({ scaleAnim }: { scaleAnim: Animated.Value }) => {
  // A simple bouncing bolt inside a tactile circle
  return (
    <Animated.View style={[styles.mascotContainer, { transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.mascotInnerRecess}>
        <Text style={styles.boltText}>⚡</Text>
      </View>
    </Animated.View>
  );
};

export default function SplashScreen({ navigation }: any) {
  const bounceValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;
  const [typedText, setTypedText] = useState('');
  const fullText = 'StreakPact';
  const { setUser } = useAuthStore();
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Sequence: Bounce mascot, then type text
    Animated.sequence([
      Animated.spring(bounceValue, {
        toValue: 1,
        friction: 4,
        tension: 20,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    ]).start(() => {
      // Type out app name
      let i = 0;
      typingTimerRef.current = setInterval(() => {
        setTypedText(fullText.substring(0, i + 1));
        i++;
        if (i >= fullText.length) {
          if (typingTimerRef.current) clearInterval(typingTimerRef.current);
          finishSplash();
        }
      }, 100);
    });

    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    };
  }, []);

  const finishSplash = async () => {
    try {
      // Give a brief moment to show full text before transitioning
      await new Promise(resolve => setTimeout(resolve, 800));

      const token = await SecureStore.getItemAsync('streakpact_jwt');
      const onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');

        if (token) {
        // Ideally we validate the JWT via Supabase/Backend here
        // If valid, auto-login. For now, bypass validation as per initial logic.
        // Assume JWT implies authenticated in v1
        setUser({
          id: 'dummy-id',
          email: 'dummy@example.com',
          username: 'dummy_user',
          displayName: 'Dummy User',
          avatarUrl: null,
          xp: 0,
          level: 1,
          totalSubmissions: 0,
          longestStreak: 0,
          shieldsAvailable: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else if (onboardingCompleted === 'true') {
        navigation.replace('Login');
      } else {
        navigation.replace('Onboarding');
      }
    } catch (e) {
      console.warn('Splash init error:', e);
      navigation.replace('Onboarding');
    }
  };

  return (
    <View style={styles.container}>
      <Mascot scaleAnim={bounceValue} />
      
      <Animated.View style={[styles.textContainer, { opacity: opacityValue }]}>
        <Text style={styles.title}>{typedText}<Text style={styles.cursor}>_</Text></Text>
      </Animated.View>
      
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceBase,
  },
  mascotContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.surfaceBase,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    ...SHADOWS.softElevation,
  },
  mascotInnerRecess: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.surfaceDark,
    justifyContent: 'center',
    alignItems: 'center',
    // Inset shadow simulation for non-web React Native
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.05)',
    overflow: 'hidden',
    shadowColor: '#fff',
    shadowOffset: { width: -2, height: -2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  boltText: {
    fontSize: 48,
    lineHeight: 56, // Ensures emoji doesn't get clipped
    textShadowColor: COLORS.brandPrimary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  textContainer: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'RobotoMono-Bold',
    fontSize: 28,
    color: COLORS.textDisplay,
    letterSpacing: 4,
    textShadowColor: 'rgba(249, 115, 22, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  cursor: {
    fontFamily: 'RobotoMono-Bold',
    fontSize: 28,
    color: COLORS.success,
  },
  versionContainer: {
    position: 'absolute',
    bottom: 40,
  },
  versionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: COLORS.textSecondary,
    letterSpacing: 2,
  },
});
