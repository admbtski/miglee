'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { buildAvatarUrl } from '@/lib/media/url';
import { Avatar } from '@/components/ui/avatar';
import { Search, Bell, BellOff, User } from 'lucide-react';
import { useUsersQuery } from '@/features/users/api/users';
import { useAdminUserNotificationsQuery } from '@/features/admin/api/admin-users';
import {
  UsersSortBy,
  SortDir,
} from '@/lib/api/__generated__/react-query-update';

export default function NotificationsPage() {
  const [searchUser, setSearchUser] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>('');

  // Search users
  const { data: usersData } = useUsersQuery({
    q: searchUser || undefined,
    sortBy: UsersSortBy.CreatedAt,
    sortDir: SortDir.Desc,
    limit: 10,
  });

  // Get notifications for selected user
  const { data: notificationsData, isLoading: isLoadingNotifications } =
    useAdminUserNotificationsQuery(
      {
        userId: selectedUserId || '',
        limit: 100,
        offset: 0,
      },
      {
        enabled: !!selectedUserId,
      }
    );

  const users = usersData?.users?.items ?? [];
  const notifications = notificationsData?.adminUserNotifications?.items ?? [];
  const total = notificationsData?.adminUserNotifications?.pageInfo?.total ?? 0;

  const handleSelectUser = (userId: string, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setSearchUser('');
  };

  const getNotificationColor = (kind: string) => {
    switch (kind) {
      case 'EVENT_INVITE':
        return 'text-blue-600 dark:text-blue-400';
      case 'EVENT_JOIN_REQUEST':
        return 'text-purple-600 dark:text-purple-400';
      case 'EVENT_APPROVED':
        return 'text-green-600 dark:text-green-400';
      case 'EVENT_REJECTED':
        return 'text-red-600 dark:text-red-400';
      case 'EVENT_MESSAGE':
        return 'text-indigo-600 dark:text-indigo-400';
      case 'DM_MESSAGE':
        return 'text-pink-600 dark:text-pink-400';
      default:
        return 'text-zinc-600 dark:text-zinc-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Powiadomienia
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Zarządzanie powiadomieniami użytkowników
          </p>
        </div>
      </div>

      {/* User Search */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Wyszukaj użytkownika
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                placeholder="Szukaj po nazwie lub email..."
                className="w-full rounded-lg border border-zinc-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Search Results */}
          {searchUser && users.length > 0 && (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900">
              <div className="max-h-60 overflow-y-auto">
                {users.map((user: any) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user.id, user.name)}
                    className="flex w-full items-center gap-3 border-b border-zinc-200 p-3 text-left transition-colors hover:bg-zinc-100 last:border-b-0 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    <Avatar
                      url={buildAvatarUrl(user.avatarKey, 'xs')}
                      blurhash={user.avatarBlurhash}
                      alt={user.name}
                      size={32}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {user.name}
                      </p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        {user.email}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selected User */}
          {selectedUserId && (
            <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Wybrany użytkownik: {selectedUserName}
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedUserId(null);
                  setSelectedUserName('');
                }}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Wyczyść
              </button>
            </div>
          )}

          {selectedUserId && (
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Znaleziono: <span className="font-semibold">{total}</span>{' '}
              powiadomień
            </div>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {!selectedUserId ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <Bell className="mx-auto h-12 w-12 text-zinc-400" />
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Wybierz użytkownika, aby zobaczyć jego powiadomienia
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          {isLoadingNotifications && (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-400" />
            </div>
          )}

          {!isLoadingNotifications && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <BellOff className="h-12 w-12 text-zinc-400" />
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                Brak powiadomień dla tego użytkownika
              </p>
            </div>
          )}

          {!isLoadingNotifications && notifications.length > 0 && (
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
                      <Bell className="h-4 w-4" />
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
      )}
    </div>
  );
}
