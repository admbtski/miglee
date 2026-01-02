'use client';

import { format, pl } from '@/lib/date';
import { useState } from 'react';
import { buildAvatarUrl } from '@/lib/media/url';
import { Avatar } from '@/components/ui/avatar';
import { Search, DollarSign, TrendingUp, Package, User } from 'lucide-react';
import { useUsersQuery } from '@/features/users';
import {
  UsersSortBy,
  SortDir,
} from '@/lib/api/__generated__/react-query-update';

export default function SponsorshipPage() {
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

  const users = usersData?.users?.items ?? [];

  const handleSelectUser = (userId: string, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setSearchUser('');
  };

  // TODO: Add real data queries when API hooks are available
  const userSubscription = null;
  const userPlanPeriods = [];
  const eventSponsorships = [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Sponsoring i Subskrypcje
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Zarządzanie płatnościami, subskrypcjami i sponsoringami wydarzeń
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
              <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Aktywne subskrypcje
              </p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                TODO
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900/30">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Sponsorowane wydarzenia
              </p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                TODO
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900/30">
              <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                PRO użytkownicy
              </p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                TODO
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-3 dark:bg-amber-900/30">
              <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Przychód (30 dni)
              </p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                TODO
              </p>
            </div>
          </div>
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
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {user.name}
                        </p>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                            user.effectivePlan === 'PRO'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                              : user.effectivePlan === 'PLUS'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-300'
                          }`}
                        >
                          {user.effectivePlan}
                        </span>
                      </div>
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
        </div>
      </div>

      {/* User Subscription & Payments Details */}
      {!selectedUserId ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <DollarSign className="mx-auto h-12 w-12 text-zinc-400" />
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Wybierz użytkownika, aby zobaczyć szczegóły subskrypcji i płatności
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Current Subscription */}
          <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Aktualna subskrypcja
              </h2>
            </div>
            <div className="p-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
              {userSubscription ? (
                <div>TODO: Display subscription details</div>
              ) : (
                <div>
                  <Package className="mx-auto h-8 w-8 text-zinc-400" />
                  <p className="mt-2">Brak aktywnej subskrypcji</p>
                </div>
              )}
            </div>
          </div>

          {/* Plan Periods History */}
          <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Historia okresów płatności
              </h2>
            </div>
            <div className="p-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
              {userPlanPeriods.length > 0 ? (
                <div>TODO: Display plan periods</div>
              ) : (
                <div>
                  <TrendingUp className="mx-auto h-8 w-8 text-zinc-400" />
                  <p className="mt-2">Brak historii płatności</p>
                </div>
              )}
            </div>
          </div>

          {/* Event Sponsorships */}
          <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Sponsorowane wydarzenia
              </h2>
            </div>
            <div className="p-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
              {eventSponsorships.length > 0 ? (
                <div>TODO: Display event sponsorships</div>
              ) : (
                <div>
                  <DollarSign className="mx-auto h-8 w-8 text-zinc-400" />
                  <p className="mt-2">Brak sponsorowanych wydarzeń</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
