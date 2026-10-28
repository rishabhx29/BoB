import { useEffect } from 'react';
import {
  InfiniteData,
  QueryClient,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  NOTIFICATION_PAGE_SIZE,
  NotificationPage,
  deleteNotification,
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  markNotificationUnread,
  subscribeToNotifications,
} from '@/services/notificationService';
import { STALE_TIMES, QUERY_KEYS } from '@/services/queryClient';
import { AppNotification } from '@/types';

type NotificationPages = InfiniteData<NotificationPage>;

function patchPages(
  data: NotificationPages | undefined,
  predicate: (notification: AppNotification) => boolean,
  patch: (notification: AppNotification) => AppNotification
): NotificationPages | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.map((item) => (predicate(item) ? patch(item) : item)),
    })),
  };
}

function removeFromPages(
  data: NotificationPages | undefined,
  notificationId: string
): NotificationPages | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.filter((item) => item.id !== notificationId),
    })),
  };
}

function decrementUnread(queryClient: QueryClient, userId: string, by = 1) {
  queryClient.setQueryData<number>(
    QUERY_KEYS.notificationsUnread(userId),
    (current) => Math.max(0, (current ?? 0) - by)
  );
}

export function useNotifications(userId: string) {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.notifications(userId),
    queryFn: ({ pageParam }) =>
      fetchNotifications({ offset: pageParam, limit: NOTIFICATION_PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.hasMore ? lastPageParam + NOTIFICATION_PAGE_SIZE : undefined,
    enabled: Boolean(userId),
    staleTime: STALE_TIMES.notifications,
  });
}

export function useUnreadNotificationCount(userId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.notificationsUnread(userId),
    queryFn: fetchUnreadNotificationCount,
    enabled: Boolean(userId),
    staleTime: STALE_TIMES.notifications,
  });
}

/**
 * Keeps the notification list and unread badge live. Mounted once at the app
 * root so the bell count updates even when the notification screen is closed.
 */
export function useNotificationRealtime(userId: string): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    return subscribeToNotifications(userId, () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications(userId) });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notificationsUnread(userId) });
    });
  }, [queryClient, userId]);
}

export function useMarkNotificationRead(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(notificationId),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.notifications(userId) });
      const previousPages = queryClient.getQueryData<NotificationPages>(
        QUERY_KEYS.notifications(userId)
      );
      const wasUnread = previousPages?.pages.some((page) =>
        page.items.some((item) => item.id === notificationId && !item.isRead)
      );

      queryClient.setQueryData<NotificationPages | undefined>(
        QUERY_KEYS.notifications(userId),
        (current) =>
          patchPages(current, (item) => item.id === notificationId, (item) => ({
            ...item,
            isRead: true,
          }))
      );
      if (wasUnread) decrementUnread(queryClient, userId);

      return { previousPages, wasUnread };
    },
    onError: (_err, _id, context) => {
      if (context?.previousPages) {
        queryClient.setQueryData(QUERY_KEYS.notifications(userId), context.previousPages);
      }
      if (context?.wasUnread) {
        queryClient.setQueryData<number>(
          QUERY_KEYS.notificationsUnread(userId),
          (current) => (current ?? 0) + 1
        );
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notificationsUnread(userId) });
    },
  });
}

export function useMarkNotificationUnread(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => markNotificationUnread(notificationId),
    onMutate: async (notificationId) => {
      const previousPages = queryClient.getQueryData<NotificationPages>(
        QUERY_KEYS.notifications(userId)
      );
      const wasRead = previousPages?.pages.some((page) =>
        page.items.some((item) => item.id === notificationId && item.isRead)
      );

      queryClient.setQueryData<NotificationPages | undefined>(
        QUERY_KEYS.notifications(userId),
        (current) =>
          patchPages(current, (item) => item.id === notificationId, (item) => ({
            ...item,
            isRead: false,
          }))
      );
      if (wasRead) {
        queryClient.setQueryData<number>(
          QUERY_KEYS.notificationsUnread(userId),
          (current) => (current ?? 0) + 1
        );
      }

      return { previousPages, wasRead };
    },
    onError: (_err, _id, context) => {
      if (context?.previousPages) {
        queryClient.setQueryData(QUERY_KEYS.notifications(userId), context.previousPages);
      }
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notificationsUnread(userId) });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notificationsUnread(userId) });
    },
  });
}

export function useMarkAllNotificationsRead(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.notifications(userId) });
      const previousPages = queryClient.getQueryData<NotificationPages>(
        QUERY_KEYS.notifications(userId)
      );
      const previousCount = queryClient.getQueryData<number>(
        QUERY_KEYS.notificationsUnread(userId)
      );

      queryClient.setQueryData<NotificationPages | undefined>(
        QUERY_KEYS.notifications(userId),
        (current) =>
          patchPages(current, () => true, (item) =>
            item.isRead ? item : { ...item, isRead: true }
          )
      );
      queryClient.setQueryData(QUERY_KEYS.notificationsUnread(userId), 0);

      return { previousPages, previousCount };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousPages) {
        queryClient.setQueryData(QUERY_KEYS.notifications(userId), context.previousPages);
      }
      if (typeof context?.previousCount === 'number') {
        queryClient.setQueryData(QUERY_KEYS.notificationsUnread(userId), context.previousCount);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications(userId) });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notificationsUnread(userId) });
    },
  });
}

export function useDeleteNotification(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => deleteNotification(notificationId),
    onMutate: async (notificationId) => {
      const previousPages = queryClient.getQueryData<NotificationPages>(
        QUERY_KEYS.notifications(userId)
      );
      const wasUnread = previousPages?.pages.some((page) =>
        page.items.some((item) => item.id === notificationId && !item.isRead)
      );

      queryClient.setQueryData<NotificationPages | undefined>(
        QUERY_KEYS.notifications(userId),
        (current) => removeFromPages(current, notificationId)
      );
      if (wasUnread) decrementUnread(queryClient, userId);

      return { previousPages, wasUnread };
    },
    onError: (_err, _id, context) => {
      if (context?.previousPages) {
        queryClient.setQueryData(QUERY_KEYS.notifications(userId), context.previousPages);
      }
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notificationsUnread(userId) });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notificationsUnread(userId) });
    },
  });
}
