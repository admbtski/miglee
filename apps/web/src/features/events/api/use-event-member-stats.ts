import {
  GetEventMemberStatsDocument,
  GetEventMemberStatsQuery,
  GetEventMemberStatsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { GET_EVENT_MEMBER_STATS_KEY } from './events-query-keys';

export function buildGetEventMemberStatsOptions(
  variables: GetEventMemberStatsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetEventMemberStatsQuery,
      unknown,
      GetEventMemberStatsQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  GetEventMemberStatsQuery,
  unknown,
  GetEventMemberStatsQuery,
  QueryKey
> {
  return {
    queryKey: GET_EVENT_MEMBER_STATS_KEY(variables) as QueryKey,
    queryFn: () =>
      gqlClient.request<
        GetEventMemberStatsQuery,
        GetEventMemberStatsQueryVariables
      >(GetEventMemberStatsDocument, variables),
    ...(options ?? {}),
  };
}

export function useEventMemberStatsQuery(
  variables: GetEventMemberStatsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetEventMemberStatsQuery,
      unknown,
      GetEventMemberStatsQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(
    buildGetEventMemberStatsOptions(variables, {
      enabled: !!variables.eventId,
      ...(options ?? {}),
    })
  );
}
