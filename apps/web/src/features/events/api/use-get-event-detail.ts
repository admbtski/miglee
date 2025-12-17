import {
  GetEventDetailDocument,
  GetEventDetailQuery,
  GetEventDetailQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { GET_EVENT_DETAIL_KEY } from './events-query-keys';

export function buildGetEventDetailOptions(
  variables: GetEventDetailQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetEventDetailQuery,
      unknown,
      GetEventDetailQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  GetEventDetailQuery,
  unknown,
  GetEventDetailQuery,
  QueryKey
> {
  return {
    queryKey: GET_EVENT_DETAIL_KEY(variables) as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<GetEventDetailQuery, GetEventDetailQueryVariables>(
        GetEventDetailDocument,
        variables
      ),
    ...(options ?? {}),
  };
}

export function useEventDetailQuery(
  variables: GetEventDetailQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetEventDetailQuery,
      unknown,
      GetEventDetailQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(
    buildGetEventDetailOptions(variables, {
      enabled: !!variables.id,
      ...(options ?? {}),
    })
  );
}
