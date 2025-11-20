'use client';

import { useState } from 'react';
import { Star, Calendar, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { GetUserProfileQuery } from '@/lib/api/__generated__/react-query-update';
import { useUserReviewsQuery } from '@/lib/api/user-reviews';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

type ReviewsTabProps = {
  user: NonNullable<GetUserProfileQuery['user']>;
};

export function ReviewsTab({ user }: ReviewsTabProps) {
  const [page, setPage] = useState(0);
  const limit = 10;

  const { data, isLoading, error } = useUserReviewsQuery({
    userId: user.id,
    limit,
    offset: page * limit,
  });

  const reviews = (data as any)?.userReviews?.items || [];
  const total = (data as any)?.userReviews?.total || 0;
  const totalPages = Math.ceil(total / limit);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-zinc-200 bg-white p-12 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950/30">
        <p className="text-sm text-red-600 dark:text-red-400">
          Nie udało się załadować recenzji
        </p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <Star className="mx-auto h-12 w-12 text-zinc-400" />
        <h3 className="mt-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Brak recenzji
        </h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Ten użytkownik nie napisał jeszcze żadnych recenzji
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Reviews List */}
      <div className="space-y-3">
        {reviews.map((review: any) => {
          const createdDate = new Date(review.createdAt);
          const categoryNames = review.intent?.categories?.[0]?.names as any;
          const categoryName =
            categoryNames?.pl || categoryNames?.en || 'Wydarzenie';

          return (
            <div
              key={review.id}
              className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              {/* Header: Event Link & Date */}
              <div className="mb-3 flex items-start justify-between gap-4">
                <Link
                  href={`/intent/${review.intent?.id}`}
                  className="group flex-1"
                >
                  <h3 className="font-semibold text-zinc-900 group-hover:text-blue-600 dark:text-zinc-100 dark:group-hover:text-blue-400">
                    {review.intent?.title}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {categoryName}
                  </p>
                </Link>
                <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <Calendar className="h-3 w-3" />
                  {format(createdDate, 'PPP', { locale: pl })}
                </div>
              </div>

              {/* Rating */}
              <div className="mb-2 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-zinc-300 dark:text-zinc-600'
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {review.rating}/5
                </span>
              </div>

              {/* Content */}
              {review.content && (
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  {review.content}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Strona {page + 1} z {totalPages} ({total} recenzji)
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-lg border border-zinc-300 px-3 py-1 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Poprzednia
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded-lg border border-zinc-300 px-3 py-1 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Następna
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
