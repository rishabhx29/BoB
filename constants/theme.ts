import { Dimensions } from 'react-native';

export const COLORS = {
  surfaceBase: '#E5E7EB',
  surfaceDark: '#D1D5DB',
  surfaceScreen: '#111827',
  brandPrimary: '#F97316',
  brandPrimaryDark: '#C2410C',
  success: '#34D399',
  danger: '#EF4444',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textDisplay: '#F97316',
  shadowLight: '#FFFFFF',
  shadowDark: '#C8C9CC',
};

export const SHADOWS = {
  // Soft Elevation (Buttons)
  softElevation: {
    shadowColor: COLORS.shadowDark,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3, // For Android
  },
  // Medium Elevation (Cards)
  mediumElevation: {
    shadowColor: COLORS.shadowDark,
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 5,
  },
  // High Elevation (Header/Footer)
  highElevation: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 8,
  },
  // Main FAB
  fabDefault: {
    shadowColor: COLORS.brandPrimaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  fabPressed: {
    shadowColor: COLORS.brandPrimaryDark,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  }
};

export const TYPOGRAPHY = {
  headingLg: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: COLORS.textPrimary,
  },
  headingMd: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: COLORS.textPrimary,
  },
  body: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  caption: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  digitalDisplay: {
    fontFamily: 'RobotoMono-Bold',
    fontSize: 20,
    color: COLORS.textDisplay,
  },
};

export const SIZES = {
  base: 4,
  padding: 24,
  radiusCard: 32,
  radiusButton: 12,
  radiusScreen: 16,
  radiusPill: 999,
  screenWidth: Dimensions.get('window').width,
  screenHeight: Dimensions.get('window').height,
};

export default { COLORS, SHADOWS, TYPOGRAPHY, SIZES };
