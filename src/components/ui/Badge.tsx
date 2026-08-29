import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { COLORS } from '@/constants/theme';
import { Text } from './Text';

export interface BadgeProps {
  label?: string;
  text?: string;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  style?: StyleProp<ViewStyle>;
}

export function Badge({ label, text, variant = 'default', style }: BadgeProps) {
  const displayLabel = label || text || '';
  
  const getBackgroundColor = () => {
    switch (variant) {
      case 'success': return COLORS.success;
      case 'danger': return COLORS.danger;
      case 'secondary': return COLORS.surfaceDark;
      case 'warning': return '#F59E0B';
      case 'primary':
      case 'default':
      default: return COLORS.brandPrimary;
    }
  };

  const getTextColor = () => {
    if (variant === 'secondary') return COLORS.textPrimary;
    return '#FFFFFF';
  };

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }, style]}>
      <Text variant="caption" color={getTextColor()} style={styles.label}>
        {displayLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
  }
});
