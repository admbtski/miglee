import {
  GetEventCheckinLogsDocument,
  GetEventCheckinLogsQuery,
  GetEventCheckinLogsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { checkinKeys } from './checkin-query-keys';

export function buildGetEventCheckinLogsOptions(
  variables: GetEventCheckinLogsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetEventCheckinLogsQuery,
      Error,
      GetEventCheckinLogsQuery['eventCheckinLogs'],
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  GetEventCheckinLogsQuery,
  Error,
  GetEventCheckinLogsQuery['eventCheckinLogs'],
  QueryKey
> {
  return {
    queryKey: checkinKeys.eventLogs(variables) as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<
        GetEventCheckinLogsQuery,
        GetEventCheckinLogsQueryVariables
      >(GetEventCheckinLogsDocument, variables),
    select: (data) => data.eventCheckinLogs,
    ...(options ?? {}),
  };
}

export function useGetEventCheckinLogsQuery(
  variables: GetEventCheckinLogsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetEventCheckinLogsQuery,
      Error,
      GetEventCheckinLogsQuery['eventCheckinLogs'],
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetEventCheckinLogsOptions(variables, options));
}
