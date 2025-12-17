'use client';

import {
  GetReviewsDocument,
  type GetReviewsQuery,
  type GetReviewsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { reviewKeys } from './reviews-query-keys';

export function useGetReviews(
  variables: GetReviewsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetReviewsQuery, Error>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<GetReviewsQuery, Error>({
    queryKey: reviewKeys.list(variables),
    queryFn: async () => {
      const res = await gqlClient.request<GetReviewsQuery>(
        GetReviewsDocument,
        variables
      );
      return res;
    },
    enabled: !!variables.eventId,
    ...options,
  });
}
