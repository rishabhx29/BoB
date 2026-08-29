import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ConfettiBurst } from '@/components/ui/ConfettiBurst';
import { XPChip } from '@/components/ui/XPChip';
import { COLORS, SIZES, SHADOWS, TYPOGRAPHY } from '@/constants/theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Activity, FieldDefinition } from '@/types';
import { archiveActivity } from '@/services/groupService';
import { PRESET_ACTIVITIES } from '@/constants/activityTemplates';
import { DynamicForm } from '@/components/ui/DynamicForm';
import { BottomSheet } from '@/components/ui/BottomSheet';
import * as Haptics from 'expo-haptics';

interface HistoryItem {
  id: string;
  userName: string;
  timestamp: string;
  summary: string;
  metrics?: Record<string, any>;
}

export default function ActivityDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  // Default activity fallback if opened with minimal or mock parameters
  const routeActivity: Activity | undefined = route.params?.activity;
  const activity: Activity = routeActivity || {
    id: 'act-gym',
    groupId: route.params?.groupId || 'g1',
    name: 'Gym / Workout',
    icon: '🏋️',
    color: '#EF4444',
    templateKey: 'gym',
    frequency: 'daily',
    frequencyDays: [0, 1, 2, 3, 4, 5, 6],
    restDaysPerWeek: 1,
    requirePhoto: true,
    templateFields: PRESET_ACTIVITIES.find(a => a.id === 'gym')?.templateFields || [],
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const matchedPreset = PRESET_ACTIVITIES.find(a => a.id === activity.templateKey);
  const fields: FieldDefinition[] = activity.templateFields && activity.templateFields.length > 0
    ? activity.templateFields
    : matchedPreset?.templateFields || [];

  const [activeTab, setActiveTab] = useState<'calendar' | 'history'>('calendar');
  const [isArchiving, setIsArchiving] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showXPChip, setShowXPChip] = useState(false);

  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([
    {
      id: 'h1',
      userName: 'Alex Rivera',
      timestamp: 'Today, 8:30 AM',
      summary: 'Chest & Triceps completed. 65 minutes total. Felt great!',
    },
    {
      id: 'h2',
      userName: 'Sarah Kim',
      timestamp: 'Yesterday, 7:15 PM',
      summary: 'Completed 5km evening run. Pace 5:20/km.',
    },
  ]);

  const handleArchive = async () => {
    Alert.alert(
      'Archive Activity',
      'Are you sure you want to archive this activity? It will be hidden from the active list, but historical data will be preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Archive', 
          style: 'destructive',
          onPress: async () => {
            setIsArchiving(true);
            try {
              await archiveActivity(activity.id);
              navigation.goBack();
            } catch (_error: any) {
              // Graceful fallback for offline / mock testing
              navigation.goBack();
            } finally {
              setIsArchiving(false);
            }
          }
        }
      ]
    );
  };

  const handleFormSubmit = (data: Record<string, any>) => {
    setIsSubmittingForm(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    setTimeout(() => {
      setIsSubmittingForm(false);
      setShowSubmitModal(false);

      // Create a formatted summary string from submitted form data
      const summaryParts: string[] = [];
      Object.entries(data).forEach(([key, val]) => {
        if (Array.isArray(val)) {
          summaryParts.push(`${key}: ${val.join(', ')}`);
        } else if (typeof val === 'boolean') {
          summaryParts.push(val ? `${key}: Yes` : `${key}: No`);
        } else if (val) {
          summaryParts.push(`${key}: ${val}`);
        }
      });
      const summaryText = summaryParts.length > 0 ? summaryParts.join(' • ') : 'Logged today\'s session successfully!';

      // Prepend to history live
      const newEntry: HistoryItem = {
        id: `h-${Date.now()}`,
        userName: 'You',
        timestamp: 'Just now',
        summary: summaryText,
        metrics: data,
      };
      setHistoryItems(prev => [newEntry, ...prev]);

      // Trigger Celebration effects
      setShowCelebration(true);
      setShowXPChip(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }, 600);
  };

  return (
    <View style={styles.container}>
      {/* Celebration Effects */}
      <ConfettiBurst isVisible={showCelebration} pieceCount={50} />
      {showXPChip && <XPChip xp={50} onAnimationEnd={() => setShowXPChip(false)} />}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text variant="headingMd">← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleArchive} style={styles.settingsBtn}>
          <Text style={{ fontSize: 18 }}>🗑️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={[styles.heroIconBox, { backgroundColor: activity.color }]}>
            <Text style={{ fontSize: 44 }}>{activity.icon}</Text>
          </View>
          <Text variant="headingLg" style={styles.title}>{activity.name}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <Badge text={activity.frequency === 'daily' ? 'Daily' : 'Specific Days'} variant="primary" />
            {activity.requirePhoto && <Badge text="Photo Required 📷" variant="secondary" />}
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <Card style={styles.statBox}>
            <Text variant="digitalDisplay" style={{ fontSize: 18, color: COLORS.brandPrimary }}>🔥 14</Text>
            <Text variant="caption" color={COLORS.textSecondary} style={{ marginTop: 2 }}>Streak</Text>
          </Card>
          <Card style={styles.statBox}>
            <Text variant="digitalDisplay" style={{ fontSize: 18, color: COLORS.success }}>92%</Text>
            <Text variant="caption" color={COLORS.textSecondary} style={{ marginTop: 2 }}>Completion</Text>
          </Card>
          <Card style={styles.statBox}>
            <Text variant="digitalDisplay" style={{ fontSize: 18, color: COLORS.textPrimary }}>+50 XP</Text>
            <Text variant="caption" color={COLORS.textSecondary} style={{ marginTop: 2 }}>Per Log</Text>
          </Card>
        </View>

        {/* Tracked Fields Card */}
        {fields.length > 0 && (
          <Card style={styles.fieldsCard}>
            <Text variant="headingMd" style={{ marginBottom: 12 }}>Tracked Metrics ({fields.length})</Text>
            <View style={styles.fieldChipsRow}>
              {fields.map(f => (
                <View key={f.id} style={styles.fieldChip}>
                  <Text variant="caption" style={{ fontWeight: '600' }}>
                    {f.label} {f.unit ? `(${f.unit})` : ''}
                  </Text>
                  <Text variant="caption" color={COLORS.textSecondary} style={{ fontSize: 10, marginTop: 2 }}>
                    {f.type}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Quick Submit CTA */}
        <View style={{ marginVertical: 16 }}>
          <Button 
            label="⚡ Submit for Today" 
            onPress={() => {
              try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
              setShowSubmitModal(true);
            }}
          />
        </View>

        {/* Subtabs: Calendar vs History */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'calendar' && styles.activeTab]}
            onPress={() => {
              try { Haptics.selectionAsync(); } catch {}
              setActiveTab('calendar');
            }}
          >
            <Text style={activeTab === 'calendar' ? styles.activeTabText : styles.inactiveTabText}>
              Calendar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
            onPress={() => {
              try { Haptics.selectionAsync(); } catch {}
              setActiveTab('history');
            }}
          >
            <Text style={activeTab === 'history' ? styles.activeTabText : styles.inactiveTabText}>
              History ({historyItems.length})
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContent}>
          {activeTab === 'calendar' ? (
            <Card style={styles.placeholderContainer}>
              <Text variant="headingMd" color={COLORS.textPrimary}>Monthly Heat Map</Text>
              <Text variant="caption" color={COLORS.textSecondary} style={{ textAlign: 'center', marginTop: 8, marginBottom: 16 }}>
                Green dots indicate days when the pact was completed.
              </Text>
              
              <View style={styles.miniHeatmapGrid}>
                {Array.from({ length: 28 }).map((_, i) => (
                  <View 
                    key={i} 
                    style={[
                      styles.heatDot, 
                      { backgroundColor: i % 5 !== 3 ? COLORS.success : COLORS.surfaceDark }
                    ]} 
                  />
                ))}
              </View>
            </Card>
          ) : (
            <View style={{ gap: 12 }}>
              {historyItems.map((item) => (
                <Card key={item.id} style={styles.historyCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text variant="headingMd">{item.userName}</Text>
                    <Text variant="caption" color={COLORS.textSecondary}>{item.timestamp}</Text>
                  </View>
                  <Text variant="body" color={COLORS.textSecondary}>
                    {item.summary}
                  </Text>
                </Card>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Dynamic Form Bottom Sheet */}
      <BottomSheet 
        isVisible={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
      >
        <Text variant="headingLg" style={{ marginBottom: 4, textAlign: 'center' }}>
          {activity.icon} Log {activity.name}
        </Text>
        <Text variant="caption" color={COLORS.textSecondary} style={{ textAlign: 'center', marginBottom: 20 }}>
          Fill in today's details to lock in your streak!
        </Text>

        <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
          {fields.length > 0 ? (
            <DynamicForm 
              fields={fields} 
              onSubmit={handleFormSubmit}
              submitLabel="Confirm & Submit 🔥"
              isSubmitting={isSubmittingForm}
            />
          ) : (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Text variant="body" style={{ marginBottom: 20 }}>No custom fields required for this activity.</Text>
              <Button 
                label="Confirm & Submit 🔥" 
                onPress={() => handleFormSubmit({})}
                disabled={isSubmittingForm}
              />
            </View>
          )}
        </ScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surfaceBase,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: SIZES.padding,
    paddingBottom: 16,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  settingsBtn: {
    padding: 8,
    marginRight: -8,
  },
  content: {
    padding: SIZES.padding,
    paddingTop: 0,
    paddingBottom: 60,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 20,
  },
  heroIconBox: {
    width: 90,
    height: 90,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...SHADOWS.mediumElevation,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    width: '100%',
  },
  statBox: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  fieldsCard: {
    marginBottom: 8,
    padding: 16,
  },
  fieldChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fieldChip: {
    backgroundColor: COLORS.surfaceDark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceDark,
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: COLORS.surfaceBase,
    ...SHADOWS.softElevation,
  },
  activeTabText: {
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  inactiveTabText: {
    color: COLORS.textSecondary,
  },
  tabContent: {
    flex: 1,
  },
  placeholderContainer: {
    padding: 20,
    alignItems: 'center',
  },
  miniHeatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    width: '100%',
  },
  heatDot: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  historyCard: {
    padding: 16,
  },
});
