import { supabase } from './supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { AppError } from './errors';

const LOG_PREFIX = '[commentService]';

export interface SubmissionComment {
  id: string;
  submissionId: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  text: string;
  createdAt: string;
}

function mapCommentRow(row: any): SubmissionComment {
  return {
    id: row.id,
    submissionId: row.submission_id,
    userId: row.user_id,
    username: row.user?.username || 'member',
    displayName: row.user?.display_name || row.user?.username || 'Squad Member',
    avatarUrl: row.user?.avatar_url ?? null,
    text: row.text,
    createdAt: row.created_at,
  };
}

const COMMENT_SELECT = `
  id,
  submission_id,
  user_id,
  text,
  created_at,
  user:users!comments_user_id_fkey(display_name, username, avatar_url)
`;

/**
 * Add a new comment to a submission thread.
 */
export async function addSubmissionComment(
  submissionId: string,
  text: string
): Promise<SubmissionComment> {
  const user = useAuthStore.getState().user;
  if (!user?.id) {
    throw new AppError('NOT_AUTHENTICATED', 'You must be logged in to comment');
  }

  const trimmed = text.trim();
  if (!trimmed) {
    throw new AppError('VALIDATION', 'Comment cannot be empty');
  }
  if (trimmed.length > 500) {
    throw new AppError('VALIDATION', 'Comments are limited to 500 characters');
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      submission_id: submissionId,
      user_id: user.id,
      text: trimmed,
    })
    .select(COMMENT_SELECT)
    .single();

  if (error) {
    console.error(`${LOG_PREFIX} Failed to add comment:`, error);
    throw new AppError('NETWORK', 'Failed to post comment');
  }

  return mapCommentRow(data);
}

/**
 * Fetch comments for a specific submission, oldest first.
 */
export async function fetchSubmissionComments(
  submissionId: string,
  limitCount: number = 50
): Promise<SubmissionComment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(COMMENT_SELECT)
    .eq('submission_id', submissionId)
    .order('created_at', { ascending: true })
    .limit(limitCount);

  if (error) {
    console.error(`${LOG_PREFIX} Failed to fetch comments:`, error);
    throw new AppError('NETWORK', 'Failed to load comments');
  }

  return ((data ?? []) as any[]).map(mapCommentRow);
}

/**
 * Delete a comment (author or pact admin — enforced by RLS).
 */
export async function deleteSubmissionComment(
  submissionId: string,
  commentId: string
): Promise<void> {
  const user = useAuthStore.getState().user;
  if (!user?.id) {
    throw new AppError('NOT_AUTHENTICATED', 'You must be logged in to delete comments');
  }

  const { data, error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('submission_id', submissionId)
    .select('id');

  if (error) {
    console.error(`${LOG_PREFIX} Failed to delete comment:`, error);
    throw new AppError('NETWORK', 'Failed to delete comment');
  }

  if (!data || data.length === 0) {
    throw new AppError('NOT_ALLOWED', 'You cannot delete this comment');
  }
}

/**
 * Subscribe to realtime comment changes for one submission.
 * The callback receives the fresh, full thread.
 * Returns an unsubscribe function.
 */
export function subscribeToSubmissionComments(
  submissionId: string,
  callback: (comments: SubmissionComment[]) => void
): () => void {
  const channel = supabase
    .channel(`comments-${submissionId}-${Math.random().toString(36).slice(2, 8)}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `submission_id=eq.${submissionId}`,
      },
      () => {
        fetchSubmissionComments(submissionId)
          .then(callback)
          .catch((err) => console.warn(`${LOG_PREFIX} Realtime refetch failed:`, err));
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
