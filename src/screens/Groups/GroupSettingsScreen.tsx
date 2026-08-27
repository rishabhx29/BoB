import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Switch, Share, Alert, Pressable } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { COLORS, SIZES, SHADOWS } from '@/constants/theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

// Custom tactile switch
const TactileSwitch = ({ value, onValueChange }: { value: boolean, onValueChange: (val: boolean) => void }) => {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onValueChange(!value);
      }}
      style={[
        styles.switchTrack,
        value ? styles.switchTrackActive : styles.switchTrackInactive
      ]}
    >
      <View style={[
        styles.switchThumb,
        value ? styles.switchThumbActive : styles.switchThumbInactive
      ]} />
    </Pressable>
  );
};

export default function GroupSettingsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const groupId = route.params?.groupId || 'H3X2B9';
  const isAdmin = route.params?.isAdmin ?? true;

  const [groupName, setGroupName] = useState('Morning Runners');
  const [groupEmoji, setGroupEmoji] = useState('🏃');
  const [requirePhoto, setRequirePhoto] = useState(true);
  const [groupStreak, setGroupStreak] = useState(false);

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(groupId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Copied", "Invite code copied to clipboard");
  };

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `Join my StreakPact group! 💪 Code: ${groupId} or tap: https://streakpact.app/join/${groupId}`,
      });
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  const handleLeaveGroup = () => {
    Alert.alert("Leave Group", "Are you sure you want to leave this group?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Leave", 
        style: "destructive", 
        onPress: () => navigation.navigate('Main', { screen: 'Groups' }) 
      }
    ]);
  };

  const handleDeleteGroup = () => {
    Alert.alert("Delete Group", "Are you sure you want to delete this group forever? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: () => navigation.navigate('Main', { screen: 'Groups' }) 
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text variant="headingMd">← Back</Text>
        </TouchableOpacity>
        <Text variant="headingMd">Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Invite Code Section */}
        <View style={styles.section}>
          <Text variant="headingMd" style={styles.sectionTitle}>Invite Code</Text>
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>{groupId}</Text>
          </View>
          <View style={styles.actionRow}>
            <Button label="Copy Code" variant="secondary" onPress={handleCopyCode} style={{ flex: 1, marginRight: 8 }} />
            <Button label="Share Invite" onPress={handleShareCode} style={{ flex: 1, marginLeft: 8 }} />
          </View>
        </View>

        {isAdmin ? (
          <>
            <View style={styles.section}>
              <Text variant="headingMd" style={styles.sectionTitle}>Group Info</Text>
              <Input
                label="Group Name"
                value={groupName}
                onChangeText={setGroupName}
                maxLength={30}
              />
              <Input
                label="Emoji Icon"
                value={groupEmoji}
                onChangeText={setGroupEmoji}
                maxLength={2}
                style={{ marginTop: 16 }}
              />
            </View>

            <View style={styles.section}>
              <Text variant="headingMd" style={styles.sectionTitle}>Rules</Text>
              
              <View style={styles.settingRow}>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>Require Photo Proof</Text>
                  <Text style={styles.settingSubLabel}>Users must upload a photo to submit</Text>
                </View>
                <TactileSwitch value={requirePhoto} onValueChange={setRequirePhoto} />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>Group Streak (Hardcore)</Text>
                  <Text style={styles.settingSubLabel}>If one person misses, everyone's streak resets</Text>
                </View>
                <TactileSwitch value={groupStreak} onValueChange={setGroupStreak} />
              </View>
            </View>

            <View style={styles.section}>
              <Text variant="headingMd" style={styles.sectionTitle}>Danger Zone</Text>
              <Button label="Regenerate Invite Code" variant="secondary" onPress={() => Alert.alert("Regenerated")} style={{ marginBottom: 16 }} />
              <Button label="Delete Group" variant="danger" onPress={handleDeleteGroup} />
            </View>
          </>
        ) : (
          <View style={styles.section}>
            <Text variant="headingMd" style={styles.sectionTitle}>Danger Zone</Text>
            <Button label="Leave Group" variant="danger" onPress={handleLeaveGroup} />
          </View>
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>
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
    backgroundColor: COLORS.surfaceBase,
    zIndex: 10,
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 5,
  },
  content: {
    padding: SIZES.padding,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
    color: COLORS.textPrimary,
  },
  codeContainer: {
    backgroundColor: COLORS.surfaceScreen,
    borderRadius: SIZES.radiusCard,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...SHADOWS.softElevation,
  },
  codeText: {
    fontFamily: 'RobotoMono-Bold',
    fontSize: 48,
    color: COLORS.brandPrimary,
    letterSpacing: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  settingTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  settingSubLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: COLORS.textSecondary,
  },
  switchTrack: {
    width: 52,
    height: 32,
    borderRadius: 16,
    padding: 2,
    justifyContent: 'center',
    ...SHADOWS.softElevation,
  },
  switchTrackActive: {
    backgroundColor: COLORS.success,
  },
  switchTrackInactive: {
    backgroundColor: COLORS.surfaceDark,
  },
  switchThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceBase,
    ...SHADOWS.softElevation,
  },
  switchThumbActive: {
    transform: [{ translateX: 20 }],
  },
  switchThumbInactive: {
    transform: [{ translateX: 0 }],
  },
});
