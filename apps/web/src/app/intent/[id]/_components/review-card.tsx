'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Star, Trash2, Edit2, Flag } from 'lucide-react';
import { buildAvatarUrl } from '@/lib/media/url';
import { Avatar } from '@/components/ui/avatar';

type ReviewCardProps = {
  review: {
    id: string;
    rating: number;
    content?: string | null;
    createdAt: string;
    author: {
      id: string;
      name: string;
      avatarKey?: string | null;
      avatarBlurhash?: string | null;
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
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {/* Avatar */}
          <Link href={`/u/${review.author.name}`} className="flex-shrink-0">
            {review.author.avatarKey ? (
              <Avatar
                url={buildAvatarUrl(review.author.avatarKey, 'md') || ''}
                blurhash={review.author.avatarBlurhash}
                alt={review.author.name}
                size={48}
                className="rounded-full transition-opacity hover:opacity-80"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-200 transition-opacity hover:opacity-80 dark:bg-neutral-700">
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                  {(
                    (review.author as any).profile?.displayName ||
                    review.author.name
                  )
                    .charAt(0)
                    .toUpperCase()}
                </span>
              </div>
            )}
          </Link>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/u/${review.author.name}`}
                className="text-sm font-medium text-neutral-900 transition-colors hover:text-blue-600 dark:text-neutral-100 dark:hover:text-blue-400"
              >
                {(review.author as any).profile?.displayName ||
                  review.author.name}
              </Link>
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-neutral-300 dark:text-neutral-600'
                    }`}
                  />
                ))}
              </div>
            </div>
            <Link
              href={`/u/${review.author.name}`}
              className="text-xs text-neutral-600 transition-colors hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400"
            >
              @{review.author.name}
            </Link>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              {format(new Date(review.createdAt), 'dd MMM yyyy, HH:mm', {
                locale: pl,
              })}
            </p>
            {review.content && (
              <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
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
                    className="rounded-lg p-1.5 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
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
                    className="rounded-lg p-1.5 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
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
