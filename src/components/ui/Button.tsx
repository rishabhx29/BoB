import React, { useState } from 'react';
import { Pressable, PressableProps, StyleSheet, Animated, ViewStyle } from 'react-native';
import { COLORS, SHADOWS, SIZES, TYPOGRAPHY } from '@/constants/theme';
import { Text } from './Text';

export interface ButtonProps extends PressableProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isPill?: boolean;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  isPill = false,
  style,
  onPressIn,
  onPressOut,
  ...rest
}: ButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  
  // Physical push down animation
  const translateY = new Animated.Value(0);

  const handlePressIn = (e: any) => {
    setIsPressed(true);
    Animated.spring(translateY, {
      toValue: variant === 'primary' ? 4 : 2,
      useNativeDriver: true,
      speed: 50,
    }).start();
    if (onPressIn) onPressIn(e);
  };

  const handlePressOut = (e: any) => {
    setIsPressed(false);
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      speed: 50,
    }).start();
    if (onPressOut) onPressOut(e);
  };

  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary': return COLORS.brandPrimary;
      case 'danger': return COLORS.danger;
      case 'secondary':
      default: return COLORS.surfaceBase;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
      case 'danger': return '#FFFFFF';
      case 'secondary':
      default: return COLORS.textPrimary;
    }
  };

  const containerStyles = [
    styles.container,
    {
      backgroundColor: getBackgroundColor(),
      borderRadius: isPill ? SIZES.radiusPill : SIZES.radiusButton,
    },
    variant === 'primary' 
      ? (isPressed ? SHADOWS.fabPressed : SHADOWS.fabDefault)
      : (isPressed ? styles.pressedSecondary : SHADOWS.softElevation),
    style as ViewStyle,
  ];

  return (
    <Animated.View style={{ transform: [{ translateY }] }}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={containerStyles}
        {...rest}
      >
        <Text
          variant={size === 'lg' ? 'headingMd' : 'body'}
          color={getTextColor()}
          style={styles.label}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'Inter-SemiBold', // Make button text a bit bolder
  },
  pressedSecondary: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1, // Simulating inset shadow via lower elevation
  },
});
