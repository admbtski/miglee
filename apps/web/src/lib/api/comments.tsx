'use client';

import {
  useMutation,
  type UseMutationOptions,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import {
  CreateCommentDocument,
  type CreateCommentMutation,
  type CreateCommentMutationVariables,
  DeleteCommentDocument,
  type DeleteCommentMutation,
  type DeleteCommentMutationVariables,
  GetCommentDocument,
  type GetCommentQuery,
  type GetCommentQueryVariables,
  GetCommentsDocument,
  type GetCommentsQuery,
  type GetCommentsQueryVariables,
  UpdateCommentDocument,
  type UpdateCommentMutation,
  type UpdateCommentMutationVariables,
} from './__generated__/react-query-update';
import { gqlClient } from './client';

// =============================================================================
// Query Keys
// =============================================================================

export const commentKeys = {
  all: ['comments'] as const,
  lists: () => [...commentKeys.all, 'list'] as const,
  list: (filters?: GetCommentsQueryVariables) =>
    [...commentKeys.lists(), filters] as const,
  details: () => [...commentKeys.all, 'detail'] as const,
  detail: (id: string) => [...commentKeys.details(), id] as const,
};

// =============================================================================
// Queries
// =============================================================================

/**
 * Get comments for an intent
 */
export function useGetComments(
  variables: GetCommentsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetCommentsQuery, Error>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<GetCommentsQuery, Error>({
    queryKey: commentKeys.list(variables),
    queryFn: async () => {
      const res = await gqlClient.request<GetCommentsQuery>(
        GetCommentsDocument,
        variables
      );
      return res;
    },
    enabled: !!variables.intentId,
    ...options,
  });
}

/**
 * Get a single comment with replies
 */
export function useGetComment(
  variables: GetCommentQueryVariables,
  options?: Omit<
    UseQueryOptions<GetCommentQuery, Error>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<GetCommentQuery, Error>({
    queryKey: commentKeys.detail(variables.id),
    queryFn: async () => {
      const res = await gqlClient.request<GetCommentQuery>(
        GetCommentDocument,
        variables
      );
      return res;
    },
    enabled: !!variables.id,
    ...options,
  });
}

// =============================================================================
// Mutations
// =============================================================================

/**
 * Create a new comment
 */
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
    mutationFn: async (variables) => {
      const res = await gqlClient.request<CreateCommentMutation>(
        CreateCommentDocument,
        variables
      );
      return res;
    },
    onSuccess: (data, variables) => {
      // Invalidate comments list for this intent
      queryClient.invalidateQueries({
        queryKey: commentKeys.lists(),
      });

      // Invalidate intent query to update comment count
      queryClient.invalidateQueries({
        queryKey: ['intents', 'detail', variables.input.intentId],
      });
    },
    ...options,
  });
}

/**
 * Update a comment
 */
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
    mutationFn: async (variables) => {
      const res = await gqlClient.request<UpdateCommentMutation>(
        UpdateCommentDocument,
        variables
      );
      return res;
    },
    onSuccess: (data, variables) => {
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

/**
 * Delete a comment
 */
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
    mutationFn: async (variables) => {
      const res = await gqlClient.request<DeleteCommentMutation>(
        DeleteCommentDocument,
        variables
      );
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.all });
    },
    ...options,
  });
}
