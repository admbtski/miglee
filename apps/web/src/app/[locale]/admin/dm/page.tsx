'use client';

import { format, pl } from '@/lib/date';
import { useState } from 'react';
import { buildAvatarUrl } from '@/lib/media/url';
import { Avatar } from '@/components/ui/avatar';
import { Search, MessageSquare, User } from 'lucide-react';
import { useUsersQuery } from '@/features/users';
import { useAdminUserDmThreadsQuery } from '@/features/admin';
import {
  UsersSortBy,
  SortDir,
} from '@/lib/api/__generated__/react-query-update';

export default function DmPage() {
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

  // Get DM threads for selected user
  const { data: dmThreadsData, isLoading: isLoadingThreads } =
    useAdminUserDmThreadsQuery(
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
  const dmThreads = dmThreadsData?.adminUserDmThreads?.items ?? [];
  const total = dmThreadsData?.adminUserDmThreads?.pageInfo?.total ?? 0;

  const handleSelectUser = (userId: string, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setSearchUser('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Wiadomości DM
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Przegląd wątków wiadomości prywatnych użytkowników
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
              Znaleziono: <span className="font-semibold">{total}</span> wątków
              DM
            </div>
          )}
        </div>
      </div>

      {/* DM Threads List */}
      {!selectedUserId ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <MessageSquare className="mx-auto h-12 w-12 text-zinc-400" />
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Wybierz użytkownika, aby zobaczyć jego wątki wiadomości
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          {isLoadingThreads && (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-400" />
            </div>
          )}

          {!isLoadingThreads && dmThreads.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-zinc-400" />
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                Brak wątków DM dla tego użytkownika
              </p>
            </div>
          )}

          {!isLoadingThreads && dmThreads.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                      Rozmówca
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                      Liczba wiadomości
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                      Utworzono
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                      Ostatnia wiadomość
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
                  {dmThreads.map((thread) => (
                    <tr
                      key={thread.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            url={buildAvatarUrl(
                              thread.otherUser?.avatarKey,
                              'xs'
                            )}
                            blurhash={thread.otherUser?.avatarBlurhash}
                            alt={thread.otherUser?.name || 'User'}
                            size={32}
                          />
                          <div>
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                              {thread.otherUser?.name || 'N/A'}
                            </p>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400">
                              @{thread.otherUser?.name || 'unknown'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300">
                        {thread.messageCount || 0}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300">
                        {format(new Date(thread.createdAt), 'dd MMM yyyy', {
                          locale: pl,
                        })}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300">
                        {thread.lastMessageAt
                          ? format(
                              new Date(thread.lastMessageAt),
                              'dd MMM yyyy, HH:mm',
                              {
                                locale: pl,
                              }
                            )
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

