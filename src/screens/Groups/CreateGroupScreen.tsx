import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Share } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { COLORS, SIZES, SHADOWS } from '@/constants/theme';
import { useNavigation } from '@react-navigation/native';
import { Input } from '@/components/ui/Input';
import { z } from 'zod';

const step1Schema = z.object({
  groupName: z.string().min(1, 'Group name is required').max(30, 'Max 30 characters'),
});

const step4Schema = z.object({
  goal: z.string().max(200, 'Max 200 characters').optional(),
});

const EMOJI_LIST = ['⚡', '🔥', '💪', '🚀', '🎯', '🏆', '💎', '🌟', '🧘', '🎧', '🥑', '📚'];

const ACTIVITIES = [
  { id: 'water', emoji: '💧', name: 'Drink Water' },
  { id: 'run', emoji: '🏃', name: 'Morning Run' },
  { id: 'read', emoji: '📖', name: 'Read 10 Pages' },
];

const VIBES = [
  { id: 'relaxed', emoji: '🏖️', title: 'Relaxed', desc: 'Skip days allowed, no penalties.' },
  { id: 'hardcore', emoji: '🔥', title: 'Hardcore', desc: 'Miss a day and the group streak dies.' },
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
  const [emoji, setEmoji] = useState('⚡');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  
  const [goal, setGoal] = useState('');
  const [goalError, setGoalError] = useState('');
  
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    setInviteCode(generateSafeCode());
  }, []);

  const handleNext = () => {
    if (step === 1) {
      const result = step1Schema.safeParse({ groupName });
      if (!result.success) {
        setGroupNameError(result.error.issues[0].message);
        return;
      }
      setGroupNameError('');
    }

    if (step === 4) {
      const result = step4Schema.safeParse({ goal });
      if (!result.success) {
        setGoalError(result.error.issues[0].message);
        return;
      }
      setGoalError('');
    }

    if (step < 5) {
      setStep(step + 1);
    } else {
      navigation.replace('GroupHome', { groupId: 'new-group' });
    }
  };

  const toggleActivity = (id: string) => {
    if (selectedActivities.includes(id)) {
      setSelectedActivities(selectedActivities.filter(a => a !== id));
    } else {
      setSelectedActivities([...selectedActivities, id]);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join my StreakPact group! 💪 Code: ${inviteCode} or tap: https://streakpact.app/join/${inviteCode}`,
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()} style={styles.backBtn}>
          <Text variant="headingMd">← Back</Text>
        </TouchableOpacity>
        <Text variant="headingMd">Step {step} of 5</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text variant="headingLg" style={styles.title}>Name your Pact</Text>
            <Text style={styles.subtitle}>Make it something motivating.</Text>
            
            <View style={styles.emojiSection}>
              <TouchableOpacity 
                style={showEmojiPicker ? [styles.emojiPicker, styles.cardInset] : [styles.emojiPicker, styles.cardOutset]} 
                onPress={() => setShowEmojiPicker(!showEmojiPicker)}
                activeOpacity={0.7}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
              
              {showEmojiPicker && (
                <View style={styles.emojiDropdown}>
                  {EMOJI_LIST.map(e => (
                    <TouchableOpacity 
                      key={e} 
                      style={[styles.emojiOption, e === emoji && styles.emojiOptionSelected]}
                      onPress={() => { setEmoji(e); setShowEmojiPicker(false); }}
                    >
                      <Text style={styles.emojiOptionText}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <Input 
              label="Group Name" 
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
            <Text variant="headingLg" style={styles.title}>Choose Activities</Text>
            <Text style={styles.subtitle}>Select the habits you want to track together.</Text>
            
            {ACTIVITIES.map((act) => {
              const isSelected = selectedActivities.includes(act.id);
              return (
                <TouchableOpacity 
                  key={act.id}
                  style={renderCardStyle(isSelected)}
                  onPress={() => toggleActivity(act.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.presetEmoji}>{act.emoji}</Text>
                  <Text variant="headingMd" style={isSelected && styles.textSelected}>{act.name}</Text>
                </TouchableOpacity>
              );
            })}
            
            <TouchableOpacity style={[styles.presetCard, styles.customCard]} activeOpacity={0.8}>
              <Text style={[styles.presetEmoji, {color: COLORS.textSecondary}]}>+</Text>
              <Text variant="headingMd" color={COLORS.textSecondary}>Custom Activity</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text variant="headingLg" style={styles.title}>Set the Vibe</Text>
            <Text style={styles.subtitle}>How strict is this pact?</Text>
            
            {VIBES.map((vibe) => {
              const isSelected = selectedVibe === vibe.id;
              return (
                <TouchableOpacity 
                  key={vibe.id}
                  style={renderCardStyle(isSelected)}
                  onPress={() => setSelectedVibe(vibe.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.presetEmoji}>{vibe.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text variant="headingMd" style={isSelected && styles.textSelected}>{vibe.title}</Text>
                    <Text variant="caption">{vibe.desc}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepContainer}>
            <Text variant="headingLg" style={styles.title}>Group Goal</Text>
            <Text style={styles.subtitle}>What are we working towards? (Optional)</Text>
            
            <Input 
              label="Goal Description" 
              placeholder="e.g. Read 50 books this year"
              multiline
              numberOfLines={4}
              value={goal}
              onChangeText={(txt) => { setGoal(txt); if(goalError) setGoalError(''); }}
              error={goalError}
              maxLength={200}
              style={{ height: 100, textAlignVertical: 'top' }}
            />
          </View>
        )}

        {step === 5 && (
          <View style={styles.stepContainer}>
            <Text variant="headingLg" style={styles.title}>Invite Friends</Text>
            <Text style={styles.subtitle}>Share this code or link with your friends to join.</Text>
            
            <View style={[styles.codeContainer, styles.cardInset]}>
              <Text variant="caption" style={styles.codeLabel}>YOUR INVITE CODE</Text>
              <Text style={styles.codeDisplay}>{inviteCode}</Text>
            </View>

            <TouchableOpacity style={[styles.presetCard, styles.cardOutset, { justifyContent: 'center' }]} onPress={handleShare}>
              <Text variant="headingMd" color={COLORS.brandPrimary}>Share Invite Link</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Create Group" onPress={handleNext} />
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
  content: {
    padding: SIZES.padding,
  },
  stepContainer: {
    flex: 1,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  emojiSection: {
    alignItems: 'center',
    marginVertical: 24,
    zIndex: 10,
  },
  emojiPicker: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 40,
  },
  emojiDropdown: {
    position: 'absolute',
    top: 90,
    backgroundColor: COLORS.surfaceBase,
    padding: 12,
    borderRadius: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    ...SHADOWS.mediumElevation,
  },
  emojiOption: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    margin: 4,
  },
  emojiOptionSelected: {
    backgroundColor: COLORS.surfaceDark,
  },
  emojiOptionText: {
    fontSize: 28,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
  },
  cardOutset: {
    backgroundColor: COLORS.surfaceBase,
    ...SHADOWS.softElevation,
  },
  cardInset: {
    backgroundColor: COLORS.surfaceDark,
    borderColor: 'rgba(0,0,0,0.05)',
    borderWidth: 1,
    transform: [{ translateY: 2 }],
  },
  textSelected: {
    color: COLORS.brandPrimary,
  },
  customCard: {
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: COLORS.surfaceDark,
    backgroundColor: 'transparent',
    justifyContent: 'center',
  },
  presetEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  codeContainer: {
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  codeLabel: {
    marginBottom: 12,
    letterSpacing: 2,
  },
  codeDisplay: {
    fontFamily: 'RobotoMono-Bold',
    fontSize: 48,
    color: COLORS.textDisplay,
    letterSpacing: 8,
  },
  footer: {
    padding: SIZES.padding,
    paddingBottom: 40,
  },
});
