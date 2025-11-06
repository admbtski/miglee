'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  type UseQueryOptions,
  type UseMutationOptions,
  type UseInfiniteQueryOptions,
} from '@tanstack/react-query';
import {
  type GetIntentMessagesQuery,
  type GetIntentMessagesQueryVariables,
  type GetIntentUnreadCountQuery,
  type GetIntentUnreadCountQueryVariables,
  type SendIntentMessageMutation,
  type SendIntentMessageMutationVariables,
  type EditIntentMessageMutation,
  type EditIntentMessageMutationVariables,
  type DeleteIntentMessageMutation,
  type DeleteIntentMessageMutationVariables,
  type MarkIntentChatReadMutation,
  type MarkIntentChatReadMutationVariables,
  type MuteIntentMutation,
  type MuteIntentMutationVariables,
  SendIntentMessageDocument,
  EditIntentMessageDocument,
  DeleteIntentMessageDocument,
  MarkIntentChatReadDocument,
  MuteIntentDocument,
  GetIntentMessagesDocument,
  GetIntentUnreadCountDocument,
} from './__generated__/react-query-update';
import { gqlClient } from './client';

// =============================================================================
// Query Keys
// =============================================================================

export const eventChatKeys = {
  all: ['eventChat'] as const,
  messages: (intentId: string) =>
    [...eventChatKeys.all, 'messages', intentId] as const,
  unreadCount: (intentId: string) =>
    [...eventChatKeys.all, 'unread', intentId] as const,
};

// =============================================================================
// Queries
// =============================================================================

/**
 * Get messages for an intent (infinite scroll with cursor pagination)
 */
export function useGetIntentMessages(
  variables: GetIntentMessagesQueryVariables,
  options?: Omit<
    UseInfiniteQueryOptions<GetIntentMessagesQuery, Error>,
    'queryKey' | 'queryFn' | 'getNextPageParam'
  >
) {
  return useInfiniteQuery<GetIntentMessagesQuery, Error>({
    queryKey: eventChatKeys.messages(variables.intentId),
    queryFn: async ({ pageParam }) => {
      const res = await gqlClient.request<GetIntentMessagesQuery>(
        GetIntentMessagesDocument,
        {
          ...variables,
          after: pageParam as string | undefined,
        }
      );
      return res;
    },
    getNextPageParam: (lastPage) => {
      const hasMore = lastPage.intentMessages.hasMore;
      const endCursor = lastPage.intentMessages.pageInfo.endCursor;
      return hasMore && endCursor ? endCursor : undefined;
    },
    enabled: !!variables.intentId,
    ...options,
  });
}

/**
 * Get unread count for intent chat
 */
export function useGetIntentUnreadCount(
  variables: GetIntentUnreadCountQueryVariables,
  options?: Omit<
    UseQueryOptions<GetIntentUnreadCountQuery, Error>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<GetIntentUnreadCountQuery, Error>({
    queryKey: eventChatKeys.unreadCount(variables.intentId),
    queryFn: async () => {
      const res = await gqlClient.request<GetIntentUnreadCountQuery>(
        GetIntentUnreadCountDocument,
        variables
      );
      return res;
    },
    enabled: !!variables.intentId,
    refetchInterval: 30000, // Refetch every 30 seconds
    ...options,
  });
}

// =============================================================================
// Mutations
// =============================================================================

/**
 * Send a message in event chat
 */
export function useSendIntentMessage(
  options?: UseMutationOptions<
    SendIntentMessageMutation,
    Error,
    SendIntentMessageMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    SendIntentMessageMutation,
    Error,
    SendIntentMessageMutationVariables
  >({
    mutationFn: async (variables) => {
      const res = await gqlClient.request<SendIntentMessageMutation>(
        SendIntentMessageDocument,
        variables
      );
      return res;
    },
    onSuccess: (data, variables) => {
      // Invalidate messages list
      queryClient.invalidateQueries({
        queryKey: eventChatKeys.messages(variables.input.intentId),
      });

      // Invalidate unread count
      queryClient.invalidateQueries({
        queryKey: eventChatKeys.unreadCount(variables.input.intentId),
      });

      // Invalidate intent query to update messagesCount
      queryClient.invalidateQueries({
        queryKey: ['intents', 'detail', variables.input.intentId],
      });
    },
    ...options,
  });
}

/**
 * Edit a message
 */
export function useEditIntentMessage(
  options?: UseMutationOptions<
    EditIntentMessageMutation,
    Error,
    EditIntentMessageMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    EditIntentMessageMutation,
    Error,
    EditIntentMessageMutationVariables
  >({
    mutationFn: async (variables) => {
      const res = await gqlClient.request<EditIntentMessageMutation>(
        EditIntentMessageDocument,
        variables
      );
      return res;
    },
    onSuccess: () => {
      // Invalidate all messages (we don't know which intent)
      queryClient.invalidateQueries({
        queryKey: eventChatKeys.all,
      });
    },
    ...options,
  });
}

/**
 * Delete a message
 */
export function useDeleteIntentMessage(
  options?: UseMutationOptions<
    DeleteIntentMessageMutation,
    Error,
    DeleteIntentMessageMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    DeleteIntentMessageMutation,
    Error,
    DeleteIntentMessageMutationVariables
  >({
    mutationFn: async (variables) => {
      const res = await gqlClient.request<DeleteIntentMessageMutation>(
        DeleteIntentMessageDocument,
        variables
      );
      return res;
    },
    onSuccess: () => {
      // Invalidate all messages
      queryClient.invalidateQueries({
        queryKey: eventChatKeys.all,
      });
    },
    ...options,
  });
}

/**
 * Mark intent chat as read
 */
export function useMarkIntentChatRead(
  options?: UseMutationOptions<
    MarkIntentChatReadMutation,
    Error,
    MarkIntentChatReadMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    MarkIntentChatReadMutation,
    Error,
    MarkIntentChatReadMutationVariables
  >({
    mutationFn: async (variables) => {
      const res = await gqlClient.request<MarkIntentChatReadMutation>(
        MarkIntentChatReadDocument,
        variables
      );
      return res;
    },
    onSuccess: (data, variables) => {
      // Invalidate unread count
      queryClient.invalidateQueries({
        queryKey: eventChatKeys.unreadCount(variables.intentId),
      });
    },
    ...options,
  });
}

/**
 * Mute/unmute an intent chat
 */
export function useMuteIntent(
  options?: UseMutationOptions<
    MuteIntentMutation,
    Error,
    MuteIntentMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<MuteIntentMutation, Error, MuteIntentMutationVariables>({
    mutationFn: async (variables) => {
      const res = await gqlClient.request<MuteIntentMutation>(
        MuteIntentDocument,
        variables
      );
      return res;
    },
    onSuccess: (_, variables) => {
      // Invalidate intent query to update mute status
      queryClient.invalidateQueries({
        queryKey: ['intents', 'detail', variables.intentId],
      });
    },
    ...options,
  });
}
