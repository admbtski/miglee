'use client';

import {
  MySubscriptionDocument,
  type MySubscriptionQuery,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { billingKeys } from './billing-query-keys';

export function useMySubscription(
  options?: Omit<
    UseQueryOptions<MySubscriptionQuery, Error, MySubscriptionQuery>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: billingKeys.mySubscription(),
    queryFn: async () => gqlClient.request(MySubscriptionDocument),
    ...options,
  });
}
