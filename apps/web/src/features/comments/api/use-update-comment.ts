'use client';

import {
  UpdateCommentDocument,
  type UpdateCommentMutation,
  type UpdateCommentMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  useMutation,
  type UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import { commentKeys } from './comments-query-keys';

export function useUpdateComment(
  options?: UseMutationOptions<
    UpdateCommentMutation,
    Error,
    UpdateCommentMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateCommentMutation,
    Error,
    UpdateCommentMutationVariables
  >({
    mutationKey: ['UpdateComment'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<UpdateCommentMutation>(
        UpdateCommentDocument,
        variables
      );
      return res;
    },
    meta: {
      successMessage: 'Comment updated',
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: commentKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: commentKeys.lists(),
      });
    },
    ...options,
  });
}
