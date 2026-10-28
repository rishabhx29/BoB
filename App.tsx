import React, { useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  NavigationContainer,
  DarkTheme,
  Theme,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import {
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
import { COLORS } from './constants/theme';
import { useAuthSync } from './src/hooks/useAuthSync';
import { usePendingInvite } from './src/hooks/usePendingInvite';
import { SyncStatusPill } from './src/components/ui/SyncStatusPill';
import { NotificationSync } from './src/components/notifications/NotificationSync';
import { PushSync } from './src/components/notifications/PushSync';
import { linking } from './src/navigation/linking';
import { RootStackParamList } from './src/types';

SplashScreen.preventAutoHideAsync().catch(() => {});

function buildNavTheme(): Theme {
  return {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: COLORS.bgBase,
      card: COLORS.bgPanel,
      text: COLORS.textPrimary,
      border: COLORS.border,
      primary: COLORS.accentBlue,
      notification: COLORS.accentRed,
    },
  };
}

export default function App() {
  // Mount the auth sync listener once at the root. It restores the session,
  // fetches the matching `public.users` row and lets RootNavigator decide
  // between Auth, SetupProfile and Main.
  useAuthSync();

  // Holds an invite code captured before sign-in and opens JoinGroup once the
  // auth gate reaches Main.
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const { handleReady } = usePendingInvite(navigationRef);

  // Dark cosmos is the only theme — ignore system color scheme.
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
        <View style={{ flex: 1, backgroundColor: COLORS.bgBase }} onLayout={onLayoutRootView}>
          <NavigationContainer
            ref={navigationRef}
            onReady={handleReady}
            theme={buildNavTheme()}
            linking={linking}
          >
            <RootNavigator />
          </NavigationContainer>
          {/* Keeps the bell count and notification list live app-wide. */}
          <NotificationSync />
          {/* Native push: token registration + tap routing. */}
          <PushSync navigationRef={navigationRef} />
          {/* Drives offline submission sync and shows queue state app-wide. */}
          <SyncStatusPill />
          <StatusBar style="light" />
        </View>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
