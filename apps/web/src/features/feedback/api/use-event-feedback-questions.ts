import {
  EventFeedbackQuestionsDocument,
  EventFeedbackQuestionsQuery,
  EventFeedbackQuestionsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { GET_FEEDBACK_QUESTIONS_KEY } from './feedback-query-keys';

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
