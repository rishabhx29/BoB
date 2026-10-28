import { IconName } from '@/components/ui/Icon';
import { BadgeCategory } from '@/types';

/**
 * Stable, brand-aligned visuals for achievement badges.
 * A badge id always maps to the same colour so the grid never "flickers"
 * between renders or across screens.
 */

const PALETTE = ['#FF5B1F', '#8B5CF6', '#2E9D6A', '#0EA5E9', '#F59E0B', '#EC4899'];

export function badgeColor(badgeId: string): string {
  let h = 0;
  for (let i = 0; i < badgeId.length; i++) h = (h << 5) - h + badgeId.charCodeAt(i);
  return PALETTE[Math.abs(h) % PALETTE.length];
}

export function hexToTint(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function badgeIcon(icon: string | null | undefined): IconName {
  return (icon as IconName) || 'medal';
}

export const BADGE_CATEGORY_ORDER: BadgeCategory[] = [
  'streak',
  'activity',
  'social',
  'special',
];

export const BADGE_CATEGORY_META: Record<
  BadgeCategory,
  { title: string; subtitle: string; icon: IconName }
> = {
  streak: {
    title: 'Streaks',
    subtitle: 'Proof of consistency, day after day.',
    icon: 'fire',
  },
  activity: {
    title: 'Proofs',
    subtitle: 'For showing up and doing the work.',
    icon: 'paper-plane-tilt',
  },
  social: {
    title: 'Pact life',
    subtitle: 'For the teammates who keep you honest.',
    icon: 'users',
  },
  special: {
    title: 'Special',
    subtitle: 'Rare moments worth remembering.',
    icon: 'sparkle',
  },
};
