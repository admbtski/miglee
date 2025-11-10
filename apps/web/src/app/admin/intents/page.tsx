'use client';

import { useState } from 'react';
import { useIntentsQuery } from '@/lib/api/intents';
import {
  Visibility,
  IntentStatus,
  MeetingKind,
  IntentsSortBy,
  SortDir,
} from '@/lib/api/__generated__/react-query-update';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Eye, Search } from 'lucide-react';

export default function IntentsPage() {
  const [keywords, setKeywords] = useState('');
  const [visibility, setVisibility] = useState<Visibility | undefined>();
  const [status, setStatus] = useState<IntentStatus | undefined>();
  const [kind, setKind] = useState<MeetingKind | undefined>();

  const { data, isLoading } = useIntentsQuery({
    keywords: keywords ? [keywords] : undefined,
    visibility,
    status,
    kinds: kind ? [kind] : undefined,
    sortBy: IntentsSortBy.CreatedAt,
    sortDir: SortDir.Desc,
    limit: 50,
  });

  const intents = data?.intents?.items ?? [];
  const total = data?.intents?.pageInfo?.total ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Wydarzenia
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Zarządzanie wydarzeniami platformy
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
        <div className="grid gap-4 md:grid-cols-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Wyszukaj
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="Szukaj po tytule..."
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Widoczność
            </label>
            <select
              value={visibility || ''}
              onChange={(e) =>
                setVisibility((e.target.value as Visibility) || undefined)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="">Wszystkie</option>
              <option value={Visibility.Public}>Publiczne</option>
              <option value={Visibility.Hidden}>Ukryte</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              value={status || ''}
              onChange={(e) =>
                setStatus((e.target.value as IntentStatus) || undefined)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="">Wszystkie</option>
              <option value={IntentStatus.Available}>Dostępne</option>
              <option value={IntentStatus.Ongoing}>W trakcie</option>
              <option value={IntentStatus.Past}>Zakończone</option>
              <option value={IntentStatus.Canceled}>Anulowane</option>
            </select>
          </div>

          {/* Kind */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Typ
            </label>
            <select
              value={kind || ''}
              onChange={(e) =>
                setKind((e.target.value as MeetingKind) || undefined)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="">Wszystkie</option>
              <option value={MeetingKind.Onsite}>Stacjonarne</option>
              <option value={MeetingKind.Online}>Online</option>
              <option value={MeetingKind.Hybrid}>Hybrydowe</option>
            </select>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Znaleziono: <span className="font-semibold">{total}</span> wydarzeń
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-400" />
          </div>
        )}

        {!isLoading && intents.length === 0 && (
          <div className="p-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Brak wydarzeń
            </p>
          </div>
        )}

        {!isLoading && intents.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Tytuł
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Organizator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Typ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-950">
                {intents.map((intent) => (
                  <tr
                    key={intent.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <td className="max-w-xs truncate px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {intent.title}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {intent.owner?.name || 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {format(new Date(intent.startAt), 'dd MMM yyyy', {
                        locale: pl,
                      })}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {intent.meetingKind || '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          intent.status === IntentStatus.Available
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : intent.status === IntentStatus.Ongoing
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                              : intent.status === IntentStatus.Past
                                ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}
                      >
                        {intent.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/intent/${intent.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
