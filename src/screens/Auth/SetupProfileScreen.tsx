import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Pressable, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Input, Button, Icon } from '@/components/ui';
import { COLORS, RADIUS } from '@/constants/theme';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/store/useAuthStore';
import { userService } from '@/services/userService';

const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'At least 3 characters')
    .max(20, 'Maximum 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers, underscore only'),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function SetupProfileScreen({ navigation }: any) {
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const { user, setUser } = useAuthStore();

  const { control, handleSubmit, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { username: user?.username || '' },
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (!result.canceled) setAvatar(result.assets[0].uri);
  };

  const onSubmit = async (data: ProfileForm) => {
    setIsLoading(true);
    setUsernameError(null);
    try {
      const saved = await userService.ensureCurrentUser({
        username: data.username,
        displayName: user?.displayName || data.username,
        avatarUrl: avatar || user?.avatarUrl || null,
      });
      setUser(saved);
      navigation.replace('BiometricSetup');
    } catch (e: any) {
      setUsernameError('Could not save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.kb}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text variant="eyebrow" color={COLORS.inkSecondary} style={styles.step}>Step 1 of 2</Text>
            <Text variant="displaySm" color={COLORS.inkDisplay} style={styles.title}>
              Set up your profile
            </Text>
            <Text variant="body" color={COLORS.inkSecondary} style={styles.subtitle}>
              Pick a username your pact will recognize.
            </Text>
          </View>

          <Pressable onPress={pickImage} style={styles.avatarBtn} accessibilityLabel="Upload avatar">
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Icon name="camera" size={28} color={COLORS.inkSecondary} />
                <Text variant="caption" color={COLORS.inkSecondary} style={styles.avatarHint}>
                  Add photo
                </Text>
              </View>
            )}
          </Pressable>

          <View style={styles.form}>
            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Username"
                  placeholder="iron_man"
                  leadingIcon="user"
                  autoCapitalize="none"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.username?.message || usernameError || undefined}
                  hint="3-20 chars · letters, numbers, underscore"
                />
              )}
            />

            <Button
              label={isLoading ? 'Saving…' : 'Continue'}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              loading={isLoading}
              fullWidth
              size="lg"
              trailingIcon="arrow-right"
              style={styles.submit}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surfaceBase },
  kb: { flex: 1, paddingHorizontal: 24 },
  content: { flex: 1, justifyContent: 'center' },
  header: { marginBottom: 32 },
  step: { marginBottom: 8 },
  title: { marginBottom: 8 },
  subtitle: { lineHeight: 22 },
  avatarBtn: {
    alignSelf: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 108,
    height: 108,
    borderRadius: 54,
  },
  avatarPlaceholder: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: { marginTop: 4 },
  form: { width: '100%' },
  submit: { marginTop: 28 },
});
