import {
  MyJoinRequestsDocument,
  MyJoinRequestsQuery,
  MyJoinRequestsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { GET_MY_JOIN_REQUESTS_KEY } from './join-form-query-keys';

export function buildGetMyJoinRequestsOptions(
  variables: MyJoinRequestsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      MyJoinRequestsQuery,
      Error,
      MyJoinRequestsQuery['myJoinRequests'],
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  MyJoinRequestsQuery,
  Error,
  MyJoinRequestsQuery['myJoinRequests'],
  QueryKey
> {
  return {
    queryKey: GET_MY_JOIN_REQUESTS_KEY(variables) as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<MyJoinRequestsQuery, MyJoinRequestsQueryVariables>(
        MyJoinRequestsDocument,
        variables
      ),
    select: (data) => data.myJoinRequests,
    ...(options ?? {}),
  };
}

export function useMyJoinRequestsQuery(
  variables: MyJoinRequestsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      MyJoinRequestsQuery,
      Error,
      MyJoinRequestsQuery['myJoinRequests'],
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetMyJoinRequestsOptions(variables, options));
}
