'use client';

import {
  UpdateReviewDocument,
  type UpdateReviewMutation,
  type UpdateReviewMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  useMutation,
  type UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import { reviewKeys } from './reviews-query-keys';

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
