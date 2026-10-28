import { supabase } from './supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { AppError } from './errors';
import { Reaction } from '@/types';

const LOG_PREFIX = '[reactionService]';

export interface ReactionDetail {
  userId: string;
  emoji: Reaction['emoji'];
  displayName: string;
  avatarUrl?: string | null;
  createdAt: string;
}

export type ReactionItem = ReactionDetail;

function mapReactionRow(row: any): Reaction {
  return {
    submissionId: row.submission_id,
    userId: row.user_id,
    emoji: row.emoji,
    createdAt: row.created_at,
  };
}

/**
 * Toggles an emoji reaction for the current user on a submission.
 * Rules:
 *   - 1 reaction per user per submission (enforced by a unique index).
 *   - Tapping same emoji toggles it off.
 *   - Tapping different emoji updates to the new emoji.
 */
export async function toggleSubmissionReaction(
  submissionId: string,
  emoji: string
): Promise<{ action: 'added' | 'removed' | 'changed'; emoji: string }> {
  const user = useAuthStore.getState().user;
  if (!user?.id) {
    throw new AppError('NOT_AUTHENTICATED', 'You must be logged in to react');
  }

  const { data: existing, error: readError } = await supabase
    .from('reactions')
    .select('emoji')
    .eq('submission_id', submissionId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (readError) {
    console.error(`${LOG_PREFIX} Failed to read reaction:`, readError);
    throw new AppError('NETWORK', 'Failed to update reaction');
  }

  if (existing) {
    if (existing.emoji === emoji) {
      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('submission_id', submissionId)
        .eq('user_id', user.id);
      if (error) {
        console.error(`${LOG_PREFIX} Failed to remove reaction:`, error);
        throw new AppError('NETWORK', 'Failed to update reaction');
      }
      return { action: 'removed', emoji };
    }

    const { error } = await supabase
      .from('reactions')
      .update({ emoji })
      .eq('submission_id', submissionId)
      .eq('user_id', user.id);
    if (error) {
      console.error(`${LOG_PREFIX} Failed to change reaction:`, error);
      throw new AppError('NETWORK', 'Failed to update reaction');
    }
    return { action: 'changed', emoji };
  }

  const { error } = await supabase.from('reactions').insert({
    submission_id: submissionId,
    user_id: user.id,
    emoji,
  });

  if (error) {
    // A concurrent insert from another device won the race — update instead.
    if (error.code === '23505') {
      const { error: updateError } = await supabase
        .from('reactions')
        .update({ emoji })
        .eq('submission_id', submissionId)
        .eq('user_id', user.id);
      if (!updateError) return { action: 'changed', emoji };
    }
    console.error(`${LOG_PREFIX} Failed to add reaction:`, error);
    throw new AppError('NETWORK', 'Failed to update reaction');
  }

  return { action: 'added', emoji };
}

/**
 * All reactions for a submission, with author display data.
 * Used by the feed cards and the "Who reacted" bottom sheet.
 */
export async function fetchSubmissionReactions(submissionId: string): Promise<ReactionItem[]> {
  const { data, error } = await supabase
    .from('reactions')
    .select(`
      submission_id,
      user_id,
      emoji,
      created_at,
      user:users!reactions_user_id_fkey(display_name, username, avatar_url)
    `)
    .eq('submission_id', submissionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error(`${LOG_PREFIX} Failed to fetch reactions:`, error);
    throw new AppError('NETWORK', 'Failed to load reactions');
  }

  return ((data ?? []) as any[]).map((row) => ({
    userId: row.user_id,
    emoji: row.emoji as Reaction['emoji'],
    displayName:
      row.user?.display_name || row.user?.username || 'Squad Member',
    avatarUrl: row.user?.avatar_url ?? null,
    createdAt: row.created_at,
  }));
}

/**
 * Subscribe to realtime reaction changes for one submission.
 * Returns an unsubscribe function.
 */
export function subscribeToSubmissionReactions(
  submissionId: string,
  callback: (reactions: ReactionItem[]) => void
): () => void {
  const channel = supabase
    .channel(`reactions-${submissionId}-${Math.random().toString(36).slice(2, 8)}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reactions',
        filter: `submission_id=eq.${submissionId}`,
      },
      () => {
        fetchSubmissionReactions(submissionId)
          .then(callback)
          .catch((err) => console.warn(`${LOG_PREFIX} Realtime refetch failed:`, err));
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

/** Map a Supabase reaction row into the app's Reaction type. */
export function reactionFromRow(row: any): Reaction {
  return mapReactionRow(row);
}
