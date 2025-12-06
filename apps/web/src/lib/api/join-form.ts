/**
 * React Query hooks for Join Form (Questions & Requests)
 */

import {
  IntentJoinQuestionsDocument,
  IntentJoinQuestionsQuery,
  IntentJoinQuestionsQueryVariables,
  IntentJoinRequestsDocument,
  IntentJoinRequestsQuery,
  IntentJoinRequestsQueryVariables,
  MyJoinRequestsDocument,
  MyJoinRequestsQuery,
  MyJoinRequestsQueryVariables,
  RequestJoinIntentWithAnswersDocument,
  RequestJoinIntentWithAnswersMutation,
  RequestJoinIntentWithAnswersMutationVariables,
  ApproveJoinRequestDocument,
  ApproveJoinRequestMutation,
  ApproveJoinRequestMutationVariables,
  RejectJoinRequestDocument,
  RejectJoinRequestMutation,
  RejectJoinRequestMutationVariables,
  CancelJoinRequestDocument,
  CancelJoinRequestMutation,
  CancelJoinRequestMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
  useInfiniteQuery,
  UseInfiniteQueryOptions,
} from '@tanstack/react-query';

/* --------------------------------- KEYS ---------------------------------- */
export const GET_JOIN_QUESTIONS_KEY = (
  variables: IntentJoinQuestionsQueryVariables
) => ['GetIntentJoinQuestions', variables] as const;

export const GET_JOIN_REQUESTS_KEY = (
  variables: IntentJoinRequestsQueryVariables
) => ['GetIntentJoinRequests', variables] as const;

export const GET_MY_JOIN_REQUESTS_KEY = (
  variables: MyJoinRequestsQueryVariables
) => ['GetMyJoinRequests', variables] as const;

/* ----------------------------- QUERY BUILDERS ---------------------------- */

