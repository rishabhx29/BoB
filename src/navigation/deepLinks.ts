import { MainTabParamList, RootStackParamList } from '@/types';

export type DeepLinkTarget =
  | { screen: 'Main'; params: { screen: keyof MainTabParamList } }
  | { screen: keyof RootStackParamList; params?: Record<string, unknown> };

const MAIN_TAB_PATHS: Record<string, keyof MainTabParamList> = {
  home: 'Home',
  groups: 'Groups',
  leaderboard: 'Leaderboard',
  profile: 'Profile',
};

/**
 * Turn a stored notification deep link into a navigation target.
 *
 * Accepts both real app links (`streakpact://group/<id>`) and Expo dev links
 * (`exp://192.168…/--/group/<id>`). Unknown links return null so the caller can
 * stay put instead of navigating somewhere arbitrary.
 */
export function resolveDeepLink(raw: string | null | undefined): DeepLinkTarget | null {
  const parsed = parseLink(raw);
  if (!parsed) return null;

  const { segments, query } = parsed;
  if (segments.length === 0) {
    return { screen: 'Main', params: { screen: 'Home' } };
  }

  const [first, second, third, fourth] = segments;

  if (segments.length === 1 && MAIN_TAB_PATHS[first]) {
    return { screen: 'Main', params: { screen: MAIN_TAB_PATHS[first] } };
  }

  switch (first) {
    case 'notifications':
      return { screen: 'Notifications' };
    case 'settings':
      return { screen: 'Settings' };
    case 'edit-profile':
      return { screen: 'EditProfile' };
    case 'badges':
      return { screen: 'Badges' };
    case 'create-group':
      return { screen: 'CreateGroup' };
    case 'submit':
      return {
        screen: 'SubmissionFlow',
        params: compact({
          activityId: query.activityId,
          groupId: query.groupId,
        }),
      };
    case 'join':
    case 'invite':
      return second ? { screen: 'JoinGroup', params: { code: second.toUpperCase() } } : null;
    case 'submission':
      return second ? { screen: 'SubmissionDetail', params: { submissionId: second } } : null;
    case 'group':
      if (!second) return null;
      if (third === 'settings') {
        return { screen: 'GroupSettings', params: { groupId: second } };
      }
      if (third === 'create-activity') {
        return { screen: 'CreateActivity', params: { groupId: second } };
      }
      return {
        screen: 'GroupHome',
        params: compact({
          groupId: second,
          activityId: fourth,
        }),
      };
    case 'comparative':
      return second && third
        ? {
            screen: 'Comparative',
            params: { member1Id: second, member2Id: third },
          }
        : null;
    default:
      return null;
  }
}

/**
 * Navigate to a notification's destination. Returns true when the link was
 * understood and navigation was dispatched.
 */
export function navigateDeepLink(
  navigation: { navigate: (name: any, params?: any) => void },
  raw: string | null | undefined
): boolean {
  const target = resolveDeepLink(raw);
  if (!target) return false;

  if (target.screen === 'Main') {
    navigation.navigate('Main', target.params);
  } else {
    navigation.navigate(target.screen, (target as any).params);
  }
  return true;
}

function parseLink(raw: string | null | undefined): {
  segments: string[];
  query: Record<string, string>;
} | null {
  if (!raw) return null;

  let path = raw.trim();
  if (!path) return null;

  const schemeIndex = path.indexOf('://');
  if (schemeIndex >= 0) path = path.slice(schemeIndex + 3);

  // Expo dev client URLs: exp://host:port/--/path
  path = path.replace(/^[^/]+\/--\//, '');

  const queryStart = path.indexOf('?');
  const queryString = queryStart >= 0 ? path.slice(queryStart + 1) : '';
  if (queryStart >= 0) path = path.slice(0, queryStart);

  const hashStart = path.indexOf('#');
  if (hashStart >= 0) path = path.slice(0, hashStart);

  const segments = path
    .split('/')
    .map((segment) => decodeURIComponent(segment))
    .filter(Boolean);

  return { segments, query: parseQuery(queryString) };
}

function parseQuery(queryString: string): Record<string, string> {
  if (!queryString) return {};
  const result: Record<string, string> = {};
  for (const pair of queryString.split('&')) {
    if (!pair) continue;
    const [rawKey, rawValue = ''] = pair.split('=');
    const key = decodeURIComponent(rawKey.replace(/\+/g, ' '));
    if (key) result[key] = decodeURIComponent(rawValue.replace(/\+/g, ' '));
  }
  return result;
}

function compact(values: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
}
