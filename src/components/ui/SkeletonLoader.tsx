import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { COLORS, SIZES } from '@/constants/theme';

export interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = SIZES.base * 2, style }: SkeletonProps) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      shimmer.value,
      [0, 1],
      [COLORS.surfaceDark, COLORS.shadowLight]
    ),
  }));

  return (
    <Animated.View
      style={[
        { width: width as any, height, borderRadius },
        animatedStyle,
        style,
      ]}
    />
  );
}

// Skeleton for a Feed Card
export function FeedCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Skeleton width={44} height={44} borderRadius={22} />
        <View style={styles.headerText}>
          <Skeleton width={120} height={14} />
          <View style={{ height: 6 }} />
          <Skeleton width={80} height={10} />
        </View>
      </View>
      <View style={{ height: 12 }} />
      <Skeleton width="100%" height={200} borderRadius={16} />
      <View style={{ height: 12 }} />
      <Skeleton width="70%" height={14} />
      <View style={{ height: 6 }} />
      <Skeleton width="100%" height={12} />
      <View style={{ height: 6 }} />
      <Skeleton width="90%" height={12} />
    </View>
  );
}

// Skeleton for a Calendar Cell row
export function CalendarRowSkeleton() {
  return (
    <View style={styles.calendarRow}>
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton key={i} width={36} height={36} borderRadius={8} style={{ margin: 2 }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceBase,
    borderRadius: SIZES.radiusCard,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
});
