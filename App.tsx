import React, { useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  RobotoMono_500Medium,
  RobotoMono_700Bold,
} from '@expo-google-fonts/roboto-mono';
import * as SplashScreen from 'expo-splash-screen';
import { View } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import RootNavigator from './src/navigation';
import { queryClient } from './src/services/queryClient';

// Keep the splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

// Deep link config for invite codes: streakpact://join/XXXXXX
const linking = {
  prefixes: ['streakpact://'],
  config: {
    screens: {
      Auth: {
        screens: {
          Splash: '',
          Onboarding: 'onboarding',
          Login: 'login',
          Register: 'register',
        },
      },
      Main: {
        screens: {
          Groups: 'join/:code',
          Home: 'home',
          Leaderboard: 'leaderboard',
          Profile: 'profile',
        },
      },
    },
  },
};

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'RobotoMono-Medium': RobotoMono_500Medium,
    'RobotoMono-Bold': RobotoMono_700Bold,
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
        <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
          <NavigationContainer linking={linking}>
            <RootNavigator />
          </NavigationContainer>
          <StatusBar style="dark" backgroundColor="transparent" translucent />
        </View>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
