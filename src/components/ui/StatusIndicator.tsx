import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/theme';

export interface StatusIndicatorProps {
  status: 'pending' | 'completed' | 'missed' | 'rest';
  size?: number;
}

export function StatusIndicator({ status, size = 16 }: StatusIndicatorProps) {
  
  const getStyles = () => {
    switch (status) {
      case 'completed':
        return [
          styles.completed,
          { 
            width: size, 
            height: size, 
            borderRadius: size / 2,
            shadowColor: COLORS.success,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 10,
            elevation: 10,
          }
        ];
      case 'missed':
        return [
          styles.missed,
          { 
            width: size, 
            height: size, 
            borderRadius: size / 2,
            shadowColor: COLORS.danger,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 10,
            elevation: 10,
          }
        ];
      case 'rest':
        return [
          styles.rest,
          { width: size, height: size, borderRadius: size / 2 }
        ];
      case 'pending':
      default:
        return [
          styles.pending,
          { width: size, height: size, borderRadius: size / 2 }
        ];
    }
  };

  return <View style={getStyles()} />;
}

const styles = StyleSheet.create({
  pending: {
    backgroundColor: COLORS.surfaceDark,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  completed: {
    backgroundColor: COLORS.success,
  },
  missed: {
    backgroundColor: COLORS.danger,
  },
  rest: {
    backgroundColor: COLORS.textSecondary,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
});
