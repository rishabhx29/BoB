import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { COLORS, SHADOWS, SIZES } from '@/constants/theme';
import { Text } from './Text';

export interface StreakCounterProps {
  count: number;
  label?: string;
}

/**
 * A neumorphic "digital display" component showing the streak number.
 * Looks like an LCD screen embedded in the hardware card.
 */
export function StreakCounter({ count, label = 'DAY STREAK' }: StreakCounterProps) {
  const scale = useSharedValue(1);

  // Pulse animation whenever count changes
  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.05, { duration: 150, easing: Easing.out(Easing.ease) }),
      withSpring(1, { damping: 6 })
    );
  }, [count]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.screen, animatedStyle]}>
      <Text variant="digitalDisplay" style={styles.count}>
        {String(count).padStart(3, '0')}
      </Text>
      <Text variant="caption" color={COLORS.textSecondary} style={styles.label}>
        🔥 {label}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: COLORS.surfaceScreen,
    borderRadius: SIZES.base * 2, // 8px
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    // Simulated inset shadow using border
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderTopColor: 'rgba(0,0,0,0.4)',
    borderLeftColor: 'rgba(0,0,0,0.4)',
  },
  count: {
    // Override color to orange display text
    color: COLORS.textDisplay,
    letterSpacing: 4,
  },
  label: {
    marginTop: 2,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
