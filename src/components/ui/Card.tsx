import { View, ViewProps, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SHADOWS, SIZES } from '@/constants/theme';

export interface CardProps extends ViewProps {
  padding?: number;
  elevation?: 'soft' | 'medium' | 'high';
  onPress?: () => void;
  onLongPress?: () => void;
}

export function Card({
  padding = SIZES.padding,
  elevation = 'medium',
  onPress,
  onLongPress,
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

  const combinedStyle = [
    styles.container,
    { padding },
    getShadow(),
    style,
  ];

  if (onPress || onLongPress) {
    return (
      <TouchableOpacity
        style={combinedStyle}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.8}
        {...(rest as any)}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={combinedStyle}
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
