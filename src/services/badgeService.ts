import { supabase } from './supabase';
import { BadgeDefinition } from '@/types';

/**
 * Ask the server to evaluate the current user's badges.
 *
 * Best-effort by design: the submission already succeeded, so a missing edge
 * function, offline device, or cold-start failure must never surface as an error.
 * Returns the badges unlocked by this call (usually an empty array).
 */
export async function evaluateMyBadges(): Promise<BadgeDefinition[]> {
  try {
    const { data, error } = await supabase.functions.invoke('evaluate-badges', {
      body: {},
    });

    if (error) {
      console.warn('[badgeService] Badge evaluation failed:', error.message);
      return [];
    }

    const results = Array.isArray((data as any)?.results) ? (data as any).results : [];
    const mine = results[0];
    return Array.isArray(mine?.newlyAwarded) ? (mine.newlyAwarded as BadgeDefinition[]) : [];
  } catch (err) {
    console.warn('[badgeService] Badge evaluation error:', err);
    return [];
  }
}
