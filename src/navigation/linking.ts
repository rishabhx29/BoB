import { LinkingOptions, getStateFromPath } from '@react-navigation/native';
import { RootStackParamList } from '@/types';

/**
 * Single source of truth for URL-based navigation.
 *
 * Used by NavigationContainer, and kept here (instead of App.tsx) so the
 * notification router and tests can reference the same config.
 *
 * `invite/<code>` is accepted as an alias for `join/<code>`: older share
 * sheets wrote the former, newer ones write the latter.
 */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['streakpact://', 'exp://'],
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
          Home: 'home',
          Groups: 'groups',
          Leaderboard: 'leaderboard',
          Profile: 'profile',
        },
      },
      Notifications: 'notifications',
      Settings: 'settings',
      EditProfile: 'edit-profile',
      Badges: 'badges',
      SubmissionDetail: 'submission/:submissionId',
      JoinGroup: 'join/:code',
      CreateGroup: 'create-group',
      GroupHome: 'group/:groupId',
      GroupSettings: 'group/:groupId/settings',
      CreateActivity: 'group/:groupId/create-activity',
      ActivityDetail: 'group/:groupId/activity',
      SubmissionFlow: 'submit',
      Comparative: 'comparative/:member1Id/:member2Id',
    },
  },
  getStateFromPath: (path, options) => {
    const normalized = path.replace(/^\/?invite\//, 'join/');
    return getStateFromPath(normalized, options);
  },
} as LinkingOptions<RootStackParamList>;
