import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { COLORS, SIZES } from '@/constants/theme';
import { Text } from './Text';

export interface XPChipProps {
  xp: number;
  onAnimationEnd?: () => void;
}

/**
 * A chip that slides up from the bottom and fades out after 2 seconds.
 * Shown after a successful submission.
 */
export function XPChip({ xp, onAnimationEnd }: XPChipProps) {
  const translateY = useSharedValue(20);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    // Slide up and bounce in
    translateY.value = withSpring(-80, { damping: 8, stiffness: 120 });
    opacity.value = withTiming(1, { duration: 300 });
    scale.value = withSpring(1, { damping: 6 });

    // Fade out after 1.5s
    opacity.value = withDelay(
      1500,
      withTiming(0, { duration: 500 }, (finished) => {
        if (finished && onAnimationEnd) {
          runOnJS(onAnimationEnd)();
        }
      })
    );
  }, [xp]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.chip, animatedStyle]} pointerEvents="none">
      <Text variant="body" color="#FFFFFF" style={styles.text}>
        +{xp} XP 🔥
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    backgroundColor: COLORS.brandPrimary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: SIZES.radiusPill,
    shadowColor: COLORS.brandPrimaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  text: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    letterSpacing: 0.5,
  },
});
