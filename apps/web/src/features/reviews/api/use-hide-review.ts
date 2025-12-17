'use client';

import {
  HideReviewDocument,
  type HideReviewMutation,
  type HideReviewMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  useMutation,
  type UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import { reviewKeys } from './reviews-query-keys';

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
