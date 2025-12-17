'use client';

import {
  DeleteReviewDocument,
  type DeleteReviewMutation,
  type DeleteReviewMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  useMutation,
  type UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import { reviewKeys } from './reviews-query-keys';

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