// Join Questions Query
export function buildGetIntentJoinQuestionsOptions(
  variables: IntentJoinQuestionsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      IntentJoinQuestionsQuery,
      Error,
      IntentJoinQuestionsQuery['intentJoinQuestions'],
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  IntentJoinQuestionsQuery,
  Error,
  IntentJoinQuestionsQuery['intentJoinQuestions'],
  QueryKey
> {
  return {
    queryKey: GET_JOIN_QUESTIONS_KEY(variables) as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<
        IntentJoinQuestionsQuery,
        IntentJoinQuestionsQueryVariables
      >(IntentJoinQuestionsDocument, variables),
    select: (data) => data.intentJoinQuestions,
    ...(options ?? {}),
  };
}

// Join Requests Query (Infinite)
export function buildGetIntentJoinRequestsOptions(
  variables: Omit<IntentJoinRequestsQueryVariables, 'offset'>,
  options?: Omit<
    UseInfiniteQueryOptions<
      IntentJoinRequestsQuery,
      Error,
      IntentJoinRequestsQuery,
      QueryKey,
      number
    >,
    'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam'
  >
): UseInfiniteQueryOptions<
  IntentJoinRequestsQuery,
  Error,
  IntentJoinRequestsQuery,
  QueryKey,
  number
> {
  return {
    queryKey: GET_JOIN_REQUESTS_KEY(variables) as unknown as QueryKey,
    queryFn: async ({ pageParam = 0 }) =>
      gqlClient.request<
        IntentJoinRequestsQuery,
        IntentJoinRequestsQueryVariables
      >(IntentJoinRequestsDocument, {
        ...variables,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: any, allPages: any[]) => {
      const { total } = lastPage.intentJoinRequests;
      const loadedCount = allPages.reduce(
        (sum: number, page: any) => sum + page.intentJoinRequests.items.length,
        0
      );
      return loadedCount < total ? loadedCount : undefined;
    },
    ...(options ?? {}),
  };
}

// My Join Requests Query
export function buildGetMyJoinRequestsOptions(
  variables: MyJoinRequestsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      MyJoinRequestsQuery,
      Error,
      MyJoinRequestsQuery['myJoinRequests'],
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  MyJoinRequestsQuery,
  Error,
  MyJoinRequestsQuery['myJoinRequests'],
  QueryKey
> {
  return {
    queryKey: GET_MY_JOIN_REQUESTS_KEY(variables) as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<MyJoinRequestsQuery, MyJoinRequestsQueryVariables>(
        MyJoinRequestsDocument,
        variables
      ),
    select: (data) => data.myJoinRequests,
    ...(options ?? {}),
  };
}

/* --------------------------------- HOOKS --------------------------------- */

// Queries
export function useIntentJoinQuestionsQuery(
  variables: IntentJoinQuestionsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      IntentJoinQuestionsQuery,
      Error,
      IntentJoinQuestionsQuery['intentJoinQuestions'],
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetIntentJoinQuestionsOptions(variables, options));
}

export function useIntentJoinRequestsQuery(
  variables: Omit<IntentJoinRequestsQueryVariables, 'offset'>,
  options?: Omit<
    UseInfiniteQueryOptions<
      IntentJoinRequestsQuery,
      Error,
      IntentJoinRequestsQuery,
      QueryKey,
      number
    >,
    'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam'
  >
) {
  return useInfiniteQuery(
    buildGetIntentJoinRequestsOptions(variables, options)
  );
}

export function useMyJoinRequestsQuery(
  variables: MyJoinRequestsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      MyJoinRequestsQuery,
      Error,
      MyJoinRequestsQuery['myJoinRequests'],
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetMyJoinRequestsOptions(variables, options));
}

// Request Join with Answers
export function useRequestJoinIntentWithAnswersMutation(
  options?: UseMutationOptions<
    RequestJoinIntentWithAnswersMutation,
    Error,
    RequestJoinIntentWithAnswersMutationVariables
  >
) {
  const queryClient = getQueryClient();
  return useMutation<
    RequestJoinIntentWithAnswersMutation,
    Error,
    RequestJoinIntentWithAnswersMutationVariables
  >({
    mutationFn: async (variables) =>
      gqlClient.request<
        RequestJoinIntentWithAnswersMutation,
        RequestJoinIntentWithAnswersMutationVariables
      >(RequestJoinIntentWithAnswersDocument, variables),
    onSuccess: (_data, variables) => {
      // Invalidate intent queries
      queryClient.invalidateQueries({
        queryKey: ['GetIntent', { id: variables.input.intentId }],
      });
      // Invalidate my join requests
      queryClient.invalidateQueries({
        queryKey: ['GetMyJoinRequests'],
      });
      // Invalidate join requests for this intent
      queryClient.invalidateQueries({
        queryKey: [
          'GetIntentJoinRequests',
          { intentId: variables.input.intentId },
        ],
      });
    },
    ...options,
  });
}

// Approve Request
export function useApproveJoinRequestMutation(
  options?: UseMutationOptions<
    ApproveJoinRequestMutation,
    Error,
    ApproveJoinRequestMutationVariables
  >
) {
  const queryClient = getQueryClient();
  return useMutation<
    ApproveJoinRequestMutation,
    Error,
    ApproveJoinRequestMutationVariables
  >({
    mutationFn: async (variables) =>
      gqlClient.request<
        ApproveJoinRequestMutation,
        ApproveJoinRequestMutationVariables
      >(ApproveJoinRequestDocument, variables),
    onSuccess: (_data, variables) => {
      // Invalidate join requests
      queryClient.invalidateQueries({
        queryKey: [
          'GetIntentJoinRequests',
          { intentId: variables.input.intentId },
        ],
      });
      // Invalidate members
      queryClient.invalidateQueries({
        queryKey: ['GetIntentMembers', { intentId: variables.input.intentId }],
      });
      // Invalidate intent
      queryClient.invalidateQueries({
        queryKey: ['GetIntent', { id: variables.input.intentId }],
      });
    },
    ...options,
  });
}

// Reject Request
export function useRejectJoinRequestMutation(
  options?: UseMutationOptions<
    RejectJoinRequestMutation,
    Error,
    RejectJoinRequestMutationVariables
  >
) {
  const queryClient = getQueryClient();
  return useMutation<
    RejectJoinRequestMutation,
    Error,
    RejectJoinRequestMutationVariables
  >({
    mutationFn: async (variables) =>
      gqlClient.request<
        RejectJoinRequestMutation,
        RejectJoinRequestMutationVariables
      >(RejectJoinRequestDocument, variables),
    onSuccess: (_data, variables) => {
      // Invalidate join requests
      queryClient.invalidateQueries({
        queryKey: [
          'GetIntentJoinRequests',
          { intentId: variables.input.intentId },
        ],
      });
      // Invalidate members
      queryClient.invalidateQueries({
        queryKey: ['GetIntentMembers', { intentId: variables.input.intentId }],
      });
    },
    ...options,
  });
}

// Cancel Request
export function useCancelJoinRequestMutation(
  options?: UseMutationOptions<
    CancelJoinRequestMutation,
    Error,
    CancelJoinRequestMutationVariables
  >
) {
  const queryClient = getQueryClient();
  return useMutation<
    CancelJoinRequestMutation,
    Error,
    CancelJoinRequestMutationVariables
  >({
    mutationFn: async (variables) =>
      gqlClient.request<
        CancelJoinRequestMutation,
        CancelJoinRequestMutationVariables
      >(CancelJoinRequestDocument, variables),
    onSuccess: (_data, variables) => {
      // Invalidate my join requests
      queryClient.invalidateQueries({
        queryKey: ['GetMyJoinRequests'],
      });
      // Invalidate intent
      queryClient.invalidateQueries({
        queryKey: ['GetIntent', { id: variables.intentId }],
      });
    },
    ...options,
  });
}
