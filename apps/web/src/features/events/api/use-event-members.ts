import {
  GetEventMembersDocument,
  GetEventMembersQuery,
  GetEventMembersQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { GET_EVENT_MEMBERS_KEY } from './events-query-keys';

export function buildGetEventMembersOptions(
  variables: GetEventMembersQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetEventMembersQuery,
      unknown,
      GetEventMembersQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  GetEventMembersQuery,
  unknown,
  GetEventMembersQuery,
  QueryKey
> {
  return {
    queryKey: GET_EVENT_MEMBERS_KEY(variables) as QueryKey,
    queryFn: () =>
      gqlClient.request<GetEventMembersQuery, GetEventMembersQueryVariables>(
        GetEventMembersDocument,
        variables
      ),
    ...(options ?? {}),
  };
}

export function useEventMembersQuery(
  variables: GetEventMembersQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetEventMembersQuery,
      unknown,
      GetEventMembersQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(
    buildGetEventMembersOptions(variables, {
      enabled: !!variables.eventId,
      ...(options ?? {}),
    })
  );
}
