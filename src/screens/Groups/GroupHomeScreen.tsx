import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Animated, Pressable, Alert, RefreshControl, Share } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { COLORS, SIZES, SHADOWS, TYPOGRAPHY } from '@/constants/theme';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { ActivityCard, MemberActivityStatus } from '@/components/groups/ActivityCard';
import { Activity, Group, GroupMember } from '@/types';
import { fetchGroupWithMembers, fetchGroupActivities } from '@/services/groupService';
import * as Haptics from 'expo-haptics';

const TactileIconButton = ({ icon, onPress }: { icon: string; onPress: () => void }) => {
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

  return (
    <Animated.View style={{ transform: [{ translateY }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.iconButton,
          isPressed ? styles.iconButtonPressed : SHADOWS.softElevation,
        ]}
      >
        <Text variant="headingMd">{icon}</Text>
      </Pressable>
    </Animated.View>
  );
};

const AvatarStack = ({ members }: { members: GroupMember[] }) => {
  const displayed = members.slice(0, 3);
  const remaining = members.length - 3;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {displayed.map((m, i) => (
        <View key={m.userId || i} style={{ marginLeft: i === 0 ? 0 : -10 }}>
          <Avatar url={m.user?.avatarUrl} name={m.user?.displayName} size={32} />
        </View>
      ))}
      {remaining > 0 && (
        <View style={[styles.avatarMore, SHADOWS.softElevation]}>
          <Text variant="caption" style={{ color: COLORS.textPrimary, fontWeight: 'bold' }}>
            +{remaining}
          </Text>
        </View>
      )}
    </View>
  );
};

const DEFAULT_MEMBERS: GroupMember[] = [
  {
    groupId: 'g1',
    userId: 'u1',
    role: 'admin',
    joinedAt: new Date().toISOString(),
    user: {
      id: 'u1',
      email: 'alex@streakpact.app',
      username: 'AlexR',
      displayName: 'Alex Rivera',
      avatarUrl: 'https://i.pravatar.cc/150?u=alex',
      xp: 4250,
      level: 4,
      totalSubmissions: 48,
      longestStreak: 18,
      shieldsAvailable: 2,
      createdAt: '',
      updatedAt: '',
    },
  },
  {
    groupId: 'g1',
    userId: 'u2',
    role: 'member',
    joinedAt: new Date().toISOString(),
    user: {
      id: 'u2',
      email: 'sarah@streakpact.app',
      username: 'SarahK',
      displayName: 'Sarah Kim',
      avatarUrl: 'https://i.pravatar.cc/150?u=sarah',
      xp: 3800,
      level: 4,
      totalSubmissions: 42,
      longestStreak: 14,
      shieldsAvailable: 1,
      createdAt: '',
      updatedAt: '',
    },
  },
  {
    groupId: 'g1',
    userId: 'u3',
    role: 'member',
    joinedAt: new Date().toISOString(),
    user: {
      id: 'u3',
      email: 'mike@streakpact.app',
      username: 'MikeD',
      displayName: 'Mike Chen',
      avatarUrl: 'https://i.pravatar.cc/150?u=mike',
      xp: 2900,
      level: 3,
      totalSubmissions: 31,
      longestStreak: 9,
      shieldsAvailable: 0,
      createdAt: '',
      updatedAt: '',
    },
  },
  {
    groupId: 'g1',
    userId: 'u4',
    role: 'member',
    joinedAt: new Date().toISOString(),
    user: {
      id: 'u4',
      email: 'jessica@streakpact.app',
      username: 'JessW',
      displayName: 'Jessica Wu',
      avatarUrl: 'https://i.pravatar.cc/150?u=jessica',
      xp: 1850,
      level: 2,
      totalSubmissions: 19,
      longestStreak: 6,
      shieldsAvailable: 1,
      createdAt: '',
      updatedAt: '',
    },
  },
];

