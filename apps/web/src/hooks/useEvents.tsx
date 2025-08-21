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

function eventsQueryKey(variables?: GetEventsQueryVariables): QueryKey {
  return variables ? ['GetEvents', variables] : ['GetEvents'];
}

export function buildEventsOptions(
  variables?: GetEventsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetEventsQuery, unknown, GetEventsQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<GetEventsQuery, unknown, GetEventsQuery, QueryKey> {
  return {
    queryKey: eventsQueryKey(variables),
    queryFn: async () => {
      // ⬇️ kluczowa zmiana: wywołanie warunkowe
      if (variables) {
        return gqlClient.request<GetEventsQuery, GetEventsQueryVariables>(
          GetEventsDocument,
          variables
        );
      }
      return gqlClient.request<GetEventsQuery>(GetEventsDocument);
    },
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
    queryKey: eventsQueryKey(variables),
    queryFn: async () => {
      if (variables) {
        return gqlClient.request<GetEventsQuery, GetEventsQueryVariables>(
          GetEventsDocument,
          variables
        );
      }
      return gqlClient.request<GetEventsQuery>(GetEventsDocument);
    },
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
