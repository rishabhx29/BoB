import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Input, Button } from '@/components/ui';
import { COLORS } from '@/constants/theme';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseAuth } from '@/services/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import * as SecureStore from 'expo-secure-store';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen({ navigation }: any) {
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, data.email, data.password);
      const token = await userCredential.user.getIdToken();
      
      // Save token and set user
      await SecureStore.setItemAsync('streakpact_jwt', token);
      setUser({
        id: userCredential.user.uid,
        email: userCredential.user.email || '',
        username: 'User',
        displayName: userCredential.user.displayName || 'User',
        avatarUrl: userCredential.user.photoURL || null,
        level: 1,
        xp: 0,
        shieldsAvailable: 0,
        totalSubmissions: 0,
        longestStreak: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential') {
        setAuthError('Invalid email or password.');
      } else {
        setAuthError(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // TODO: Implement Expo AuthSession or React Native Google Sign In
    setAuthError('Google Sign-In coming soon!');
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    try {
      await SecureStore.setItemAsync('streakpact_jwt', 'guest-token');
      setUser({
        id: 'guest-user-001',
        email: 'guest@streakpact.app',
        username: 'GuestUser',
        displayName: 'Guest Explorer',
        avatarUrl: null,
        level: 1,
        xp: 0,
        shieldsAvailable: 3,
        totalSubmissions: 0,
        longestStreak: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch {
      setAuthError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
              <Text variant="headingLg" style={styles.title}>Welcome Back</Text>
            <Text variant="body" color={COLORS.textSecondary}>Ready to keep your pact?</Text>
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
                placeholder="Enter your password"
                secureTextEntry
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.password?.message}
              />
            )}
          />

          {authError && (
            <Text variant="body" color={COLORS.danger} style={styles.errorText}>
              {authError}
            </Text>
          )}

          <Button 
            label={isLoading ? "Signing in..." : "Login"} 
            onPress={handleSubmit(onSubmit)} 
            style={styles.loginBtn}
            disabled={isLoading}
          />

          <Text style={styles.orText} color={COLORS.textSecondary}>OR</Text>

          <Button 
            label="Sign in with Google" 
            variant="secondary"
            onPress={handleGoogleLogin} 
            style={styles.googleBtn}
          />

          <Button 
            label="🚀 Continue as Guest" 
            variant="secondary"
            onPress={handleGuestLogin} 
            style={styles.guestBtn}
            disabled={isLoading}
          />
        </View>

        <View style={styles.footer}>
          <Text color={COLORS.textSecondary}>Don't have an account? </Text>
          <Pressable onPress={() => navigation.navigate('Register')}>
            <Text color={COLORS.brandPrimary} style={styles.linkText}>Sign up</Text>
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
  loginBtn: {
    marginTop: 24,
  },
  orText: {
    textAlign: 'center',
    marginVertical: 16,
  },
  googleBtn: {
    marginBottom: 12,
  },
  guestBtn: {
    marginBottom: 24,
    borderStyle: 'dashed' as any,
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
