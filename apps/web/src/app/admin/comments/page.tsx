'use client';

import { useState } from 'react';
import { useGetComments } from '@/lib/api/comments';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';

export default function CommentsPage() {
  const [intentId, setIntentId] = useState('');

  const { data, isLoading } = useGetComments({
    intentId: intentId || undefined,
    limit: 50,
  });

  const comments = data?.comments?.items ?? [];
  const total = data?.comments?.pageInfo?.total ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Komentarze
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Moderacja komentarzy
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              ID wydarzenia (opcjonalnie)
            </label>
            <input
              type="text"
              value={intentId}
              onChange={(e) => setIntentId(e.target.value)}
              placeholder="Filtruj po ID wydarzenia..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Znaleziono: <span className="font-semibold">{total}</span> komentarzy
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-400" />
          </div>
        )}

        {!isLoading && comments.length === 0 && (
          <div className="p-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Brak komentarzy
            </p>
          </div>
        )}

        {!isLoading && comments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Autor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Treść
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Data
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-950">
                {comments.map((comment) => (
                  <tr
                    key={comment.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {comment.author?.name || 'N/A'}
                    </td>
                    <td className="max-w-md truncate px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {comment.body}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {format(
                        new Date(comment.createdAt),
                        'dd MMM yyyy, HH:mm',
                        {
                          locale: pl,
                        }
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                        Usuń
                      </button>
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
