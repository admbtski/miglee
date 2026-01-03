'use client';

import { format, pl } from '@/lib/date';
import { useState } from 'react';
import {
  MessageSquare,
  Star,
  Trash2,
  ExternalLink,
  Loader2,
  Calendar,
  Users,
  UserMinus,
  Ban,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  useAdminUserCommentsQuery,
  useAdminUserReviewsQuery,
  useAdminUserMembershipsQuery,
  useAdminUserEventsQuery,
  useAdminDeleteComment,
  useAdminDeleteReview,
  useAdminKickMemberMutation,
  useAdminBanMemberMutation,
  useAdminUnbanMemberMutation,
} from '@/features/admin';
import {
  useApproveMembershipMutation,
  useRejectMembershipMutation,
} from '@/features/members';
import Link from 'next/link';
import { useLocalePath } from '@/hooks/use-locale-path';

type ActivityTabProps = {
  userId: string;
};

export function ActivityTab({ userId }: ActivityTabProps) {
  const { localePath } = useLocalePath();
  const [activeSection, setActiveSection] = useState<'content' | 'events'>(
    'content'
  );
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [membershipsOpen, setMembershipsOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);

  // Content queries
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

  // Events queries
  const { data: membershipsData, isLoading: membershipsLoading } =
    useAdminUserMembershipsQuery({
      userId,
      limit: 50,
      offset: 0,
    });

  const { data: eventsData, isLoading: eventsLoading } =
    useAdminUserEventsQuery({
      userId,
      limit: 50,
      offset: 0,
    });

  // Mutations
  const deleteCommentMutation = useAdminDeleteComment();
  const deleteReviewMutation = useAdminDeleteReview();
  const kickMemberMutation = useAdminKickMemberMutation();
  const banMemberMutation = useAdminBanMemberMutation();
  const unbanMemberMutation = useAdminUnbanMemberMutation();
  const approveMembershipMutation = useApproveMembershipMutation();
  const rejectMembershipMutation = useRejectMembershipMutation();

  const comments = commentsData?.adminUserComments?.items ?? [];
  const reviews = reviewsData?.adminUserReviews?.items ?? [];
  const memberships = membershipsData?.adminUserMemberships?.items ?? [];
  const events = eventsData?.adminUserEvents?.items ?? [];

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten komentarz?')) return;
    try {
      await deleteCommentMutation.mutateAsync(commentId);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę recenzję?')) return;
    try {
      await deleteReviewMutation.mutateAsync(reviewId);
    } catch (error) {
      console.error('Failed to delete review:', error);
    }
  };

  const handleKickMember = async (eventId: string) => {
    if (!confirm('Czy na pewno chcesz wyrzucić tego użytkownika z wydarzenia?'))
      return;
    try {
      await kickMemberMutation.mutateAsync({
        input: { eventId, userId, note: 'Wyrzucony przez administratora' },
      });
    } catch (error) {
      console.error('Failed to kick member:', error);
    }
  };

  const handleBanMember = async (eventId: string) => {
    if (
      !confirm(
        'Czy na pewno chcesz zbanować tego użytkownika na tym wydarzeniu?'
      )
    )
      return;
    try {
      await banMemberMutation.mutateAsync({
        input: { eventId, userId, note: 'Zbanowany przez administratora' },
      });
    } catch (error) {
      console.error('Failed to ban member:', error);
    }
  };

  const handleUnbanMember = async (eventId: string) => {
    if (!confirm('Czy na pewno chcesz odbanować tego użytkownika?')) return;
    try {
      await unbanMemberMutation.mutateAsync({ input: { eventId, userId } });
    } catch (error) {
      console.error('Failed to unban member:', error);
    }
  };

  const handleApproveMembership = async (eventId: string) => {
    if (!confirm('Czy na pewno chcesz zatwierdzić to członkostwo?')) return;
    try {
      await approveMembershipMutation.mutateAsync({
        input: { eventId, userId },
      });
    } catch (error) {
      console.error('Failed to approve membership:', error);
    }
  };

  const handleRejectMembership = async (eventId: string) => {
    if (!confirm('Czy na pewno chcesz odrzucić to członkostwo?')) return;
    try {
      await rejectMembershipMutation.mutateAsync({
        input: { eventId, userId, note: 'Odrzucone przez administratora' },
      });
    } catch (error) {
      console.error('Failed to reject membership:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveSection('content')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeSection === 'content'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
              : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
          }`}
        >
          Treści ({comments.length + reviews.length})
        </button>
        <button
          onClick={() => setActiveSection('events')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeSection === 'events'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
              : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
          }`}
        >
          Wydarzenia ({memberships.length + events.length})
        </button>
      </div>

      {/* Content Section */}
      {activeSection === 'content' && (
        <div className="space-y-4">
          {/* Comments */}
          <div className="space-y-3">
            <h5 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Komentarze użytkownika
            </h5>
            <button
              onClick={() => setCommentsOpen(true)}
              disabled={commentsLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
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
            <h5 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Recenzje użytkownika
            </h5>
            <button
              onClick={() => setReviewsOpen(true)}
              disabled={reviewsLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {reviewsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Star className="h-4 w-4" />
              )}
              Pokaż recenzje ({reviews.length})
            </button>
          </div>
        </div>
      )}

      {/* Events Section */}
      {activeSection === 'events' && (
        <div className="space-y-4">
          {/* Memberships */}
          <div className="space-y-3">
            <h5 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Członkostwa w wydarzeniach
            </h5>
            <button
              onClick={() => setMembershipsOpen(true)}
              disabled={membershipsLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {membershipsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Users className="h-4 w-4" />
              )}
              Pokaż członkostwa ({memberships.length})
            </button>
          </div>

          {/* Created Events */}
          <div className="space-y-3">
            <h5 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Utworzone wydarzenia
            </h5>
            <button
              onClick={() => setEventsOpen(true)}
              disabled={eventsLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {eventsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4" />
              )}
              Pokaż wydarzenia ({events.length})
            </button>
          </div>
        </div>
      )}

      {/* Comments List */}
      {commentsOpen && (
        <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <h6 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Komentarze ({comments.length})
            </h6>
            <button
              onClick={() => setCommentsOpen(false)}
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Zwiń
            </button>
          </div>

          {commentsLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          )}

          {!commentsLoading && comments.length === 0 && (
            <p className="py-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
              Brak komentarzy
            </p>
          )}

          {!commentsLoading && comments.length > 0 && (
            <div className="space-y-3">
              {comments.map((comment: any) => (
                <div
                  key={comment.id}
                  className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-950"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <Link
                      href={localePath(`/e/${comment.event.id}`)}
                      target="_blank"
                      className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {comment.event.title}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      title="Usuń komentarz"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">
                    {comment.content}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    {format(new Date(comment.createdAt), 'dd MMM yyyy, HH:mm', {
                      locale: pl,
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reviews List */}
      {reviewsOpen && (
        <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <h6 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Recenzje ({reviews.length})
            </h6>
            <button
              onClick={() => setReviewsOpen(false)}
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Zwiń
            </button>
          </div>

          {reviewsLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          )}

          {!reviewsLoading && reviews.length === 0 && (
            <p className="py-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
              Brak recenzji
            </p>
          )}

          {!reviewsLoading && reviews.length > 0 && (
            <div className="space-y-3">
              {reviews.map((review: any) => (
                <div
                  key={review.id}
                  className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-950"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Link
                        href={localePath(`/e/${review.event.id}`)}
                        target="_blank"
                        className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {review.event.title}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < review.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-zinc-300 dark:text-zinc-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteReview(review.id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      title="Usuń recenzję"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {review.content && (
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">
                      {review.content}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    {format(new Date(review.createdAt), 'dd MMM yyyy, HH:mm', {
                      locale: pl,
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Memberships List */}
      {membershipsOpen && (
        <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <h6 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Członkostwa ({memberships.length})
            </h6>
            <button
              onClick={() => setMembershipsOpen(false)}
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Zwiń
            </button>
          </div>

          {membershipsLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          )}

          {!membershipsLoading && memberships.length === 0 && (
            <p className="py-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
              Brak członkostw
            </p>
          )}

          {!membershipsLoading && memberships.length > 0 && (
            <div className="space-y-3">
              {memberships.map((membership: any) => (
                <div
                  key={membership.id}
                  className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-950"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex-1">
                      <Link
                        href={localePath(`/e/${membership.event.id}`)}
                        target="_blank"
                        className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {membership.event.title}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                            membership.status === 'JOINED'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : membership.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                                : membership.status === 'BANNED'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                  : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800/30 dark:text-zinc-300'
                          }`}
                        >
                          {membership.status}
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {membership.role}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {membership.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() =>
                              handleApproveMembership(membership.event.id)
                            }
                            className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                            title="Zatwierdź"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleRejectMembership(membership.event.id)
                            }
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            title="Odrzuć"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {membership.status === 'JOINED' && (
                        <>
                          <button
                            onClick={() => handleKickMember(membership.event.id)}
                            className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                            title="Wyrzuć"
                          >
                            <UserMinus className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleBanMember(membership.event.id)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            title="Zbanuj"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {membership.status === 'BANNED' && (
                        <button
                          onClick={() => handleUnbanMember(membership.event.id)}
                          className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                          title="Odbanuj"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  {membership.joinedAt && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Dołączono:{' '}
                      {format(
                        new Date(membership.joinedAt),
                        'dd MMM yyyy, HH:mm',
                        {
                          locale: pl,
                        }
                      )}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Created Events List */}
      {eventsOpen && (
        <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <h6 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Utworzone wydarzenia ({events.length})
            </h6>
            <button
              onClick={() => setEventsOpen(false)}
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Zwiń
            </button>
          </div>

          {eventsLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          )}

          {!eventsLoading && events.length === 0 && (
            <p className="py-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
              Brak utworzonych wydarzeń
            </p>
          )}

          {!eventsLoading && events.length > 0 && (
            <div className="space-y-3">
              {events.map((event: any) => (
                <div
                  key={event.id}
                  className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-950"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link
                        href={localePath(`/e/${event.id}`)}
                        target="_blank"
                        className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {event.title}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                            event.status === 'CANCELED'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              : event.status === 'DELETED'
                                ? 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800/30 dark:text-zinc-300'
                                : event.status === 'PAST'
                                  ? 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800/30 dark:text-zinc-300'
                                  : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          }`}
                        >
                          {event.status}
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {event.joinedCount} uczestników
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    {format(new Date(event.startAt), 'dd MMM yyyy, HH:mm', {
                      locale: pl,
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
