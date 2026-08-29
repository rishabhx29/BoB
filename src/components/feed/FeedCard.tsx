import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Card, Text, Avatar, Badge } from '@/components/ui';
import { COLORS, SIZES, TYPOGRAPHY } from '@/constants/theme';

export interface FeedCardProps {
  user: { name: string; avatarUrl: string; groupName: string };
  activity: { name: string; icon: string; color: string };
  submission: {
    photoUrl?: string;
    title: string;
    description: string;
    summaryText: string;
    timestamp: string;
    streakCount: number;
    reactions: number;
    comments: number;
  };
}

export function FeedCard({ user, activity, submission }: FeedCardProps) {
  return (
    <Card elevation="medium" padding={SIZES.padding} style={styles.cardContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Avatar src={user.avatarUrl} size="md" />
          <View style={styles.userText}>
            <Text variant="headingMd">{user.name}</Text>
            <View style={styles.groupTag}>
              <Text variant="caption">{user.groupName}</Text>
            </View>
          </View>
        </View>
        <Text variant="caption">{submission.timestamp}</Text>
      </View>

      {/* Activity Title */}
      <View style={styles.activityHeader}>
        <View style={[styles.activityIconWrapper, { backgroundColor: activity.color }]}>
          <Text variant="body" style={{ color: '#fff' }}>{activity.icon}</Text>
        </View>
        <Text variant="headingMd">{activity.name}</Text>
        <Badge text={`🔥 Day ${submission.streakCount}`} variant="success" style={styles.streakBadge} />
      </View>

      {/* Photo */}
      {submission.photoUrl && (
        <Image source={{ uri: submission.photoUrl }} style={styles.photo} resizeMode="cover" />
      )}

      {/* Content */}
      <View style={styles.content}>
        <Text variant="headingMd" style={styles.title}>{submission.title}</Text>
        <Text variant="body" style={styles.description} numberOfLines={3}>
          {submission.description}
        </Text>
        <View style={styles.summaryBox}>
          <Text variant="caption">{submission.summaryText}</Text>
        </View>
      </View>

      {/* Footer / Reactions */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.reactionButton}>
          <Text variant="body">🔥</Text>
          <Text variant="caption" style={styles.reactionCount}>{submission.reactions}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.reactionButton}>
          <Text variant="body">💬</Text>
          <Text variant="caption" style={styles.reactionCount}>{submission.comments}</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: SIZES.padding,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userText: {
    justifyContent: 'center',
  },
  groupTag: {
    backgroundColor: COLORS.surfaceDark,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: SIZES.radiusPill,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  activityIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakBadge: {
    marginLeft: 'auto',
  },
  photo: {
    width: '100%',
    height: 300,
    borderRadius: SIZES.radiusButton,
    marginBottom: 16,
    backgroundColor: COLORS.surfaceDark,
  },
  content: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
  },
  description: {
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  summaryBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: 12,
    borderRadius: SIZES.radiusButton,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.brandPrimary,
  },
  footer: {
    flexDirection: 'row',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceDark,
    paddingTop: 16,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceBase,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: SIZES.radiusPill,
    ...TYPOGRAPHY.caption,
  },
  reactionCount: {
    marginLeft: 6,
    fontWeight: 'bold',
  },
});
