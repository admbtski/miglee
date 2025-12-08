'use client';

import { useAdminUserNotificationsQuery } from '@/features/admin/api/admin-users';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { buildAvatarUrl } from '@/lib/media/url';
import { Avatar } from '@/components/ui/avatar';
import { Bell, BellOff, Loader2 } from 'lucide-react';

type NotificationsTabProps = {
  userId: string;
};

export function NotificationsTab({ userId }: NotificationsTabProps) {
  const { data, isLoading } = useAdminUserNotificationsQuery({
    userId,
    limit: 100,
    offset: 0,
  });

  const notifications = data?.adminUserNotifications?.items ?? [];
  const total = data?.adminUserNotifications?.pageInfo?.total ?? 0;

  const getNotificationIcon = (_kind: string) => {
    return <Bell className="h-4 w-4" />;
  };

  const getNotificationColor = (kind: string) => {
    switch (kind) {
      case 'INTENT_INVITE':
        return 'text-blue-600 dark:text-blue-400';
      case 'INTENT_JOIN_REQUEST':
        return 'text-purple-600 dark:text-purple-400';
      case 'INTENT_APPROVED':
        return 'text-green-600 dark:text-green-400';
      case 'INTENT_REJECTED':
        return 'text-red-600 dark:text-red-400';
      case 'INTENT_MESSAGE':
        return 'text-indigo-600 dark:text-indigo-400';
      case 'DM_MESSAGE':
        return 'text-pink-600 dark:text-pink-400';
      default:
        return 'text-zinc-600 dark:text-zinc-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Wszystkie powiadomienia
            </span>
          </div>
          <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {total}
          </span>
        </div>
      </div>

      {/* Notifications List */}
      <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <BellOff className="h-12 w-12 text-zinc-400" />
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              Brak powiadomień
            </p>
          </div>
        )}

        {!isLoading && notifications.length > 0 && (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
                  !notification.readAt
                    ? 'bg-blue-50/50 dark:bg-blue-950/20'
                    : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className={`mt-1 ${getNotificationColor(notification.kind)}`}
                  >
                    {getNotificationIcon(notification.kind)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        {/* Title */}
                        {notification.title && (
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {notification.title}
                          </p>
                        )}

                        {/* Body */}
                        {notification.body && (
                          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                            {notification.body}
                          </p>
                        )}

                        {/* Actor */}
                        {notification.actor && (
                          <div className="mt-2 flex items-center gap-2">
                            {notification.actor.avatarKey && (
                              <Avatar
                                url={buildAvatarUrl(
                                  notification.actor.avatarKey,
                                  'xs'
                                )}
                                blurhash={notification.actor.avatarBlurhash}
                                alt={notification.actor.name}
                                size={20}
                              />
                            )}
                            <span className="text-xs text-zinc-500 dark:text-zinc-500">
                              Od: {notification.actor.name}
                            </span>
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-500">
                          <span>Typ: {notification.kind}</span>
                          {notification.entityType && (
                            <span>Entity: {notification.entityType}</span>
                          )}
                          <span>
                            {format(
                              new Date(notification.createdAt),
                              'dd MMM yyyy, HH:mm',
                              { locale: pl }
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Read Status */}
                      <div className="flex-shrink-0">
                        {notification.readAt ? (
                          <span className="inline-flex rounded-full bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-300">
                            Przeczytane
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            Nieprzeczytane
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
