'use client';

import {
  MyPlanDocument,
  type MyPlanQuery,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { billingKeys } from './billing-query-keys';

export function useMyPlan(
  options?: Omit<
    UseQueryOptions<MyPlanQuery, Error, MyPlanQuery>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: billingKeys.myPlan(),
    queryFn: async () => gqlClient.request(MyPlanDocument),
    ...options,
  });
}
