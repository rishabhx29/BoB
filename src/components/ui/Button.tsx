import React, { useState, useRef } from 'react';
import { Pressable, PressableProps, StyleSheet, Animated, ViewStyle, StyleProp } from 'react-native';
import { COLORS, SHADOWS, SIZES } from '@/constants/theme';
import { Text } from './Text';
import * as Haptics from 'expo-haptics';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  label?: string;
  title?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isPill?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  title,
  variant = 'primary',
  size = 'md',
  isPill = false,
  style,
  disabled,
  onPress,
  onPressIn,
  onPressOut,
  ...rest
}: ButtonProps) {
  const displayLabel = label || title || '';
  const [isPressed, setIsPressed] = useState(false);
  
  // Physical push down animation
  const translateY = useRef(new Animated.Value(0)).current;

  const handlePressIn = (e: any) => {
    if (disabled) return;
    setIsPressed(true);
    Animated.spring(translateY, {
      toValue: variant === 'primary' ? 4 : 2,
      useNativeDriver: true,
      speed: 50,
    }).start();
    if (onPressIn) onPressIn(e);
  };

  const handlePressOut = (e: any) => {
    if (disabled) return;
    setIsPressed(false);
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      speed: 50,
    }).start();
    if (onPressOut) onPressOut(e);
  };

  const handlePress = (e: any) => {
    if (disabled) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    if (onPress) onPress(e);
  };

  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary': return COLORS.brandPrimary;
      case 'danger': return COLORS.danger;
      case 'outline':
      case 'ghost': return 'transparent';
      case 'secondary':
      default: return COLORS.surfaceBase;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
      case 'danger': return '#FFFFFF';
      case 'outline': return COLORS.brandPrimary;
      case 'ghost':
      case 'secondary':
      default: return COLORS.textPrimary;
    }
  };

  const getShadowStyle = () => {
    if (variant === 'outline' || variant === 'ghost') return null;
    if (variant === 'primary') {
      return isPressed ? SHADOWS.fabPressed : SHADOWS.fabDefault;
    }
    return isPressed ? styles.pressedSecondary : SHADOWS.softElevation;
  };

  const getPadding = () => {
    switch (size) {
      case 'sm': return { paddingVertical: 8, paddingHorizontal: 16 };
      case 'lg': return { paddingVertical: 18, paddingHorizontal: 32 };
      case 'md':
      default: return { paddingVertical: 14, paddingHorizontal: 24 };
    }
  };

  const containerStyles = [
    styles.container,
    getPadding(),
    {
      backgroundColor: getBackgroundColor(),
      borderRadius: isPill ? SIZES.radiusPill : SIZES.radiusButton,
      borderWidth: variant === 'outline' ? 1.5 : 0,
      borderColor: variant === 'outline' ? COLORS.brandPrimary : 'transparent',
      opacity: disabled ? 0.5 : 1,
    },
    getShadowStyle(),
    style,
  ];

  return (
    <Animated.View style={{ transform: [{ translateY }] }}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled}
        style={containerStyles}
        {...rest}
      >
        <Text
          variant={size === 'lg' ? 'headingMd' : (size === 'sm' ? 'caption' : 'body')}
          color={getTextColor()}
          style={styles.label}
        >
          {displayLabel}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'Inter-SemiBold',
  },
  pressedSecondary: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
});
