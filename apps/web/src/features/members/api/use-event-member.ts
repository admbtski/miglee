import {
  GetEventMemberDocument,
  GetEventMemberQuery,
  GetEventMemberQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';

export const GET_EVENT_MEMBER_KEY = (variables: GetEventMemberQueryVariables) =>
  ['GetEventMember', variables] as const;

export function buildGetEventMemberOptions(
  variables: GetEventMemberQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetEventMemberQuery,
      unknown,
      GetEventMemberQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  GetEventMemberQuery,
  unknown,
  GetEventMemberQuery,
  QueryKey
> {
  return {
    queryKey: GET_EVENT_MEMBER_KEY(variables) as QueryKey,
    queryFn: () =>
      gqlClient.request<GetEventMemberQuery, GetEventMemberQueryVariables>(
        GetEventMemberDocument,
        variables
      ),
    ...(options ?? {}),
  };
}

export function useEventMemberQuery(
  variables: GetEventMemberQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetEventMemberQuery,
      unknown,
      GetEventMemberQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(
    buildGetEventMemberOptions(variables, {
      enabled: !!variables.eventId && !!variables.userId,
      ...(options ?? {}),
    })
  );
}

