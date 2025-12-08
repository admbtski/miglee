/**
 * Notifications Page
 * Displays user notifications with filtering, marking as read, and deletion
 */

'use client';

import { useState, useMemo, useCallback } from 'react';

// External libraries
import { format } from 'date-fns';
import { pl, enUS, de } from 'date-fns/locale';
import { Virtuoso } from 'react-virtuoso';

// Icons
import {
  AlertCircle,
  Bell,
  Calendar,
  Check,
  CheckCheck,
  CreditCard,
  Info,
  Loader2,
  MessageSquare,
  RefreshCcw,
  Trash2,
  User,
} from 'lucide-react';

// Features
import { useMeQuery } from '@/features/auth/hooks/auth';
import {
  useDeleteNotificationMutation,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsInfiniteQuery,
} from '@/features/notifications/api/notifications';

// Types
import type {
  GetNotificationsQuery,
  GetNotificationsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';

// i18n & Layout
import { useI18n } from '@/lib/i18n/provider-ssr';
import { AccountPageHeader } from '../_components';

type NotificationNode = NonNullable<
  GetNotificationsQuery['notifications']['items']
>[number];

type FilterType = 'all' | 'unread' | 'read';

function getNotificationIcon(entityType?: string) {
  switch (entityType) {
    case 'EVENT':
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

function getDateLocale(locale: string) {
  switch (locale) {
    case 'pl':
      return pl;
    case 'de':
      return de;
    case 'en':
    default:
      return enUS;
  }
}

export default function NotificationsPage() {
  const { t, locale } = useI18n();

  // useMeQuery with staleTime to use cached data from sidebar
  // This prevents showing "login required" message when data is still loading
  const { data: authData, isLoading: isLoadingAuth } = useMeQuery({
    staleTime: 5 * 60 * 1000, // 5 minutes - use cached data
  });
  const recipientId = authData?.me?.id;

  const dateLocale = getDateLocale(locale);

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

      // Get translated notification kind
      const kindKey = n.kind as string as keyof typeof t.notifications.kinds;
      const kindLabel =
        t.notifications.kinds[kindKey] || t.notifications.kinds.default;

      return (
        <div
          className={`group relative overflow-hidden rounded-xl border transition-all ${
            index === 0 ? 'mt-2' : ''
          } ${
            unread
              ? 'border-indigo-200 bg-gradient-to-br from-indigo-50 to-white shadow-sm dark:border-indigo-900/40 dark:from-indigo-950/30 dark:to-zinc-900'
              : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
          } hover:shadow-md hover:scale-[1.005]`}
        >
          {/* Unread indicator bar */}
          {unread && (
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 via-purple-500 to-cyan-500" />
          )}

          <div className="flex items-start gap-3 p-3.5">
            {/* Icon */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 shadow-sm">
              {getNotificationIcon(n.entityType as string)}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                  {n.title ?? kindLabel}
                </h3>
                <div className="flex items-center gap-2">
                  {unread && (
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-500 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500 shadow-sm" />
                    </span>
                  )}
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium whitespace-nowrap">
                    {format(new Date(n.createdAt), 'dd MMM yyyy, HH:mm', {
                      locale: dateLocale,
                    })}
                  </span>
                </div>
              </div>

              {n.body && (
                <p className="mb-2.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-2">
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
                    className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-indigo-700 active:scale-95 disabled:opacity-50 shadow-sm"
                  >
                    <Check className="h-3 w-3" />
                    {t.notifications.markAsRead}
                  </button>
                )}
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => handleDeleteOne(n.id)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 transition hover:bg-red-50 hover:text-red-600 active:scale-95 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                >
                  <Trash2 className="h-3 w-3" />
                  {t.notifications.delete}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    },
    [
      filteredNotifications,
      marking,
      deleting,
      handleMarkOne,
      handleDeleteOne,
      t,
      dateLocale,
    ]
  );

  const computeItemKey = useCallback(
    (index: number) => filteredNotifications[index]?.id || `notif-${index}`,
    [filteredNotifications]
  );

  const Footer = useCallback(() => {
    if (!hasNextPage && filteredNotifications.length > 0) {
      return (
        <div className="py-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 dark:bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            <CheckCheck className="h-3.5 w-3.5" />
            {t.notifications.loadedAll} ({filteredNotifications.length})
          </div>
        </div>
      );
    }
    if (isFetchingNextPage) {
      return (
        <div className="flex justify-center py-8">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 opacity-20 blur-md" />
            <Loader2 className="relative h-7 w-7 animate-spin text-indigo-600" />
          </div>
        </div>
      );
    }
    return null;
  }, [hasNextPage, isFetchingNextPage, filteredNotifications.length, t]);

  const virtuosoComponents = useMemo(
    () => ({
      List: ({ children, ...props }: any) => (
        <div {...props} className="flex flex-col gap-2 p-3">
          {children}
        </div>
      ),
      Footer,
    }),
    [Footer]
  );

  // Only show login required if auth is done loading and we don't have userId
  // While auth is loading, show the page structure (header, filters) with loading state for notifications
  if (!isLoadingAuth && !recipientId) {
    return (
      <div className="space-y-4">
        {/* Header - always visible */}
        <AccountPageHeader
          title={t.notifications.title}
          description={t.notifications.subtitle}
        />

        {/* Login required message */}
        <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950">
          <div className="text-center">
            <Bell className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-700" />
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              {t.notifications.loginRequired}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <AccountPageHeader
        title={t.notifications.title}
        description={t.notifications.subtitle}
      />

      {/* Stats & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
        {/* Stats */}
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <Bell className="h-4 w-4" />
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {allNotifications.length}
            </span>
          </div>
          {unreadCount > 0 && (
            <>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <div className="flex items-center gap-1.5">
                <div className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
                </div>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {unreadCount}
                </span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  {t.notifications.unread}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Filters + Buttons */}
        <div className="flex items-center gap-2">
          {/* Filters */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
            <button
              onClick={() => setFilter('all')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                filter === 'all'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              {t.notifications.all}
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`relative rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                filter === 'unread'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              {t.notifications.unread}
              {unreadCount > 0 && (
                <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                filter === 'read'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              {t.notifications.read}
            </button>
          </div>

          {/* Action Buttons */}
          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            title={t.notifications.refresh}
          >
            <RefreshCcw className="h-3.5 w-3.5" />
          </button>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={markingAll}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              title={t.notifications.markAllRead}
            >
              <CheckCheck className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {/* Show loading when: auth is loading (and we don't have recipientId yet) OR notifications are loading */}
      {isLoading || (isLoadingAuth && !recipientId) ? (
        <div className="rounded-xl border border-zinc-200 bg-gradient-to-br from-zinc-50/50 to-white dark:border-zinc-800 dark:from-zinc-900/50 dark:to-zinc-950 shadow-sm overflow-hidden">
          <div className="flex flex-col gap-2 p-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-start gap-3 p-3.5">
                  {/* Icon skeleton */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />

                  {/* Content skeleton */}
                  <div className="min-w-0 flex-1 space-y-3">
                    {/* Title + timestamp */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                      <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                    </div>

                    {/* Body */}
                    <div className="space-y-2">
                      <div className="h-3 w-full rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                      <div className="h-3 w-5/6 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-24 rounded-md bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                      <div className="h-7 w-20 rounded-md bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="flex min-h-[500px] items-center justify-center rounded-xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950">
          <div className="text-center px-6 py-8">
            <div className="relative mx-auto w-fit mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-10 blur-xl rounded-full" />
              <div className="relative p-4 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900">
                <Bell className="h-10 w-10 text-zinc-400 dark:text-zinc-600" />
              </div>
            </div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
              {filter === 'unread'
                ? t.notifications.empty.unread
                : filter === 'read'
                  ? t.notifications.empty.read
                  : t.notifications.empty.all}
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto">
              {filter === 'all'
                ? t.notifications.empty.description
                : t.notifications.empty.changeFilter}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-gradient-to-br from-zinc-50/50 to-white dark:border-zinc-800 dark:from-zinc-900/50 dark:to-zinc-950 shadow-sm overflow-hidden">
          <Virtuoso
            style={{
              height: 'calc(100vh - 360px)',
              minHeight: '500px',
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
