import { Dimensions } from 'react-native';

/**
 * StreakPact Design System
 *
 * Direction: "Premium consumer / editorial"
 * - Warm off-white body (not cream/sand AI slop)
 * - Single saturated accent (Volt Orange)
 * - Space Grotesk display, Inter body, JetBrains Mono numerics
 * - Real depth via subtle shadows + 1px hairlines (not 2010 neumorphism)
 * - One radius scale, locked.
 * - One motion language: ease-out-quint for entry, spring-ui for press.
 *
 * Light mode by default. Dark mode supported via useColorScheme hook.
 */

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── COLOR ────────────────────────────────────────────────────────────────────

export const lightColors = {
  // Surfaces
  surfaceBase: '#F5F4F0',       // warm neutral bone — the page
  surfaceElevated: '#FFFFFF',   // cards, sheets
  surfaceSunken: '#EAE8E2',     // pressed, recessed
  surfaceOverlay: 'rgba(14, 14, 16, 0.55)', // modal backdrop

  // Ink
  inkDisplay: '#0E0E10',        // headlines, high contrast
  inkPrimary: '#1F1F22',        // body
  inkSecondary: '#6B6B70',      // secondary body (≥4.5:1 on surfaceBase)
  inkTertiary: '#9A9A9F',       // placeholder, disabled
  inkInverse: '#FAFAFA',        // on dark / accent fills

  // Accent (single saturated)
  accent: '#FF5B1F',            // Volt Orange
  accentHover: '#FF7A47',
  accentPressed: '#D64410',
  accentTint: 'rgba(255, 91, 31, 0.10)',
  accentTintStrong: 'rgba(255, 91, 31, 0.18)',

  // Semantic
  positive: '#2E9D6A',
  positiveTint: 'rgba(46, 157, 106, 0.12)',
  danger: '#DC2626',
  dangerTint: 'rgba(220, 38, 38, 0.10)',
  warning: '#C97A0B',
  warningTint: 'rgba(201, 122, 11, 0.12)',

  // Lines
  hairline: 'rgba(14, 14, 16, 0.08)',
  hairlineStrong: 'rgba(14, 14, 16, 0.14)',

  // Special — the LCD streak display
  screenInk: '#FF7A47',
  screenBg: '#0E0E10',
};

export const darkColors = {
  surfaceBase: '#0E0E10',       // OLED near-black
  surfaceElevated: '#1A1A1E',   // cards
  surfaceSunken: '#070708',     // pressed
  surfaceOverlay: 'rgba(0, 0, 0, 0.7)',

  inkDisplay: '#FAFAFA',
  inkPrimary: '#E8E8EA',
  inkSecondary: '#9A9A9F',
  inkTertiary: '#5C5C62',
  inkInverse: '#0E0E10',

  accent: '#FF6B2C',            // slightly brighter for OLED
  accentHover: '#FF8550',
  accentPressed: '#E04E0E',
  accentTint: 'rgba(255, 107, 44, 0.14)',
  accentTintStrong: 'rgba(255, 107, 44, 0.22)',

  positive: '#34D399',
  positiveTint: 'rgba(52, 211, 153, 0.14)',
  danger: '#F87171',
  dangerTint: 'rgba(248, 113, 113, 0.14)',
  warning: '#FBBF24',
  warningTint: 'rgba(251, 191, 36, 0.14)',

  hairline: 'rgba(255, 255, 255, 0.08)',
  hairlineStrong: 'rgba(255, 255, 255, 0.14)',

  screenInk: '#FF8550',
  screenBg: '#000000',
};

// Default to light. Consumers can swap via useColors() hook.
export const COLORS = {
  ...lightColors,
  // Backward-compat aliases for old theme keys used by un-migrated screens.
  brandPrimary: '#FF5B1F',
  brandPrimaryDark: '#D64410',
  surfaceDark: lightColors.surfaceSunken,
  textPrimary: lightColors.inkPrimary,
  textSecondary: lightColors.inkSecondary,
  textDisplay: lightColors.screenInk,
  shadowDark: 'rgba(14, 14, 16, 0.20)',
  shadowLight: '#FFFFFF',
  success: lightColors.positive,
  danger: lightColors.danger,
};

// ─── RADIUS (one scale, locked) ───────────────────────────────────────────────

export const RADIUS = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

// ─── SPACING (4-pt baseline) ──────────────────────────────────────────────────

export const SPACE = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
};

// ─── TYPOGRAPHY ───────────────────────────────────────────────────────────────

/**
 * Type roles (do not use point sizes directly in screens).
 * Always compose: `Text variant="display">`
 */
