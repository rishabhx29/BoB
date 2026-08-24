import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SHADOWS, SIZES } from '@/constants/theme';
import { Text } from './Text';

export interface ChipProps {
  label: string;
  isSelected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Chip({ label, isSelected = false, onPress, style }: ChipProps) {
  const containerStyle = [
    styles.container,
    isSelected ? styles.selected : SHADOWS.softElevation,
    style,
  ];

  return (
    <Pressable onPress={onPress} style={containerStyle}>
      <Text 
        variant="caption" 
        color={isSelected ? COLORS.brandPrimary : COLORS.textPrimary}
        style={styles.label}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surfaceBase,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: SIZES.radiusPill,
    alignSelf: 'flex-start',
    marginRight: 8,
    marginBottom: 8,
  },
  selected: {
    borderWidth: 1,
    borderColor: COLORS.brandPrimary,
    backgroundColor: COLORS.surfaceDark,
  },
  label: {
    fontFamily: 'Inter-SemiBold',
  }
});
