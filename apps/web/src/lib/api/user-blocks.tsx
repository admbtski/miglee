'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';
import {
  BlockUserDocument,
  GetMyBlocksDocument,
  IsBlockedDocument,
  UnblockUserDocument,
  type BlockUserMutation,
  type BlockUserMutationVariables,
  type GetMyBlocksQuery,
  type GetMyBlocksQueryVariables,
  type IsBlockedQuery,
  type IsBlockedQueryVariables,
  type UnblockUserMutation,
  type UnblockUserMutationVariables,
} from './__generated__/react-query-update';
import { gqlClient } from './client';

// =============================================================================
// Query Keys
// =============================================================================

export const userBlockKeys = {
  all: ['userBlocks'] as const,
  lists: () => [...userBlockKeys.all, 'list'] as const,
  list: (filters?: GetMyBlocksQueryVariables) =>
    [...userBlockKeys.lists(), filters] as const,
  isBlocked: (userId: string) =>
    [...userBlockKeys.all, 'isBlocked', userId] as const,
};

// =============================================================================
// Queries
// =============================================================================

/**
 * Get my blocks (users I've blocked)
 */
export function useGetMyBlocks(
  variables?: GetMyBlocksQueryVariables,
  options?: Omit<
    UseQueryOptions<GetMyBlocksQuery, Error>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<GetMyBlocksQuery, Error>({
    queryKey: userBlockKeys.list(variables),
    queryFn: async () => {
      const res = await gqlClient.request<GetMyBlocksQuery>(
        GetMyBlocksDocument,
        variables
      );
      return res;
    },
    ...options,
  });
}

/**
 * Check if a user is blocked
 */
export function useIsBlocked(
  variables: IsBlockedQueryVariables,
  options?: Omit<UseQueryOptions<IsBlockedQuery, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<IsBlockedQuery, Error>({
    queryKey: userBlockKeys.isBlocked(variables.userId),
    queryFn: async () => {
      const res = await gqlClient.request<IsBlockedQuery>(
        IsBlockedDocument,
        variables
      );
      return res;
    },
    enabled: !!variables.userId,
    ...options,
  });
}

// =============================================================================
// Mutations
// =============================================================================

/**
 * Block a user
 */
export function useBlockUser(
  options?: UseMutationOptions<
    BlockUserMutation,
    Error,
    BlockUserMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<BlockUserMutation, Error, BlockUserMutationVariables>({
    mutationKey: ['BlockUser'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<BlockUserMutation>(
        BlockUserDocument,
        variables
      );
      return res;
    },
    meta: {
      successMessage: 'User blocked successfully',
    },
    onSuccess: (data, variables) => {
      // Invalidate blocks list
      queryClient.invalidateQueries({ queryKey: userBlockKeys.lists() });
      // Invalidate isBlocked for this user
      queryClient.invalidateQueries({
        queryKey: userBlockKeys.isBlocked(variables.userId),
      });
    },
    ...options,
  });
}

/**
 * Unblock a user
 */
export function useUnblockUser(
  options?: UseMutationOptions<
    UnblockUserMutation,
    Error,
    UnblockUserMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<UnblockUserMutation, Error, UnblockUserMutationVariables>({
    mutationKey: ['UnblockUser'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<UnblockUserMutation>(
        UnblockUserDocument,
        variables
      );
      return res;
    },
    meta: {
      successMessage: 'User unblocked successfully',
    },
    onSuccess: (data, variables) => {
      // Invalidate blocks list
      queryClient.invalidateQueries({ queryKey: userBlockKeys.lists() });
      // Invalidate isBlocked for this user
      queryClient.invalidateQueries({
        queryKey: userBlockKeys.isBlocked(variables.userId),
      });
    },
    ...options,
  });
}
