import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Button, Icon, Input, ScreenHeader, Text } from '@/components/ui';
import { COLORS, RADIUS, SPACE } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';
import {
  useCurrentUser,
  useUpdateProfile,
  useUsernameAvailability,
} from '@/hooks/useCurrentUser';
import { uploadAvatarPhoto } from '@/services/storageService';
import { isAppError } from '@/services/errors';
import { USERNAME_MAX, usernameSchema } from '@/validation/auth';

const BIO_MAX = 160;
const DISPLAY_NAME_MAX = 40;

export default function EditProfileScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const { data: profile } = useCurrentUser();
  const updateProfile = useUpdateProfile();

  const baseline = profile ?? user;
  const sourceUsername = profile?.username ?? user?.username ?? '';

  const [displayName, setDisplayName] = useState(baseline?.displayName ?? '');
  const [username, setUsername] = useState(sourceUsername);
  const [bio, setBio] = useState(baseline?.bio ?? '');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // Only hydrate from the server once, and never overwrite edits the user has
  // already started typing.
  const touchedRef = useRef(false);
  useEffect(() => {
    if (touchedRef.current || !profile) return;
    setDisplayName(profile.displayName ?? '');
    setUsername(profile.username ?? '');
    setBio(profile.bio ?? '');
  }, [profile]);

  const markTouched = useCallback(() => {
    touchedRef.current = true;
  }, []);

  const trimmedUsername = username.trim();
  const usernameChanged =
    trimmedUsername.toLowerCase() !== sourceUsername.toLowerCase();

  const availability = useUsernameAvailability(trimmedUsername, 400, sourceUsername);
  const usernameValidation = useMemo(
    () => usernameSchema.safeParse(trimmedUsername),
    [trimmedUsername]
  );

  const usernameTaken =
    usernameChanged && availability.data === false && !availability.isFetching;
  const usernameFormatError =
    trimmedUsername.length > 0 && !usernameValidation.success
      ? usernameValidation.error.issues[0]?.message
      : undefined;
  const usernameError = usernameFormatError ?? (usernameTaken ? 'That username is taken.' : undefined);

  const usernameHint = usernameTaken
    ? 'That username is taken.'
    : usernameChanged && availability.data === true
      ? 'Username is available.'
      : `3–${USERNAME_MAX} chars · letters, numbers, underscore`;

  const avatarPreview = avatarUri ?? baseline?.avatarUrl ?? null;

  const pickAvatar = useCallback(() => {
    const applyResult = (result: ImagePicker.ImagePickerResult) => {
      if (!result.canceled && result.assets?.[0]?.uri) {
        markTouched();
        setAvatarUri(result.assets[0].uri);
      }
    };

    Alert.alert('Profile photo', 'Choose a source', [
      {
        text: 'Take photo',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission needed', 'Camera access is required to take a photo.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });
          applyResult(result);
        },
      },
      {
        text: 'Choose from library',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });
          applyResult(result);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [markTouched]);

  const handleSave = useCallback(async () => {
    const cleanDisplayName = displayName.trim();
    const cleanBio = bio.trim();

    if (!cleanDisplayName) {
      Alert.alert('Display name needed', 'Your pact needs a name to recognise you.');
      return;
    }
    if (!usernameValidation.success) {
      Alert.alert(
        'Check your username',
        usernameValidation.error.issues[0]?.message ?? 'That username is not valid.'
      );
      return;
    }
    if (usernameChanged && availability.data === false) {
      Alert.alert('Username taken', 'Try a different username.');
      return;
    }

    try {
      let avatarUrl: string | undefined;
      if (avatarUri) {
        if (!user?.id) {
          throw new Error('No active user');
        }
        avatarUrl = await uploadAvatarPhoto(user.id, avatarUri);
      }

      await updateProfile.mutateAsync({
        displayName: cleanDisplayName,
        username: trimmedUsername,
        bio: cleanBio ? cleanBio : null,
        ...(avatarUrl ? { avatarUrl } : {}),
      });

      Alert.alert('Profile updated', 'Your changes are live.', [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert(
        'Could not save profile',
        isAppError(error) ? error.message : 'Check your connection and try again.'
      );
    }
  }, [
    avatarUri,
    availability.data,
    bio,
    displayName,
    navigation,
    trimmedUsername,
    updateProfile,
    user?.id,
    usernameChanged,
    usernameValidation,
  ]);

  const isSaving = updateProfile.isPending;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Edit profile" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.avatarBlock}>
            <Pressable
              onPress={pickAvatar}
              style={styles.avatarButton}
              accessibilityRole="button"
              accessibilityLabel="Change profile photo"
            >
              {avatarPreview ? (
                <Image source={{ uri: avatarPreview }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Icon name="user" size={40} color={COLORS.textTertiary} />
                </View>
              )}
              <View style={styles.cameraBadge}>
                <Icon name="camera" size={16} color="#FFFFFF" />
              </View>
            </Pressable>
            <Text variant="caption" color={COLORS.textSecondary} style={styles.avatarHint}>
              Tap to change your photo
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Display name"
              placeholder="How your pact sees you"
              leadingIcon="pencil-simple"
              value={displayName}
              onChangeText={(value) => {
                markTouched();
                setDisplayName(value);
              }}
              maxLength={DISPLAY_NAME_MAX}
              autoCapitalize="words"
              textContentType="name"
              showCharCount
            />

            <Input
              label="Username"
              placeholder="iron_man"
              leadingIcon="user"
              value={username}
              onChangeText={(value) => {
                markTouched();
                setUsername(value);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={USERNAME_MAX}
              error={usernameError}
              hint={usernameHint}
            />

            <Input
              label="Bio"
              placeholder="One line about what you're building."
              value={bio}
              onChangeText={(value) => {
                markTouched();
                setBio(value);
              }}
              multiline
              maxLength={BIO_MAX}
              showCharCount
              style={styles.bioInput}
            />

            <View style={styles.emailRow}>
              <View style={styles.emailIcon}>
                <Icon name="envelope" size={17} color={COLORS.textSecondary} />
              </View>
              <View style={styles.emailText}>
                <Text variant="caption" color={COLORS.textSecondary}>
                  Email
                </Text>
                <Text variant="bodySm" color={COLORS.textPrimary} numberOfLines={1}>
                  {profile?.email || user?.email || 'Not available'}
                </Text>
              </View>
              <Icon name="lock" size={15} color={COLORS.textTertiary} />
            </View>

            <Button
              label={isSaving ? 'Saving…' : 'Save changes'}
              onPress={handleSave}
              disabled={isSaving}
              loading={isSaving}
              fullWidth
              size="lg"
              style={styles.saveButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bgBase },
  flex: { flex: 1 },
  content: { paddingHorizontal: SPACE.lg, paddingBottom: 80 },
  avatarBlock: { alignItems: 'center', paddingTop: SPACE.md, paddingBottom: SPACE.xl },
  avatarButton: { width: 116, height: 116 },
  avatarImage: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: COLORS.bgSurface,
  },
  avatarPlaceholder: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: COLORS.bgPanel,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.accentBlue,
    borderWidth: 3,
    borderColor: COLORS.bgBase,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: { marginTop: SPACE.sm },
  form: { gap: SPACE.md },
  bioInput: { minHeight: 84, paddingTop: 12, textAlignVertical: 'top' },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    backgroundColor: COLORS.bgPanel,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACE.md,
    paddingVertical: 14,
  },
  emailIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailText: { flex: 1, gap: 2 },
  saveButton: { marginTop: SPACE.md },
});
