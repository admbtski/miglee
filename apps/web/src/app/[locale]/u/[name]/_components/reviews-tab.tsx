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
      <div className="flex items-center justify-center rounded-3xl border border-slate-100 bg-white p-12 shadow-sm">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-slate-600">Failed to load reviews</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center shadow-sm">
        <Star className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-4 text-sm font-semibold text-slate-900">
          No reviews yet
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          This user hasn't written any reviews yet
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
            categoryNames?.pl || categoryNames?.en || 'Event';

          return (
            <div
              key={review.id}
              className="rounded-3xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm"
            >
              {/* Header: Event Link & Date */}
              <div className="mb-3 flex items-start justify-between gap-4">
                <Link
                  href={`/intent/${review.intent?.id}`}
                  className="group flex-1"
                >
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {review.intent?.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    {categoryName}
                  </p>
                </Link>
                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-500">
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
                        : 'text-slate-300 dark:text-zinc-700'
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  {review.rating}/5
                </span>
              </div>

              {/* Content */}
              {review.content && (
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {review.content}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-3xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 shadow-sm">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Page {page + 1} of {totalPages} ({total} reviews)
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-lg border border-slate-300 dark:border-zinc-700 px-3 py-1 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded-lg border border-slate-300 dark:border-zinc-700 px-3 py-1 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
