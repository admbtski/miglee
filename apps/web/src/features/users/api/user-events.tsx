import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';
import {
  GetUserEventsDocument,
  type GetUserEventsQuery,
  type GetUserEventsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';

export const USER_EVENTS_KEY = 'userEvents';

export function buildUserEventsOptions(
  variables?: GetUserEventsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetUserEventsQuery, Error, GetUserEventsQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<GetUserEventsQuery, Error, GetUserEventsQuery, QueryKey> {
  return {
    queryKey: [USER_EVENTS_KEY, variables],
    queryFn: async () =>
      variables
        ? gqlClient.request<GetUserEventsQuery, GetUserEventsQueryVariables>(
            GetUserEventsDocument,
            variables
          )
        : gqlClient.request<GetUserEventsQuery>(GetUserEventsDocument),
    ...(options ?? {}),
  };
}

export function useUserEventsQuery(
  variables?: GetUserEventsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetUserEventsQuery, Error, GetUserEventsQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildUserEventsOptions(variables, options));
}
