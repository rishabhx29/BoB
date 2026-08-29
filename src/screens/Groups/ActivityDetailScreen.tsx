import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { COLORS, SIZES, SHADOWS } from '@/constants/theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Activity } from '@/types';
import { archiveActivity } from '@/services/groupService';

export default function ActivityDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const activity: Activity = route.params?.activity;
  
  const [activeTab, setActiveTab] = useState<'calendar' | 'history'>('calendar');
  const [isArchiving, setIsArchiving] = useState(false);

  if (!activity) {
    return (
      <View style={styles.container}>
        <Text>Error: Activity not found</Text>
        <Button label="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

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
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to archive activity');
            } finally {
              setIsArchiving(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text variant="headingMd">← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {}} style={styles.settingsBtn}>
          <Text style={{ fontSize: 20 }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={[styles.heroIconBox, { backgroundColor: activity.color }]}>
            <Text style={{ fontSize: 48 }}>{activity.icon}</Text>
          </View>
          <Text variant="headingLg" style={styles.title}>{activity.name}</Text>
          <Text variant="caption" color={COLORS.textSecondary}>
            {activity.frequency === 'daily' ? 'Daily' : 'Specific Days'} • {activity.requirePhoto ? 'Photo Required' : 'No Photo Required'}
          </Text>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'calendar' && styles.activeTab]}
            onPress={() => setActiveTab('calendar')}
          >
            <Text style={activeTab === 'calendar' ? styles.activeTabText : styles.inactiveTabText}>
              Calendar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={activeTab === 'history' ? styles.activeTabText : styles.inactiveTabText}>
              History
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContent}>
          {activeTab === 'calendar' ? (
            <View style={styles.placeholderContainer}>
              <Text variant="headingMd" color={COLORS.textSecondary}>Calendar View (Phase 6)</Text>
              <Text style={{ textAlign: 'center', marginTop: 12, color: COLORS.textSecondary }}>
                The group calendar heat map and daily streak dots will appear here.
              </Text>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Text variant="headingMd" color={COLORS.textSecondary}>Submissions History</Text>
              <Text style={{ textAlign: 'center', marginTop: 12, color: COLORS.textSecondary }}>
                A historical feed of all submissions for this activity will appear here.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Admin Actions footer for demonstration. In a real app, wrap with role check */}
      <View style={styles.footer}>
        <Button 
          label={isArchiving ? "Archiving..." : "Archive Activity"} 
          onPress={handleArchive}
          disabled={isArchiving}
          // Normally we might use a secondary or destructive variant here
        />
      </View>
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
    paddingBottom: 20,
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
  },
  hero: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heroIconBox: {
    width: 100,
    height: 100,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...SHADOWS.softElevation,
  },
  title: {
    marginBottom: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceDark,
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
    ...SHADOWS.mediumElevation,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
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
    minHeight: 300,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceDark,
    borderRadius: 24,
    padding: 32,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.05)', // Inset look
  },
  footer: {
    padding: SIZES.padding,
    paddingBottom: 40,
  },
});
