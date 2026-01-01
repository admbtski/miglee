'use client';

// TODO i18n: All Polish strings need translation keys
// - Loading/error/empty states, pagination labels
// TODO i18n: Date formatting should be locale-aware

import { format, pl } from '@/lib/date';
import { useState } from 'react';
import {
  Star,
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';
import type { GetUserProfileQuery } from '@/lib/api/__generated__/react-query-update';
import { useI18n } from '@/lib/i18n/provider-ssr';
import { useUserReviewsQuery } from '../api';

type ReviewsTabProps = {
  user: NonNullable<GetUserProfileQuery['user']>;
};

export function ReviewsTab({ user }: ReviewsTabProps) {
  const { locale } = useI18n();
  const [page, setPage] = useState(0);
  const limit = 10;

  const { data, isLoading, error } = useUserReviewsQuery({
    userId: user.id,
    limit,
    offset: page * limit,
  });

  const reviews = data?.userReviews?.items || [];
  const total = data?.userReviews?.total || 0;
  const totalPages = Math.ceil(total / limit);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-12 shadow-sm">
        <div className="text-center">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-indigo-600 dark:text-indigo-400" />
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Ładowanie opinii...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 p-6 text-center">
        <p className="text-sm text-red-700 dark:text-red-400">
          Nie udało się załadować opinii
        </p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-12 text-center shadow-sm">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <MessageSquare
            className="h-10 w-10 text-zinc-400 dark:text-zinc-600"
            strokeWidth={1.5}
          />
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Brak opinii
        </h3>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto">
          Ten użytkownik nie napisał jeszcze żadnych opinii.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => {
          // TODO i18n: use locale-aware date formatting and category names
          const createdDate = new Date(review.createdAt);
          const categoryNames = review.event?.categories?.[0]?.names;
          const categoryName = categoryNames?.[locale ?? 'en'] ?? 'Wydarzenie';

          return (
            <div
              key={review.id}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 shadow-sm"
            >
              {/* Header: Event Link & Date */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <Link
                  href={`${locale}/event/${review.event?.id}`}
                  className="group flex-1 min-w-0"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                      {categoryName}
                    </span>
                  </div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                    {review.event?.title}
                  </h3>
                </Link>
                <div className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 flex-shrink-0">
                  <Calendar className="h-4 w-4" />
                  {/* TODO i18n: locale-aware date */}
                  <span>{format(createdDate, 'PP', { locale: pl })}</span>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < review.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-zinc-200 dark:text-zinc-700'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {review.rating}
                  <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400">
                    /5
                  </span>
                </span>
              </div>

              {/* Content */}
              {review.content && (
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  {review.content}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 px-5 py-4 shadow-sm">
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Strona{' '}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {page + 1}
            </span>{' '}
            z{' '}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {totalPages}
            </span>
            <span className="hidden sm:inline"> ({total} opinii)</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Poprzednia
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              Następna
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
