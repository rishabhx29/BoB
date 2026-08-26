import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Text } from '@/components/ui/Text';
import { COLORS, SHADOWS } from '@/constants/theme';

interface StackedAvatarsProps {
  avatars: (any | null)[];
  max?: number;
  size?: number;
}

export function StackedAvatars({ avatars, max = 3, size = 32 }: StackedAvatarsProps) {
  const displayAvatars = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <View style={styles.container}>
      {displayAvatars.map((source, index) => (
        <View 
          key={index} 
          style={[
            styles.avatarContainer, 
            { marginLeft: index === 0 ? 0 : -size / 3 }
          ]}
        >
          <Avatar source={source} size={size} />
        </View>
      ))}
      {remaining > 0 && (
        <View 
          style={[
            styles.avatarContainer, 
            styles.moreContainer,
            { 
              width: size, 
              height: size, 
              borderRadius: size / 2,
              marginLeft: -size / 3 
            }
          ]}
        >
          <Text variant="caption" style={{ color: COLORS.surfaceScreen }}>
            +{remaining}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    borderWidth: 2,
    borderColor: COLORS.surfaceBase,
    borderRadius: 999,
    ...SHADOWS.softElevation,
  },
  moreContainer: {
    backgroundColor: COLORS.surfaceDark,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
