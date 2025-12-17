'use client';

import {
  DeleteCommentDocument,
  type DeleteCommentMutation,
  type DeleteCommentMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  useMutation,
  type UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import { commentKeys } from './comments-query-keys';

export function useDeleteComment(
  options?: UseMutationOptions<
    DeleteCommentMutation,
    Error,
    DeleteCommentMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    DeleteCommentMutation,
    Error,
    DeleteCommentMutationVariables
  >({
    mutationKey: ['DeleteComment'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<DeleteCommentMutation>(
        DeleteCommentDocument,
        variables
      );
      return res;
    },
    meta: {
      successMessage: 'Comment deleted',
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.all });
    },
    ...options,
  });
}
