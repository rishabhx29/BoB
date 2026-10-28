import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import { useAuthStore } from '@/store/useAuthStore';

import { RootStackParamList } from '@/types';

// Onboarding gate: a signed-in user without a `public.users` row.
import SetupProfileScreen from '@/screens/Auth/SetupProfileScreen';
import ProfileLoadingScreen from '@/screens/Auth/ProfileLoadingScreen';

// Group Screens
import CreateGroupScreen from '@/screens/Groups/CreateGroupScreen';
import JoinGroupScreen from '@/screens/Groups/JoinGroupScreen';
import GroupHomeScreen from '@/screens/Groups/GroupHomeScreen';
import GroupSettingsScreen from '@/screens/Groups/GroupSettingsScreen';
import CreateActivityScreen from '@/screens/Groups/CreateActivityScreen';
import ActivityDetailScreen from '@/screens/Groups/ActivityDetailScreen';
import SubmissionFlowScreen from '@/screens/Submission/SubmissionFlowScreen';
import ComparativeScreen from '@/screens/Groups/ComparativeScreen';

// Profile & notification screens
import NotificationsScreen from '@/screens/Main/NotificationsScreen';
import SettingsScreen from '@/screens/Main/SettingsScreen';
import EditProfileScreen from '@/screens/Main/EditProfileScreen';
import BadgesScreen from '@/screens/Main/BadgesScreen';
import SubmissionDetailScreen from '@/screens/Main/SubmissionDetailScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Root navigator + auth gate.
 *
 * Three states, in order of precedence:
 *
 *   1. Booting / signed out  → Auth stack (Splash, Onboarding, Login, Register)
 *   2. Signed in, no profile → SetupProfile. A session by itself is not enough:
 *      groups, submissions and streaks all have a foreign key to
 *      `public.users`, so a Google/OAuth user who has never completed setup
 *      must not reach Main. The Auth stack is deliberately not used here
 *      because the user is already authenticated.
 *   3. Signed in + profile   → Main tabs and the modal screens.
 *
 * State comes from `useAuthSync`; this navigator never manages sessions.
 * Screens are declared conditionally (the React Navigation "auth flow"
 * pattern), so the navigator instance is stable across sign-in and sign-out.
 */
export default function RootNavigator() {
  const session = useAuthStore((s) => s.session);
  const profileStatus = useAuthStore((s) => s.profileStatus);
  const isLoading = useAuthStore((s) => s.isLoading);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isLoading || !session ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : profileStatus === 'missing' ? (
        <Stack.Screen name="SetupProfile" component={SetupProfileScreen} />
      ) : profileStatus === 'unknown' ? (
        <Stack.Screen name="Loading" component={ProfileLoadingScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />

          {/* Group Stack */}
          <Stack.Screen
            name="CreateGroup"
            component={CreateGroupScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="JoinGroup"
            component={JoinGroupScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="GroupHome"
            component={GroupHomeScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="GroupSettings"
            component={GroupSettingsScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="CreateActivity"
            component={CreateActivityScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="ActivityDetail"
            component={ActivityDetailScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="SubmissionFlow"
            component={SubmissionFlowScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="Comparative"
            component={ComparativeScreen}
            options={{ animation: 'slide_from_bottom' }}
          />

          {/* Profile & notifications */}
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="Badges"
            component={BadgesScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="SubmissionDetail"
            component={SubmissionDetailScreen}
            options={{ animation: 'slide_from_right' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
