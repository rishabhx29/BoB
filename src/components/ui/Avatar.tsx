import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { COLORS, SHADOWS } from '@/constants/theme';

export interface AvatarProps {
  source?: any;
  size?: number;
  isRecessed?: boolean;
}

export function Avatar({ source, size = 48, isRecessed = false }: AvatarProps) {
  const containerStyle = [
    styles.container,
    { width: size, height: size, borderRadius: size / 2 },
    isRecessed ? styles.recessed : SHADOWS.softElevation,
  ];

  return (
    <View style={containerStyle}>
      {source ? (
        <Image 
          source={source} 
          style={{ width: size, height: size, borderRadius: size / 2 }} 
        />
      ) : (
        <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surfaceBase,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    backgroundColor: COLORS.surfaceDark,
  },
  recessed: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  }
});