const DEFAULT_ACTIVITIES: Activity[] = [
  {
    id: 'act-1',
    groupId: 'g1',
    name: 'Gym / Workout',
    icon: '🏋️',
    color: '#EF4444',
    templateKey: 'gym',
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    restDaysPerWeek: 1,
    requirePhoto: true,
    templateFields: [],
    isArchived: false,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'act-2',
    groupId: 'g1',
    name: 'Study / Focus Session',
    icon: '📚',
    color: '#3B82F6',
    templateKey: 'study',
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    restDaysPerWeek: 1,
    requirePhoto: false,
    templateFields: [],
    isArchived: false,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'act-3',
    groupId: 'g1',
    name: 'Morning Run',
    icon: '🏃',
    color: '#10B981',
    templateKey: 'run',
    frequency: 'specific_days',
    frequencyDays: [1, 3, 5],
    restDaysPerWeek: 2,
    requirePhoto: true,
    templateFields: [],
    isArchived: false,
    createdAt: '',
    updatedAt: '',
  },
];

export default function GroupHomeScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { groupId, groupName: routeName = 'Morning Warriors', groupEmoji: routeEmoji = '🌅' } = route.params || {};

  const [activeTab, setActiveTab] = useState<'Feed' | 'Activities' | 'Members' | 'Leaderboard'>('Feed');
  const tabs: ('Feed' | 'Activities' | 'Members' | 'Leaderboard')[] = ['Feed', 'Activities', 'Members', 'Leaderboard'];

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>(DEFAULT_MEMBERS);
  const [activities, setActivities] = useState<Activity[]>(DEFAULT_ACTIVITIES);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nudgedMembers, setNudgedMembers] = useState<{ [userId: string]: boolean }>({});

  const loadGroupData = useCallback(async () => {
    if (!groupId) return;
    try {
      const [groupResult, activitiesResult] = await Promise.allSettled([
        fetchGroupWithMembers(groupId),
        fetchGroupActivities(groupId),
      ]);

      if (groupResult.status === 'fulfilled' && groupResult.value) {
        setGroup(groupResult.value.group);
        if (groupResult.value.members && groupResult.value.members.length > 0) {
          setMembers(groupResult.value.members);
        }
      }

      if (activitiesResult.status === 'fulfilled' && activitiesResult.value && activitiesResult.value.length > 0) {
        setActivities(activitiesResult.value);
      }
    } catch {
      // Fallback silently to mock state in offline / guest mode
    }
  }, [groupId]);

  useFocusEffect(
    useCallback(() => {
      loadGroupData();
    }, [loadGroupData])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    await loadGroupData();
    setIsRefreshing(false);
  };

  const getMemberStatuses = (activityId: string): MemberActivityStatus[] => {
    return members.map((m, idx) => ({
      member: m,
      currentStreak: Math.max(1, 14 - idx * 3),
      hasSubmittedToday: idx % 2 === 0,
    }));
  };

  const handleNudge = (member: GroupMember) => {
    if (nudgedMembers[member.userId]) {
      Alert.alert('⚡ Already Nudged', `You already sent a nudge to ${member.user?.displayName || 'your teammate'} today!`);
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    setNudgedMembers(prev => ({ ...prev, [member.userId]: true }));
    Alert.alert(
      '⚡ Nudge Sent!',
      `You sent a motivating reminder to ${member.user?.displayName || 'your teammate'}!`,
      [{ text: 'Keep it up! 💪' }]
    );
  };

  const handleShareInvite = async () => {
    const code = group?.inviteCode || 'WARRIOR6';
    try {
      Haptics.selectionAsync();
    } catch {}
    try {
      await Share.share({
        message: `Join our habit pact "${group?.name || routeName}" on StreakPact using code: ${code}\nstreakpact://join/${code}`,
      });
    } catch {}
  };

  const handleActivitySubmit = (activity: Activity) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    navigation.navigate('ActivityDetail', { activity, groupId });
  };

  const displayGroupName = group?.name || routeName;
  const displayGroupEmoji = group?.emoji || routeEmoji;
  const displayGoal = group?.goalDescription || 'Stay consistent 6 days a week. Keep each other accountable and no zero days!';

  return (
    <View style={styles.container}>
      {/* Header Panel */}
      <View style={[styles.headerPanel, SHADOWS.highElevation]}>
        <View style={styles.headerTopRow}>
          <TactileIconButton icon="←" onPress={() => navigation.goBack()} />
          <View style={styles.headerCenter}>
            <Text style={styles.headerEmoji}>{displayGroupEmoji}</Text>
            <Text variant="headingMd" style={{ marginTop: 4 }}>{displayGroupName}</Text>
          </View>
          <TactileIconButton icon="⚙️" onPress={() => navigation.navigate('GroupSettings', { groupId: groupId || 'g1' })} />
        </View>

        <View style={styles.headerBottomRow}>
          <TouchableOpacity style={styles.memberRow} onPress={() => setActiveTab('Members')}>
            <AvatarStack members={members} />
          </TouchableOpacity>

          <View style={styles.streakDisplay}>
            <Text variant="digitalDisplay" style={{ fontSize: 13 }}>🔥 12 DAY STREAK</Text>
          </View>
        </View>
      </View>

      {/* Tabs Bar */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SIZES.padding }}>
          {tabs.map((tab) => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => {
                try {
                  Haptics.selectionAsync();
                } catch {}
                setActiveTab(tab);
              }}
            >
              <Text style={{ 
                color: activeTab === tab ? COLORS.brandPrimary : COLORS.textSecondary, 
                fontWeight: activeTab === tab ? 'bold' : '500',
                fontSize: 15
              }}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Tab Content */}
      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={handleRefresh}
            tintColor={COLORS.brandPrimary} 
          />
        }
      >
        
        {/* ─── TAB 1: FEED ─── */}
        {activeTab === 'Feed' && (
          <View style={styles.fullWidthSection}>
            {/* Weekly Progress Card */}
            <Card style={styles.calendarPlaceholder}>
              <View style={styles.sectionHeaderRow}>
                <Text variant="headingMd">Weekly Progress</Text>
                <Badge text="All on Track" variant="primary" />
              </View>
              <View style={styles.calendarGrid}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                  <View key={i} style={styles.dayCol}>
                    <Text variant="caption" color={COLORS.textSecondary}>{day}</Text>
                    <View style={styles.dotStack}>
                      <View style={[styles.dot, { backgroundColor: COLORS.success }]} />
                      <View style={[styles.dot, { backgroundColor: i < 5 ? COLORS.success : COLORS.surfaceDark }]} />
                      <View style={[styles.dot, { backgroundColor: i < 4 ? COLORS.success : COLORS.surfaceDark }]} />
                    </View>
                  </View>
                ))}
              </View>
            </Card>

            {/* Group Goal / Status Card */}
            <Card style={{ marginTop: 16 }}>
              <Text variant="headingMd" style={{ marginBottom: 4 }}>🎯 Group Goal</Text>
              <Text variant="body" color={COLORS.textSecondary}>
                {displayGoal}
              </Text>
            </Card>

            {/* Recent Submissions Snippet */}
            <View style={{ marginTop: 24, marginBottom: 16 }}>
              <Text variant="headingMd" style={{ marginBottom: 12 }}>Today's Submissions</Text>
              <Card style={styles.submissionSnippetCard}>
                <View style={styles.snippetRow}>
                  <Avatar url="https://i.pravatar.cc/150?u=alex" size={40} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text variant="headingMd">Alex Rivera</Text>
                    <Text variant="caption" color={COLORS.textSecondary}>Leg day complete! (60 min) • 2h ago</Text>
                  </View>
                  <Text style={{ fontSize: 20 }}>🔥</Text>
                </View>
              </Card>

              <Card style={[styles.submissionSnippetCard, { marginTop: 12 }]}>
                <View style={styles.snippetRow}>
                  <Avatar url="https://i.pravatar.cc/150?u=sarah" size={40} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text variant="headingMd">Sarah Kim</Text>
                    <Text variant="caption" color={COLORS.textSecondary}>Read 25 pages of Deep Work • 4h ago</Text>
                  </View>
                  <Text style={{ fontSize: 20 }}>📚</Text>
                </View>
              </Card>
            </View>
          </View>
        )}

        {/* ─── TAB 2: ACTIVITIES ─── */}
        {activeTab === 'Activities' && (
          <View style={styles.fullWidthSection}>
            <View style={styles.sectionHeaderRow}>
              <Text variant="headingMd">Active Pacts ({activities.length})</Text>
              <Button 
                label="+ Add Activity" 
                variant="secondary"
                onPress={() => navigation.navigate('CreateActivity', { groupId: groupId || 'g1' })}
                style={{ paddingVertical: 8, paddingHorizontal: 14 }}
              />
            </View>

            {activities.length === 0 ? (
              <Card style={{ alignItems: 'center', padding: 24, marginVertical: 12 }}>
                <Text style={{ fontSize: 36, marginBottom: 8 }}>⚡</Text>
                <Text variant="headingMd" style={{ textAlign: 'center' }}>No Activities Yet</Text>
                <Text variant="body" color={COLORS.textSecondary} style={{ textAlign: 'center', marginVertical: 8 }}>
                  Create your first pact activity for this group!
                </Text>
                <Button 
                  label="Create Activity" 
                  onPress={() => navigation.navigate('CreateActivity', { groupId: groupId || 'g1' })}
                  style={{ marginTop: 8 }}
                />
              </Card>
            ) : (
              activities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  memberStatuses={getMemberStatuses(activity.id)}
                  onPress={() => navigation.navigate('ActivityDetail', { activity, groupId })}
                  onSubmit={() => handleActivitySubmit(activity)}
                />
              ))
            )}
          </View>
        )}

        {/* ─── TAB 3: MEMBERS ─── */}
        {activeTab === 'Members' && (
          <View style={styles.fullWidthSection}>
            <View style={styles.sectionHeaderRow}>
              <Text variant="headingMd">Team Members ({members.length})</Text>
              <Text variant="caption" color={COLORS.textSecondary}>Max 6 members</Text>
            </View>

            {/* Invite Teammate Card */}
            {members.length < 6 && (
              <Card style={styles.inviteCard}>
                <View style={styles.inviteRow}>
                  <View style={{ flex: 1 }}>
                    <Text variant="headingMd" style={{ color: COLORS.brandPrimary }}>Invite Teammates</Text>
                    <Text variant="caption" color={COLORS.textSecondary} style={{ marginTop: 2 }}>
                      Share code: <Text variant="caption" style={{ fontWeight: 'bold', color: COLORS.textPrimary }}>{group?.inviteCode || 'WARRIOR6'}</Text>
                    </Text>
                  </View>
                  <Button 
                    label="Share 🔗" 
                    variant="secondary"
                    onPress={handleShareInvite}
                    style={{ paddingVertical: 6, paddingHorizontal: 12 }}
                  />
                </View>
              </Card>
            )}

            {members.map((member, idx) => {
              const isNudged = !!nudgedMembers[member.userId];
              return (
                <Card key={member.userId} style={styles.memberCard}>
                  <View style={styles.memberCardRow}>
                    <Avatar url={member.user?.avatarUrl} name={member.user?.displayName} size={48} />
                    <View style={styles.memberInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text variant="headingMd">{member.user?.displayName}</Text>
                        {member.role === 'admin' && <Badge text="ADMIN" variant="primary" />}
                      </View>
                      <Text variant="caption" color={COLORS.textSecondary}>
                        Level {member.user?.level || 1} • {member.user?.xp || 0} XP • 🔥 {Math.max(1, 14 - idx * 3)}d streak
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={[
                        styles.nudgeBtn, 
                        isNudged ? styles.nudgeBtnActive : SHADOWS.softElevation
                      ]}
                      onPress={() => handleNudge(member)}
                    >
                      <Text style={{ 
                        fontSize: 13, 
                        fontWeight: 'bold', 
                        color: isNudged ? COLORS.success : COLORS.brandPrimary 
                      }}>
                        {isNudged ? '✓ Nudged' : '⚡ Nudge'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        {/* ─── TAB 4: LEADERBOARD ─── */}
        {activeTab === 'Leaderboard' && (
          <View style={styles.fullWidthSection}>
            <View style={styles.sectionHeaderRow}>
              <Text variant="headingMd">Monthly Standings</Text>
              <Text variant="caption" color={COLORS.textSecondary}>Resets in 6 days</Text>
            </View>

            {members.map((member, idx) => {
              const maxXP = members[0]?.user?.xp || 4250;
              const currentXp = member.user?.xp || 0;
              const fillPct = Math.min(100, Math.max(10, Math.round((currentXp / maxXP) * 100)));
              const rankIcons = ['🥇', '🥈', '🥉', '4', '5', '6'];
              
              return (
                <Card key={member.userId} style={[styles.leaderCard, idx === 0 && styles.firstPlaceCard]}>
                  <View style={styles.leaderTopRow}>
                    <Text style={{ fontSize: 20, width: 28, textAlign: 'center', fontWeight: 'bold' }}>
                      {rankIcons[idx] || `${idx + 1}`}
                    </Text>
                    <Avatar url={member.user?.avatarUrl} name={member.user?.displayName} size={36} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text variant="headingMd">{member.user?.displayName}</Text>
                      <Text variant="caption" color={COLORS.textSecondary}>Level {member.user?.level || 1}</Text>
                    </View>
                    <View style={styles.xpBadge}>
                      <Text style={styles.xpText}>{currentXp} XP</Text>
                    </View>
                  </View>

                  <View style={styles.barBackground}>
                    <View style={[styles.barFill, { width: `${fillPct}%`, backgroundColor: idx === 0 ? COLORS.brandPrimary : COLORS.success }]} />
                  </View>
                </Card>
              );
            })}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surfaceBase,
  },
  headerPanel: {
    backgroundColor: COLORS.surfaceBase,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: SIZES.padding,
    zIndex: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerEmoji: {
    fontSize: 44,
  },
  headerBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  memberRow: {
    padding: 4,
  },
  streakDisplay: {
    backgroundColor: COLORS.surfaceScreen,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceBase,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPressed: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  avatarMore: {
    marginLeft: -10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceBase,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceDark,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    marginRight: 6,
  },
  activeTab: {
    borderBottomColor: COLORS.brandPrimary,
  },
  content: {
    padding: SIZES.padding,
    paddingBottom: 100,
  },
  fullWidthSection: {
    width: '100%',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarPlaceholder: {
    width: '100%',
    padding: 16,
  },
  calendarGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 12,
  },
  dayCol: {
    alignItems: 'center',
  },
  dotStack: {
    marginTop: 8,
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  submissionSnippetCard: {
    padding: 12,
  },
  snippetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inviteCard: {
    marginBottom: 16,
    padding: 14,
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.2)',
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberCard: {
    marginBottom: 12,
    padding: 14,
  },
  memberCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nudgeBtn: {
    backgroundColor: COLORS.surfaceBase,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: SIZES.radiusPill,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  nudgeBtnActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderColor: COLORS.success,
  },
  leaderCard: {
    marginBottom: 12,
    padding: 16,
  },
  firstPlaceCard: {
    borderWidth: 1.5,
    borderColor: COLORS.brandPrimary,
  },
  leaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  xpBadge: {
    backgroundColor: COLORS.surfaceDark,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: SIZES.radiusPill,
  },
  xpText: {
    ...TYPOGRAPHY.digitalDisplay,
    fontSize: 14,
  },
  barBackground: {
    height: 8,
    backgroundColor: COLORS.surfaceDark,
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
});
