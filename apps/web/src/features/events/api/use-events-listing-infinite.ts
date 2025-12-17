import {
  GetEventsListingDocument,
  GetEventsListingQuery,
  GetEventsListingQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  InfiniteData,
  QueryKey,
  useInfiniteQuery,
  UseInfiniteQueryOptions,
} from '@tanstack/react-query';
import { GET_EVENTS_LISTING_INFINITE_KEY } from './events-query-keys';

export function buildGetEventsListingInfiniteOptions(
  variables?: Omit<GetEventsListingQueryVariables, 'offset'>,
  options?: Omit<
    UseInfiniteQueryOptions<
      GetEventsListingQuery, // TQueryFnData
      Error, // TError
      InfiniteData<GetEventsListingQuery>,
      QueryKey, // TQueryKey
      number // TPageParam (offset)
    >,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
  >
): UseInfiniteQueryOptions<
  GetEventsListingQuery,
  Error,
  InfiniteData<GetEventsListingQuery>,
  QueryKey,
  number
> {
  return {
    queryKey: GET_EVENTS_LISTING_INFINITE_KEY(variables) as unknown as QueryKey,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const vars: GetEventsListingQueryVariables = {
        ...(variables ?? {}),
        offset: pageParam,
      };
      return variables
        ? gqlClient.request<
            GetEventsListingQuery,
            GetEventsListingQueryVariables
          >(GetEventsListingDocument, vars)
        : gqlClient.request<GetEventsListingQuery>(GetEventsListingDocument);
    },
    getNextPageParam: (lastPage, _allPages, lastOffset) => {
      const res = lastPage.events;

      if (res?.pageInfo) {
        const { hasNext, limit } = res.pageInfo as {
          hasNext: boolean;
          limit: number;
        };
        if (!hasNext) return undefined;
        const prev = (lastOffset ?? 0) as number;
        return prev + limit;
      }
      // Fallback — brak paginacji
      return undefined;
    },
    ...(options ?? {}),
  };
}

export function useEventsListingInfiniteQuery(
  variables?: Omit<GetEventsListingQueryVariables, 'offset'>,
  options?: Omit<
    UseInfiniteQueryOptions<
      GetEventsListingQuery,
      Error,
      InfiniteData<GetEventsListingQuery>,
      QueryKey,
      number
    >,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
  >
) {
  return useInfiniteQuery<
    GetEventsListingQuery,
    Error,
    InfiniteData<GetEventsListingQuery>,
    QueryKey,
    number
  >(buildGetEventsListingInfiniteOptions(variables, options));
}
