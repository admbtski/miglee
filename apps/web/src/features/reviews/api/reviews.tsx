'use client';

import {
  useMutation,
  type UseMutationOptions,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import {
  CreateReviewDocument,
  type CreateReviewMutation,
  type CreateReviewMutationVariables,
  DeleteReviewDocument,
  type DeleteReviewMutation,
  type DeleteReviewMutationVariables,
  HideReviewDocument,
  type HideReviewMutation,
  type HideReviewMutationVariables,
  UnhideReviewDocument,
  type UnhideReviewMutation,
  type UnhideReviewMutationVariables,
  GetMyReviewDocument,
  type GetMyReviewQuery,
  type GetMyReviewQueryVariables,
  GetReviewDocument,
  type GetReviewQuery,
  type GetReviewQueryVariables,
  GetReviewsDocument,
  type GetReviewsQuery,
  type GetReviewsQueryVariables,
  GetReviewStatsDocument,
  type GetReviewStatsQuery,
  type GetReviewStatsQueryVariables,
  UpdateReviewDocument,
  type UpdateReviewMutation,
  type UpdateReviewMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';

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
  stats: (eventId: string) => [...reviewKeys.all, 'stats', eventId] as const,
  myReview: (eventId: string) => [...reviewKeys.all, 'my', eventId] as const,
};

// =============================================================================
// Queries
// =============================================================================

/**
 * Get reviews for an event
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
        GetReviewsDocument,
        variables
      );
      return res;
    },
    enabled: !!variables.eventId,
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
        GetReviewDocument,
        variables
      );
      return res;
    },
    enabled: !!variables.id,
    ...options,
  });
}

/**
 * Get review statistics for an event
 */
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

/**
 * Get current user's review for an event
 */
export function useGetMyReview(
  variables: GetMyReviewQueryVariables,
  options?: Omit<
    UseQueryOptions<GetMyReviewQuery, Error>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<GetMyReviewQuery, Error>({
    queryKey: reviewKeys.myReview(variables.eventId),
    queryFn: async () => {
      const res = await gqlClient.request<GetMyReviewQuery>(
        GetMyReviewDocument,
        variables
      );
      return res;
    },
    enabled: !!variables.eventId,
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
    mutationKey: ['CreateReview'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<CreateReviewMutation>(
        CreateReviewDocument,
        variables
      );
      return res;
    },
    meta: {
      successMessage: 'Review submitted successfully',
    },
    onSuccess: (_data, variables) => {
      // Invalidate reviews list for this event
      queryClient.invalidateQueries({
        queryKey: reviewKeys.lists(),
      });

      // Invalidate review stats
      queryClient.invalidateQueries({
        queryKey: reviewKeys.stats(variables.input.eventId),
      });

      // Invalidate my review
      queryClient.invalidateQueries({
        queryKey: reviewKeys.myReview(variables.input.eventId),
      });

      // Invalidate event query
      queryClient.invalidateQueries({
        queryKey: ['events', 'detail', variables.input.eventId],
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
    mutationKey: ['UpdateReview'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<UpdateReviewMutation>(
        UpdateReviewDocument,
        variables
      );
      return res;
    },
    meta: {
      successMessage: 'Review updated successfully',
    },
    onSuccess: (_data, variables) => {
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
    mutationKey: ['DeleteReview'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<DeleteReviewMutation>(
        DeleteReviewDocument,
        variables
      );
      return res;
    },
    meta: {
      successMessage: 'Review deleted successfully',
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
    ...options,
  });
}

/**
 * Hide a review (moderation)
 */
export function useHideReview(
  options?: UseMutationOptions<
    HideReviewMutation,
    Error,
    HideReviewMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<HideReviewMutation, Error, HideReviewMutationVariables>({
    mutationKey: ['HideReview'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<HideReviewMutation>(
        HideReviewDocument,
        variables
      );
      return res;
    },
    meta: {
      successMessage: 'Review hidden',
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
    ...options,
  });
}

/**
 * Unhide a review (moderation)
 */
export function useUnhideReview(
  options?: UseMutationOptions<
    UnhideReviewMutation,
    Error,
    UnhideReviewMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    UnhideReviewMutation,
    Error,
    UnhideReviewMutationVariables
  >({
    mutationKey: ['UnhideReview'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<UnhideReviewMutation>(
        UnhideReviewDocument,
        variables
      );
      return res;
    },
    meta: {
      successMessage: 'Review restored',
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
    ...options,
  });
}
