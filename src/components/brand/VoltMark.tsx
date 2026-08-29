import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '@/constants/theme';

/**
 * Volt — the StreakPact mascot mark.
 *
 * Two overlapping parallelograms forming an asymmetric lightning bolt.
 * The negative space in the middle is a deliberate design moment.
 * Pure SVG — scales perfectly, theme-aware via the `color` prop.
 */

interface VoltMarkProps {
  size?: number;
  color?: string;
  withHalo?: boolean;
  style?: ViewStyle;
}

export function VoltMark({ size = 64, color = COLORS.accent, withHalo = false, style }: VoltMarkProps) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      {withHalo && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: size / 2,
              backgroundColor: COLORS.accentTint,
            },
          ]}
        />
      )}
      <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <Defs>
          <LinearGradient id="voltGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={color} stopOpacity="1" />
            <Stop offset="1" stopColor={color} stopOpacity="0.85" />
          </LinearGradient>
        </Defs>
        {/* The Volt: two parallelogram forms that interlock */}
        <Path
          d="M38 4 L14 36 L26 36 L22 60 L50 26 L36 26 L42 4 Z"
          fill="url(#voltGrad)"
        />
      </Svg>
    </View>
  );
}

/**
 * VoltWordmark — the StreakPact logo (mark + wordmark, lockup).
 * Used in splash, onboarding, marketing surfaces.
 */
interface VoltWordmarkProps {
  size?: number;
  color?: string;
  textColor?: string;
  showMark?: boolean;
  style?: ViewStyle;
}

export function VoltWordmark({
  size = 28,
  color = COLORS.accent,
  textColor = COLORS.inkDisplay,
  showMark = true,
  style,
}: VoltWordmarkProps) {
  const markSize = Math.round(size * 1.05);
  return (
    <View style={[styles.wordmarkRow, style]}>
      {showMark && (
        <View style={{ marginRight: 10 }}>
          <VoltMark size={markSize} color={color} />
        </View>
      )}
      <Text
        style={{
          fontFamily: 'SpaceGrotesk-Bold',
          fontSize: size,
          lineHeight: size * 1.1,
          letterSpacing: -0.5,
          color: textColor,
        }}
      >
        Streak<Text style={{ color }}>Pact</Text>
      </Text>
    </View>
  );
}

/**
 * VoltAvatar — the brand mark rendered as a circular avatar
 * for use in empty states, the splash, and the onboarding hero.
 */
interface VoltAvatarProps {
  size?: number;
  withHalo?: boolean;
  style?: ViewStyle;
}

export function VoltAvatar({ size = 96, withHalo = true, style }: VoltAvatarProps) {
  return (
    <View
      style={[
        styles.avatarWrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: COLORS.surfaceBase,
        },
        style,
      ]}
    >
      {withHalo && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: size / 2,
              backgroundColor: COLORS.accentTintStrong,
            },
          ]}
        />
      )}
      <View style={styles.avatarInner}>
        <VoltMark size={size * 0.6} color={COLORS.accent} />
      </View>
    </View>
  );
}

/**
 * VoltInScreen — the mascot seen peeking from a corner (empty states).
 */
export function VoltPeek({ size = 80, style }: { size?: number; style?: ViewStyle }) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 80 80" fill="none">
        <Defs>
          <LinearGradient id="peekGrad" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={COLORS.accent} stopOpacity="0.95" />
            <Stop offset="1" stopColor={COLORS.accentHover} stopOpacity="0.85" />
          </LinearGradient>
        </Defs>
        {/* A circular plate with the bolt in front */}
        <Circle cx="40" cy="40" r="36" fill={COLORS.accentTint} />
        <Circle cx="40" cy="40" r="28" fill={COLORS.surfaceElevated} />
        <Path
          d="M46 18 L26 42 L36 42 L32 62 L54 36 L42 36 L48 18 Z"
          fill="url(#peekGrad)"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default VoltMark;
