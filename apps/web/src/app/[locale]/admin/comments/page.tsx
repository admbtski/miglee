'use client';

import { format, pl } from '@/lib/date';
import { useState } from 'react';
import { useAdminComments, useAdminDeleteComment } from '@/features/admin';
import { useHideComment, useUnhideComment } from '@/features/comments';
import { Trash2, EyeOff, Eye, Search, ExternalLink } from 'lucide-react';
import { NoticeModal } from '@/components/ui/notice-modal';
import { Pagination } from '@/components/ui/pagination';
import Link from 'next/link';
import { useLocalePath } from '@/hooks/use-locale-path';

const LIMIT = 100;

export default function CommentsPage() {
  const [eventId, setEventId] = useState('');
  const [userId, setUserId] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(
    null
  );
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const { localePath } = useLocalePath();

  const offset = (page - 1) * LIMIT;

  const { data, isLoading, refetch } = useAdminComments({
    eventId: eventId || undefined,
    userId: userId || undefined,
    limit: LIMIT,
    offset,
  });

  const deleteMutation = useAdminDeleteComment();
  const hideMutation = useHideComment();
  const unhideMutation = useUnhideComment();

  const comments = data?.adminComments?.items ?? [];
  const total = data?.adminComments?.pageInfo?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  // Reset to page 1 when filters change
  const handleEventIdChange = (value: string) => {
    setEventId(value);
    setPage(1);
  };

  const handleUserIdChange = (value: string) => {
    setUserId(value);
    setPage(1);
  };

  const handleDeleteComment = async () => {
    if (!selectedCommentId) return;
    try {
      await deleteMutation.mutateAsync(selectedCommentId);
      setDeleteModalOpen(false);
      setSelectedCommentId(null);
      refetch();
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleHideComment = async (id: string) => {
    try {
      await hideMutation.mutateAsync({ id });
      refetch();
    } catch (error) {
      console.error('Failed to hide comment:', error);
    }
  };

  const handleUnhideComment = async (id: string) => {
    try {
      await unhideMutation.mutateAsync({ id });
      refetch();
    } catch (error) {
      console.error('Failed to unhide comment:', error);
    }
  };

  const openDeleteModal = (id: string) => {
    setSelectedCommentId(id);
    setDeleteModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Komentarze
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Moderacja komentarzy
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              ID wydarzenia (opcjonalnie)
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={eventId}
                onChange={(e) => handleEventIdChange(e.target.value)}
                placeholder="Filtruj po ID wydarzenia..."
                className="w-full rounded-lg border border-zinc-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              ID użytkownika (opcjonalnie)
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={userId}
                onChange={(e) => handleUserIdChange(e.target.value)}
                placeholder="Filtruj po ID użytkownika..."
                className="w-full rounded-lg border border-zinc-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Znaleziono: <span className="font-semibold">{total}</span> komentarzy
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-400" />
          </div>
        )}

        {!isLoading && comments.length === 0 && (
          <div className="p-6 text-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Brak komentarzy
            </p>
          </div>
        )}

        {!isLoading && comments.length > 0 && (
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
                    Treść
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Status
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
                {comments.map((comment) => (
                  <tr
                    key={comment.id}
                    className={`hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
                      comment.hiddenAt
                        ? 'bg-red-50/50 dark:bg-red-950/20'
                        : comment.deletedAt
                          ? 'bg-zinc-100/50 opacity-50 dark:bg-zinc-800/50'
                          : ''
                    }`}
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100">
                      {comment.author?.name || 'N/A'}
                    </td>
                    <td className="max-w-xs px-6 py-4 text-sm">
                      {comment.event?.id ? (
                        <Link
                          href={localePath(`/event/${comment.event.id}`)}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                          title="Przejdź do wydarzenia"
                        >
                          <span className="truncate">
                            {comment.event.title}
                          </span>
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </Link>
                      ) : (
                        <span className="text-zinc-700 dark:text-zinc-300">
                          N/A
                        </span>
                      )}
                    </td>
                    <td className="max-w-md truncate px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300">
                      {comment.content}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      {comment.deletedAt ? (
                        <span className="inline-flex rounded-full bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-300">
                          Usunięty
                        </span>
                      ) : comment.hiddenAt ? (
                        <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800 dark:bg-red-900/30 dark:text-red-300">
                          Ukryty
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          Aktywny
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300">
                      {format(
                        new Date(comment.createdAt),
                        'dd MMM yyyy, HH:mm',
                        {
                          locale: pl,
                        }
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        {!comment.deletedAt && (
                          <>
                            {comment.hiddenAt ? (
                              <button
                                type="button"
                                onClick={() => handleUnhideComment(comment.id)}
                                disabled={unhideMutation.isPending}
                                className="inline-flex items-center gap-1 text-green-600 hover:text-green-900 disabled:opacity-50 dark:text-green-400 dark:hover:text-green-300"
                                title="Przywróć komentarz"
                              >
                                <Eye className="h-4 w-4" />
                                Przywróć
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleHideComment(comment.id)}
                                disabled={hideMutation.isPending}
                                className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-900 disabled:opacity-50 dark:text-orange-400 dark:hover:text-orange-300"
                                title="Ukryj komentarz"
                              >
                                <EyeOff className="h-4 w-4" />
                                Ukryj
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openDeleteModal(comment.id)}
                              className="inline-flex items-center gap-1 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="Usuń na zawsze"
                            >
                              <Trash2 className="h-4 w-4" />
                              Usuń
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && comments.length > 0 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={total}
            itemsPerPage={LIMIT}
            itemsOnCurrentPage={comments.length}
          />
        )}
      </div>

      {/* Delete Modal */}
      <NoticeModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        variant="error"
        size="sm"
        title="Usuń komentarz"
        subtitle="Czy na pewno chcesz usunąć ten komentarz? Ta akcja jest nieodwracalna."
        primaryLabel={
          deleteMutation.isPending ? 'Usuwanie...' : 'Usuń na zawsze'
        }
        secondaryLabel="Anuluj"
        onPrimary={handleDeleteComment}
        onSecondary={() => setDeleteModalOpen(false)}
      >
        <></>
      </NoticeModal>
    </div>
  );
}