export const TYPOGRAPHY = {
  // Display — Space Grotesk
  displayLg: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -1.5,
    color: COLORS.inkDisplay,
  },
  displayMd: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -1.0,
    color: COLORS.inkDisplay,
  },
  displaySm: {
    fontFamily: 'SpaceGrotesk-SemiBold',
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.5,
    color: COLORS.inkDisplay,
  },

  // Headings — Space Grotesk
  headingLg: {
    fontFamily: 'SpaceGrotesk-SemiBold',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
    color: COLORS.inkDisplay,
  },
  headingMd: {
    fontFamily: 'SpaceGrotesk-SemiBold',
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
    color: COLORS.inkDisplay,
  },
  headingSm: {
    fontFamily: 'SpaceGrotesk-Medium',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.1,
    color: COLORS.inkDisplay,
  },

  // Body — Inter
  body: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.inkPrimary,
  },
  bodyMedium: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.inkPrimary,
  },
  bodySm: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.inkPrimary,
  },

  // Labels
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0,
    color: COLORS.inkPrimary,
  },
  caption: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.1,
    color: COLORS.inkSecondary,
  },

  // Eyebrow / overline — Inter all-caps
  eyebrow: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: 'uppercase' as const,
    color: COLORS.inkSecondary,
  },

  // Numerics — JetBrains Mono (streaks, XP, counters)
  numericXl: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 56,
    lineHeight: 60,
    letterSpacing: -2,
    color: COLORS.inkDisplay,
  },
  numericLg: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.5,
    color: COLORS.inkDisplay,
  },
  numericMd: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: 0,
    color: COLORS.inkDisplay,
  },
  numericSm: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 0.2,
    color: COLORS.inkPrimary,
  },

  // LCD digital display (streak counter)
  digitalDisplay: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: 2,
    color: lightColors.screenInk,
  },
};

// ─── SHADOWS ──────────────────────────────────────────────────────────────────

/**
 * Real depth via dual shadows:
 * - a tight tinted offset (not black) to anchor the element
 * - a soft ambient blur to create the "lifted off the page" feel
 *
 * Avoids 2010 neumorphism: no inset double-borders, no harsh gray.
 */
export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  // Cards — subtle lift
  card: {
    shadowColor: '#1F1F22',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHover: {
    shadowColor: '#1F1F22',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  // Sheets, modals, FAB
  raised: {
    shadowColor: '#1F1F22',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  raisedLg: {
    shadowColor: '#1F1F22',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 16,
  },
  // Primary CTA — accent-tinted shadow for that "this is the one" pop
  cta: {
    shadowColor: '#FF5B1F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    elevation: 6,
  },
  // Hairline divider
  divider: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  // Legacy aliases for un-migrated screens
  softElevation: {
    shadowColor: '#1F1F22',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  mediumElevation: {
    shadowColor: '#1F1F22',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  highElevation: {
    shadowColor: '#1F1F22',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  fabDefault: {
    shadowColor: '#FF5B1F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.30,
    shadowRadius: 16,
    elevation: 8,
  },
  fabPressed: {
    shadowColor: '#FF5B1F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
};

// ─── MOTION ───────────────────────────────────────────────────────────────────

/**
 * Cubic-bezier curves (Emil Kowalski's framework applied).
 * Strong custom easings — default linear/ease feel weak.
 */
export const EASE = {
  // Element entering screen — fast initial movement, gentle settle
  out: 'cubic-bezier(0.16, 1, 0.3, 1)',
  outQuart: 'cubic-bezier(0.25, 1, 0.5, 1)',
  // Element moving on screen — natural acceleration/deceleration
  inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  // iOS-like drawer curve
  drawer: 'cubic-bezier(0.32, 0.72, 0, 1)',
  // Spring config for Reanimated Animated.spring calls
  spring: { damping: 18, stiffness: 220, mass: 0.8, useNativeDriver: true },
  springBouncy: { damping: 12, stiffness: 180, mass: 0.7, useNativeDriver: true },
  springSoft: { damping: 22, stiffness: 180, mass: 1, useNativeDriver: true },
};

/** Duration budget (ms). UI animations <300ms. */
export const DURATION = {
  fast: 120,
  base: 200,
  slow: 320,
  sheet: 380,
};

// ─── SIZES (screen + tap targets) ─────────────────────────────────────────────

export const SIZES = {
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  // iOS HIG / Material minimum
  tapTarget: 44,
  // Legacy aliases
  base: 4,
  padding: 24,
  radiusCard: 28,
  radiusButton: 14,
  radiusScreen: 16,
  radiusPill: 999,
};

export default {
  COLORS,
  lightColors,
  darkColors,
  RADIUS,
  SPACE,
  TYPOGRAPHY,
  SHADOWS,
  EASE,
  DURATION,
  SIZES,
};
