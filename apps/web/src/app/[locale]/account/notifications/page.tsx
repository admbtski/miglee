'use client';

import { useState, useMemo, useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';
import {
  Bell,
  Check,
  Trash2,
  RefreshCcw,
  Calendar,
  MessageSquare,
  CreditCard,
  User,
  Info,
  AlertCircle,
  Loader2,
  CheckCheck,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useMeQuery } from '@/lib/api/auth';
import {
  useNotificationsInfiniteQuery,
  useMarkNotificationReadMutation,
  useDeleteNotificationMutation,
  useMarkAllNotificationsReadMutation,
} from '@/lib/api/notifications';
import type {
  GetNotificationsQuery,
  GetNotificationsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';

type NotificationNode = NonNullable<
  GetNotificationsQuery['notifications']['items']
>[number];

type FilterType = 'all' | 'unread' | 'read';

function getNotificationIcon(entityType?: string) {
  switch (entityType) {
    case 'INTENT':
      return <Calendar className="h-5 w-5 text-sky-600 dark:text-sky-400" />;
    case 'MESSAGE':
      return (
        <MessageSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
      );
    case 'PAYMENT':
    case 'INVOICE':
      return (
        <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400" />
      );
    case 'USER':
      return <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />;
    case 'SYSTEM':
      return <Info className="h-5 w-5 text-violet-600 dark:text-violet-400" />;
    case 'OTHER':
    default:
      return (
        <AlertCircle className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
      );
  }
}

function formatKind(kind: string) {
  switch (kind) {
    case 'INTENT_REMINDER':
      return 'Przypomnienie o wydarzeniu';
    case 'INTENT_UPDATED':
      return 'Wydarzenie zaktualizowane';
    case 'INTENT_CANCELED':
      return 'Wydarzenie anulowane';
    case 'INTENT_CREATED':
      return 'Nowe wydarzenie';
    case 'NEW_MESSAGE':
      return 'Nowa wiadomość';
    case 'NEW_COMMENT':
      return 'Nowy komentarz';
    case 'NEW_REVIEW':
      return 'Nowa recenzja';
    case 'MEMBER_JOINED':
      return 'Nowy uczestnik';
    case 'MEMBER_LEFT':
      return 'Uczestnik opuścił';
    case 'INVITE_RECEIVED':
      return 'Otrzymano zaproszenie';
    default:
      return 'Powiadomienie';
  }
}

function mergeUniqueById<T extends { id: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of arr) {
    if (seen.has(it.id)) continue;
    seen.add(it.id);
    out.push(it);
  }
  return out;
}

export default function NotificationsPage() {
  const { data: authData } = useMeQuery();
  const recipientId = authData?.me?.id;

  const [filter, setFilter] = useState<FilterType>('all');
  const [optimistic, setOptimistic] = useState<
    Record<string, Partial<NotificationNode>>
  >({});
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  // Infinite query
  const baseVars: GetNotificationsQueryVariables = useMemo(
    () => ({ recipientId: recipientId || '', limit: 20, offset: 0 }),
    [recipientId]
  );

  const {
    data,
    isLoading,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotificationsInfiniteQuery(baseVars, {
    enabled: !!recipientId,
    refetchOnWindowFocus: false,
    staleTime: 10_000,
  });

  // Flatten pages
  const pagesItems = useMemo(() => {
    const items =
      data?.pages.flatMap((p) => p.notifications?.items ?? []) ?? [];
    return mergeUniqueById(items);
  }, [data?.pages]);

  // Apply optimistic updates and filters
  const allNotifications: NotificationNode[] = useMemo(() => {
    const applied = pagesItems
      .filter((x) => !deletedIds.has(x.id))
      .map((x) => ({ ...x, ...(optimistic[x.id] ?? {}) }));
    return applied;
  }, [pagesItems, optimistic, deletedIds]);

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') {
      return allNotifications.filter((n) => !n.readAt);
    }
    if (filter === 'read') {
      return allNotifications.filter((n) => n.readAt);
    }
    return allNotifications;
  }, [allNotifications, filter]);

  const unreadCount = useMemo(
    () => allNotifications.filter((n) => !n.readAt).length,
    [allNotifications]
  );

  // Mutations
  const { mutate: markRead, isPending: marking } =
    useMarkNotificationReadMutation(baseVars, {
      onSuccess: () => void refetch(),
    });

  const { mutate: delNotif, isPending: deleting } =
    useDeleteNotificationMutation(baseVars, {
      onSuccess: () => void refetch(),
    });

  const { mutate: markAll, isPending: markingAll } =
    useMarkAllNotificationsReadMutation(baseVars, {
      onSuccess: () => void refetch(),
    });

  // Handlers
  const handleMarkOne = useCallback(
    (id: string) => {
      setOptimistic((prev) => ({
        ...prev,
        [id]: { ...(prev[id] ?? {}), readAt: new Date().toISOString() },
      }));
      markRead({ id });
    },
    [markRead]
  );

  const handleDeleteOne = useCallback(
    (id: string) => {
      setDeletedIds((prev) => new Set(prev).add(id));
      delNotif({ id });
    },
    [delNotif]
  );

  const handleMarkAll = useCallback(() => {
    if (!recipientId) return;
    const now = new Date().toISOString();
    setOptimistic((prev) => {
      const next = { ...prev };
      for (const it of allNotifications) {
        next[it.id] = { ...(next[it.id] ?? {}), readAt: now };
      }
      return next;
    });
    markAll({ recipientId });
  }, [markAll, recipientId, allNotifications]);

  // Virtuoso callbacks
  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderNotificationItem = useCallback(
    (index: number) => {
      const n = filteredNotifications[index];
      if (!n) return null;

      const unread = !n.readAt;
      return (
        <div
          className={`group relative overflow-hidden rounded-xl border transition-all ${
            unread
              ? 'border-indigo-200 bg-indigo-50/50 shadow-sm dark:border-indigo-900/40 dark:bg-indigo-950/20'
              : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
          } hover:shadow-md`}
        >
          <div className="flex items-start gap-4 p-4">
            {/* Icon */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
              {getNotificationIcon(n.entityType as string)}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {n.title ?? formatKind(n.kind as string)}
                </h3>
                <div className="flex items-center gap-2">
                  {unread && (
                    <span className="relative inline-flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-indigo-500 opacity-70" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-indigo-500" />
                    </span>
                  )}
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {format(new Date(n.createdAt), 'dd MMM yyyy, HH:mm', {
                      locale: pl,
                    })}
                  </span>
                </div>
              </div>

              {n.body && (
                <p className="mb-3 text-sm text-zinc-700 dark:text-zinc-300">
                  {n.body}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                {unread && (
                  <button
                    type="button"
                    disabled={marking}
                    onClick={() => handleMarkOne(n.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Oznacz jako przeczytane
                  </button>
                )}
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => handleDeleteOne(n.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Usuń
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    },
    [filteredNotifications, marking, deleting, handleMarkOne, handleDeleteOne]
  );

  const computeItemKey = useCallback(
    (index: number) => filteredNotifications[index]?.id || `notif-${index}`,
    [filteredNotifications]
  );

  const Footer = useCallback(() => {
    if (!hasNextPage && filteredNotifications.length > 0) {
      return (
        <div className="py-6 text-center">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Wszystko załadowane ({filteredNotifications.length})
          </span>
        </div>
      );
    }
    if (isFetchingNextPage) {
      return (
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      );
    }
    return null;
  }, [hasNextPage, isFetchingNextPage, filteredNotifications.length]);

  const virtuosoComponents = useMemo(
    () => ({
      List: ({ children, ...props }: any) => (
        <div {...props} className="flex flex-col gap-3 p-3">
          {children}
        </div>
      ),
      Footer,
    }),
    [Footer]
  );

  if (!recipientId) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Bell className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-700" />
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Musisz być zalogowany, aby zobaczyć powiadomienia
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Notifications
          </h1>
          <p className="mt-1 text-base text-zinc-600 dark:text-zinc-400">
            Manage your notifications and stay updated
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            title="Refresh"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={markingAll}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
              title="Mark all as read"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Stats & Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <Bell className="h-4 w-4" />
          <span>
            Wszystkie: <strong>{allNotifications.length}</strong>
          </span>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <span>
            Nieprzeczytane:{' '}
            <strong className="text-indigo-600 dark:text-indigo-400">
              {unreadCount}
            </strong>
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-500" />
          <button
            onClick={() => setFilter('all')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
            }`}
          >
            Wszystkie
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              filter === 'unread'
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
            }`}
          >
            Nieprzeczytane
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              filter === 'read'
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
            }`}
          >
            Przeczytane
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="text-center">
            <Bell className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-700" />
            <p className="mt-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {filter === 'unread'
                ? 'Brak nieprzeczytanych powiadomień'
                : filter === 'read'
                  ? 'Brak przeczytanych powiadomień'
                  : 'Brak powiadomień'}
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {filter === 'all'
                ? 'Powiadomienia pojawią się tutaj, gdy coś się wydarzy'
                : 'Zmień filtr, aby zobaczyć inne powiadomienia'}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/30">
          <Virtuoso
            style={{
              height: 'calc(100vh - 420px)',
              minHeight: '400px',
            }}
            data={filteredNotifications}
            totalCount={filteredNotifications.length}
            endReached={handleEndReached}
            overscan={5}
            atBottomThreshold={400}
            itemContent={renderNotificationItem}
            computeItemKey={computeItemKey}
            components={virtuosoComponents}
            increaseViewportBy={{ top: 200, bottom: 400 }}
            followOutput={false}
            className="virtuoso-notifications-list"
          />
        </div>
      )}
    </div>
  );
}
