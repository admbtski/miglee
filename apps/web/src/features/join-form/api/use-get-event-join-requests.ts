import {
  EventJoinRequestsDocument,
  EventJoinRequestsQuery,
  EventJoinRequestsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  QueryKey,
  useInfiniteQuery,
  UseInfiniteQueryOptions,
} from '@tanstack/react-query';
import { GET_JOIN_REQUESTS_KEY } from './join-form-query-keys';

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
