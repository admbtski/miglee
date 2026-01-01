'use client';

import { format, pl } from '@/lib/date';
import { useState } from 'react';
import { useGetComments } from '@/features/comments';
import { useGetReviews } from '@/features/reviews';
import { useGetEventMessages } from '@/features/chat';
import {
  MessageSquare,
  Star,
  MessageCircle,
  Loader2,
  Trash2,
  Eye,
} from 'lucide-react';
import { buildAvatarUrl } from '@/lib/media/url';
import { Avatar } from '@/components/ui/avatar';

type ContentTabProps = {
  eventId: string;
};

type ContentType = 'comments' | 'reviews' | 'messages';

export function ContentTab({ eventId }: ContentTabProps) {
  const [activeContent, setActiveContent] = useState<ContentType>('comments');

  // Queries
  const { data: commentsData, isLoading: commentsLoading } = useGetComments(
    { eventId, limit: 50 },
    { enabled: activeContent === 'comments' }
  );

  const { data: reviewsData, isLoading: reviewsLoading } = useGetReviews(
    { eventId, limit: 50 },
    { enabled: activeContent === 'reviews' }
  );

  const { data: messagesData, isLoading: messagesLoading } =
    useGetEventMessages(eventId, {
      enabled: activeContent === 'messages',
    });

  const comments = commentsData?.comments?.items ?? [];
  const commentsCount = commentsData?.comments?.pageInfo?.total ?? 0;

  const reviews = reviewsData?.reviews?.items ?? [];
  const reviewsCount = reviewsData?.reviews?.pageInfo?.total ?? 0;

  const messages =
    messagesData?.pages.flatMap((page) => page.eventMessages.edges) ?? [];
  const messagesCount = messages.length;

  const isLoading =
    (activeContent === 'comments' && commentsLoading) ||
    (activeContent === 'reviews' && reviewsLoading) ||
    (activeContent === 'messages' && messagesLoading);

  const renderComments = () => (
    <div className="space-y-4">
      {comments.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Brak komentarzy
          </p>
        </div>
      )}
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {comment.author.avatarKey && (
                <Avatar
                  url={buildAvatarUrl(comment.author.avatarKey, 'md')}
                  blurhash={comment.author.avatarBlurhash}
                  alt={comment.author.name}
                  size={40}
                />
              )}
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {comment.author.name}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  {format(new Date(comment.createdAt), 'dd MMM yyyy, HH:mm', {
                    locale: pl,
                  })}
                </p>
                <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                  {comment.content}
                </p>
                {comment.repliesCount > 0 && (
                  <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                    {comment.repliesCount} odpowiedzi
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-300"
                title="Zobacz komentarz"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                title="Usuń komentarz"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderReviews = () => (
    <div className="space-y-4">
      {reviews.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Brak recenzji
          </p>
        </div>
      )}
      {reviews.map((review) => (
        <div
          key={review.id}
          className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {review.author.avatarKey && (
                <Avatar
                  url={buildAvatarUrl(review.author.avatarKey, 'md')}
                  blurhash={review.author.avatarBlurhash}
                  alt={review.author.name}
                  size={40}
                />
              )}
              <div>
                <div className="flex items-center gap-2">
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
                  <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                    {review.content}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-300"
                title="Zobacz recenzję"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                title="Usuń recenzję"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderMessages = () => (
    <div className="space-y-4">
      {messages.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Brak wiadomości
          </p>
        </div>
      )}
      {messages.map((edge) => {
        const message = edge.node;
        return (
          <div
            key={message.id}
            className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {message.author.avatarKey && (
                  <Avatar
                    url={buildAvatarUrl(message.author.avatarKey, 'md')}
                    blurhash={message.author.avatarBlurhash}
                    alt={message.author.name}
                    size={40}
                  />
                )}
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {message.author.name}
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    {format(new Date(message.createdAt), 'dd MMM yyyy, HH:mm', {
                      locale: pl,
                    })}
                    {message.isEdited && (
                      <span className="ml-1">(edytowano)</span>
                    )}
                  </p>
                  <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                    {message.content}
                  </p>
                  {message.reactions && message.reactions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {message.reactions.map((reaction, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 text-xs dark:bg-zinc-800"
                        >
                          {reaction.emoji} {reaction.count}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button
                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                title="Usuń wiadomość"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <button
          onClick={() => setActiveContent('comments')}
          className={`rounded-lg border p-4 text-left transition-colors ${
            activeContent === 'comments'
              ? 'border-blue-500 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/30'
              : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Komentarze
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {commentsCount}
          </p>
        </button>
        <button
          onClick={() => setActiveContent('reviews')}
          className={`rounded-lg border p-4 text-left transition-colors ${
            activeContent === 'reviews'
              ? 'border-yellow-500 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-950/30'
              : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Recenzje
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {reviewsCount}
          </p>
        </button>
        <button
          onClick={() => setActiveContent('messages')}
          className={`rounded-lg border p-4 text-left transition-colors ${
            activeContent === 'messages'
              ? 'border-green-500 bg-green-50 dark:border-green-700 dark:bg-green-950/30'
              : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Wiadomości
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {messagesCount}
          </p>
        </button>
      </div>

      {/* Content */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
          </div>
        )}

        {!isLoading && (
          <>
            {activeContent === 'comments' && renderComments()}
            {activeContent === 'reviews' && renderReviews()}
            {activeContent === 'messages' && renderMessages()}
          </>
        )}
      </div>
    </div>
  );
}
