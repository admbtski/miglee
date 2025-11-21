'use client';

import { useState } from 'react';
import { AlertCircle, Loader2, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JoinQuestionEditor } from '@/features/intents/components/join-question-editor';
import { JoinRequestsList } from './join-requests-list';
import {
  useIntentJoinQuestionsQuery,
  useCreateJoinQuestionMutation,
  useUpdateJoinQuestionMutation,
  useDeleteJoinQuestionMutation,
  useReorderJoinQuestionsMutation,
  useIntentJoinRequestsQuery,
} from '@/lib/api/join-form';
import type { IntentJoinRequestsQuery } from '@/lib/api/__generated__/react-query-update';
import { useIntentMembersQuery } from '@/lib/api/intent-members';
import { useMeQuery } from '@/lib/api/auth';

interface JoinFormPanelProps {
  intentId: string;
}

/**
 * Panel for managing join form questions and viewing pending requests
 * Shown in event management modal
 */
export function JoinFormPanel({ intentId }: JoinFormPanelProps) {
  const [activeView, setActiveView] = useState<'questions' | 'requests'>(
    'questions'
  );

  // Fetch questions
  const {
    data: questions = [],
    isLoading: questionsLoading,
    error: questionsError,
  } = useIntentJoinQuestionsQuery({ intentId });

  // Fetch requests
  const {
    data: requestsData,
    isLoading: requestsLoading,
    error: requestsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useIntentJoinRequestsQuery({ intentId, limit: 20 });

  // Fetch members to check if editing is locked
  const { data: membersData } = useIntentMembersQuery({ intentId });
  const { data: authData } = useMeQuery();
  const currentUserId = authData?.me?.id;

  // Mutations
  const createQuestion = useCreateJoinQuestionMutation();
  const updateQuestion = useUpdateJoinQuestionMutation();
  const deleteQuestion = useDeleteJoinQuestionMutation();
  const reorderQuestions = useReorderJoinQuestionsMutation();

  // Check if editing is locked (at least one PENDING or JOINED member, excluding owner and current user)
  const isLocked =
    membersData?.intentMembers?.some(
      (m) =>
        (m.status === 'PENDING' || m.status === 'JOINED') &&
        m.role !== 'OWNER' &&
        m.userId !== currentUserId
    ) ?? false;

  const lockReason = isLocked
    ? 'Nie możesz edytować pytań, ponieważ co najmniej jedna osoba już złożyła prośbę lub dołączyła.'
    : undefined;

  // Flatten paginated requests
  const allRequests =
    (requestsData as any)?.pages?.flatMap(
      (page: any) =>
        (page as IntentJoinRequestsQuery).intentJoinRequests?.items ?? []
    ) ?? [];

  // Use allRequests.length as the total count
  // In infinite queries, we load all pages, so this is accurate
  const totalRequests = allRequests.length;

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

  if (questionsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (questionsError) {
    return (
      <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-900 dark:text-red-100">
              Błąd ładowania
            </h4>
            <p className="text-sm text-red-800 dark:text-red-200 mt-1">
              Nie udało się załadować pytań. Spróbuj ponownie.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with info */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <FileQuestion className="h-5 w-5 text-zinc-600 dark:text-zinc-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Formularz dołączania
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Skonfiguruj pytania, które użytkownicy muszą wypełnić przed
              wysłaniem prośby o dołączenie (tylko dla trybu REQUEST).
            </p>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={activeView === 'questions' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView('questions')}
          >
            Pytania ({questions.length})
          </Button>
          <Button
            variant={activeView === 'requests' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView('requests')}
          >
            Prośby ({totalRequests})
          </Button>
        </div>
      </div>

      {/* Questions view */}
      {activeView === 'questions' && (
        <div className="space-y-4">
          <JoinQuestionEditor
            intentId={intentId}
            questions={questions}
            onCreateQuestion={handleCreateQuestion}
            onUpdateQuestion={handleUpdateQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onReorderQuestions={handleReorderQuestions}
            isLocked={isLocked}
            lockReason={lockReason}
            maxQuestions={5}
          />

          {questions.length === 0 && !isLocked && (
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-6 text-center">
              <FileQuestion className="h-12 w-12 text-zinc-400 mx-auto mb-3" />
              <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Brak pytań
              </h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Dodaj pytania, aby użytkownicy musieli wypełnić formularz przed
                wysłaniem prośby o dołączenie.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Requests view */}
      {activeView === 'requests' && (
        <JoinRequestsList
          intentId={intentId}
          requests={allRequests}
          isLoading={requestsLoading}
          error={requestsError}
          hasMore={hasNextPage ?? false}
          onLoadMore={fetchNextPage}
          isLoadingMore={isFetchingNextPage}
        />
      )}
    </div>
  );
}
