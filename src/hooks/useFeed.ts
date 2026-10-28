import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { fetchAggregatedFeed, fetchSubmissionFeedItem } from '@/services/feedService';
import { STALE_TIMES } from '@/services/queryClient';

const PAGE_SIZE = 20;

export interface UseFeedOptions {
  /** Every group the current user belongs to. */
  groupIds: string[];
  /** Optional single-pact filter from the home screen chips. */
  selectedGroupId?: string | null;
  /** When set, only this user's submissions are returned ("My Activity"). */
  userId?: string;
}

/**
 * Paginated home feed, scoped to the user's pacts.
 *
 * Query key starts with `['feed']` so the existing submission mutations
 * invalidate it automatically.
 */
export function useFeed({ groupIds, selectedGroupId, userId }: UseFeedOptions) {
  const scopedGroupIds = selectedGroupId
    ? groupIds.filter((id) => id === selectedGroupId)
    : groupIds;
  const scopeKey = scopedGroupIds.slice().sort().join(',');

  return useInfiniteQuery({
    queryKey: ['feed', 'home', scopeKey, userId ?? 'everyone'] as const,
    queryFn: ({ pageParam }) =>
      fetchAggregatedFeed({
        groupIds: scopedGroupIds,
        limitCount: PAGE_SIZE,
        offset: pageParam,
        userId,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.reduce((total, page) => total + page.items.length, 0);
    },
    enabled: scopedGroupIds.length > 0,
    staleTime: STALE_TIMES.feed,
  });
}

/**
 * One group's recent proofs, using the same projection as the home feed so the
 * card, reaction counts and author embeds are identical in both places.
 */
export function useGroupFeed(groupId: string, limitCount: number = 20) {
  return useQuery({
    queryKey: ['feed', 'group', groupId, limitCount] as const,
    queryFn: () => fetchAggregatedFeed({ groupIds: [groupId], limitCount }),
    enabled: Boolean(groupId),
    staleTime: STALE_TIMES.feed,
  });
}

/**
 * One feed-shaped submission, used by the notification deep-link screen.
 * Shares the feed projection so counts, reactions and author data match.
 */
export function useSubmissionFeedItem(submissionId: string) {
  return useQuery({
    queryKey: ['submission-feed-item', submissionId] as const,
    queryFn: () => fetchSubmissionFeedItem(submissionId),
    enabled: Boolean(submissionId),
    staleTime: STALE_TIMES.feed,
  });
}
