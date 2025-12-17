import {
  GetNotificationsDocument,
  GetNotificationsQuery,
  GetNotificationsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  InfiniteData,
  QueryKey,
  useInfiniteQuery,
  UseInfiniteQueryOptions,
} from '@tanstack/react-query';
import { GET_NOTIFICATIONS_INFINITE_KEY } from './notifications-query-keys';
import { NotificationsVarsNoOffset } from './notifications-query-types';

export function buildGetNotificationsInfiniteOptions(
  variables: NotificationsVarsNoOffset,
  options?: Omit<
    UseInfiniteQueryOptions<
      GetNotificationsQuery,
      Error,
      InfiniteData<GetNotificationsQuery>,
      QueryKey,
      number
    >,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
  >
): UseInfiniteQueryOptions<
  GetNotificationsQuery,
  Error,
  InfiniteData<GetNotificationsQuery>,
  QueryKey,
  number
> {
  return {
    queryKey: GET_NOTIFICATIONS_INFINITE_KEY(variables) as unknown as QueryKey,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const vars: GetNotificationsQueryVariables = {
        ...variables,
        offset: pageParam,
      };
      return gqlClient.request<
        GetNotificationsQuery,
        GetNotificationsQueryVariables
      >(GetNotificationsDocument, vars);
    },
    getNextPageParam: (lastPage, _all, lastOffset) => {
      const res = lastPage.notifications;
      if (res?.pageInfo) {
        const { hasNext, limit } = res.pageInfo as {
          hasNext: boolean;
          limit: number;
        };
        if (!hasNext) return undefined;
        const prev = (lastOffset ?? 0) as number;
        return prev + limit;
      }
      return undefined;
    },
    ...(options ?? {}),
  };
}

export function useNotificationsInfiniteQuery(
  variables: NotificationsVarsNoOffset,
  options?: Omit<
    UseInfiniteQueryOptions<
      GetNotificationsQuery,
      Error,
      InfiniteData<GetNotificationsQuery>,
      QueryKey,
      number
    >,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
  >
) {
  return useInfiniteQuery<
    GetNotificationsQuery,
    Error,
    InfiniteData<GetNotificationsQuery>,
    QueryKey,
    number
  >(buildGetNotificationsInfiniteOptions(variables, options));
}
