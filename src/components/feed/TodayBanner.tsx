import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui';
import { COLORS, SIZES } from '@/constants/theme';

export interface TodayActivity {
  id: string;
  name: string;
  icon: string;
  color: string;
  status: 'pending' | 'submitted' | 'rest';
}

interface TodayBannerProps {
  activities: TodayActivity[];
  onActivityPress: (activity: TodayActivity) => void;
}

export function TodayBanner({ activities, onActivityPress }: TodayBannerProps) {
  return (
    <View style={styles.container}>
      <Text variant="headingMd" style={styles.title}>Today</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {activities.map((act) => (
          <TouchableOpacity
            key={act.id}
            style={styles.pill}
            onPress={() => onActivityPress(act)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrapper, { backgroundColor: act.color }]}>
              <Text variant="body" style={{ color: '#fff' }}>{act.icon}</Text>
            </View>
            <Text variant="caption" style={styles.actName}>{act.name}</Text>
            
            {/* Status dot */}
            {act.status === 'pending' && <View style={[styles.statusDot, { backgroundColor: COLORS.brandPrimary }]} />}
            {act.status === 'submitted' && <View style={[styles.statusDot, { backgroundColor: COLORS.success }]} />}
            {act.status === 'rest' && <View style={[styles.statusDot, { backgroundColor: COLORS.textSecondary }]} />}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    marginBottom: 12,
    paddingHorizontal: SIZES.padding,
  },
  scrollContent: {
    paddingHorizontal: SIZES.padding,
    gap: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceBase,
    padding: 8,
    paddingRight: 16,
    borderRadius: SIZES.radiusPill,
    elevation: 2,
    shadowColor: COLORS.shadowDark,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  actName: {
    fontWeight: 'bold',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
});
