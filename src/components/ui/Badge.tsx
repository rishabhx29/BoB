import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '@/constants/theme';
import { Text } from './Text';

export interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'danger';
  style?: ViewStyle;
}

export function Badge({ label, variant = 'default', style }: BadgeProps) {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'success': return COLORS.success;
      case 'danger': return COLORS.danger;
      case 'default':
      default: return COLORS.brandPrimary;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }, style]}>
      <Text variant="caption" color="#FFFFFF" style={styles.label}>
        {label}
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
