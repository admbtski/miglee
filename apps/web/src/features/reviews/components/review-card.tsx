'use client';

import { format, pl } from '@/lib/date';
import Link from 'next/link';
import {
  Star,
  Trash2,
  Edit2,
  Flag,
  Shield,
  EyeOff,
  MoreVertical,
} from 'lucide-react';
import { buildAvatarUrl } from '@/lib/media/url';
import { Avatar } from '@/components/ui/avatar';

type ReviewCardProps = {
  review: {
    id: string;
    rating: number;
    content?: string | null;
    createdAt: string;
    deletedAt?: string | null;
    deletedById?: string | null;
    hiddenAt?: string | null;
    hiddenById?: string | null;
    author: {
      id: string;
      name: string;
      avatarKey?: string | null;
      avatarBlurhash?: string | null;
    };
    deletedBy?: {
      id: string;
      name: string;
    } | null;
    hiddenBy?: {
      id: string;
      name: string;
    } | null;
  };
  currentUserId?: string;
  isAppAdmin?: boolean;
  isAppModerator?: boolean;
  isEventOwnerOrMod?: boolean;
  onEdit?: (reviewId: string) => void;
  onDelete?: (reviewId: string) => void;
  onHide?: (reviewId: string) => void;
  onReport?: (reviewId: string, authorName: string) => void;
};

export function ReviewCard({
  review,
  currentUserId,
  isAppAdmin = false,
  isAppModerator = false,
  isEventOwnerOrMod = false,
  onEdit,
  onDelete,
  onHide,
  onReport,
}: ReviewCardProps) {
  const isAuthor = currentUserId === review.author.id;
  const isDeleted = Boolean(review.deletedAt);
  const isHidden = Boolean(review.hiddenAt);
  const isRemovedFromView = isDeleted || isHidden;

  // Content is null when review is hidden/deleted and viewer cannot see it
  const contentVisible = review.content !== null;

  // Permissions matrix (must match backend resolver rules):
  // - Edit: ONLY Review Author (admins/moderators CANNOT edit)
  // - Delete: App Admin, App Moderator, or Review Author (Event Owner/Mod CANNOT delete)
  // - Hide: App Admin, App Moderator, or Event Owner/Mod
  // - Report: Any logged in user except the author
  const canEdit = isAuthor;
  const canDelete = isAppAdmin || isAppModerator || isAuthor;
  const canHide =
    (isAppAdmin || isAppModerator || isEventOwnerOrMod) && !isHidden;
  const canReport = Boolean(currentUserId) && !isAuthor;
  // App-level moderators and event moderators can see hidden/deleted reviews
  const showModerationBadge =
    (isAppAdmin || isAppModerator || isEventOwnerOrMod) && isRemovedFromView;

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm group dark:bg-zinc-900">
      {/* Deleted/Hidden Review Placeholder (for users who cannot see content) */}
      {!contentVisible ? (
        <div className="flex items-center gap-3 py-6 text-sm text-zinc-500 dark:text-zinc-400">
          <EyeOff className="w-4 h-4" />
          <span className="italic">
            {isHidden
              ? isAuthor
                ? 'Twoja recenzja została ukryta przez moderację'
                : 'Ta recenzja została ukryta przez moderację'
              : isDeleted
                ? isAuthor
                  ? 'Usunąłeś swoją recenzję'
                  : 'Ta recenzja została usunięta przez autora'
                : 'Ta recenzja jest niedostępna'}
          </span>
        </div>
      ) : (
        <>
          {/* Moderation Badge for deleted/hidden reviews visible to moderators */}
          {isRemovedFromView && showModerationBadge && (
            <div className="flex items-center gap-2 px-3 py-2 mb-3 text-xs font-medium border rounded-lg bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800">
              <Shield className="w-4 h-4" />
              <span>
                {isDeleted ? 'Recenzja usunięta' : 'Recenzja ukryta'}
                {review.deletedBy && ` przez ${review.deletedBy.name}`}
                {review.hiddenBy && ` przez ${review.hiddenBy.name}`}
              </span>
              <span className="ml-auto text-red-600 dark:text-red-400">
                (widoczna dla moderatorów)
              </span>
            </div>
          )}

          {/* Author & Actions */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3">
              {review.author.avatarKey && (
                <Link
                  href={`/u/${review.author.name}`}
                  className="flex-shrink-0"
                >
                  <Avatar
                    url={buildAvatarUrl(review.author.avatarKey, 'xs')}
                    blurhash={review.author.avatarBlurhash}
                    alt={
                      (review.author as any).profile?.displayName ||
                      review.author.name
                    }
                    size={32}
                    className="transition-opacity rounded-full hover:opacity-80"
                  />
                </Link>
              )}
              <div className="min-w-0">
                <Link
                  href={`/u/${review.author.name}`}
                  className="text-sm font-medium transition-colors text-zinc-900 hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400"
                >
                  {(review.author as any)?.profile?.displayName ||
                    review.author.name ||
                    'N/A'}
                </Link>
                <Link
                  href={`/u/${review.author.name}`}
                  className="block text-xs transition-colors text-zinc-600 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400"
                >
                  @{review.author.name || 'N/A'}
                </Link>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  {format(new Date(review.createdAt), 'dd MMM yyyy, HH:mm', {
                    locale: pl,
                  })}
                </p>
              </div>
            </div>

            {currentUserId && (
              <div className="relative transition-opacity opacity-0 group-hover:opacity-100">
                <div className="relative group/menu">
                  <button className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <MoreVertical className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                  </button>
                  <div className="absolute right-0 z-10 w-48 py-1 mt-1 transition-transform origin-top-right scale-0 bg-white rounded-md shadow-lg ring-1 ring-zinc-200 group-hover/menu:scale-100 dark:bg-zinc-800 dark:ring-zinc-700">
                    {canEdit && onEdit && (
                      <button
                        onClick={() => onEdit(review.id)}
                        className="flex items-center w-full gap-2 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edytuj
                      </button>
                    )}
                    {canDelete && onDelete && (
                      <button
                        onClick={() => onDelete(review.id)}
                        className="flex items-center w-full gap-2 px-4 py-2 text-sm text-red-600 hover:bg-zinc-100 dark:text-red-400 dark:hover:bg-zinc-700"
                      >
                        <Trash2 className="w-4 h-4" />
                        {isAuthor ? 'Usuń' : 'Usuń (moderacja)'}
                      </button>
                    )}
                    {canHide && onHide && (
                      <button
                        onClick={() => onHide(review.id)}
                        className="flex items-center w-full gap-2 px-4 py-2 text-sm text-amber-600 hover:bg-zinc-100 dark:text-amber-400 dark:hover:bg-zinc-700"
                      >
                        <Shield className="w-4 h-4" />
                        Ukryj recenzję
                      </button>
                    )}
                    {canReport && onReport && (
                      <button
                        onClick={() =>
                          onReport(review.id, review.author.name || 'N/A')
                        }
                        className="flex items-center w-full gap-2 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                      >
                        <Flag className="w-4 h-4" />
                        Zgłoś
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-2">
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

          {/* Content */}
          {review.content && (
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              {review.content}
            </p>
          )}
        </>
      )}
    </div>
  );
}
