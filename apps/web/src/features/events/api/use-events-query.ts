import {
  GetEventsDocument,
  GetEventsQuery,
  GetEventsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';

export const GET_EVENTS_KEY = (variables?: GetEventsQueryVariables) =>
  variables
    ? (['GetEvents', variables] as const)
    : (['GetEvents'] as const);

export function buildGetEventsOptions(
  variables?: GetEventsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetEventsQuery, Error, GetEventsQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<GetEventsQuery, Error, GetEventsQuery, QueryKey> {
  return {
    queryKey: GET_EVENTS_KEY(variables) as QueryKey,
    queryFn: async () => {
      const data = await gqlClient.request<
        GetEventsQuery,
        GetEventsQueryVariables
      >(GetEventsDocument, variables || {});
      return data;
    },
    ...options,
  };
}

export function useEventsQuery(
  variables?: GetEventsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetEventsQuery, Error, GetEventsQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetEventsOptions(variables, options));
}

