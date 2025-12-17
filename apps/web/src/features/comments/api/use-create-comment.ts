'use client';

import {
  CreateCommentDocument,
  type CreateCommentMutation,
  type CreateCommentMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  useMutation,
  type UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import { commentKeys } from './comments-query-keys';

export function useCreateComment(
  options?: UseMutationOptions<
    CreateCommentMutation,
    Error,
    CreateCommentMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    CreateCommentMutation,
    Error,
    CreateCommentMutationVariables
  >({
    mutationKey: ['CreateComment'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<CreateCommentMutation>(
        CreateCommentDocument,
        variables
      );
      return res;
    },
    meta: {
      successMessage: 'Comment added',
    },
    onSuccess: (_data, variables) => {
      // Invalidate comments list for this event
      queryClient.invalidateQueries({
        queryKey: commentKeys.lists(),
      });

      // Invalidate event query to update comment count
      queryClient.invalidateQueries({
        queryKey: ['events', 'detail', variables.input.eventId],
      });
    },
    ...options,
  });
}
