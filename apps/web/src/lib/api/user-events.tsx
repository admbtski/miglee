import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { gqlClient } from './client';
import {
  GetUserEventsDocument,
  type GetUserEventsQuery,
  type GetUserEventsQueryVariables,
} from './__generated__/react-query-update';

export const USER_EVENTS_KEY = 'userEvents';

export function buildUserEventsOptions(
  variables: GetUserEventsQueryVariables,
  options?: Partial<UseQueryOptions<GetUserEventsQuery>>
): any {
  return {
    queryKey: [USER_EVENTS_KEY, variables],
    queryFn: async () => {
      return gqlClient.request(GetUserEventsDocument, variables);
    },
    ...options,
  };
}

export function useUserEventsQuery(
  variables: GetUserEventsQueryVariables,
  options?: Partial<UseQueryOptions<GetUserEventsQuery>>
) {
  return useQuery(buildUserEventsOptions(variables, options));
}
