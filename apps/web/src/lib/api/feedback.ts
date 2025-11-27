/**
 * React Query hooks for Feedback (Questions & Answers)
 */

import {
  IntentFeedbackQuestionsDocument,
  IntentFeedbackQuestionsQuery,
  IntentFeedbackQuestionsQueryVariables,
  IntentFeedbackResultsDocument,
  IntentFeedbackResultsQuery,
  IntentFeedbackResultsQueryVariables,
  MyFeedbackAnswersDocument,
  MyFeedbackAnswersQuery,
  MyFeedbackAnswersQueryVariables,
  CanSubmitFeedbackDocument,
  CanSubmitFeedbackQuery,
  CanSubmitFeedbackQueryVariables,
  CreateFeedbackQuestionDocument,
  CreateFeedbackQuestionMutation,
  CreateFeedbackQuestionMutationVariables,
  UpdateFeedbackQuestionDocument,
  UpdateFeedbackQuestionMutation,
  UpdateFeedbackQuestionMutationVariables,
  DeleteFeedbackQuestionDocument,
  DeleteFeedbackQuestionMutation,
  DeleteFeedbackQuestionMutationVariables,
  ReorderFeedbackQuestionsDocument,
  ReorderFeedbackQuestionsMutation,
  ReorderFeedbackQuestionsMutationVariables,
  SubmitReviewAndFeedbackDocument,
  SubmitReviewAndFeedbackMutation,
  SubmitReviewAndFeedbackMutationVariables,
  SendFeedbackRequestsDocument,
  SendFeedbackRequestsMutation,
  SendFeedbackRequestsMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from '@tanstack/react-query';

/* --------------------------------- KEYS ---------------------------------- */
export const GET_FEEDBACK_QUESTIONS_KEY = (
  variables: IntentFeedbackQuestionsQueryVariables
) => ['GetIntentFeedbackQuestions', variables] as const;

export const GET_FEEDBACK_RESULTS_KEY = (
  variables: IntentFeedbackResultsQueryVariables
) => ['GetIntentFeedbackResults', variables] as const;

export const GET_MY_FEEDBACK_ANSWERS_KEY = (
  variables: MyFeedbackAnswersQueryVariables
) => ['GetMyFeedbackAnswers', variables] as const;

export const GET_CAN_SUBMIT_FEEDBACK_KEY = (
  variables: CanSubmitFeedbackQueryVariables
) => ['GetCanSubmitFeedback', variables] as const;

/* ----------------------------- QUERY BUILDERS ---------------------------- */

// Feedback Questions Query
export function buildGetIntentFeedbackQuestionsOptions(
  variables: IntentFeedbackQuestionsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      IntentFeedbackQuestionsQuery,
      Error,
      IntentFeedbackQuestionsQuery['intentFeedbackQuestions'],
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  IntentFeedbackQuestionsQuery,
  Error,
  IntentFeedbackQuestionsQuery['intentFeedbackQuestions'],
  QueryKey
> {
  return {
    queryKey: GET_FEEDBACK_QUESTIONS_KEY(variables) as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<
        IntentFeedbackQuestionsQuery,
        IntentFeedbackQuestionsQueryVariables
      >(IntentFeedbackQuestionsDocument, variables),
    select: (data) => data.intentFeedbackQuestions,
    ...(options ?? {}),
  };
}

// Feedback Results Query
export function buildGetIntentFeedbackResultsOptions(
  variables: IntentFeedbackResultsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      IntentFeedbackResultsQuery,
      Error,
      IntentFeedbackResultsQuery['intentFeedbackResults'],
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  IntentFeedbackResultsQuery,
  Error,
  IntentFeedbackResultsQuery['intentFeedbackResults'],
  QueryKey
> {
  return {
    queryKey: GET_FEEDBACK_RESULTS_KEY(variables) as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<
        IntentFeedbackResultsQuery,
        IntentFeedbackResultsQueryVariables
      >(IntentFeedbackResultsDocument, variables),
    select: (data) => data.intentFeedbackResults,
    ...(options ?? {}),
  };
}

// My Feedback Answers Query
export function buildGetMyFeedbackAnswersOptions(
  variables: MyFeedbackAnswersQueryVariables,
  options?: Omit<
    UseQueryOptions<
      MyFeedbackAnswersQuery,
      Error,
      MyFeedbackAnswersQuery['myFeedbackAnswers'],
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  MyFeedbackAnswersQuery,
  Error,
  MyFeedbackAnswersQuery['myFeedbackAnswers'],
  QueryKey
> {
  return {
    queryKey: GET_MY_FEEDBACK_ANSWERS_KEY(variables) as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<
        MyFeedbackAnswersQuery,
        MyFeedbackAnswersQueryVariables
      >(MyFeedbackAnswersDocument, variables),
    select: (data) => data.myFeedbackAnswers,
    ...(options ?? {}),
  };
}

// Can Submit Feedback Query
export function buildGetCanSubmitFeedbackOptions(
  variables: CanSubmitFeedbackQueryVariables,
  options?: Omit<
    UseQueryOptions<
      CanSubmitFeedbackQuery,
      Error,
      CanSubmitFeedbackQuery['canSubmitFeedback'],
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  CanSubmitFeedbackQuery,
  Error,
  CanSubmitFeedbackQuery['canSubmitFeedback'],
  QueryKey
> {
  return {
    queryKey: GET_CAN_SUBMIT_FEEDBACK_KEY(variables) as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<
        CanSubmitFeedbackQuery,
        CanSubmitFeedbackQueryVariables
      >(CanSubmitFeedbackDocument, variables),
    select: (data) => data.canSubmitFeedback,
    ...(options ?? {}),
  };
}

/* --------------------------------- HOOKS --------------------------------- */

// Queries
export function useIntentFeedbackQuestionsQuery(
  variables: IntentFeedbackQuestionsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      IntentFeedbackQuestionsQuery,
      Error,
      IntentFeedbackQuestionsQuery['intentFeedbackQuestions'],
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetIntentFeedbackQuestionsOptions(variables, options));
}

export function useIntentFeedbackResultsQuery(
  variables: IntentFeedbackResultsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      IntentFeedbackResultsQuery,
      Error,
      IntentFeedbackResultsQuery['intentFeedbackResults'],
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetIntentFeedbackResultsOptions(variables, options));
}

export function useMyFeedbackAnswersQuery(
  variables: MyFeedbackAnswersQueryVariables,
  options?: Omit<
    UseQueryOptions<
      MyFeedbackAnswersQuery,
      Error,
      MyFeedbackAnswersQuery['myFeedbackAnswers'],
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetMyFeedbackAnswersOptions(variables, options));
}

export function useCanSubmitFeedbackQuery(
  variables: CanSubmitFeedbackQueryVariables,
  options?: Omit<
    UseQueryOptions<
      CanSubmitFeedbackQuery,
      Error,
      CanSubmitFeedbackQuery['canSubmitFeedback'],
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetCanSubmitFeedbackOptions(variables, options));
}

// Mutations

// Create Question
export function useCreateFeedbackQuestionMutation(
  options?: UseMutationOptions<
    CreateFeedbackQuestionMutation,
    Error,
    CreateFeedbackQuestionMutationVariables
  >
) {
  const queryClient = getQueryClient();
  return useMutation<
    CreateFeedbackQuestionMutation,
    Error,
    CreateFeedbackQuestionMutationVariables
  >({
    mutationFn: async (variables) =>
      gqlClient.request<
        CreateFeedbackQuestionMutation,
        CreateFeedbackQuestionMutationVariables
      >(CreateFeedbackQuestionDocument, variables),
    onSuccess: (_data, variables) => {
      // Invalidate questions list
      queryClient.invalidateQueries({
        queryKey: [
          'GetIntentFeedbackQuestions',
          { intentId: variables.input.intentId },
        ],
      });
    },
    ...options,
  });
}

// Update Question
export function useUpdateFeedbackQuestionMutation(
  options?: UseMutationOptions<
    UpdateFeedbackQuestionMutation,
    Error,
    UpdateFeedbackQuestionMutationVariables
  >
) {
  const queryClient = getQueryClient();
  return useMutation<
    UpdateFeedbackQuestionMutation,
    Error,
    UpdateFeedbackQuestionMutationVariables
  >({
    mutationFn: async (variables) =>
      gqlClient.request<
        UpdateFeedbackQuestionMutation,
        UpdateFeedbackQuestionMutationVariables
      >(UpdateFeedbackQuestionDocument, variables),
    onSuccess: () => {
      // Invalidate all questions queries
      queryClient.invalidateQueries({
        queryKey: ['GetIntentFeedbackQuestions'],
      });
    },
    ...options,
  });
}

// Delete Question
export function useDeleteFeedbackQuestionMutation(
  options?: UseMutationOptions<
    DeleteFeedbackQuestionMutation,
    Error,
    DeleteFeedbackQuestionMutationVariables
  >
) {
  const queryClient = getQueryClient();
  return useMutation<
    DeleteFeedbackQuestionMutation,
    Error,
    DeleteFeedbackQuestionMutationVariables
  >({
    mutationFn: async (variables) =>
      gqlClient.request<
        DeleteFeedbackQuestionMutation,
        DeleteFeedbackQuestionMutationVariables
      >(DeleteFeedbackQuestionDocument, variables),
    onSuccess: () => {
      // Invalidate all questions queries
      queryClient.invalidateQueries({
        queryKey: ['GetIntentFeedbackQuestions'],
      });
    },
    ...options,
  });
}

// Reorder Questions
export function useReorderFeedbackQuestionsMutation(
  options?: UseMutationOptions<
    ReorderFeedbackQuestionsMutation,
    Error,
    ReorderFeedbackQuestionsMutationVariables
  >
) {
  const queryClient = getQueryClient();
  return useMutation<
    ReorderFeedbackQuestionsMutation,
    Error,
    ReorderFeedbackQuestionsMutationVariables
  >({
    mutationFn: async (variables) =>
      gqlClient.request<
        ReorderFeedbackQuestionsMutation,
        ReorderFeedbackQuestionsMutationVariables
      >(ReorderFeedbackQuestionsDocument, variables),
    onSuccess: (_data, variables) => {
      // Invalidate questions list
      queryClient.invalidateQueries({
        queryKey: [
          'GetIntentFeedbackQuestions',
          { intentId: variables.intentId },
        ],
      });
    },
    ...options,
  });
}

// Submit Review + Feedback
export function useSubmitReviewAndFeedbackMutation(
  options?: UseMutationOptions<
    SubmitReviewAndFeedbackMutation,
    Error,
    SubmitReviewAndFeedbackMutationVariables
  >
) {
  const queryClient = getQueryClient();
  return useMutation<
    SubmitReviewAndFeedbackMutation,
    Error,
    SubmitReviewAndFeedbackMutationVariables
  >({
    mutationFn: async (variables) =>
      gqlClient.request<
        SubmitReviewAndFeedbackMutation,
        SubmitReviewAndFeedbackMutationVariables
      >(SubmitReviewAndFeedbackDocument, variables),
    onSuccess: (_data, variables) => {
      // Invalidate reviews
      queryClient.invalidateQueries({
        queryKey: ['GetReviews', { intentId: variables.input.intentId }],
      });
      // Invalidate my review
      queryClient.invalidateQueries({
        queryKey: ['GetMyReview', { intentId: variables.input.intentId }],
      });
      // Invalidate feedback results
      queryClient.invalidateQueries({
        queryKey: [
          'GetIntentFeedbackResults',
          { intentId: variables.input.intentId },
        ],
      });
      // Invalidate my feedback answers
      queryClient.invalidateQueries({
        queryKey: [
          'GetMyFeedbackAnswers',
          { intentId: variables.input.intentId },
        ],
      });
      // Invalidate intent
      queryClient.invalidateQueries({
        queryKey: ['GetIntent', { id: variables.input.intentId }],
      });
    },
    ...options,
  });
}

// Send Feedback Requests (manual trigger)
export function useSendFeedbackRequestsMutation(
  options?: UseMutationOptions<
    SendFeedbackRequestsMutation,
    Error,
    SendFeedbackRequestsMutationVariables
  >
) {
  return useMutation<
    SendFeedbackRequestsMutation,
    Error,
    SendFeedbackRequestsMutationVariables
  >({
    mutationFn: async (variables) =>
      gqlClient.request<
        SendFeedbackRequestsMutation,
        SendFeedbackRequestsMutationVariables
      >(SendFeedbackRequestsDocument, variables),
    ...options,
  });
}
