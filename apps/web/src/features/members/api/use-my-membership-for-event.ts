import {
  GetMyMembershipForEventDocument,
  GetMyMembershipForEventQuery,
  GetMyMembershipForEventQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';

export const GET_MY_MEMBERSHIP_FOR_EVENT_KEY = (
  variables: GetMyMembershipForEventQueryVariables
) => ['GetMyMembershipForEvent', variables] as const;

export function buildGetMyMembershipForEventOptions(
  variables: GetMyMembershipForEventQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetMyMembershipForEventQuery,
      unknown,
      GetMyMembershipForEventQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  GetMyMembershipForEventQuery,
  unknown,
  GetMyMembershipForEventQuery,
  QueryKey
> {
  return {
    queryKey: GET_MY_MEMBERSHIP_FOR_EVENT_KEY(variables) as QueryKey,
    queryFn: () =>
      gqlClient.request<
        GetMyMembershipForEventQuery,
        GetMyMembershipForEventQueryVariables
      >(GetMyMembershipForEventDocument, variables),
    ...(options ?? {}),
  };
}

export function useMyMembershipForEventQuery(
  variables: GetMyMembershipForEventQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetMyMembershipForEventQuery,
      unknown,
      GetMyMembershipForEventQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(
    buildGetMyMembershipForEventOptions(variables, {
      enabled: !!variables.eventId,
      ...(options ?? {}),
    })
  );
}

