// supabase/functions/_shared/gamification.ts
// Shared XP + badge logic for edge functions.
//
// The database owns the atomics (award_user_xp, user_badge_metrics); this module
// owns the condition vocabulary and notification side effects.

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Must match src/utils/progression.ts
export const LEVEL_THRESHOLDS = [0, 1000, 2500, 5000, 10000, 20000, 40000];

export function levelFromXp(xp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return Math.min(level, LEVEL_THRESHOLDS.length);
}

export interface BadgeRow {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'streak' | 'activity' | 'social' | 'special';
  condition: Record<string, unknown>;
}

export interface BadgeMetrics {
  longestStreak: number;
  currentStreak: number;
  comebackStreak: number;
  shieldsUsed: number;
  totalSubmissions: number;
  activityCounts: Record<string, number>;
  nudgeConversions: number;
  adminDays: number;
  comments: number;
  earlyDays: number;
  lateDays: number;
}

const EMPTY_METRICS: BadgeMetrics = {
  longestStreak: 0,
  currentStreak: 0,
  comebackStreak: 0,
  shieldsUsed: 0,
  totalSubmissions: 0,
  activityCounts: {},
  nudgeConversions: 0,
  adminDays: 0,
  comments: 0,
  earlyDays: 0,
  lateDays: 0,
};

function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function normalizeMetrics(raw: unknown): BadgeMetrics {
  if (!raw || typeof raw !== 'object') return EMPTY_METRICS;
  const m = raw as Record<string, unknown>;
  const counts = m.activityCounts;
  return {
    longestStreak: num(m.longestStreak),
    currentStreak: num(m.currentStreak),
    comebackStreak: num(m.comebackStreak),
    shieldsUsed: num(m.shieldsUsed),
    totalSubmissions: num(m.totalSubmissions),
    activityCounts:
      counts && typeof counts === 'object'
        ? (counts as Record<string, number>)
        : {},
    nudgeConversions: num(m.nudgeConversions),
    adminDays: num(m.adminDays),
    comments: num(m.comments),
    earlyDays: num(m.earlyDays),
    lateDays: num(m.lateDays),
  };
}

function normalizeTemplateKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function activityCount(metrics: BadgeMetrics, type: string): number {
  const target = normalizeTemplateKey(type);
  for (const [key, value] of Object.entries(metrics.activityCounts)) {
    if (normalizeTemplateKey(key) === target) return num(value);
  }
  return 0;
}

/**
 * Evaluate one badge's `condition` JSON against the metrics.
 * Unknown condition shapes are treated as unmet (and logged by the caller).
 */
export function isConditionMet(
  condition: Record<string, unknown>,
  metrics: BadgeMetrics
): boolean {
  if (typeof condition.streakDays === 'number') {
    return metrics.longestStreak >= condition.streakDays;
  }

  if (typeof condition.activityType === 'string' && typeof condition.count === 'number') {
    return activityCount(metrics, condition.activityType) >= condition.count;
  }

  if (typeof condition.nudgeConversions === 'number') {
    return metrics.nudgeConversions >= condition.nudgeConversions;
  }

  if (typeof condition.adminDays === 'number') {
    return metrics.adminDays >= condition.adminDays;
  }

  if (typeof condition.comments === 'number') {
    return metrics.comments >= condition.comments;
  }

  if (typeof condition.earlySubmissions === 'number') {
    return metrics.earlyDays >= condition.earlySubmissions;
  }

  if (typeof condition.lateSubmissions === 'number') {
    return metrics.lateDays >= condition.lateSubmissions;
  }

  if (typeof condition.shieldsUsed === 'number') {
    return metrics.shieldsUsed >= condition.shieldsUsed;
  }

  if (typeof condition.comebackStreak === 'number') {
    return metrics.comebackStreak >= condition.comebackStreak;
  }

  return false;
}

export interface AwardXpInput {
  userId: string;
  amount: number;
  reason: string;
  sourceId?: string | null;
}

export interface AwardXpResult {
  xp: number;
  level: number;
  awarded: boolean;
}

/**
 * Atomically award (or deduct) XP through the database function.
 * A repeated `sourceId` is a no-op, which keeps retries safe.
 */
export async function awardXp(
  supabase: SupabaseClient,
  input: AwardXpInput
): Promise<AwardXpResult> {
  const { data, error } = await supabase.rpc('award_user_xp', {
    p_user_id: input.userId,
    p_amount: input.amount,
    p_reason: input.reason,
    p_source_id: input.sourceId ?? null,
  });

  if (error) throw new Error(error.message);

  const row = Array.isArray(data) ? data[0] : data;
  return {
    xp: num(row?.xp),
    level: num(row?.level) || levelFromXp(num(row?.xp)),
    awarded: Boolean(row?.awarded),
  };
}

/**
 * Evaluate every badge for one user and persist the newly earned ones.
 * Returns the badges awarded by this call (existing badges are not repeated).
 */
export async function evaluateBadgesForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<BadgeRow[]> {
  const [{ data: badgeRows, error: badgeError }, { data: ownedRows, error: ownedError }, { data: metricsJson, error: metricsError }] =
    await Promise.all([
      supabase.from('badges').select('id, name, description, icon, category, condition'),
      supabase.from('user_badges').select('badge_id').eq('user_id', userId),
      supabase.rpc('user_badge_metrics', { p_user_id: userId }),
    ]);

  if (badgeError) throw new Error(`badge_lookup_failed: ${badgeError.message}`);
  if (ownedError) throw new Error(`owned_badge_lookup_failed: ${ownedError.message}`);
  if (metricsError) throw new Error(`badge_metrics_failed: ${metricsError.message}`);

  const metrics = normalizeMetrics(metricsJson);
  const owned = new Set<string>((ownedRows ?? []).map((row: any) => row.badge_id));

  const unmetConditions: string[] = [];
  const candidates = ((badgeRows ?? []) as BadgeRow[]).filter((badge) => {
    if (owned.has(badge.id)) return false;
    const met = isConditionMet(badge.condition ?? {}, metrics);
    if (!met && Object.keys(badge.condition ?? {}).length === 0) {
      unmetConditions.push(badge.id);
    }
    return met;
  });

  if (unmetConditions.length > 0) {
    console.warn('[badges] Unsupported condition shape:', unmetConditions.join(', '));
  }

  if (candidates.length === 0) return [];

  const { data: inserted, error: insertError } = await supabase
    .from('user_badges')
    .upsert(
      candidates.map((badge) => ({ user_id: userId, badge_id: badge.id })),
      { onConflict: 'user_id,badge_id', ignoreDuplicates: true }
    )
    .select('badge_id');

  if (insertError) {
    throw new Error(`badge_insert_failed: ${insertError.message}`);
  }

  const insertedIds = new Set<string>((inserted ?? []).map((row: any) => row.badge_id));
  const awarded = candidates.filter((badge) => insertedIds.has(badge.id));

  if (awarded.length > 0) {
    // Best-effort: a missing notification table must not undo the award.
    const { error: notifyError } = await supabase.from('notifications').insert(
      awarded.map((badge) => ({
        user_id: userId,
        type: 'badge_earned',
        title: `Badge unlocked: ${badge.name} ${badge.icon}`,
        body: badge.description,
        deep_link: 'streakpact://badges',
        is_read: false,
      }))
    );
    if (notifyError) {
      console.warn('[badges] Notification insert failed:', notifyError.message);
    }
  }

  return awarded;
}
