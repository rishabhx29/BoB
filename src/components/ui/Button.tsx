import React, { useCallback } from 'react';
import { Pressable, PressableProps, StyleSheet, ViewStyle, StyleProp, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { COLORS, RADIUS, SHADOWS, EASE, DURATION, SPACE } from '@/constants/theme';
import { Text } from './Text';
import { Icon } from './Icon';
import * as Haptics from 'expo-haptics';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label?: string;
  title?: string;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  isPill?: boolean;
  leadingIcon?: any;     // phosphor icon name
  trailingIcon?: any;    // phosphor icon name
  iconOnly?: any;        // phosphor icon name
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  label,
  title,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isPill = true,
  leadingIcon,
  trailingIcon,
  iconOnly,
  loading = false,
  disabled,
  style,
  onPressIn,
  onPressOut,
  onPress,
  ...rest
}: ButtonProps) {
  const displayLabel = label || title || '';
  const press = useSharedValue(0);

  const handlePressIn = useCallback((e: any) => {
    if (disabled) return;
    press.value = withSpring(1, { damping: 18, stiffness: 320, mass: 0.6 });
    onPressIn?.(e);
  }, [disabled, onPressIn]);

  const handlePressOut = useCallback((e: any) => {
    if (disabled) return;
    press.value = withSpring(0, { damping: 18, stiffness: 320, mass: 0.6 });
    onPressOut?.(e);
  }, [disabled, onPressOut]);

  const handlePress = useCallback((e: any) => {
    if (disabled || loading) return;
    try {
      Haptics.impactAsync(
        variant === 'primary' || variant === 'danger'
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light
      );
    } catch {}
    onPress?.(e);
  }, [disabled, loading, variant, onPress]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(press.value, [0, 1], [1, 0.97]);
    const translateY = interpolate(press.value, [0, 1], [0, 1]);
    return { transform: [{ scale }, { translateY }] };
  });

  const palette = getPalette(variant);
  const padding = getPadding(size);
  const radius = isPill ? RADIUS.pill : (size === 'sm' ? RADIUS.sm : RADIUS.md);
  const iconSize = size === 'lg' ? 22 : size === 'sm' ? 16 : 18;
  const textVariant = size === 'lg' ? 'headingMd' : size === 'sm' ? 'bodySm' : 'bodyMedium';
  const showShadow = variant === 'primary' || variant === 'danger' || variant === 'secondary';

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[
        styles.base,
        padding,
        {
          backgroundColor: palette.bg,
          borderRadius: radius,
          borderWidth: variant === 'outline' || variant === 'ghost' ? 1 : 0,
          borderColor: variant === 'outline' ? COLORS.hairlineStrong : 'transparent',
          opacity: disabled ? 0.45 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        showShadow ? (variant === 'primary' || variant === 'danger' ? SHADOWS.cta : SHADOWS.card) : null,
        animatedStyle,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, busy: loading }}
      {...rest}
    >
      <View style={styles.inner}>
        {leadingIcon && !loading && !iconOnly && (
          <View style={{ marginRight: 8 }}>
            <Icon name={leadingIcon} size={iconSize} color={palette.fg} />
          </View>
        )}
        {iconOnly && !loading ? (
          <Icon name={iconOnly} size={iconSize} color={palette.fg} />
        ) : loading ? (
          <LoadingDots color={palette.fg} />
        ) : (
          <Text variant={textVariant} color={palette.fg} style={styles.label}>
            {displayLabel}
          </Text>
        )}
        {trailingIcon && !loading && !iconOnly && (
          <View style={{ marginLeft: 8 }}>
            <Icon name={trailingIcon} size={iconSize} color={palette.fg} />
          </View>
        )}
      </View>
    </AnimatedPressable>
  );
}

function LoadingDots({ color }: { color: string }) {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  React.useEffect(() => {
    const animate = (sv: any, delay: number) => {
      sv.value = withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }, () => {
        sv.value = withTiming(0, { duration: 600, easing: Easing.inOut(Easing.ease) });
      });
    };
    const t1 = setTimeout(() => { dot1.value = withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }, () => { dot1.value = withTiming(0, { duration: 500, easing: Easing.inOut(Easing.ease) }); }); }, 0);
    const t2 = setTimeout(() => { dot2.value = withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }, () => { dot2.value = withTiming(0, { duration: 500, easing: Easing.inOut(Easing.ease) }); }); }, 150);
    const t3 = setTimeout(() => { dot3.value = withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }, () => { dot3.value = withTiming(0, { duration: 500, easing: Easing.inOut(Easing.ease) }); }); }, 300);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const d1 = useAnimatedStyle(() => ({ opacity: 0.4 + dot1.value * 0.6 }));
  const d2 = useAnimatedStyle(() => ({ opacity: 0.4 + dot2.value * 0.6 }));
  const d3 = useAnimatedStyle(() => ({ opacity: 0.4 + dot3.value * 0.6 }));

  return (
    <View style={styles.dots}>
      <Animated.View style={[styles.dot, { backgroundColor: color }, d1]} />
      <Animated.View style={[styles.dot, { backgroundColor: color }, d2]} />
      <Animated.View style={[styles.dot, { backgroundColor: color }, d3]} />
    </View>
  );
}

function getPadding(size: Size) {
  switch (size) {
    case 'sm': return { paddingVertical: 10, paddingHorizontal: 16 };
    case 'lg': return { paddingVertical: 18, paddingHorizontal: 28 };
    case 'md':
    default: return { paddingVertical: 14, paddingHorizontal: 22 };
  }
}

function getPalette(variant: Variant) {
  switch (variant) {
    case 'primary':   return { bg: COLORS.accent, fg: '#FFFFFF' };
    case 'secondary': return { bg: COLORS.surfaceElevated, fg: COLORS.inkDisplay };
    case 'ghost':     return { bg: 'transparent', fg: COLORS.inkPrimary };
    case 'danger':    return { bg: COLORS.danger, fg: '#FFFFFF' };
    case 'outline':   return { bg: 'transparent', fg: COLORS.inkDisplay };
  }
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    letterSpacing: 0.1,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

export default Button;
