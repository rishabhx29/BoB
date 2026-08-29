import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Input, Button } from '@/components/ui';
import { COLORS } from '@/constants/theme';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseAuth } from '@/services/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import { storage } from '@/utils/storage';
import * as SecureStore from 'expo-secure-store';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterScreen({ navigation }: any) {
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, data.email, data.password);
      const token = await userCredential.user.getIdToken();
      
      // Save token
      await storage.setItem('streakpact_jwt', token);
      setUser({
        id: userCredential.user.uid,
        email: userCredential.user.email || '',
        displayName: 'New User',
        username: 'NewUser',
        avatarUrl: null,
        level: 1,
        xp: 0,
        shieldsAvailable: 3,
        totalSubmissions: 0,
        longestStreak: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await SecureStore.setItemAsync('streakpact_jwt', token);

      // We should ideally navigate to an Avatar/Username setup screen next.
      navigation.replace('SetupProfile');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setAuthError('An account with this email already exists.');
      } else {
        setAuthError(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setAuthError('Google Sign-In coming soon!');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text variant="headingLg" style={styles.title}>Create Account</Text>
            <Text variant="body" color={COLORS.textSecondary}>Join the accountability revolution.</Text>
          </View>

          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  placeholder="Enter your email"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.email?.message}
                />
              )}
            />

            <View style={styles.spacer} />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="Create a password"
                  secureTextEntry
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.password?.message}
                />
              )}
            />

            <View style={styles.spacer} />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirm Password"
                  placeholder="Type it again"
                  secureTextEntry
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.confirmPassword?.message}
                />
              )}
            />

            {authError && (
              <Text variant="body" color={COLORS.danger} style={styles.errorText}>
                {authError}
              </Text>
            )}

            <Button 
              label={isLoading ? "Creating account..." : "Sign Up"} 
              onPress={handleSubmit(onSubmit)} 
              style={styles.registerBtn}
              disabled={isLoading}
            />

            <Text style={styles.orText} color={COLORS.textSecondary}>OR</Text>

            <Button 
              label="Sign up with Google" 
              variant="secondary"
              onPress={handleGoogleLogin} 
              style={styles.googleBtn}
            />
          </View>

          <View style={styles.footer}>
            <Text color={COLORS.textSecondary}>Already have an account? </Text>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text color={COLORS.brandPrimary} style={styles.linkText}>Log in</Text>
            </Pressable>
          </View>
        </ScrollView>
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
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
  },
  title: {
    marginBottom: 8,
  },
  form: {
    width: '100%',
  },
  spacer: {
    height: 16,
  },
  errorText: {
    marginTop: 8,
    textAlign: 'center',
  },
  registerBtn: {
    marginTop: 24,
  },
  orText: {
    textAlign: 'center',
    marginVertical: 16,
  },
  googleBtn: {
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  linkText: {
    fontFamily: 'Inter-SemiBold',
  },
});
