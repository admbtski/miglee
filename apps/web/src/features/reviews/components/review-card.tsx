'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Star, Trash2, Edit2, Flag, Shield, EyeOff } from 'lucide-react';
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
  // Note: isEventOwnerOrMod is eventionally NOT included for reviews
  // Event owners/moderators cannot moderate reviews to protect review integrity
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
  onEdit,
  onDelete,
  onHide,
  onReport,
}: ReviewCardProps) {
  const isAuthor = currentUserId === review.author.id;
  const isDeleted = Boolean(review.deletedAt);
  const isHidden = Boolean(review.hiddenAt);
  const isRemovedFromView = isDeleted || isHidden;

  // Permissions matrix for reviews (different from comments to protect review integrity):
  // - Edit: Only App Admin or Review Author (App Moderator and Event Owner/Mod should NOT edit)
  // - Delete: Only App Admin, App Moderator, or Review Author (Event Owner/Mod CANNOT delete)
  // - Hide: Only App Admin or App Moderator (Event Owner/Mod CANNOT hide - protects ratings)
  // - Report: Any logged in user except the author
  const canEdit = isAppAdmin || isAuthor;
  const canDelete = isAppAdmin || isAppModerator || isAuthor;
  const canHide = (isAppAdmin || isAppModerator) && !isHidden;
  const canReport = Boolean(currentUserId) && !isAuthor;
  // Only app-level moderators can see hidden/deleted reviews (not event owner/mod)
  const showModerationBadge =
    (isAppAdmin || isAppModerator) && isRemovedFromView;

  return (
    <div className="p-4 border rounded-lg border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      {/* Deleted/Hidden Review Placeholder */}
      {isRemovedFromView && !showModerationBadge ? (
        <div className="flex items-center gap-3 py-6 text-sm text-zinc-500 dark:text-zinc-400">
          <EyeOff className="w-4 h-4" />
          <span className="italic">
            {isDeleted
              ? 'Ta recenzja została usunięta'
              : 'Ta recenzja została ukryta'}
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

          <div className="flex items-start justify-between">
            <div className="flex items-start flex-1 gap-3">
              {/* Avatar */}
              <Link href={`/u/${review.author.name}`} className="flex-shrink-0">
                {review.author.avatarKey ? (
                  <Avatar
                    url={buildAvatarUrl(review.author.avatarKey, 'md') || ''}
                    blurhash={review.author.avatarBlurhash}
                    alt={review.author.name}
                    size={48}
                    className="transition-opacity rounded-full hover:opacity-80"
                  />
                ) : (
                  <div className="flex items-center justify-center w-10 h-10 transition-opacity rounded-full bg-zinc-200 hover:opacity-80 dark:bg-zinc-700">
                    <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
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
                <div className="flex items-center flex-wrap gap-2">
                  <Link
                    href={`/u/${review.author.name}`}
                    className="text-sm font-medium transition-colors text-zinc-900 hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400"
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
                            : 'text-zinc-300 dark:text-zinc-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <Link
                  href={`/u/${review.author.name}`}
                  className="text-xs transition-colors text-zinc-600 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400"
                >
                  @{review.author.name}
                </Link>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  {format(new Date(review.createdAt), 'dd MMM yyyy, HH:mm', {
                    locale: pl,
                  })}
                </p>
                {review.content && (
                  <p className="mt-2 text-sm whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                    {review.content}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            {currentUserId && (
              <div className="flex items-center gap-2 ml-2">
                {canEdit && onEdit && (
                  <button
                    onClick={() => onEdit(review.id)}
                    className="rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    title="Edytuj recenzję"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                {canDelete && onDelete && (
                  <button
                    onClick={() => onDelete(review.id)}
                    className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                    title={
                      isAuthor ? 'Usuń recenzję' : 'Usuń recenzję (moderacja)'
                    }
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                {canHide && onHide && (
                  <button
                    onClick={() => onHide(review.id)}
                    className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30 dark:hover:text-amber-300"
                    title="Ukryj recenzję"
                  >
                    <Shield className="w-4 h-4" />
                  </button>
                )}
                {canReport && onReport && (
                  <button
                    onClick={() => onReport(review.id, review.author.name)}
                    className="rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    title="Zgłoś recenzję"
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
