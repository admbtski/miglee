'use client';

import {
  MyPlanPeriodsDocument,
  type MyPlanPeriodsQuery,
  type MyPlanPeriodsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { billingKeys } from './billing-query-keys';

export function useMyPlanPeriods(
  variables?: MyPlanPeriodsQueryVariables,
  options?: Omit<
    UseQueryOptions<MyPlanPeriodsQuery, Error, MyPlanPeriodsQuery>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: billingKeys.myPlanPeriods(variables?.limit ?? undefined),
    queryFn: async () =>
      gqlClient.request(MyPlanPeriodsDocument, variables ?? {}),
    ...options,
  });
}
