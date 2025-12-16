'use client';

import { useState } from 'react';
import { Star, Plus, Loader2, AlertCircle } from 'lucide-react';
import { useMeQuery } from '@/features/auth/hooks/auth';
import {
  useGetReviews,
  useGetReviewStats,
  useGetMyReview,
  useDeleteReview,
  useHideReview,
} from '@/features/reviews/api/reviews';
import { ReviewCard } from './review-card';
import { ReviewStats } from './review-stats';
import { AddReviewModal } from './add-review-modal';
import { ReportReviewModal } from '../../reports/components/report-review-modal';
import { NoticeModal } from '@/components/feedback/notice-modal';
import type { EventDetailsData } from '@/features/events/types/event-details';

type EventReviewsProps = {
  event: EventDetailsData;
};

export function EventReviews({ event }: EventReviewsProps) {
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reviewToReport, setReviewToReport] = useState<{
    id: string;
    authorName: string;
  } | null>(null);

  const { data: authData } = useMeQuery();
  const currentUserId = authData?.me?.id;
  const userRole = authData?.me?.role;

  // Check permissions hierarchy for reviews
  // Note: Unlike comments, Event Owner/Moderators CANNOT moderate reviews
  // This protects review integrity and prevents organizers from "polishing" ratings
  const isAppAdmin = userRole === 'ADMIN';
  const isAppModerator = userRole === 'MODERATOR';

  // Fetch reviews
  const {
    data: reviewsData,
    isLoading: isLoadingReviews,
    refetch: refetchReviews,
  } = useGetReviews({
    eventId: event.id,
    limit: 50,
  });

  // Fetch stats
  const { data: statsData } = useGetReviewStats({
    eventId: event.id,
  });

  // Fetch my review
  const { data: myReviewData } = useGetMyReview(
    {
      eventId: event.id,
    },
    {
      enabled: !!currentUserId,
    }
  );

  const deleteMutation = useDeleteReview();
  const hideMutation = useHideReview();

  const reviews = reviewsData?.reviews?.items ?? [];
  const stats = statsData?.reviewStats;
  const myReview = myReviewData?.myReview;

  // Check if user can review
  const canReview = () => {
    if (!currentUserId) return false;
    if (myReview) return false; // Already reviewed

    // Check if event has ended
    const now = new Date();
    const endDate = event.endISO
      ? new Date(event.endISO)
      : new Date(event.startISO);
    if (endDate > now) return false;

    // Check if user is a participant
    const isParticipant = event.members?.some(
      (member) => member.user.id === currentUserId && member.status === 'JOINED'
    );

    return isParticipant;
  };

  const handleDeleteReview = async () => {
    if (!reviewToDelete) return;

    try {
      await deleteMutation.mutateAsync({ id: reviewToDelete });
      setDeleteModalOpen(false);
      setReviewToDelete(null);
      refetchReviews();
    } catch (error) {
      console.error('Failed to delete review:', error);
    }
  };

  const handleHideReview = async (reviewId: string) => {
    if (
      !confirm(
        'Czy na pewno chcesz ukryć tę recenzję? Będzie ona widoczna tylko dla moderatorów.'
      )
    )
      return;

    try {
      await hideMutation.mutateAsync({ id: reviewId });
      refetchReviews();
    } catch (error) {
      console.error('Failed to hide review:', error);
    }
  };

  const handleEditReview = () => {
    setReviewModalOpen(true);
  };

  const handleDeleteClick = (reviewId: string) => {
    setReviewToDelete(reviewId);
    setDeleteModalOpen(true);
  };

  const handleReportClick = (reviewId: string, authorName: string) => {
    setReviewToReport({ id: reviewId, authorName });
    setReportModalOpen(true);
  };

  const handleModalClose = () => {
    setReviewModalOpen(false);
    refetchReviews();
  };

  // Check if event has ended
  const now = new Date();
  const endDate = event.endISO
    ? new Date(event.endISO)
    : new Date(event.startISO);
  const hasEnded = endDate <= now;

  // Check if boost is active
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/70 p-6 dark:border-zinc-800 dark:bg-zinc-900/40 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Recenzje
          </h2>
          {stats && stats.totalCount > 0 && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {stats.totalCount}
            </span>
          )}
        </div>

        {/* Add Review Button */}
        {currentUserId && canReview() && (
          <button
            onClick={() => setReviewModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Dodaj recenzję
          </button>
        )}

        {/* Edit My Review Button */}
        {myReview && (
          <button
            onClick={handleEditReview}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Edytuj swoją recenzję
          </button>
        )}
      </div>

      {/* Info message for non-participants */}
      {!hasEnded && currentUserId && (
        <div className="p-4 mb-6 border border-blue-200 rounded-lg bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-medium">
                Recenzje będą dostępne po zakończeniu wydarzenia
              </p>
              <p className="mt-1 text-blue-700 dark:text-blue-300">
                Tylko uczestnicy mogą dodawać recenzje po zakończeniu
                wydarzenia.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && stats.totalCount > 0 && (
        <div className="mb-6">
          <ReviewStats stats={stats} />
        </div>
      )}

      {/* Loading */}
      {isLoadingReviews && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
        </div>
      )}

      {/* Empty State */}
      {!isLoadingReviews && reviews.length === 0 && (
        <div className="py-12 text-center">
          <Star className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700" />
          <p className="mt-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Brak recenzji
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {hasEnded
              ? 'Bądź pierwszy, który doda recenzję tego wydarzenia!'
              : 'Recenzje będą dostępne po zakończeniu wydarzenia.'}
          </p>
        </div>
      )}

      {/* Reviews List */}
      {!isLoadingReviews && reviews.length > 0 && (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUserId={currentUserId}
              isAppAdmin={isAppAdmin}
              isAppModerator={isAppModerator}
              onEdit={handleEditReview}
              onDelete={handleDeleteClick}
              onHide={handleHideReview}
              onReport={handleReportClick}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Review Modal */}
      <AddReviewModal
        open={reviewModalOpen}
        onClose={handleModalClose}
        eventId={event.id}
        eventTitle={event.title}
        existingReview={myReview}
      />

      {/* Delete Confirmation Modal */}
      <NoticeModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        variant="error"
        size="sm"
        title="Usuń recenzję"
        subtitle="Czy na pewno chcesz usunąć swoją recenzję? Ta akcja jest nieodwracalna."
        primaryLabel={deleteMutation.isPending ? 'Usuwanie...' : 'Usuń'}
        secondaryLabel="Anuluj"
        onPrimary={handleDeleteReview}
        onSecondary={() => setDeleteModalOpen(false)}
      >
        <></>
      </NoticeModal>

      {/* Report Review Modal */}
      {reviewToReport && (
        <ReportReviewModal
          open={reportModalOpen}
          onClose={() => {
            setReportModalOpen(false);
            setReviewToReport(null);
          }}
          reviewId={reviewToReport.id}
          reviewAuthor={reviewToReport.authorName}
        />
      )}
    </div>
  );
}
