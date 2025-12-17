import {
  GetMyEventsDocument,
  GetMyEventsQuery,
  GetMyEventsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { GET_MY_EVENTS_KEY } from './events-query-keys';

function buildGetMyEventsOptions(
  variables?: GetMyEventsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetMyEventsQuery, Error, GetMyEventsQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<GetMyEventsQuery, Error, GetMyEventsQuery, QueryKey> {
  return {
    queryKey: GET_MY_EVENTS_KEY(variables),
    queryFn: async () => {
      const data = await gqlClient.request(
        GetMyEventsDocument,
        variables || {}
      );
      return data;
    },
    ...options,
  };
}

export function useMyEventsQuery(
  variables?: GetMyEventsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetMyEventsQuery, Error, GetMyEventsQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetMyEventsOptions(variables, options));
}
