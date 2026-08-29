import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, ViewStyle, StyleProp, Animated, View } from 'react-native';
import { COLORS, SHADOWS, SIZES } from '@/constants/theme';
import { Text } from './Text';
import * as Haptics from 'expo-haptics';

export interface ChipProps {
  label: string;
  icon?: string;
  isSelected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function Chip({ label, icon, isSelected = false, onPress, style }: ChipProps) {
  const [isPressed, setIsPressed] = useState(false);
  const translateY = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(translateY, { toValue: 2, useNativeDriver: true, speed: 50 }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 50 }).start();
  };

  const handlePress = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    if (onPress) onPress();
  };

  const containerStyle = [
    styles.container,
    isSelected ? styles.selected : SHADOWS.softElevation,
    style,
  ];

  return (
    <Animated.View style={{ transform: [{ translateY }] }}>
      <Pressable 
        onPress={handlePress} 
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={containerStyle}
      >
        <View style={styles.contentRow}>
          {icon ? <Text style={styles.icon}>{icon}</Text> : null}
          <Text 
            variant="caption" 
            color={isSelected ? COLORS.brandPrimary : COLORS.textPrimary}
            style={styles.label}
          >
            {label}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surfaceBase,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: SIZES.radiusPill,
    alignSelf: 'flex-start',
    marginRight: 8,
    marginBottom: 8,
  },
  selected: {
    borderWidth: 1.5,
    borderColor: COLORS.brandPrimary,
    backgroundColor: COLORS.surfaceDark,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 14,
    marginRight: 6,
  },
  label: {
    fontFamily: 'Inter-SemiBold',
  },
});
