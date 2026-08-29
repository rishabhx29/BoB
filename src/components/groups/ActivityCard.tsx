import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StreakCounter } from '@/components/ui/StreakCounter';
import { COLORS, SIZES, SHADOWS } from '@/constants/theme';
import { Activity, GroupMember } from '@/types';

export type MemberActivityStatus = {
  member: GroupMember;
  currentStreak: number;
  hasSubmittedToday: boolean;
};

interface ActivityCardProps {
  activity: Activity;
  memberStatuses: MemberActivityStatus[];
  onPress: () => void;
  onSubmit: () => void;
}

export function ActivityCard({ activity, memberStatuses, onPress, onSubmit }: ActivityCardProps) {
  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={[styles.headerEdge, { backgroundColor: activity.color }]} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.icon}>{activity.icon}</Text>
          <View style={styles.titleContainer}>
            <Text variant="headingMd" style={styles.title}>{activity.name}</Text>
            <Text variant="caption" color={COLORS.textSecondary}>
              {activity.frequency === 'daily' ? 'Daily' : 'Specific Days'}
            </Text>
          </View>
        </View>

        <View style={styles.grid}>
          {memberStatuses.map((status, index) => (
            <View key={status.member.userId || index} style={styles.memberCell}>
              <View style={styles.avatarContainer}>
                <Avatar url={status.member.user?.avatarUrl} name={status.member.user?.displayName || 'User'} size={48} />
                <View style={[
                  styles.statusDot, 
                  { backgroundColor: status.hasSubmittedToday ? COLORS.success : COLORS.surfaceDark }
                ]} />
              </View>
              <View style={styles.streakWrapper}>
                <StreakCounter count={status.currentStreak} size="small" />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Button 
            label="Submit for Today" 
            onPress={onSubmit}
          />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: SIZES.padding,
  },
  headerEdge: {
    height: 6,
    width: '100%',
  },
  content: {
    padding: SIZES.padding,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 28,
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    marginBottom: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  memberCell: {
    alignItems: 'center',
    width: 64,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  statusDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.surfaceBase,
  },
  streakWrapper: {
    transform: [{ scale: 0.8 }],
  },
  footer: {
    marginTop: 8,
  },
});
