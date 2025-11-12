'use client';

import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Star, Trash2, Edit2, Flag } from 'lucide-react';

type ReviewCardProps = {
  review: {
    id: string;
    rating: number;
    content?: string | null;
    createdAt: string;
    author: {
      id: string;
      name: string;
      imageUrl?: string | null;
    };
  };
  currentUserId?: string;
  onEdit?: (reviewId: string) => void;
  onDelete?: (reviewId: string) => void;
  onReport?: (reviewId: string, authorName: string) => void;
};

export function ReviewCard({
  review,
  currentUserId,
  onEdit,
  onDelete,
  onReport,
}: ReviewCardProps) {
  const isAuthor = currentUserId === review.author.id;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {/* Avatar */}
          {review.author.imageUrl ? (
            <img
              src={review.author.imageUrl}
              alt={review.author.name}
              className="h-10 w-10 rounded-full"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                {review.author.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {review.author.name}
              </p>
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-zinc-300 dark:text-zinc-600'
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              {format(new Date(review.createdAt), 'dd MMM yyyy, HH:mm', {
                locale: pl,
              })}
            </p>
            {review.content && (
              <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                {review.content}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        {currentUserId && (
          <div className="flex items-center gap-2 ml-2">
            {isAuthor ? (
              <>
                {onEdit && (
                  <button
                    onClick={() => onEdit(review.id)}
                    className="rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    title="Edytuj recenzję"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(review.id)}
                    className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                    title="Usuń recenzję"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </>
            ) : (
              <>
                {onReport && (
                  <button
                    onClick={() => onReport(review.id, review.author.name)}
                    className="rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    title="Zgłoś recenzję"
                  >
                    <Flag className="h-4 w-4" />
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
