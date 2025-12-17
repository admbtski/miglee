'use client';

import {
  HideCommentDocument,
  type HideCommentMutation,
  type HideCommentMutationVariables,
  UnhideCommentDocument,
  type UnhideCommentMutation,
  type UnhideCommentMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  useMutation,
  type UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import { commentKeys } from './comments-query-keys';

export function useHideComment(
  options?: UseMutationOptions<
    HideCommentMutation,
    Error,
    HideCommentMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<HideCommentMutation, Error, HideCommentMutationVariables>({
    mutationKey: ['HideComment'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<HideCommentMutation>(
        HideCommentDocument,
        variables
      );
      return res;
    },
    meta: {
      successMessage: 'Comment hidden',
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.all });
    },
    ...options,
  });
}
