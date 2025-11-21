'use client';

import { useState } from 'react';
import { Star, Plus, Loader2, AlertCircle } from 'lucide-react';
import { useMeQuery } from '@/lib/api/auth';
import {
  useGetReviews,
  useGetReviewStats,
  useGetMyReview,
  useDeleteReview,
} from '@/lib/api/reviews';
import { ReviewCard } from './review-card';
import { ReviewStats } from './review-stats';
import { AddReviewModal } from './add-review-modal';
import { ReportReviewModal } from './report-review-modal';
import { NoticeModal } from '@/components/feedback/notice-modal';
import type { EventDetailsData } from '@/types/event-details';

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

  // Fetch reviews
  const {
    data: reviewsData,
    isLoading: isLoadingReviews,
    refetch: refetchReviews,
  } = useGetReviews({
    intentId: event.id,
    limit: 50,
  });

  // Fetch stats
  const { data: statsData } = useGetReviewStats({
    intentId: event.id,
  });

  // Fetch my review
  const { data: myReviewData } = useGetMyReview(
    {
      intentId: event.id,
    },
    {
      enabled: !!currentUserId,
    }
  );

  const deleteMutation = useDeleteReview();

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

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/70 p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-400" />
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
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Dodaj recenzję
          </button>
        )}

        {/* Edit My Review Button */}
        {myReview && (
          <button
            onClick={handleEditReview}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Edytuj swoją recenzję
          </button>
        )}
      </div>

      {/* Info message for non-participants */}
      {!hasEnded && currentUserId && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
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
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      )}

      {/* Empty State */}
      {!isLoadingReviews && reviews.length === 0 && (
        <div className="py-12 text-center">
          <Star className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-700" />
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
              onEdit={handleEditReview}
              onDelete={handleDeleteClick}
              onReport={handleReportClick}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Review Modal */}
      <AddReviewModal
        open={reviewModalOpen}
        onClose={handleModalClose}
        intentId={event.id}
        intentTitle={event.title}
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
