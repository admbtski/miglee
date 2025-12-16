'use client';

import {
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
import { commentKeys } from './comment-query-keys';

export function useUnhideComment(
  options?: UseMutationOptions<
    UnhideCommentMutation,
    Error,
    UnhideCommentMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    UnhideCommentMutation,
    Error,
    UnhideCommentMutationVariables
  >({
    mutationKey: ['UnhideComment'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<UnhideCommentMutation>(
        UnhideCommentDocument,
        variables
      );
      return res;
    },
    meta: {
      successMessage: 'Comment restored',
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.all });
    },
    ...options,
  });
}
