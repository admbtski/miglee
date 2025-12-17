'use client';

import {
  EventSponsorshipDocument,
  type EventSponsorshipQuery,
  type EventSponsorshipQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { billingKeys } from './billing-query-keys';

export function useEventSponsorship(
  variables: EventSponsorshipQueryVariables,
  options?: Omit<
    UseQueryOptions<EventSponsorshipQuery, Error, EventSponsorshipQuery>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: billingKeys.eventSponsorship(variables.eventId),
    queryFn: async () => gqlClient.request(EventSponsorshipDocument, variables),
    ...options,
  });
}
