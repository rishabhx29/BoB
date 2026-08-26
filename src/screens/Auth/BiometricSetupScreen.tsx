import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button } from '@/components/ui';
import { COLORS, SHADOWS } from '@/constants/theme';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function BiometricSetupScreen({ navigation }: any) {
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('Biometrics');

  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsBiometricSupported(compatible);
      
      if (compatible) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('Face ID');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('Touch ID');
        }
      }
    })();
  }, []);

  const handleEnableBiometrics = async () => {
    try {
      const savedBiometrics = await LocalAuthentication.isEnrolledAsync();
      if (!savedBiometrics) {
        alert('No biometric records found. Please set them up in your device settings.');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Authenticate with ${biometricType} for StreakPact`,
        fallbackLabel: 'Use Passcode',
      });

      if (result.success) {
        await AsyncStorage.setItem('biometrics_enabled', 'true');
        navigation.replace('JoinOrCreate');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('biometrics_enabled', 'false');
    navigation.replace('JoinOrCreate');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{biometricType === 'Face ID' ? '🧑‍💻' : '👆'}</Text>
        </View>
        
        <Text variant="headingLg" style={styles.title}>Enhance Security</Text>
        <Text variant="body" color={COLORS.textSecondary} style={styles.description}>
          Log in faster and keep your accountability private with {biometricType}.
        </Text>

        <View style={styles.actions}>
          <Button 
            label={`Enable ${biometricType}`}
            onPress={handleEnableBiometrics} 
            style={styles.enableBtn}
            disabled={!isBiometricSupported}
          />
          <Button 
            label="Skip for now" 
            variant="secondary"
            onPress={handleSkip} 
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surfaceBase,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.surfaceBase,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    ...SHADOWS.mediumElevation,
  },
  icon: {
    fontSize: 60,
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 24,
  },
  actions: {
    width: '100%',
  },
  enableBtn: {
    marginBottom: 16,
  },
});
