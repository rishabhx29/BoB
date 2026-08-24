import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { COLORS, SHADOWS, SIZES } from '@/constants/theme';

export interface CardProps extends ViewProps {
  padding?: number;
  elevation?: 'soft' | 'medium' | 'high';
}

export function Card({
  padding = SIZES.padding,
  elevation = 'medium',
  style,
  children,
  ...rest
}: CardProps) {
  
  const getShadow = () => {
    switch (elevation) {
      case 'soft': return SHADOWS.softElevation;
      case 'high': return SHADOWS.highElevation;
      case 'medium':
      default: return SHADOWS.mediumElevation;
    }
  };

  return (
    <View
      style={[
        styles.container,
        { padding },
        getShadow(),
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surfaceBase,
    borderRadius: SIZES.radiusCard,
    width: '100%',
  },
});
