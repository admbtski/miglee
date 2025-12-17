'use client';

import {
  UnhideReviewDocument,
  type UnhideReviewMutation,
  type UnhideReviewMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  useMutation,
  type UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import { reviewKeys } from './reviews-query-keys';

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
