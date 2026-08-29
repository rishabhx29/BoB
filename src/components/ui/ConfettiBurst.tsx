import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Confetti colors based on brand palette
const CONFETTI_COLORS = [
  '#F97316', // Orange
  '#34D399', // Mint
  '#60A5FA', // Blue
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#A78BFA', // Purple
];

interface ConfettiPieceProps {
  color: string;
  delay: number;
  startX: number;
}

function ConfettiPiece({ color, delay, startX }: ConfettiPieceProps) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 100 }));
    translateY.value = withDelay(
      delay,
      withTiming(SCREEN_HEIGHT * 0.6, {
        duration: 1800 + Math.random() * 600,
        easing: Easing.out(Easing.ease),
      })
    );
    translateX.value = withDelay(
      delay,
      withTiming((Math.random() - 0.5) * 200, {
        duration: 1800 + Math.random() * 600,
        easing: Easing.inOut(Easing.ease),
      })
    );
    rotate.value = withDelay(
      delay,
      withTiming(720 + Math.random() * 360, { duration: 2000 })
    );
    // Fade out
    opacity.value = withDelay(delay + 1400, withTiming(0, { duration: 600 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const size = 8 + Math.random() * 8;
  const isRect = Math.random() > 0.5;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: -20,
          left: startX,
          width: size,
          height: isRect ? size * 0.5 : size,
          backgroundColor: color,
          borderRadius: isRect ? 2 : size / 2,
        },
        animatedStyle,
      ]}
    />
  );
}

export interface ConfettiBurstProps {
  isVisible: boolean;
  pieceCount?: number;
}

/**
 * Full-screen confetti burst for submission success and milestone events.
 */
export function ConfettiBurst({ isVisible, pieceCount = 40 }: ConfettiBurstProps) {
  if (!isVisible) return null;

  const pieces = Array.from({ length: pieceCount }, (_, i) => ({
    key: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: Math.random() * 400,
    startX: Math.random() * SCREEN_WIDTH,
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      {pieces.map((piece) => (
        <ConfettiPiece
          key={piece.key}
          color={piece.color}
          delay={piece.delay}
          startX={piece.startX}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
    overflow: 'hidden',
  },
});
