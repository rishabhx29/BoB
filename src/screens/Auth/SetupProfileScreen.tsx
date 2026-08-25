import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Pressable, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Input, Button } from '@/components/ui';
import { COLORS, SHADOWS } from '@/constants/theme';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/store/useAuthStore';
import { userService } from '@/services/userService';

const profileSchema = z.object({
  username: z.string()
    .min(3, 'Must be at least 3 characters')
    .max(20, 'Must be max 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only alphanumeric and underscores'),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function SetupProfileScreen({ navigation }: any) {
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const { user, setUser } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
    },
  });

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const onSubmit = async (data: ProfileForm) => {
    setIsLoading(true);
    setUsernameError(null);
    try {
      const savedUser = await userService.ensureCurrentUser({
        username: data.username,
        displayName: user?.displayName || data.username,
        avatarUrl: avatar || user?.avatarUrl || null,
      });
      setUser(savedUser);

      navigation.replace('BiometricSetup');
    } catch (error: any) {
      console.error('[SetupProfileScreen] Failed to save profile:', error);
      setUsernameError('Failed to update profile.');
      Alert.alert('Setup failed', "We couldn't save your profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text variant="headingLg" style={styles.title}>Let's set up your profile</Text>
          <Text variant="body" color={COLORS.textSecondary}>How should we call you?</Text>
        </View>

        <View style={styles.avatarContainer}>
          <Pressable onPress={pickImage} style={styles.avatarButton}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            ) : (
            <View style={styles.avatarPlaceholder}>
              <Text variant="headingLg" color={COLORS.textSecondary}>+</Text>
            </View>
            )}
          </Pressable>
            <Text variant="body" color={COLORS.brandPrimary} style={styles.avatarHint}>
            Tap to upload avatar
          </Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="username"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Username"
                placeholder="e.g. iron_man"
                autoCapitalize="none"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.username?.message || usernameError || undefined}
              />
            )}
          />

          <Button 
            label={isLoading ? "Saving..." : "Continue"} 
            onPress={handleSubmit(onSubmit)} 
            style={styles.continueBtn}
            disabled={isLoading}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surfaceBase,
  },
  keyboardView: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
  },
  title: {
    marginBottom: 8,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceBase,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.mediumElevation,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarHint: {
    marginTop: 12,
  },
  form: {
    width: '100%',
  },
  continueBtn: {
    marginTop: 32,
  },
});
