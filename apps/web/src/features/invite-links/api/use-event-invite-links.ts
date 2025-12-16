import {
  EventInviteLinksDocument,
  EventInviteLinksQuery,
  EventInviteLinksQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { GET_INVITE_LINKS_LIST_KEY } from './invite-links-query-keys';

export function buildGetEventInviteLinksOptions(
  variables: EventInviteLinksQueryVariables,
  options?: Omit<
    UseQueryOptions<
      EventInviteLinksQuery,
      Error,
      EventInviteLinksQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  EventInviteLinksQuery,
  Error,
  EventInviteLinksQuery,
  QueryKey
> {
  return {
    queryKey: GET_INVITE_LINKS_LIST_KEY(variables) as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<EventInviteLinksQuery, EventInviteLinksQueryVariables>(
        EventInviteLinksDocument,
        variables
      ),
    ...(options ?? {}),
  };
}

export function useEventInviteLinksQuery(
  variables: EventInviteLinksQueryVariables,
  options?: Omit<
    UseQueryOptions<
      EventInviteLinksQuery,
      Error,
      EventInviteLinksQuery,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetEventInviteLinksOptions(variables, options));
}
