'use client';

import { useState } from 'react';
import {
  Role,
  UsersSortBy,
  SortDir,
} from '@/lib/api/__generated__/react-query-update';
import {
  Search,
  UserPlus,
  Eye,
  Shield,
  CheckCircle,
  ShieldBan,
  User,
} from 'lucide-react';
import { useUsersQuery } from '@/features/users';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { UserDetailModal } from './_components/user-detail-modal';
import { AddUserModal } from './_components/add-user-modal';
import { buildAvatarUrl } from '@/lib/media/url';
import { Avatar } from '@/components/ui/avatar';

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<Role | undefined>();
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [addUserOpen, setAddUserOpen] = useState(false);

  const { data, isLoading } = useUsersQuery({
    q: search || undefined,
    role,
    verifiedOnly: verifiedOnly || undefined,
    sortBy: UsersSortBy.CreatedAt,
    sortDir: SortDir.Desc,
    limit: 50,
  });

  const users = data?.users?.items ?? [];
  const total = data?.users?.pageInfo?.total ?? 0;

  const handleRefresh = () => {
    // Refetch will happen automatically due to React Query
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Użytkownicy
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Zarządzanie użytkownikami platformy
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddUserOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
        >
          <UserPlus className="h-4 w-4" />
          Dodaj użytkownika
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="grid gap-4 md:grid-cols-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Wyszukaj
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Szukaj po nazwie lub email..."
                className="w-full rounded-lg border border-zinc-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Role filter */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Rola
            </label>
            <select
              value={role || ''}
              onChange={(e) => setRole((e.target.value as Role) || undefined)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="">Wszystkie</option>
              <option value={Role.Admin}>Admin</option>
              <option value={Role.Moderator}>Moderator</option>
              <option value={Role.User}>User</option>
            </select>
          </div>

          {/* Verified filter */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Status
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                Tylko zweryfikowani
              </span>
            </label>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
          <div>
            Znaleziono: <span className="font-semibold">{total}</span>{' '}
            użytkowników
          </div>
          {total > 50 && (
            <div className="text-xs text-zinc-500">
              Wyświetlono pierwsze 50 wyników
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-400" />
          </div>
        )}

        {!isLoading && users.length === 0 && (
          <div className="p-6 text-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Brak użytkowników
            </p>
          </div>
        )}

        {!isLoading && users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Użytkownik
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Rola
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Data rejestracji
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Ostatnia aktywność
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
                {users.map((user: any) => (
                  <tr
                    key={user.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <a
                          href={`/u/${user.name}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0"
                        >
                          <Avatar
                            url={buildAvatarUrl(user.avatarKey, 'xs')}
                            blurhash={user.avatarBlurhash}
                            alt={user.profile?.displayName || user.name}
                            size={32}
                            className="transition-opacity hover:opacity-80"
                          />
                        </a>
                        <div>
                          <div className="flex items-center gap-2">
                            <a
                              href={`/u/${user.name}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-semibold text-zinc-900 transition-colors hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400"
                            >
                              {user.profile?.displayName || user.name}
                            </a>
                            {user.suspendedAt && (
                              <span
                                title={`Zawieszony: ${user.suspensionReason || 'Brak powodu'}`}
                              >
                                <ShieldBan className="h-4 w-4 text-red-600 dark:text-red-400" />
                              </span>
                            )}
                            {user.verifiedAt && (
                              <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                            )}
                          </div>
                          <a
                            href={`/u/${user.name}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-zinc-500 transition-colors hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400"
                          >
                            @{user.name}
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300">
                      {user.email}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                          user.role === Role.Admin
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            : user.role === Role.Moderator
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                              : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-300'
                        }`}
                      >
                        {user.role === Role.Admin && (
                          <Shield className="h-3 w-3" />
                        )}
                        {user.role}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      {user.verifiedAt ? (
                        <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          Aktywny
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                          Niezweryfikowany
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300">
                      {format(new Date(user.createdAt), 'dd MMM yyyy', {
                        locale: pl,
                      })}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300">
                      {user.lastSeenAt
                        ? format(
                            new Date(user.lastSeenAt),
                            'dd MMM yyyy, HH:mm',
                            {
                              locale: pl,
                            }
                          )
                        : '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <div className="flex items-center justify-end gap-3">
                        <a
                          href={`/u/${user.name}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                          title="Zobacz profil publiczny"
                        >
                          <User className="h-4 w-4" />
                          Profil
                        </a>
                        <button
                          type="button"
                          onClick={() => setSelectedUserId(user.id)}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Eye className="h-4 w-4" />
                          Szczegóły
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          open={!!selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onRefresh={handleRefresh}
        />
      )}

      <AddUserModal
        open={addUserOpen}
        onClose={() => setAddUserOpen(false)}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
