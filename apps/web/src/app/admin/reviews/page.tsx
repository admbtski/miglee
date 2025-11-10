'use client';

import { useState } from 'react';
import { useGetReviews } from '@/lib/api/reviews';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Trash2, Star } from 'lucide-react';

export default function ReviewsPage() {
  const [intentId, setIntentId] = useState('');
  const [minRating, setMinRating] = useState<number | undefined>();

  const { data, isLoading } = useGetReviews({
    intentId: intentId || undefined,
    limit: 50,
  });

  const reviews = data?.reviews?.items ?? [];
  const total = data?.reviews?.pageInfo?.total ?? 0;

  const filteredReviews = minRating
    ? reviews.filter((r) => r.rating >= minRating)
    : reviews;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Recenzje
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Moderacja recenzji wydarzeń
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
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Minimalna ocena
            </label>
            <select
              value={minRating || ''}
              onChange={(e) =>
                setMinRating(
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="">Wszystkie</option>
              <option value="1">1+ gwiazdek</option>
              <option value="2">2+ gwiazdek</option>
              <option value="3">3+ gwiazdek</option>
              <option value="4">4+ gwiazdek</option>
              <option value="5">5 gwiazdek</option>
            </select>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Znaleziono:{' '}
          <span className="font-semibold">{filteredReviews.length}</span>{' '}
          recenzji
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-400" />
          </div>
        )}

        {!isLoading && filteredReviews.length === 0 && (
          <div className="p-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Brak recenzji
            </p>
          </div>
        )}

        {!isLoading && filteredReviews.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Autor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Ocena
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
                {filteredReviews.map((review) => (
                  <tr
                    key={review.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {review.reviewer?.name || 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {review.rating}
                        </span>
                      </div>
                    </td>
                    <td className="max-w-md truncate px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {review.body || '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {format(
                        new Date(review.createdAt),
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
