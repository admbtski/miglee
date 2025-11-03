'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import type {
  GetReviewsQuery,
  GetReviewsQueryVariables,
  GetReviewQuery,
  GetReviewQueryVariables,
  GetReviewStatsQuery,
  GetReviewStatsQueryVariables,
  GetMyReviewQuery,
  GetMyReviewQueryVariables,
  CreateReviewMutation,
  CreateReviewMutationVariables,
  UpdateReviewMutation,
  UpdateReviewMutationVariables,
  DeleteReviewMutation,
  DeleteReviewMutationVariables,
} from './__generated__/react-query-update';
import { gqlClient } from './client';

// =============================================================================
// Query Keys
// =============================================================================

export const reviewKeys = {
  all: ['reviews'] as const,
  lists: () => [...reviewKeys.all, 'list'] as const,
  list: (filters?: GetReviewsQueryVariables) =>
    [...reviewKeys.lists(), filters] as const,
  details: () => [...reviewKeys.all, 'detail'] as const,
  detail: (id: string) => [...reviewKeys.details(), id] as const,
  stats: (intentId: string) => [...reviewKeys.all, 'stats', intentId] as const,
  myReview: (intentId: string) => [...reviewKeys.all, 'my', intentId] as const,
};

// =============================================================================
// Queries
// =============================================================================

/**
 * Get reviews for an intent
 */
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
        /* GraphQL */ `
          query GetReviews(
            $intentId: ID!
            $limit: Int = 20
            $offset: Int = 0
            $rating: Int
          ) {
            reviews(
              intentId: $intentId
              limit: $limit
              offset: $offset
              rating: $rating
            ) {
              ...ReviewsResultCore
            }
          }
        `,
        variables
      );
      return res;
    },
    enabled: !!variables.intentId,
    ...options,
  });
}

/**
 * Get a single review
 */
export function useGetReview(
  variables: GetReviewQueryVariables,
  options?: Omit<UseQueryOptions<GetReviewQuery, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<GetReviewQuery, Error>({
    queryKey: reviewKeys.detail(variables.id),
    queryFn: async () => {
      const res = await gqlClient.request<GetReviewQuery>(
        /* GraphQL */ `
          query GetReview($id: ID!) {
            review(id: $id) {
              ...ReviewCore
            }
          }
        `,
        variables
      );
      return res;
    },
    enabled: !!variables.id,
    ...options,
  });
}

/**
 * Get review statistics for an intent
 */
export function useGetReviewStats(
  variables: GetReviewStatsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetReviewStatsQuery, Error>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<GetReviewStatsQuery, Error>({
    queryKey: reviewKeys.stats(variables.intentId),
    queryFn: async () => {
      const res = await gqlClient.request<GetReviewStatsQuery>(
        /* GraphQL */ `
          query GetReviewStats($intentId: ID!) {
            reviewStats(intentId: $intentId) {
              ...ReviewStatsCore
            }
          }
        `,
        variables
      );
      return res;
    },
    enabled: !!variables.intentId,
    ...options,
  });
}

/**
 * Get current user's review for an intent
 */
export function useGetMyReview(
  variables: GetMyReviewQueryVariables,
  options?: Omit<
    UseQueryOptions<GetMyReviewQuery, Error>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<GetMyReviewQuery, Error>({
    queryKey: reviewKeys.myReview(variables.intentId),
    queryFn: async () => {
      const res = await gqlClient.request<GetMyReviewQuery>(
        /* GraphQL */ `
          query GetMyReview($intentId: ID!) {
            myReview(intentId: $intentId) {
              ...ReviewCore
            }
          }
        `,
        variables
      );
      return res;
    },
    enabled: !!variables.intentId,
    ...options,
  });
}

// =============================================================================
// Mutations
// =============================================================================

/**
 * Create a new review
 */
export function useCreateReview(
  options?: UseMutationOptions<
    CreateReviewMutation,
    Error,
    CreateReviewMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    CreateReviewMutation,
    Error,
    CreateReviewMutationVariables
  >({
    mutationFn: async (variables) => {
      const res = await gqlClient.request<CreateReviewMutation>(
        /* GraphQL */ `
          mutation CreateReview($input: CreateReviewInput!) {
            createReview(input: $input) {
              ...ReviewCore
            }
          }
        `,
        variables
      );
      return res;
    },
    onSuccess: (data, variables) => {
      // Invalidate reviews list for this intent
      queryClient.invalidateQueries({
        queryKey: reviewKeys.lists(),
      });

      // Invalidate review stats
      queryClient.invalidateQueries({
        queryKey: reviewKeys.stats(variables.input.intentId),
      });

      // Invalidate my review
      queryClient.invalidateQueries({
        queryKey: reviewKeys.myReview(variables.input.intentId),
      });

      // Invalidate intent query
      queryClient.invalidateQueries({
        queryKey: ['intents', 'detail', variables.input.intentId],
      });
    },
    ...options,
  });
}

/**
 * Update a review
 */
export function useUpdateReview(
  options?: UseMutationOptions<
    UpdateReviewMutation,
    Error,
    UpdateReviewMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateReviewMutation,
    Error,
    UpdateReviewMutationVariables
  >({
    mutationFn: async (variables) => {
      const res = await gqlClient.request<UpdateReviewMutation>(
        /* GraphQL */ `
          mutation UpdateReview($id: ID!, $input: UpdateReviewInput!) {
            updateReview(id: $id, input: $input) {
              ...ReviewCore
            }
          }
        `,
        variables
      );
      return res;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: reviewKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.lists(),
      });
      // Invalidate stats as rating might have changed
      queryClient.invalidateQueries({
        queryKey: [...reviewKeys.all, 'stats'],
      });
    },
    ...options,
  });
}

/**
 * Delete a review
 */
export function useDeleteReview(
  options?: UseMutationOptions<
    DeleteReviewMutation,
    Error,
    DeleteReviewMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    DeleteReviewMutation,
    Error,
    DeleteReviewMutationVariables
  >({
    mutationFn: async (variables) => {
      const res = await gqlClient.request<DeleteReviewMutation>(
        /* GraphQL */ `
          mutation DeleteReview($id: ID!) {
            deleteReview(id: $id)
          }
        `,
        variables
      );
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
    ...options,
  });
}
