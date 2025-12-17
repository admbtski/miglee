'use client';

import {
  MyEventSponsorshipsDocument,
  type MyEventSponsorshipsQuery,
  type MyEventSponsorshipsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { billingKeys } from './billing-query-keys';

export function useMyEventSponsorships(
  variables?: MyEventSponsorshipsQueryVariables,
  options?: Omit<
    UseQueryOptions<MyEventSponsorshipsQuery, Error, MyEventSponsorshipsQuery>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: billingKeys.myEventSponsorships(variables?.limit ?? undefined),
    queryFn: async () =>
      gqlClient.request(MyEventSponsorshipsDocument, variables ?? {}),
    ...options,
  });
}
