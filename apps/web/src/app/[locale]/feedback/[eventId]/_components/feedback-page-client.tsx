'use client';

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Features
import { useEventQuery } from '@/features/events/api/events';
import { useGetMyReview } from '@/features/events/api/reviews';
import { ReviewAndFeedbackForm } from '@/features/events/components/review-and-feedback-form';
import {
  useCanSubmitFeedbackQuery,
  useEventFeedbackQuestionsQuery,
  useSubmitReviewAndFeedbackMutation,
} from '@/features/feedback/api/feedback';

// TODO: Add i18n support - all hardcoded Polish strings should use translations

interface FeedbackPageClientProps {
  eventId: string;
  token?: string;
}

export function FeedbackPageClient({ eventId }: FeedbackPageClientProps) {
  const [isSuccess, setIsSuccess] = useState(false);

  // Track page view
  useEffect(() => {
    // Page view tracking could be added here if needed
  }, [eventId]);

  // Fetch event
  const {
    data: eventData,
    isLoading: eventLoading,
    error: eventError,
  } = useEventQuery({ id: eventId });

  // Fetch questions
  const { data: questions = [], isLoading: questionsLoading } =
    useEventFeedbackQuestionsQuery({ eventId });

  // Check if user can submit
  const { data: canSubmit, isLoading: canSubmitLoading } =
    useCanSubmitFeedbackQuery({ eventId });

  // Check if user already has a review (to show appropriate message or prefill form)
  const { data: myReviewData, isLoading: myReviewLoading } = useGetMyReview(
    { eventId },
    { enabled: true } // Always fetch to know if we should show "already reviewed" state
  );
  const existingReview = myReviewData?.myReview;

  // Submit mutation
  const submitMutation = useSubmitReviewAndFeedbackMutation({
    onSuccess: () => {
      setIsSuccess(true);
    },
  });

  const handleSubmit = async (data: {
    rating: number;
    content?: string;
    feedbackAnswers: Array<{ questionId: string; answer: any }>;
  }) => {
    try {
      await submitMutation.mutateAsync({
        input: {
          eventId,
          rating: data.rating,
          content: data.content,
          feedbackAnswers: data.feedbackAnswers,
        },
      });
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  // Loading state
  if (eventLoading || questionsLoading || canSubmitLoading || myReviewLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto text-indigo-600 animate-spin" />
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Ładowanie...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (eventError || !eventData?.event) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-zinc-50 dark:bg-zinc-900">
        <div className="w-full max-w-md p-6 border border-red-200 shadow-sm rounded-2xl dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="flex-shrink-0 w-6 h-6 text-red-600 dark:text-red-400" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 dark:text-red-100">
                Nie znaleziono wydarzenia
              </h3>
              <p className="mt-2 text-sm text-red-800 dark:text-red-200">
                To wydarzenie nie istnieje lub zostało usunięte.
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center mt-4 h-10 px-4 py-2 rounded-xl border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Powrót do strony głównej
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Cannot submit state - show different message based on reason
  if (canSubmit === false) {
    // User already submitted review AND feedback
    if (existingReview) {
      return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-green-50 via-emerald-50/50 to-teal-50/30 dark:from-green-950/20 dark:via-emerald-950/10 dark:to-teal-950/5">
          <div className="w-full max-w-lg p-10 text-center border rounded-3xl border-green-200/80 dark:border-green-800/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-2xl shadow-green-900/10 dark:shadow-green-950/30">
            <div className="relative inline-flex items-center justify-center w-20 h-20 mx-auto mb-6">
              <div className="relative flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 rounded-full">
                <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
            </div>

            <h2 className="mb-3 text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Dziękujemy za opinię!
            </h2>
            <p className="mb-4 text-base text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
              Już wystawiłeś opinię i wypełniłeś ankietę dla tego wydarzenia.
            </p>

            {/* Show existing review summary */}
            <div className="p-4 mb-6 border rounded-xl border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
              <div className="flex items-center justify-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < existingReview.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-zinc-300 dark:text-zinc-600'
                    }`}
                  />
                ))}
              </div>
              {existingReview.content && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3">
                  &quot;{existingReview.content}&quot;
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href={`/event/${eventId}`}
                className="inline-flex items-center justify-center w-full h-12 px-6 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:from-indigo-600 hover:to-fuchsia-600 shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 transition-all"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Powrót do wydarzenia
              </Link>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Jeśli chcesz zmienić swoją opinię, możesz to zrobić na stronie
                wydarzenia.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // User cannot submit for other reasons (not a participant, event not ended)
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-zinc-50 dark:bg-zinc-900">
        <div className="w-full max-w-md p-6 border shadow-sm rounded-2xl border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="flex-shrink-0 w-6 h-6 text-amber-600 dark:text-amber-400" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                Nie możesz wystawić opinii
              </h3>
              <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
                Opinie mogą wystawiać tylko uczestnicy po zakończeniu
                wydarzenia.
              </p>
              <Link
                href={`/event/${eventId}`}
                className="inline-flex items-center justify-center mt-4 h-10 px-4 py-2 rounded-xl border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Przejdź do wydarzenia
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const event = eventData.event;

  // Success state
  if (isSuccess) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-green-50 via-emerald-50/50 to-teal-50/30 dark:from-green-950/20 dark:via-emerald-950/10 dark:to-teal-950/5">
        <div className="w-full max-w-lg p-10 text-center border rounded-3xl border-green-200/80 dark:border-green-800/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-2xl shadow-green-900/10 dark:shadow-green-950/30">
          <div className="relative inline-flex items-center justify-center w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-green-100 dark:bg-green-900/30 rounded-full animate-ping opacity-20"></div>
            <div className="relative flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 rounded-full">
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <h2 className="mb-3 text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Dziękujemy! 🎉
          </h2>
          <p className="mb-8 text-base text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
            Twoja opinia została wysłana. Dzięki niej możemy tworzyć jeszcze
            lepsze wydarzenia!
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href={`/event/${eventId}`}
              className="inline-flex items-center justify-center w-full h-12 px-6 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:from-indigo-600 hover:to-fuchsia-600 shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 transition-all"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Powrót do wydarzenia
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center w-full h-12 px-6 rounded-xl text-base font-medium border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Przeglądaj więcej wydarzeń
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-indigo-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-indigo-950/20 py-8 md:py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <Link
            href={`/event/${eventId}`}
            className="inline-flex items-center text-sm text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5 transition-transform group-hover:-translate-x-1" />
            Powrót do wydarzenia
          </Link>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Twoja opinia ma znaczenie
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Oceń wydarzenie
            </h1>
            <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl">
              Pomóż nam tworzyć jeszcze lepsze wydarzenia w przyszłości
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-6 md:p-10 shadow-xl shadow-zinc-900/5 dark:shadow-zinc-950/50">
          <ReviewAndFeedbackForm
            eventTitle={event.title}
            questions={questions}
            onSubmit={handleSubmit}
            isSubmitting={submitMutation.isPending}
            existingReview={
              existingReview
                ? {
                    rating: existingReview.rating,
                    content: existingReview.content,
                  }
                : undefined
            }
          />
        </div>

        {submitMutation.isError && (
          <div className="mt-6 rounded-2xl border border-red-200 dark:border-red-800 bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm p-5 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                  Wystąpił błąd
                </h4>
                <p className="text-sm text-red-800 dark:text-red-200">
                  Nie udało się wysłać opinii. Sprawdź połączenie i spróbuj
                  ponownie.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Trust badges */}
        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span>Bezpieczne połączenie</span>
          </div>
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span>Twoje dane są chronione</span>
          </div>
        </div>
      </div>
    </div>
  );
}
