import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { COLORS, SIZES, SHADOWS } from '@/constants/theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { PRESET_ACTIVITIES, ActivityTemplate } from '@/constants/activityTemplates';
import { addActivity } from '@/services/groupService';

export default function CreateActivityScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const groupId = route.params?.groupId;
  
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<ActivityTemplate | null>(null);
  
  // Config state
  const [frequency, setFrequency] = useState<'daily' | 'specific_days'>('daily');
  const [requirePhoto, setRequirePhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectTemplate = (template: ActivityTemplate) => {
    setSelectedTemplate(template);
    setRequirePhoto(template.requirePhoto);
    setFrequency(template.frequency === 'daily' ? 'daily' : 'specific_days');
    setStep(2);
  };

  const handleCreate = async () => {
    if (!selectedTemplate) return;
    if (!groupId) {
      Alert.alert('Error', 'No group ID provided');
      return;
    }

    setIsSubmitting(true);
    try {
      await addActivity(groupId, {
        name: selectedTemplate.name,
        icon: selectedTemplate.icon,
        color: selectedTemplate.color,
        frequency: frequency,
        frequencyDays: frequency === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : [1, 3, 5], // Mocking specific days for now
        requirePhoto: requirePhoto,
      });
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add activity');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()} style={styles.backBtn}>
          <Text variant="headingMd">← Back</Text>
        </TouchableOpacity>
        <Text variant="headingMd">{step === 1 ? 'Choose Activity' : 'Configure'}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {step === 1 && (
          <View>
            <Text variant="headingLg" style={styles.title}>What do you want to track?</Text>
            <Text style={styles.subtitle}>Select a preset or create your own.</Text>
            
            <View style={styles.grid}>
              {PRESET_ACTIVITIES.map(tpl => (
                <TouchableOpacity 
                  key={tpl.id} 
                  style={styles.templateCard} 
                  onPress={() => handleSelectTemplate(tpl)}
                >
                  <View style={[styles.templateHeader, { backgroundColor: tpl.color }]} />
                  <View style={styles.templateContent}>
                    <Text style={styles.templateIcon}>{tpl.icon}</Text>
                    <Text variant="headingMd">{tpl.name}</Text>
                    <Text variant="caption" color={COLORS.textSecondary} style={{ marginTop: 4 }}>
                      {tpl.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 2 && selectedTemplate && (
          <View>
            <View style={styles.configHeader}>
              <View style={[styles.configIconBox, { backgroundColor: selectedTemplate.color }]}>
                <Text style={{ fontSize: 40 }}>{selectedTemplate.icon}</Text>
              </View>
              <Text variant="headingLg" style={{ marginTop: 16 }}>{selectedTemplate.name}</Text>
            </View>

            <View style={styles.configSection}>
              <Text variant="headingMd" style={styles.sectionTitle}>Frequency</Text>
              <View style={styles.row}>
                <TouchableOpacity 
                  style={[styles.chip, frequency === 'daily' && styles.chipActive]}
                  onPress={() => setFrequency('daily')}
                >
                  <Text style={frequency === 'daily' ? styles.chipTextActive : undefined}>Daily</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.chip, frequency === 'specific_days' && styles.chipActive]}
                  onPress={() => setFrequency('specific_days')}
                >
                  <Text style={frequency === 'specific_days' ? styles.chipTextActive : undefined}>Specific Days</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.configSection}>
              <Text variant="headingMd" style={styles.sectionTitle}>Proof</Text>
              <View style={styles.switchRow}>
                <View>
                  <Text variant="headingMd">Require Photo</Text>
                  <Text variant="caption" color={COLORS.textSecondary}>Users must upload a photo to submit.</Text>
                </View>
                <Switch 
                  value={requirePhoto} 
                  onValueChange={setRequirePhoto} 
                  trackColor={{ false: COLORS.surfaceDark, true: COLORS.brandPrimary }}
                />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {step === 2 && (
        <View style={styles.footer}>
          <Button 
            label={isSubmitting ? "Adding..." : "Add to Pact"} 
            onPress={handleCreate} 
            disabled={isSubmitting}
          />
        </View>
      )}
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
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 24,
    color: COLORS.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  templateCard: {
    width: '48%',
    backgroundColor: COLORS.surfaceBase,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    ...SHADOWS.softElevation,
  },
  templateHeader: {
    height: 4,
    width: '100%',
  },
  templateContent: {
    padding: 16,
  },
  templateIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  configHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  configIconBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.softElevation,
  },
  configSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceBase,
    ...SHADOWS.softElevation,
  },
  chipActive: {
    backgroundColor: COLORS.brandPrimary,
  },
  chipTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceBase,
    padding: 16,
    borderRadius: 16,
    ...SHADOWS.softElevation,
  },
  footer: {
    padding: SIZES.padding,
    paddingBottom: 40,
  },
});
