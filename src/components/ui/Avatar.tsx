import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { COLORS, SHADOWS } from '@/constants/theme';

export interface AvatarProps {
  source?: any;
  src?: string | null;
  url?: string | null;
  name?: string;
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
  isRecessed?: boolean;
}

export function Avatar({ source, src, url, name, size = 48, isRecessed = false }: AvatarProps) {
  let dimension = 48;
  if (typeof size === 'number') {
    dimension = size;
  } else if (size === 'sm') {
    dimension = 32;
  } else if (size === 'md') {
    dimension = 48;
  } else if (size === 'lg') {
    dimension = 64;
  } else if (size === 'xl') {
    dimension = 80;
  }

  const rawImage = source || src || url;
  const imageSource = typeof rawImage === 'string' && rawImage.length > 0 
    ? { uri: rawImage } 
    : rawImage;

  const containerStyle = [
    styles.container,
    { width: dimension, height: dimension, borderRadius: dimension / 2 },
    isRecessed ? styles.recessed : SHADOWS.softElevation,
  ];

  return (
    <View style={containerStyle}>
      {imageSource ? (
        <Image 
          source={imageSource} 
          style={{ width: dimension, height: dimension, borderRadius: dimension / 2 }} 
        />
      ) : (
        <View style={[styles.placeholder, { width: dimension, height: dimension, borderRadius: dimension / 2 }]}>
          {name ? (
            <Text style={{ fontSize: dimension * 0.4, fontWeight: 'bold', color: COLORS.textSecondary }}>
              {name.charAt(0).toUpperCase()}
            </Text>
          ) : null}
        </View>
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
