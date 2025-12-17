'use client';

import {
  GetReviewStatsDocument,
  type GetReviewStatsQuery,
  type GetReviewStatsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { reviewKeys } from './reviews-query-keys';

export function useGetReviewStats(
  variables: GetReviewStatsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetReviewStatsQuery, Error>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<GetReviewStatsQuery, Error>({
    queryKey: reviewKeys.stats(variables.eventId),
    queryFn: async () => {
      const res = await gqlClient.request<GetReviewStatsQuery>(
        GetReviewStatsDocument,
        variables
      );
      return res;
    },
    enabled: !!variables.eventId,
    ...options,
  });
}
