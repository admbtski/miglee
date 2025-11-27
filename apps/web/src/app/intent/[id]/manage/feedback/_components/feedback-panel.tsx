'use client';

import { useState } from 'react';
import {
  AlertCircle,
  Loader2,
  FileQuestion,
  BarChart3,
  Lock,
  Send,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeedbackQuestionEditor } from '@/features/intents/components/feedback-question-editor';
import { cn } from '@/lib/utils';
import {
  useIntentFeedbackQuestionsQuery,
  useCreateFeedbackQuestionMutation,
  useUpdateFeedbackQuestionMutation,
  useDeleteFeedbackQuestionMutation,
  useReorderFeedbackQuestionsMutation,
  useIntentFeedbackResultsQuery,
  useSendFeedbackRequestsMutation,
} from '@/lib/api/feedback';
import { useIntentQuery } from '@/lib/api/intents';
import { useMeQuery } from '@/lib/api/auth';

interface FeedbackPanelProps {
  intentId: string;
}

/**
 * Panel for managing feedback questions and viewing results
 * Shown in event management panel (owner/mod only)
 */
export function FeedbackPanel({ intentId }: FeedbackPanelProps) {
  const [activeView, setActiveView] = useState<'questions' | 'results'>(
    'questions'
  );

  // Fetch intent to check plan
  const { data: intentData, isLoading: intentLoading } = useIntentQuery({
    id: intentId,
  });

  // Fetch questions
  const {
    data: questions = [],
    isLoading: questionsLoading,
    error: questionsError,
  } = useIntentFeedbackQuestionsQuery({ intentId });

  // Fetch results
  const {
    data: results,
    isLoading: resultsLoading,
    error: resultsError,
  } = useIntentFeedbackResultsQuery(
    { intentId },
    { enabled: activeView === 'results' }
  );

  const { data: authData } = useMeQuery();

  // Mutations
  const createQuestion = useCreateFeedbackQuestionMutation();
  const updateQuestion = useUpdateFeedbackQuestionMutation();
  const deleteQuestion = useDeleteFeedbackQuestionMutation();
  const reorderQuestions = useReorderFeedbackQuestionsMutation();
  const sendFeedbackRequests = useSendFeedbackRequestsMutation();

  const [sendRequestsState, setSendRequestsState] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  // Check if plan allows feedback
  const sponsorshipPlan = intentData?.intent?.sponsorshipPlan;
  const hasPlanAccess = sponsorshipPlan === 'PLUS' || sponsorshipPlan === 'PRO';

  const handleCreateQuestion = async (questionData: any) => {
    try {
      await createQuestion.mutateAsync({
        input: {
          intentId,
          ...questionData,
        },
      });
    } catch (error) {
      console.error('Failed to create question:', error);
    }
  };

  const handleUpdateQuestion = async (id: string, updates: any) => {
    try {
      await updateQuestion.mutateAsync({
        id,
        input: updates,
      });
    } catch (error) {
      console.error('Failed to update question:', error);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    try {
      await deleteQuestion.mutateAsync({ id });
    } catch (error) {
      console.error('Failed to delete question:', error);
    }
  };

  const handleReorderQuestions = async (questionIds: string[]) => {
    try {
      await reorderQuestions.mutateAsync({
        intentId,
        questionIds,
      });
    } catch (error) {
      console.error('Failed to reorder questions:', error);
    }
  };

  const handleSendFeedbackRequests = async () => {
    setSendRequestsState(null);
    try {
      const result = await sendFeedbackRequests.mutateAsync({
        intentId,
      });

      if (result.sendFeedbackRequests.success) {
        setSendRequestsState({
          success: true,
          message:
            result.sendFeedbackRequests.message ||
            `Wysłano prośby o feedback do ${result.sendFeedbackRequests.sentCount} uczestników`,
        });
      } else {
        setSendRequestsState({
          success: false,
          message:
            result.sendFeedbackRequests.message ||
            'Nie udało się wysłać próśb o feedback',
        });
      }
    } catch (error: any) {
      setSendRequestsState({
        success: false,
        message:
          error.message || 'Wystąpił błąd podczas wysyłania próśb o feedback',
      });
    }
  };

  if (intentLoading || questionsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  // Show plan upgrade message if not PLUS/PRO
  if (!hasPlanAccess) {
    return (
      <div className="p-6 border shadow-sm rounded-2xl border-indigo-200/80 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-full dark:bg-indigo-900/30">
            <Lock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">
              Rozszerzony feedback dostępny w planach Plus i Pro
            </h4>
            <p className="mt-2 text-sm text-indigo-800 dark:text-indigo-200">
              Zbieraj szczegółowe opinie od uczestników za pomocą
              niestandardowych ankiet. Uczestnicy mogą wystawić ocenę i
              odpowiedzieć na Twoje pytania po zakończeniu wydarzenia.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                Ulepsz plan
              </Button>
              <Button size="sm" variant="ghost">
                Dowiedz się więcej
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (questionsError) {
    return (
      <div className="p-4 border border-red-200 rounded-lg dark:border-red-800 bg-red-50 dark:bg-red-900/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-900 dark:text-red-100">
              Błąd ładowania
            </h4>
            <p className="mt-1 text-sm text-red-800 dark:text-red-200">
              Nie udało się załadować pytań feedbackowych. Spróbuj ponownie.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with info */}
      <div className="space-y-4">
        <div className="flex items-baseline gap-2.5">
          <FileQuestion className="flex-shrink-0 w-5 h-5 text-zinc-500 dark:text-zinc-400" />
          <div className="flex-1">
            <h3 className="text-[22px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Feedback po wydarzeniu
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-[70ch]">
              Skonfiguruj ankietę, którą uczestnicy wypełnią po zakończeniu
              wydarzenia. Zbierz szczegółowe opinie i oceń satysfakcję.
            </p>
          </div>
        </div>

        {/* View toggle - Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 w-fit">
          <button
            onClick={() => setActiveView('questions')}
            className={cn(
              'h-9 px-4 rounded-md text-sm font-medium transition-all',
              activeView === 'questions'
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100'
                : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800'
            )}
          >
            <FileQuestion className="inline-block w-4 h-4 mr-1.5 -mt-0.5" />
            Pytania ({questions.length})
          </button>
          <button
            onClick={() => setActiveView('results')}
            className={cn(
              'h-9 px-4 rounded-md text-sm font-medium transition-all',
              activeView === 'results'
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100'
                : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800'
            )}
          >
            <BarChart3 className="inline-block w-4 h-4 mr-1.5 -mt-0.5" />
            Wyniki
            {results && results.totalRespondents > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-semibold leading-none rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                {results.totalRespondents}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Questions view */}
      {activeView === 'questions' && (
        <div className="space-y-6">
          {/* Manual send button */}
          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-gradient-to-br from-white to-zinc-50/50 dark:from-zinc-900/50 dark:to-zinc-900/30 p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  Wyślij prośby o feedback
                </h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-[60ch]">
                  Wyślij emaile z prośbą o ocenę wydarzenia do wszystkich
                  uczestników ze statusem "Dołączony". Można wysłać w dowolnym
                  momencie po zakończeniu wydarzenia.
                </p>
              </div>
              <Button
                onClick={handleSendFeedbackRequests}
                disabled={
                  sendFeedbackRequests.isPending ||
                  !intentData?.intent?.endAt ||
                  new Date(intentData.intent.endAt) > new Date()
                }
                size="lg"
                className="flex-shrink-0"
              >
                {sendFeedbackRequests.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Wysyłanie...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Wyślij prośby
                  </>
                )}
              </Button>
            </div>

            {/* Send result message */}
            {sendRequestsState && (
              <div
                className={cn(
                  'mt-4 p-4 rounded-lg border',
                  sendRequestsState.success
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                )}
              >
                <div className="flex items-start gap-3">
                  {sendRequestsState.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <p
                    className={cn(
                      'text-sm',
                      sendRequestsState.success
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-red-800 dark:text-red-200'
                    )}
                  >
                    {sendRequestsState.message}
                  </p>
                </div>
              </div>
            )}

            {/* Warning if event not ended */}
            {intentData?.intent?.endAt &&
              new Date(intentData.intent.endAt) > new Date() && (
                <div className="mt-4 p-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Prośby o feedback można wysłać dopiero po zakończeniu
                      wydarzenia.
                    </p>
                  </div>
                </div>
              )}
          </div>

          <FeedbackQuestionEditor
            intentId={intentId}
            questions={questions}
            onCreateQuestion={handleCreateQuestion}
            onUpdateQuestion={handleUpdateQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onReorderQuestions={handleReorderQuestions}
            isLocked={false}
            maxQuestions={10}
          />

          {questions.length === 0 && (
            <div className="rounded-2xl border-[0.5px] border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 p-8 text-center shadow-sm">
              <FileQuestion className="w-10 h-10 mx-auto mb-4 text-zinc-400" />
              <h4 className="mb-2 font-medium text-zinc-700 dark:text-zinc-300">
                Brak pytań feedbackowych
              </h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5 max-w-[50ch] mx-auto">
                Dodaj pytania, aby zbierać szczegółowe opinie od uczestników po
                zakończeniu wydarzenia.
              </p>
              <Button
                onClick={() => {
                  const addButton = document.querySelector(
                    '[data-add-question-trigger]'
                  ) as HTMLButtonElement;
                  if (addButton) addButton.click();
                }}
                variant="outline"
                size="sm"
                className="mx-auto"
              >
                <FileQuestion className="w-4 h-4 mr-2" />
                Dodaj pierwsze pytanie
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Results view */}
      {activeView === 'results' && (
        <div className="space-y-4">
          {resultsLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            </div>
          )}

          {resultsError && (
            <div className="p-4 border border-red-200 rounded-lg dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-900 dark:text-red-100">
                    Błąd ładowania wyników
                  </h4>
                  <p className="mt-1 text-sm text-red-800 dark:text-red-200">
                    Nie udało się załadować wyników feedbacku.
                  </p>
                </div>
              </div>
            </div>
          )}

          {results && (
            <>
              {/* Summary */}
              <div className="rounded-2xl border-[0.5px] border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      Podsumowanie
                    </h4>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {results.totalRespondents} osób wypełniło ankietę
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                      {results.totalRespondents}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      odpowiedzi
                    </div>
                  </div>
                </div>
              </div>

              {/* Questions results */}
              {results.questionStats.length === 0 ? (
                <div className="rounded-2xl border-[0.5px] border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 p-8 text-center shadow-sm">
                  <BarChart3 className="w-10 h-10 mx-auto mb-4 text-zinc-400" />
                  <h4 className="mb-2 font-medium text-zinc-700 dark:text-zinc-300">
                    Brak wyników
                  </h4>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Nie ma jeszcze żadnych odpowiedzi na pytania feedbackowe.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {results.questionStats.map((stat, index) => (
                    <div
                      key={stat.question.id}
                      className="rounded-2xl border-[0.5px] border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm"
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <span className="text-sm font-medium text-zinc-500">
                          {index + 1}.
                        </span>
                        <div className="flex-1">
                          <h5 className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                            {stat.question.label}
                          </h5>
                          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            {stat.totalAnswers} odpowiedzi
                          </p>
                        </div>
                      </div>

                      {/* Choice distribution */}
                      {stat.choiceDistribution && (
                        <div className="mt-4 space-y-3">
                          {stat.choiceDistribution.map((choice) => (
                            <div key={choice.option} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-700 dark:text-zinc-300">
                                  {choice.option}
                                </span>
                                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                  {choice.count} ({choice.percentage.toFixed(1)}
                                  %)
                                </span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                                <div
                                  className="h-full transition-all bg-indigo-500 rounded-full dark:bg-indigo-400"
                                  style={{ width: `${choice.percentage}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Text answers */}
                      {stat.textAnswers && (
                        <div className="mt-4 space-y-3">
                          {stat.textAnswers.map((textAnswer, i) => (
                            <div
                              key={i}
                              className="p-4 border rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
                            >
                              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                                {textAnswer.answer}
                              </p>
                              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                                — {textAnswer.userName}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
