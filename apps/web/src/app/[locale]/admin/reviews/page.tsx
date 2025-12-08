'use client';

import { useState } from 'react';
import {
  useAdminReviews,
  useAdminDeleteReview,
} from '@/features/admin/api/admin-comments';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Trash2, Star, Eye } from 'lucide-react';
import { NoticeModal } from '@/components/feedback/notice-modal';

export default function ReviewsPage() {
  const [eventId, setEventId] = useState('');
  const [userId, setUserId] = useState('');
  const [minRating, setMinRating] = useState<number | undefined>();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useAdminReviews({
    eventId: eventId || undefined,
    userId: userId || undefined,
    rating: minRating,
    limit: 100,
  });

  const deleteMutation = useAdminDeleteReview();

  const reviews = data?.adminReviews?.items ?? [];
  const total = data?.adminReviews?.pageInfo?.total ?? 0;

  const handleDeleteReview = async () => {
    if (!selectedReviewId) return;
    try {
      await deleteMutation.mutateAsync(selectedReviewId);
      setDeleteModalOpen(false);
      setSelectedReviewId(null);
      refetch();
    } catch (error) {
      console.error('Failed to delete review:', error);
    }
  };

  const openDeleteModal = (id: string) => {
    setSelectedReviewId(id);
    setDeleteModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Recenzje
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Moderacja recenzji wydarzeń
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              ID wydarzenia (opcjonalnie)
            </label>
            <input
              type="text"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              placeholder="Filtruj po ID wydarzenia..."
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              ID użytkownika (opcjonalnie)
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Filtruj po ID użytkownika..."
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Minimalna ocena
            </label>
            <select
              value={minRating || ''}
              onChange={(e) =>
                setMinRating(
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
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

        <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Znaleziono: <span className="font-semibold">{total}</span> recenzji
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-400" />
          </div>
        )}

        {!isLoading && reviews.length === 0 && (
          <div className="p-6 text-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Brak recenzji
            </p>
          </div>
        )}

        {!isLoading && reviews.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Autor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Wydarzenie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Ocena
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Treść
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Data
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
                {reviews.map((review) => (
                  <tr
                    key={review.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100">
                      {review.author?.name || 'N/A'}
                    </td>
                    <td className="max-w-xs truncate px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300">
                      {review.event?.title || 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {review.rating}
                        </span>
                      </div>
                    </td>
                    <td className="max-w-md truncate px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300">
                      {review.content || '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300">
                      {format(
                        new Date(review.createdAt),
                        'dd MMM yyyy, HH:mm',
                        {
                          locale: pl,
                        }
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        {review.event?.id && (
                          <a
                            href={`/event/${review.event.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Eye className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => openDeleteModal(review.id)}
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Delete Modal */}
      <NoticeModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        variant="error"
        size="sm"
        title="Usuń recenzję"
        subtitle="Czy na pewno chcesz usunąć tę recenzję? Ta akcja jest nieodwracalna."
        primaryLabel={deleteMutation.isPending ? 'Usuwanie...' : 'Usuń'}
        secondaryLabel="Anuluj"
        onPrimary={handleDeleteReview}
        onSecondary={() => setDeleteModalOpen(false)}
      >
        <></>
      </NoticeModal>
    </div>
  );
}
