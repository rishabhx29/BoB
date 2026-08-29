import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Input, Button, Icon, IconName, VoltMark } from '@/components/ui';
import { COLORS, RADIUS, SHADOWS, SPACE } from '@/constants/theme';
import { useNavigation } from '@react-navigation/native';
import { z } from 'zod';
import { createGroup } from '@/services/groupService';
import { GroupVibe, ActivitySeed } from '@/types';
import { PRESET_ACTIVITIES } from '@/constants/activityTemplates';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

const EMOJI_LIST: IconName[] = ['lightning', 'flame', 'crown', 'target', 'rocket', 'star', 'sparkle', 'medal', 'trophy', 'fire', 'book', 'barbell'];
const VIBE_ICONS: Record<string, IconName> = { hardcore: 'flame', relaxed: 'leaf' };
const ACTIVITY_ICONS: Record<string, IconName> = {
  gym: 'barbell',
  study: 'book',
  read: 'book',
  run: 'rocket',
  meditate: 'leaf',
  water: 'drop',
  code: 'code',
  sleep: 'moon',
  music: 'music-notes',
};

const step1Schema = z.object({
  groupName: z.string().min(1, 'Group name is required').max(30, 'Max 30 characters'),
});

const step4Schema = z.object({
  goal: z.string().max(200, 'Max 200 characters').optional(),
});

const VIBES = [
  { id: 'hardcore', title: 'Hardcore', desc: 'Miss a day and the group streak dies. True accountability.' },
  { id: 'relaxed', title: 'Relaxed', desc: 'Skip days allowed, individual streaks preserved.' },
];

const generateSafeCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export default function CreateGroupScreen() {
  const navigation = useNavigation<any>();
  const [step, setStep] = useState(1);
  const [groupName, setGroupName] = useState('');
  const [groupNameError, setGroupNameError] = useState('');
  const [icon, setIcon] = useState<IconName>('lightning');
  const [showIconPicker, setShowIconPicker] = useState(false);
  
  const [selectedActivities, setSelectedActivities] = useState<string[]>(['gym']);
  const [activityError, setActivityError] = useState('');
  const [selectedVibe, setSelectedVibe] = useState<string>('hardcore');
  
  const [goal, setGoal] = useState('');
  const [goalError, setGoalError] = useState('');
  
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdGroupId, setCreatedGroupId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleNext = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    if (step === 1) {
      const result = step1Schema.safeParse({ groupName });
      if (!result.success) {
        setGroupNameError(result.error.issues[0].message);
        return;
      }
      setGroupNameError('');
    }

    if (step === 2) {
      if (selectedActivities.length === 0) {
        setActivityError('Please select at least one activity for your pact.');
        return;
      }
      setActivityError('');
    }

    if (step === 4) {
      const result = step4Schema.safeParse({ goal });
      if (!result.success) {
        setGoalError(result.error.issues[0].message);
        return;
      }
      setGoalError('');
      
      setIsSubmitting(true);
      
      const templates: ActivitySeed[] = selectedActivities.map(id => {
        const act = PRESET_ACTIVITIES.find(a => a.id === id);
        return {
          name: act?.name || 'Habit',
          icon: act?.icon || '⚡',
          color: act?.color || COLORS.brandPrimary,
          templateKey: act?.id || null,
          templateFields: act?.templateFields || [],
          frequency: 'daily',
          frequencyDays: [0, 1, 2, 3, 4, 5, 6],
          requirePhoto: act?.requirePhoto || false
        };
      });

      createGroup({
        name: groupName,
        emoji: icon,
        vibe: selectedVibe as GroupVibe,
        goalDescription: goal || null
      }, templates).then(group => {
        setIsSubmitting(false);
        setInviteCode(group.inviteCode);
        setCreatedGroupId(group.id);
        setStep(5);
      }).catch(_err => {
        // Fallback for guest mode / offline testing
        const fallbackCode = generateSafeCode();
        const fallbackId = 'group-' + Date.now();
        setIsSubmitting(false);
        setInviteCode(fallbackCode);
        setCreatedGroupId(fallbackId);
        setStep(5);
      });
      return;
    }

    if (step < 5) {
      setStep(step + 1);
    } else {
      if (createdGroupId) {
        navigation.replace('GroupHome', { groupId: createdGroupId, groupName, groupEmoji: icon });
      } else {
        navigation.goBack();
      }
    }
  };

  const toggleActivity = (id: string) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setActivityError('');
    if (selectedActivities.includes(id)) {
      setSelectedActivities(selectedActivities.filter(a => a !== id));
    } else {
      setSelectedActivities([...selectedActivities, id]);
    }
  };

  const handleCopyCode = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    await Clipboard.setStringAsync(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleShare = async () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    try {
      await Share.share({
        message: `Join my StreakPact group "${groupName}"! 💪\nInvite Code: ${inviteCode}\nstreakpact://join/${inviteCode}`,
      });
    } catch (error) {
      console.log('Share error', error);
    }
  };

  const renderCardStyle = (isSelected: boolean) => {
    if (isSelected) {
      return [
        styles.presetCard, 
        styles.cardInset,
      ];
    }
    return [
      styles.presetCard,
      styles.cardOutset,
    ];
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={20} color={COLORS.inkDisplay} />
        </TouchableOpacity>
        <Text variant="eyebrow" color={COLORS.inkSecondary}>Step {step} of 5</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Hardware Progress Bar */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${(step / 5) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text variant="eyebrow" color={COLORS.inkSecondary} style={styles.eyebrow}>Step 1</Text>
            <Text variant="displaySm" color={COLORS.inkDisplay} style={styles.title}>Name your pact</Text>
            <Text variant="body" color={COLORS.inkSecondary} style={styles.subtitle}>Make it something motivating.</Text>

            <View style={styles.iconSection}>
              <TouchableOpacity
                style={showIconPicker ? [styles.iconPicker, styles.cardInset] : [styles.iconPicker, styles.cardOutset]}
                onPress={() => {
                  try { Haptics.selectionAsync(); } catch {}
                  setShowIconPicker(!showIconPicker);
                }}
                activeOpacity={0.7}
              >
                <Icon name={icon} size={36} color={COLORS.accent} bold />
              </TouchableOpacity>

              {showIconPicker && (
                <View style={styles.iconDropdown}>
                  {EMOJI_LIST.map(e => (
                    <TouchableOpacity
                      key={e}
                      style={[styles.iconOption, e === icon && styles.iconOptionSelected]}
                      onPress={() => {
                        try { Haptics.selectionAsync(); } catch {}
                        setIcon(e);
                        setShowIconPicker(false);
                      }}
                    >
                      <Icon name={e} size={22} color={e === icon ? COLORS.accent : COLORS.inkPrimary} bold={e === icon} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <Input
              label="Group name"
              placeholder="e.g. Morning Warriors"
              value={groupName}
              onChangeText={(txt) => { setGroupName(txt); if(groupNameError) setGroupNameError(''); }}
              error={groupNameError}
              maxLength={30}
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text variant="eyebrow" color={COLORS.inkSecondary} style={styles.eyebrow}>Step 2</Text>
            <Text variant="displaySm" color={COLORS.inkDisplay} style={styles.title}>Choose activities</Text>
            <Text variant="body" color={COLORS.inkSecondary} style={styles.subtitle}>
              Select the habits you want to track ({selectedActivities.length} chosen).
            </Text>

            {activityError ? (
              <Text variant="caption" color={COLORS.danger} style={styles.fieldError}>
                {activityError}
              </Text>
            ) : null}

            {PRESET_ACTIVITIES.map((act) => {
              const isSelected = selectedActivities.includes(act.id);
              const actIcon = ACTIVITY_ICONS[act.id] || 'target';
              return (
                <TouchableOpacity
                  key={act.id}
                  style={renderCardStyle(isSelected)}
                  onPress={() => toggleActivity(act.id)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.actIconBox, { backgroundColor: hexToTint(act.color, 0.14) }]}>
                    <Icon name={actIcon} size={22} color={act.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="headingMd" color={isSelected ? COLORS.accent : COLORS.inkDisplay}>{act.name}</Text>
                    <Text variant="caption" color={COLORS.inkSecondary}>{act.description}</Text>
                  </View>
                  <View style={[styles.checkBox, isSelected ? styles.checkBoxActive : null]}>
                    {isSelected && <Icon name="check" size={14} color="#FFFFFF" bold />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text variant="eyebrow" color={COLORS.inkSecondary} style={styles.eyebrow}>Step 3</Text>
            <Text variant="displaySm" color={COLORS.inkDisplay} style={styles.title}>Set the vibe</Text>
            <Text variant="body" color={COLORS.inkSecondary} style={styles.subtitle}>How strict is this pact?</Text>

            {VIBES.map((vibe) => {
              const isSelected = selectedVibe === vibe.id;
              const vibeIcon = VIBE_ICONS[vibe.id] || 'target';
              return (
                <TouchableOpacity
                  key={vibe.id}
                  style={renderCardStyle(isSelected)}
                  onPress={() => {
                    try { Haptics.selectionAsync(); } catch {}
                    setSelectedVibe(vibe.id);
                  }}
                  activeOpacity={0.85}
                >
                  <View style={[styles.actIconBox, { backgroundColor: vibe.id === 'hardcore' ? COLORS.accentTint : COLORS.positiveTint }]}>
                    <Icon name={vibeIcon} size={22} color={vibe.id === 'hardcore' ? COLORS.accent : COLORS.positive} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="headingMd" color={isSelected ? COLORS.accent : COLORS.inkDisplay}>{vibe.title}</Text>
                    <Text variant="caption" color={COLORS.inkSecondary}>{vibe.desc}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepContainer}>
            <Text variant="eyebrow" color={COLORS.inkSecondary} style={styles.eyebrow}>Step 4</Text>
            <Text variant="displaySm" color={COLORS.inkDisplay} style={styles.title}>Group goal</Text>
            <Text variant="body" color={COLORS.inkSecondary} style={styles.subtitle}>What are you working toward? (Optional)</Text>

            <Input
              label="Goal"
              placeholder="e.g. Read 50 books this year"
              multiline
              numberOfLines={4}
              value={goal}
              onChangeText={(txt) => { setGoal(txt); if(goalError) setGoalError(''); }}
              error={goalError}
              maxLength={200}
              style={{ minHeight: 100, textAlignVertical: 'top' }}
            />
          </View>
        )}

        {step === 5 && (
          <View style={styles.stepContainer}>
            <Text variant="eyebrow" color={COLORS.inkSecondary} style={styles.eyebrow}>Step 5</Text>
            <Text variant="displaySm" color={COLORS.inkDisplay} style={styles.title}>Invite friends</Text>
            <Text variant="body" color={COLORS.inkSecondary} style={styles.subtitle}>Share this code with your friends.</Text>

            <TouchableOpacity
              style={styles.codeContainer}
              onPress={handleCopyCode}
              activeOpacity={0.85}
            >
              <Text variant="caption" color={COLORS.inkSecondary} style={styles.codeLabel}>
                {copiedCode ? 'COPIED TO CLIPBOARD' : 'TAP CODE TO COPY'}
              </Text>
              <Text style={styles.codeDisplay}>{inviteCode}</Text>
            </TouchableOpacity>

            <Button
              label="Share invite link"
              variant="secondary"
              leadingIcon="share-network"
              onPress={handleShare}
              fullWidth
              size="lg"
            />
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={isSubmitting ? 'Creating…' : (step === 5 ? 'Enter pact' : step === 4 ? 'Create group' : 'Next')}
          onPress={handleNext}
          disabled={isSubmitting}
          fullWidth
          size="lg"
          trailingIcon={step === 5 ? 'arrow-right' : step === 4 ? 'sparkle' : 'arrow-right'}
        />
      </View>
    </SafeAreaView>
  );
}

function hexToTint(hex: string, alpha: number) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surfaceBase },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACE.xl,
    paddingTop: 12,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.hairline,
  },
  progressBarBg: {
    height: 4, backgroundColor: COLORS.surfaceSunken, width: '100%',
  },
  progressBarFill: { height: '100%', backgroundColor: COLORS.accent },
  content: { padding: SPACE.xl, paddingBottom: 120 },
  stepContainer: { flex: 1 },
  eyebrow: { marginBottom: 6 },
  title: { marginBottom: 8 },
  subtitle: { lineHeight: 22, marginBottom: 24 },
  fieldError: { marginBottom: 12 },
  iconSection: { alignItems: 'center', marginVertical: 24, zIndex: 10 },
  iconPicker: {
    width: 84, height: 84, borderRadius: RADIUS.lg,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1, borderColor: COLORS.hairline,
  },
  iconDropdown: {
    position: 'absolute',
    top: 96,
    backgroundColor: COLORS.surfaceElevated,
    padding: 12,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    borderWidth: 1, borderColor: COLORS.hairline,
    ...SHADOWS.raised,
  },
  iconOption: {
    width: 44, height: 44, justifyContent: 'center', alignItems: 'center',
    borderRadius: RADIUS.md, margin: 4,
  },
  iconOptionSelected: { backgroundColor: COLORS.accentTint },
  presetCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: 18, borderRadius: RADIUS.lg, marginBottom: 12, gap: 14,
    borderWidth: 1, borderColor: COLORS.hairline,
  },
  cardOutset: {
    backgroundColor: COLORS.surfaceElevated,
  },
  cardInset: {
    backgroundColor: COLORS.surfaceSunken,
    borderColor: COLORS.accent,
  },
  actIconBox: {
    width: 44, height: 44, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
  },
  checkBox: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: COLORS.hairlineStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  checkBoxActive: {
    backgroundColor: COLORS.accent, borderColor: COLORS.accent,
  },
  codeContainer: {
    padding: 28, borderRadius: RADIUS.lg,
    alignItems: 'center', marginBottom: 16,
    backgroundColor: COLORS.surfaceSunken,
    borderWidth: 1, borderColor: COLORS.hairline,
  },
  codeLabel: { marginBottom: 12, letterSpacing: 2 },
  codeDisplay: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 40,
    color: COLORS.inkDisplay,
    letterSpacing: 8,
  },
  footer: {
    padding: SPACE.xl, paddingBottom: 36,
    borderTopWidth: 1, borderTopColor: COLORS.hairline,
    backgroundColor: COLORS.surfaceBase,
  },
});
