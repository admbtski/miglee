/**
 * React Query hooks for Join Form (Questions & Requests)
 */

import {
  EventJoinQuestionsDocument,
  EventJoinQuestionsQuery,
  EventJoinQuestionsQueryVariables,
  EventJoinRequestsDocument,
  EventJoinRequestsQuery,
  EventJoinRequestsQueryVariables,
  MyJoinRequestsDocument,
  MyJoinRequestsQuery,
  MyJoinRequestsQueryVariables,
  RequestJoinEventWithAnswersDocument,
  RequestJoinEventWithAnswersMutation,
  RequestJoinEventWithAnswersMutationVariables,
  ApproveJoinRequestDocument,
  ApproveJoinRequestMutation,
  ApproveJoinRequestMutationVariables,
  RejectJoinRequestDocument,
  RejectJoinRequestMutation,
  RejectJoinRequestMutationVariables,
  UpdateEventJoinQuestionsDocument,
  UpdateEventJoinQuestionsMutation,
  UpdateEventJoinQuestionsMutationVariables,
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
  variables: EventJoinQuestionsQueryVariables
) => ['GetEventJoinQuestions', variables] as const;

export const GET_JOIN_REQUESTS_KEY = (
  variables: EventJoinRequestsQueryVariables
) => ['GetEventJoinRequests', variables] as const;

export const GET_MY_JOIN_REQUESTS_KEY = (
  variables: MyJoinRequestsQueryVariables
) => ['GetMyJoinRequests', variables] as const;

/* ----------------------------- QUERY BUILDERS ---------------------------- */

// Join Questions Query
export function buildGetEventJoinQuestionsOptions(
  variables: EventJoinQuestionsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      EventJoinQuestionsQuery,
      Error,
      EventJoinQuestionsQuery['eventJoinQuestions'],
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  EventJoinQuestionsQuery,
  Error,
  EventJoinQuestionsQuery['eventJoinQuestions'],
  QueryKey
> {
  return {
    queryKey: GET_JOIN_QUESTIONS_KEY(variables) as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<
        EventJoinQuestionsQuery,
        EventJoinQuestionsQueryVariables
      >(EventJoinQuestionsDocument, variables),
    select: (data) => data.eventJoinQuestions,
    ...(options ?? {}),
  };
}

// Join Requests Query (Infinite)
export function buildGetEventJoinRequestsOptions(
  variables: Omit<EventJoinRequestsQueryVariables, 'offset'>,
  options?: Omit<
    UseInfiniteQueryOptions<
      EventJoinRequestsQuery,
      Error,
      EventJoinRequestsQuery,
      QueryKey,
      number
    >,
    'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam'
  >
): UseInfiniteQueryOptions<
  EventJoinRequestsQuery,
  Error,
  EventJoinRequestsQuery,
  QueryKey,
  number
> {
  return {
    queryKey: GET_JOIN_REQUESTS_KEY(variables) as unknown as QueryKey,
    queryFn: async ({ pageParam = 0 }) =>
      gqlClient.request<
        EventJoinRequestsQuery,
        EventJoinRequestsQueryVariables
      >(EventJoinRequestsDocument, {
        ...variables,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: any, allPages: any[]) => {
      const { total } = lastPage.eventJoinRequests;
      const loadedCount = allPages.reduce(
        (sum: number, page: any) => sum + page.eventJoinRequests.items.length,
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
export function useEventJoinQuestionsQuery(
  variables: EventJoinQuestionsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      EventJoinQuestionsQuery,
      Error,
      EventJoinQuestionsQuery['eventJoinQuestions'],
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetEventJoinQuestionsOptions(variables, options));
}

export function useEventJoinRequestsQuery(
  variables: Omit<EventJoinRequestsQueryVariables, 'offset'>,
  options?: Omit<
    UseInfiniteQueryOptions<
      EventJoinRequestsQuery,
      Error,
      EventJoinRequestsQuery,
      QueryKey,
      number
    >,
    'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam'
  >
) {
  return useInfiniteQuery(buildGetEventJoinRequestsOptions(variables, options));
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
export function useRequestJoinEventWithAnswersMutation(
  options?: UseMutationOptions<
    RequestJoinEventWithAnswersMutation,
    Error,
    RequestJoinEventWithAnswersMutationVariables
  >
) {
  const queryClient = getQueryClient();
  return useMutation<
    RequestJoinEventWithAnswersMutation,
    Error,
    RequestJoinEventWithAnswersMutationVariables
  >({
    mutationFn: async (variables) =>
      gqlClient.request<
        RequestJoinEventWithAnswersMutation,
        RequestJoinEventWithAnswersMutationVariables
      >(RequestJoinEventWithAnswersDocument, variables),
    onSuccess: (_data, variables) => {
      // Invalidate event queries
      queryClient.invalidateQueries({
        queryKey: ['GetEvent', { id: variables.input.eventId }],
      });
      // Invalidate my join requests
      queryClient.invalidateQueries({
        queryKey: ['GetMyJoinRequests'],
      });
      // Invalidate join requests for this event
      queryClient.invalidateQueries({
        queryKey: [
          'GetEventJoinRequests',
          { eventId: variables.input.eventId },
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
          'GetEventJoinRequests',
          { eventId: variables.input.eventId },
        ],
      });
      // Invalidate members
      queryClient.invalidateQueries({
        queryKey: ['GetEventMembers', { eventId: variables.input.eventId }],
      });
      // Invalidate event
      queryClient.invalidateQueries({
        queryKey: ['GetEvent', { id: variables.input.eventId }],
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
          'GetEventJoinRequests',
          { eventId: variables.input.eventId },
        ],
      });
      // Invalidate members
      queryClient.invalidateQueries({
        queryKey: ['GetEventMembers', { eventId: variables.input.eventId }],
      });
    },
    ...options,
  });
}

// Note: useCancelJoinRequestMutation is exported from event-members.tsx

// Update Join Questions (bulk replace)
export function useUpdateEventJoinQuestionsMutation(
  options?: UseMutationOptions<
    UpdateEventJoinQuestionsMutation,
    Error,
    UpdateEventJoinQuestionsMutationVariables
  >
) {
  const queryClient = getQueryClient();
  return useMutation<
    UpdateEventJoinQuestionsMutation,
    Error,
    UpdateEventJoinQuestionsMutationVariables
  >({
    mutationKey: ['UpdateEventJoinQuestions'],
    mutationFn: async (variables) =>
      gqlClient.request<
        UpdateEventJoinQuestionsMutation,
        UpdateEventJoinQuestionsMutationVariables
      >(UpdateEventJoinQuestionsDocument, variables),
    onSuccess: (_data, variables) => {
      // Invalidate event detail query to refetch with updated questions
      if (variables.input.eventId) {
        queryClient.invalidateQueries({
          queryKey: ['GetEventDetail', { id: variables.input.eventId }],
        });
        queryClient.invalidateQueries({
          queryKey: [
            'GetEventJoinQuestions',
            { eventId: variables.input.eventId },
          ],
        });
      }
    },
    ...options,
  });
}
