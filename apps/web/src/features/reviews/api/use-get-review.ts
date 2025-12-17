'use client';

import {
  GetReviewDocument,
  type GetReviewQuery,
  type GetReviewQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { reviewKeys } from './reviews-query-keys';

export function useGetReview(
  variables: GetReviewQueryVariables,
  options?: Omit<UseQueryOptions<GetReviewQuery, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<GetReviewQuery, Error>({
    queryKey: reviewKeys.detail(variables.id),
    queryFn: async () => {
      const res = await gqlClient.request<GetReviewQuery>(
        GetReviewDocument,
        variables
      );
      return res;
    },
    enabled: !!variables.id,
    ...options,
  });
}
