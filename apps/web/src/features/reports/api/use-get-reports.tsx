'use client';

import {
  GetReportsDocument,
  type GetReportsQuery,
  type GetReportsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { reportKeys } from './reports-query-keys';

export function useGetReports(
  variables?: GetReportsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetReportsQuery, Error>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<GetReportsQuery, Error>({
    queryKey: reportKeys.list(variables),
    queryFn: async () => {
      const res = await gqlClient.request<GetReportsQuery>(
        GetReportsDocument,
        variables
      );
      return res;
    },
    ...options,
  });
}
