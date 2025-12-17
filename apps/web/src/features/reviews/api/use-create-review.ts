'use client';

import {
  CreateReviewDocument,
  type CreateReviewMutation,
  type CreateReviewMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  useMutation,
  type UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import { reviewKeys } from './reviews-query-keys';

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
