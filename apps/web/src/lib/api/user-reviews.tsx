import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { gqlClient } from './client';
import {
  GetUserReviewsDocument,
  type GetUserReviewsQuery,
  type GetUserReviewsQueryVariables,
} from './__generated__/react-query-update';

export const USER_REVIEWS_KEY = 'userReviews';

export function buildUserReviewsOptions(
  variables: GetUserReviewsQueryVariables,
  options?: Partial<UseQueryOptions<GetUserReviewsQuery>>
): any {
  return {
    queryKey: [USER_REVIEWS_KEY, variables],
    queryFn: async () => {
      return gqlClient.request(GetUserReviewsDocument, variables);
    },
    ...options,
  };
}

export function useUserReviewsQuery(
  variables: GetUserReviewsQueryVariables,
  options?: Partial<UseQueryOptions<GetUserReviewsQuery>>
) {
  return useQuery(buildUserReviewsOptions(variables, options));
}
