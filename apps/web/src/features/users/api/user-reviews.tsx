import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';
import {
  GetUserReviewsDocument,
  type GetUserReviewsQuery,
  type GetUserReviewsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';

export const USER_REVIEWS_KEY = 'userReviews';

export function buildUserReviewsOptions(
  variables: GetUserReviewsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetUserReviewsQuery, Error, GetUserReviewsQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<GetUserReviewsQuery, Error, GetUserReviewsQuery, QueryKey> {
  return {
    queryKey: [USER_REVIEWS_KEY, variables],
    queryFn: async () =>
      gqlClient.request<GetUserReviewsQuery, GetUserReviewsQueryVariables>(
        GetUserReviewsDocument,
        variables
      ),
    ...(options ?? {}),
  };
}

export function useUserReviewsQuery(
  variables: GetUserReviewsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetUserReviewsQuery, Error, GetUserReviewsQuery, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildUserReviewsOptions(variables, options));
}
