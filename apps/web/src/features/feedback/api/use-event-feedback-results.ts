import {
  EventFeedbackResultsDocument,
  EventFeedbackResultsQuery,
  EventFeedbackResultsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { GET_FEEDBACK_RESULTS_KEY } from './feedback-query-keys';

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
