import {
  GetEventsDocument,
  GetEventsQuery,
  GetEventsQueryVariables,
} from '@/graphql/__generated__/react-query';
import { gqlClient } from '@/graphql/client';
import {
  QueryKey,
  UseQueryOptions,
  UseSuspenseQueryOptions,
  useQuery,
  useSuspenseQuery,
} from '@tanstack/react-query';

export const GET_EVENTS_LIST_KEY = (variables?: GetEventsQueryVariables) =>
  variables ? (['GetEvents', variables] as const) : (['GetEvents'] as const);

export function buildEventsOptions(
  variables?: GetEventsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetEventsQuery, unknown, GetEventsQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<GetEventsQuery, unknown, GetEventsQuery, QueryKey> {
  return {
    queryKey: GET_EVENTS_LIST_KEY(variables) as unknown as QueryKey,
    queryFn: async () =>
      variables
        ? gqlClient.request<GetEventsQuery, GetEventsQueryVariables>(
            GetEventsDocument,
            variables
          )
        : gqlClient.request<GetEventsQuery>(GetEventsDocument),
    ...(options ?? {}),
  };
}

export function buildEventsSuspenseOptions(
  variables?: GetEventsQueryVariables,
  options?: Omit<
    UseSuspenseQueryOptions<GetEventsQuery, unknown, GetEventsQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
): UseSuspenseQueryOptions<GetEventsQuery, unknown, GetEventsQuery, QueryKey> {
  return {
    queryKey: GET_EVENTS_LIST_KEY(variables) as unknown as QueryKey,
    queryFn: async () =>
      variables
        ? gqlClient.request<GetEventsQuery, GetEventsQueryVariables>(
            GetEventsDocument,
            variables
          )
        : gqlClient.request<GetEventsQuery>(GetEventsDocument),
    ...(options ?? {}),
  };
}

export function useGetEventsQuery(
  variables?: GetEventsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetEventsQuery, unknown, GetEventsQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildEventsOptions(variables, options));
}

export function useSuspenseGetEventsQuery(
  variables?: GetEventsQueryVariables,
  options?: Omit<
    UseSuspenseQueryOptions<GetEventsQuery, unknown, GetEventsQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  return useSuspenseQuery(buildEventsSuspenseOptions(variables, options));
}
