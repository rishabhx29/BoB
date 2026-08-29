import React, { useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme, DefaultTheme, Theme } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import * as SplashScreen from 'expo-splash-screen';
import { View } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import RootNavigator from './src/navigation';
import { queryClient } from './src/services/queryClient';
import { lightColors, darkColors, COLORS } from './constants/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

const linking: any = {
  prefixes: ['streakpact://', 'exp://'],
  config: {
    screens: {
      Auth: {
        screens: {
          Splash: '',
          Onboarding: 'onboarding',
          Login: 'login',
          Register: 'register',
          SetupProfile: 'setup-profile',
          JoinOrCreate: 'join-or-create',
          BiometricSetup: 'biometric-setup',
        },
      },
      Main: {
        screens: {
          Home: 'home',
          Groups: 'groups',
          Leaderboard: 'leaderboard',
          Profile: 'profile',
        },
      },
      JoinGroup: 'join/:code',
      CreateGroup: 'create-group',
      GroupHome: 'group/:groupId',
      GroupSettings: 'group/:groupId/settings',
      CreateActivity: 'group/:groupId/create-activity',
      ActivityDetail: 'group/:groupId/activity',
    },
  },
};

function buildNavTheme(isDark: boolean): Theme {
  const palette = isDark ? darkColors : lightColors;
  return {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: palette.surfaceBase,
      card: palette.surfaceElevated,
      text: palette.inkDisplay,
      border: palette.hairline,
      primary: palette.accent,
      notification: palette.accent,
    },
  };
}

export default function App() {
  const systemScheme = useColorScheme();
  const isDark = systemScheme === 'dark';
  const palette = isDark ? darkColors : lightColors;

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'SpaceGrotesk-Medium': SpaceGrotesk_500Medium,
    'SpaceGrotesk-SemiBold': SpaceGrotesk_600SemiBold,
    'SpaceGrotesk-Bold': SpaceGrotesk_700Bold,
    'JetBrainsMono-Regular': JetBrainsMono_400Regular,
    'JetBrainsMono-Medium': JetBrainsMono_500Medium,
    'JetBrainsMono-Bold': JetBrainsMono_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: palette.surfaceBase }} onLayout={onLayoutRootView}>
          <NavigationContainer theme={buildNavTheme(isDark)} linking={linking}>
            <RootNavigator />
          </NavigationContainer>
          <StatusBar style={isDark ? 'light' : 'dark'} />
        </View>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
