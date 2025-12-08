/**
 * React Query hooks for Feedback (Questions & Answers)
 */

import {
  EventFeedbackQuestionsDocument,
  EventFeedbackQuestionsQuery,
  EventFeedbackQuestionsQueryVariables,
  EventFeedbackResultsDocument,
  EventFeedbackResultsQuery,
  EventFeedbackResultsQueryVariables,
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
import { gql } from 'graphql-request';
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
  variables: EventFeedbackQuestionsQueryVariables
) => ['GetEventFeedbackQuestions', variables] as const;

export const GET_FEEDBACK_RESULTS_KEY = (
  variables: EventFeedbackResultsQueryVariables
) => ['GetEventFeedbackResults', variables] as const;

export const GET_MY_FEEDBACK_ANSWERS_KEY = (
  variables: MyFeedbackAnswersQueryVariables
) => ['GetMyFeedbackAnswers', variables] as const;

export const GET_CAN_SUBMIT_FEEDBACK_KEY = (
  variables: CanSubmitFeedbackQueryVariables
) => ['GetCanSubmitFeedback', variables] as const;

/* ----------------------------- QUERY BUILDERS ---------------------------- */

// Feedback Questions Query
export function buildGetEventFeedbackQuestionsOptions(
  variables: EventFeedbackQuestionsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      EventFeedbackQuestionsQuery,
      Error,
      EventFeedbackQuestionsQuery['eventFeedbackQuestions'],
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  EventFeedbackQuestionsQuery,
  Error,
  EventFeedbackQuestionsQuery['eventFeedbackQuestions'],
  QueryKey
> {
  return {
    queryKey: GET_FEEDBACK_QUESTIONS_KEY(variables) as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<
        EventFeedbackQuestionsQuery,
        EventFeedbackQuestionsQueryVariables
      >(EventFeedbackQuestionsDocument, variables),
    select: (data) => data.eventFeedbackQuestions,
    ...(options ?? {}),
  };
}

// Feedback Results Query
export function buildGetEventFeedbackResultsOptions(
  variables: EventFeedbackResultsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      EventFeedbackResultsQuery,
      Error,
      EventFeedbackResultsQuery['eventFeedbackResults'],
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  EventFeedbackResultsQuery,
  Error,
  EventFeedbackResultsQuery['eventFeedbackResults'],
  QueryKey
> {
  return {
    queryKey: GET_FEEDBACK_RESULTS_KEY(variables) as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<
        EventFeedbackResultsQuery,
        EventFeedbackResultsQueryVariables
      >(EventFeedbackResultsDocument, variables),
    select: (data) => data.eventFeedbackResults,
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
export function useEventFeedbackQuestionsQuery(
  variables: EventFeedbackQuestionsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      EventFeedbackQuestionsQuery,
      Error,
      EventFeedbackQuestionsQuery['eventFeedbackQuestions'],
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetEventFeedbackQuestionsOptions(variables, options));
}

export function useEventFeedbackResultsQuery(
  variables: EventFeedbackResultsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      EventFeedbackResultsQuery,
      Error,
      EventFeedbackResultsQuery['eventFeedbackResults'],
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetEventFeedbackResultsOptions(variables, options));
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
          'GetEventFeedbackQuestions',
          { eventId: variables.input.eventId },
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
        queryKey: ['GetEventFeedbackQuestions'],
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
        queryKey: ['GetEventFeedbackQuestions'],
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
        queryKey: ['GetEventFeedbackQuestions', { eventId: variables.eventId }],
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
        queryKey: ['GetReviews', { eventId: variables.input.eventId }],
      });
      // Invalidate my review
      queryClient.invalidateQueries({
        queryKey: ['GetMyReview', { eventId: variables.input.eventId }],
      });
      // Invalidate feedback results
      queryClient.invalidateQueries({
        queryKey: [
          'GetEventFeedbackResults',
          { eventId: variables.input.eventId },
        ],
      });
      // Invalidate my feedback answers
      queryClient.invalidateQueries({
        queryKey: [
          'GetMyFeedbackAnswers',
          { eventId: variables.input.eventId },
        ],
      });
      // Invalidate event
      queryClient.invalidateQueries({
        queryKey: ['GetEvent', { id: variables.input.eventId }],
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

// Inline document for UpdateEventFeedbackQuestions (until codegen runs)
const UpdateEventFeedbackQuestionsDocument = gql`
  mutation UpdateEventFeedbackQuestions(
    $input: UpdateEventFeedbackQuestionsInput!
  ) {
    updateEventFeedbackQuestions(input: $input) {
      id
      eventId
      order
      type
      label
      helpText
      required
      options
      maxLength
      createdAt
      updatedAt
    }
  }
`;

// Types for UpdateEventFeedbackQuestions (until codegen runs)
export type UpdateEventFeedbackQuestionsMutation = {
  updateEventFeedbackQuestions: Array<{
    id: string;
    eventId: string;
    order: number;
    type: string;
    label: string;
    helpText?: string | null;
    required: boolean;
    options?: any;
    maxLength?: number | null;
    createdAt: string;
    updatedAt: string;
  }>;
};

export type UpdateEventFeedbackQuestionsMutationVariables = {
  input: {
    eventId: string;
    questions: Array<{
      type: 'TEXT' | 'SINGLE_CHOICE' | 'MULTI_CHOICE';
      label: string;
      helpText?: string;
      required: boolean;
      order: number;
      options?: Array<{ label: string }>;
      maxLength?: number;
    }>;
  };
};

// Bulk Update Feedback Questions (replaces all questions for event)
export function useUpdateEventFeedbackQuestionsMutation(
  options?: UseMutationOptions<
    UpdateEventFeedbackQuestionsMutation,
    Error,
    UpdateEventFeedbackQuestionsMutationVariables
  >
) {
  const queryClient = getQueryClient();
  return useMutation<
    UpdateEventFeedbackQuestionsMutation,
    Error,
    UpdateEventFeedbackQuestionsMutationVariables
  >({
    mutationFn: async (variables) =>
      gqlClient.request<
        UpdateEventFeedbackQuestionsMutation,
        UpdateEventFeedbackQuestionsMutationVariables
      >(UpdateEventFeedbackQuestionsDocument, variables),
    onSuccess: (_data, variables) => {
      // Invalidate questions list
      queryClient.invalidateQueries({
        queryKey: [
          'GetEventFeedbackQuestions',
          { eventId: variables.input.eventId },
        ],
      });
      // Invalidate results as well since questions might have changed
      queryClient.invalidateQueries({
        queryKey: [
          'GetEventFeedbackResults',
          { eventId: variables.input.eventId },
        ],
      });
    },
    ...options,
  });
}
