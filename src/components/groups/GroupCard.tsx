import React, { useRef } from 'react';
import { Pressable, View, StyleSheet, Animated } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { StackedAvatars } from './StackedAvatars';
import { COLORS, SIZES, SHADOWS } from '@/constants/theme';

export interface GroupCardProps {
  name: string;
  emoji: string;
  avatars: (any | null)[];
  activitiesCount: number;
  allSubmitted: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}

export function GroupCard({ 
  name, 
  emoji, 
  avatars, 
  activitiesCount, 
  allSubmitted,
  onPress,
  onLongPress
}: GroupCardProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 2,
        useNativeDriver: true,
        speed: 50,
      }),
      Animated.spring(scale, {
        toValue: 0.98,
        useNativeDriver: true,
        speed: 50,
      })
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        speed: 50,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
      })
    ]).start();
  };

  return (
    <Animated.View style={[styles.touchable, { transform: [{ translateY }, { scale }] }]}>
      <Pressable 
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        delayLongPress={500}
      >
        <Card padding={20} elevation="medium">
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.emoji}>{emoji}</Text>
              <Text variant="headingMd" style={styles.title} numberOfLines={1}>
                {name}
              </Text>
            </View>
            <Badge 
              label={allSubmitted ? 'Done Today' : 'Pending'} 
              variant={allSubmitted ? 'success' : 'default'} 
            />
          </View>

          <View style={styles.footerRow}>
            <StackedAvatars avatars={avatars} size={32} max={4} />
            
            <View style={styles.activitiesContainer}>
              <Text variant="caption" style={styles.activitiesText}>
                {activitiesCount} {activitiesCount === 1 ? 'Activity' : 'Activities'}
              </Text>
            </View>
          </View>
        </Card>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  touchable: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  emoji: {
    fontSize: 24,
    marginRight: 12,
  },
  title: {
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  activitiesContainer: {
    backgroundColor: COLORS.surfaceDark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: SIZES.radiusPill,
  },
  activitiesText: {
    color: COLORS.textPrimary,
  }
});
