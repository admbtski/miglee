import {
  EventInviteLinkDocument,
  EventInviteLinkQuery,
  EventInviteLinkQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { GET_INVITE_LINK_ONE_KEY } from './invite-links-query-keys';

export function buildGetEventInviteLinkOptions(
  variables: EventInviteLinkQueryVariables,
  options?: Omit<
    UseQueryOptions<
      EventInviteLinkQuery,
      Error,
      EventInviteLinkQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  EventInviteLinkQuery,
  Error,
  EventInviteLinkQuery,
  QueryKey
> {
  return {
    queryKey: GET_INVITE_LINK_ONE_KEY(variables) as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<EventInviteLinkQuery, EventInviteLinkQueryVariables>(
        EventInviteLinkDocument,
        variables
      ),
    ...(options ?? {}),
  };
}

export function useEventInviteLinkQuery(
  variables: EventInviteLinkQueryVariables,
  options?: Omit<
    UseQueryOptions<
      EventInviteLinkQuery,
      Error,
      EventInviteLinkQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetEventInviteLinkOptions(variables, options));
}
