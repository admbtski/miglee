'use client';

import { useState } from 'react';
import {
  MessageSquare,
  Star,
  Trash2,
  RotateCcw,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import {
  useAdminUserCommentsQuery,
  useAdminUserReviewsQuery,
} from '@/lib/api/admin-users';
import Link from 'next/link';

type ContentTabProps = {
  userId: string;
};

export function ContentTab({ userId }: ContentTabProps) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);

  const { data: commentsData, isLoading: commentsLoading } =
    useAdminUserCommentsQuery({
      userId,
      limit: 50,
      offset: 0,
    });

  const { data: reviewsData, isLoading: reviewsLoading } =
    useAdminUserReviewsQuery({
      userId,
      limit: 50,
      offset: 0,
    });

  const comments = commentsData?.adminUserComments?.items ?? [];
  const reviews = reviewsData?.adminUserReviews?.items ?? [];

  const handleDeleteComment = async (commentId: string) => {
    // TODO: Implement deleteComment mutation
    console.log('Delete comment:', commentId);
  };

  const handleRestoreComment = async (commentId: string) => {
    // TODO: Implement restore comment (currently not in schema)
    console.log('Restore comment:', commentId);
  };

  const handleDeleteReview = async (reviewId: string) => {
    // TODO: Implement deleteReview mutation
    console.log('Delete review:', reviewId);
  };

  return (
    <div className="space-y-6">
      {/* Comments */}
      <div className="space-y-3">
        <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Komentarze użytkownika
        </h5>
        <button
          onClick={() => setCommentsOpen(true)}
          disabled={commentsLoading}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {commentsLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MessageSquare className="h-4 w-4" />
          )}
          Pokaż komentarze ({comments.length})
        </button>
      </div>

      {/* Reviews */}
      <div className="space-y-3">
        <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Recenzje użytkownika
        </h5>
        <button
          onClick={() => setReviewsOpen(true)}
          disabled={reviewsLoading}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {reviewsLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Star className="h-4 w-4" />
          )}
          Pokaż recenzje ({reviews.length})
        </button>
      </div>

      {/* Comments Modal */}
      {commentsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-4xl rounded-lg bg-white p-6 dark:bg-gray-900">
            <h4 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Komentarze użytkownika ({comments.length})
            </h4>
            <div className="max-h-[60vh] space-y-3 overflow-y-auto">
              {comments.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-600 dark:text-gray-400">
                  Użytkownik nie ma jeszcze żadnych komentarzy
                </div>
              ) : (
                comments.map((comment: any) => (
                  <div
                    key={comment.id}
                    className={`rounded-lg border p-4 ${
                      comment.deletedAt
                        ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30'
                        : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          {comment.content}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <span>
                            {format(
                              new Date(comment.createdAt),
                              'dd MMM yyyy, HH:mm',
                              { locale: pl }
                            )}
                          </span>
                          {comment.intent && (
                            <>
                              <span>•</span>
                              <Link
                                href={`/intent/${comment.intent.id}`}
                                className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400"
                              >
                                {comment.intent.title}
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </>
                          )}
                          {comment.deletedAt && (
                            <>
                              <span>•</span>
                              <span className="text-red-600 dark:text-red-400">
                                Usunięty
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {!comment.deletedAt && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="ml-4 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          title="Usuń komentarz"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setCommentsOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews Modal */}
      {reviewsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-4xl rounded-lg bg-white p-6 dark:bg-gray-900">
            <h4 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Recenzje użytkownika ({reviews.length})
            </h4>
            <div className="max-h-[60vh] space-y-3 overflow-y-auto">
              {reviews.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-600 dark:text-gray-400">
                  Użytkownik nie ma jeszcze żadnych recenzji
                </div>
              ) : (
                reviews.map((review: any) => (
                  <div
                    key={review.id}
                    className={`rounded-lg border p-4 ${
                      review.deletedAt
                        ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30'
                        : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                            {review.rating}/5
                          </span>
                        </div>
                        {review.content && (
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {review.content}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <span>
                            {format(
                              new Date(review.createdAt),
                              'dd MMM yyyy, HH:mm',
                              { locale: pl }
                            )}
                          </span>
                          {review.intent && (
                            <>
                              <span>•</span>
                              <Link
                                href={`/intent/${review.intent.id}`}
                                className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400"
                              >
                                {review.intent.title}
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </>
                          )}
                          {review.deletedAt && (
                            <>
                              <span>•</span>
                              <span className="text-red-600 dark:text-red-400">
                                Usunięta
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {!review.deletedAt && (
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          className="ml-4 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          title="Usuń recenzję"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setReviewsOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
