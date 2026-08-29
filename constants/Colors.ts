// Legacy file — kept for backwards compatibility. Use @/constants/theme instead.
export { COLORS } from './theme';
export const tintColorLight = '#FF5B1F';
export const tintColorDark = '#FF6B2C';
export default {
  light: {
    text: '#1F1F22',
    background: '#F5F4F0',
    tint: tintColorLight,
    tabIconDefault: '#9A9A9F',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#FAFAFA',
    background: '#0E0E10',
    tint: tintColorDark,
    tabIconDefault: '#5C5C62',
    tabIconSelected: tintColorDark,
  },
};
