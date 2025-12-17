'use client';

import { useState, useEffect } from 'react';
import { Star, X, Loader2 } from 'lucide-react';
import { Modal } from '@/components/feedback/modal';
import { useCreateReview, useUpdateReview } from '@/features/reviews';

type AddReviewModalProps = {
  open: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  existingReview?: {
    id: string;
    rating: number;
    content?: string | null;
  } | null;
};

export function AddReviewModal({
  open,
  onClose,
  eventId,
  eventTitle,
  existingReview,
}: AddReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [content, setContent] = useState('');

  const createMutation = useCreateReview();
  const updateMutation = useUpdateReview();

  const isEditing = !!existingReview;
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Reset form when modal opens/closes or review changes
  useEffect(() => {
    if (open) {
      if (existingReview) {
        setRating(existingReview.rating);
        setContent(existingReview.content || '');
      } else {
        setRating(0);
        setContent('');
      }
    }
  }, [open, existingReview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      return;
    }

    try {
      if (isEditing && existingReview) {
        await updateMutation.mutateAsync({
          id: existingReview.id,
          input: {
            rating,
            content: content.trim() || undefined,
          },
        });
      } else {
        await createMutation.mutateAsync({
          input: {
            eventId,
            rating,
            content: content.trim() || undefined,
          },
        });
      }

      onClose();
    } catch (error) {
      console.error('Failed to submit review:', error);
    }
  };

  const handleClose = () => {
    if (!isPending) {
      onClose();
    }
  };

  const header = (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {isEditing ? 'Edytuj recenzję' : 'Dodaj recenzję'}
        </h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {eventTitle}
        </p>
      </div>
      <button
        onClick={handleClose}
        disabled={isPending}
        className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );

  const content_element = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Rating */}
      <div>
        <label className="mb-3 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Twoja ocena <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`h-10 w-10 transition-colors ${
                  star <= (hoveredRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-zinc-300 dark:text-zinc-600'
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {rating}/5
            </span>
          )}
        </div>
        {rating === 0 && (
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
            Kliknij na gwiazdki, aby wybrać ocenę
          </p>
        )}
      </div>

      {/* Content */}
      <div>
        <label
          htmlFor="review-content"
          className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Twoja opinia (opcjonalnie)
        </label>
        <textarea
          id="review-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Podziel się swoimi wrażeniami z wydarzenia..."
          maxLength={2000}
          rows={5}
          className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <div className="mt-1 flex justify-between text-xs text-zinc-500 dark:text-zinc-500">
          <span>Opcjonalne, ale pomocne dla innych</span>
          <span>{content.length}/2000</span>
        </div>
      </div>
    </form>
  );

  const footer = (
    <div className="flex justify-end gap-3">
      <button
        type="button"
        onClick={handleClose}
        disabled={isPending}
        className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        Anuluj
      </button>
      <button
        type="submit"
        onClick={handleSubmit}
        disabled={isPending || rating === 0}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {isEditing ? 'Zapisywanie...' : 'Wysyłanie...'}
          </>
        ) : (
          <>{isEditing ? 'Zapisz zmiany' : 'Wyślij recenzję'}</>
        )}
      </button>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="md"
      header={header}
      content={content_element}
      footer={footer}
    />
  );
}
