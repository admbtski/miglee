import {
  EventJoinQuestionsDocument,
  EventJoinQuestionsQuery,
  EventJoinQuestionsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { GET_JOIN_QUESTIONS_KEY } from './join-form-query-keys';

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
