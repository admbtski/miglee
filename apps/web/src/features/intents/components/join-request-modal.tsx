'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { JoinQuestionForm } from './join-question-form';
import type { IntentJoinQuestion } from '@/lib/api/join-form';

interface JoinRequestModalProps {
  open: boolean;
  onClose: () => void;
  intentId: string;
  questions: IntentJoinQuestion[];
  onSubmit: (
    answers: Array<{ questionId: string; answer: any }>
  ) => Promise<void>;
  eventTitle?: string;
}

/**
 * Modal for users to fill out join form questions when requesting to join an event
 */
export function JoinRequestModal({
  open,
  onClose,
  intentId,
  questions,
  onSubmit,
  eventTitle,
}: JoinRequestModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (
    answers: Array<{ questionId: string; answer: any }>
  ) => {
    setIsSubmitting(true);
    try {
      await onSubmit(answers);
      onClose();
    } catch (error) {
      console.error('Failed to submit join request:', error);
      // Error handling is done in the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Prośba o dołączenie
            </h2>
            {eventTitle && (
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {eventTitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label="Zamknij"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
            Wypełnij poniższy formularz, aby wysłać prośbę o dołączenie do
            wydarzenia. Organizator otrzyma Twoje odpowiedzi i zdecyduje o
            akceptacji.
          </p>

          <JoinQuestionForm
            questions={questions}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitLabel="Wyślij prośbę"
          />
        </div>
      </div>
    </div>
  );
}
