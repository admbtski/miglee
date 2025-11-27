'use client';

import { useRouter } from 'next/navigation';
import { useIntentQuery } from '@/lib/api/intents';
import {
  useIntentFeedbackQuestionsQuery,
  useSubmitReviewAndFeedbackMutation,
  useCanSubmitFeedbackQuery,
} from '@/lib/api/feedback';
import { ReviewAndFeedbackForm } from '@/features/intents/components/review-and-feedback-form';
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState } from 'react';

interface FeedbackPageClientProps {
  intentId: string;
  token?: string;
}

export function FeedbackPageClient({
  intentId,
  token,
}: FeedbackPageClientProps) {
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);

  // Fetch intent
  const {
    data: intentData,
    isLoading: intentLoading,
    error: intentError,
  } = useIntentQuery({ id: intentId });

  // Fetch questions
  const { data: questions = [], isLoading: questionsLoading } =
    useIntentFeedbackQuestionsQuery({ intentId });

  // Check if user can submit
  const { data: canSubmit, isLoading: canSubmitLoading } =
    useCanSubmitFeedbackQuery({ intentId });

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
          intentId,
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
  if (intentLoading || questionsLoading || canSubmitLoading) {
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
  if (intentError || !intentData?.intent) {
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
              <Button asChild variant="outline" className="mt-4">
                <Link href="/">Powrót do strony głównej</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Cannot submit state
  if (canSubmit === false) {
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
              <Button asChild variant="outline" className="mt-4">
                <Link href={`/intent/${intentId}`}>Przejdź do wydarzenia</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const intent = intentData.intent;

  // Success state
  if (isSuccess) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-zinc-50 dark:bg-zinc-900">
        <div className="w-full max-w-md p-8 text-center border border-green-200 shadow-sm rounded-2xl dark:border-green-800 bg-green-50 dark:bg-green-900/20">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full dark:bg-green-900/30">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Dziękujemy za opinię!
          </h2>
          <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
            Twoja opinia pomoże nam ulepszyć przyszłe wydarzenia.
          </p>
          <div className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href={`/intent/${intentId}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Powrót do wydarzenia
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Przeglądaj wydarzenia</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen px-4 py-12 bg-zinc-50 dark:bg-zinc-900">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/intent/${intentId}`}
            className="inline-flex items-center mb-4 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Powrót do wydarzenia
          </Link>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Oceń wydarzenie
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Twoja opinia jest dla nas bardzo ważna
          </p>
        </div>

        {/* Form Card */}
        <div className="p-8 bg-white border shadow-sm rounded-2xl border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
          <ReviewAndFeedbackForm
            intentTitle={intent.title}
            questions={questions}
            onSubmit={handleSubmit}
            isSubmitting={submitMutation.isPending}
          />
        </div>

        {submitMutation.isError && (
          <div className="p-4 mt-4 border border-red-200 rounded-lg dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-red-900 dark:text-red-100">
                  Błąd podczas wysyłania
                </h4>
                <p className="mt-1 text-sm text-red-800 dark:text-red-200">
                  Nie udało się wysłać opinii. Spróbuj ponownie.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
