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
  type PublishIntentTypingMutation,
  type PublishIntentTypingMutationVariables,
  SendIntentMessageDocument,
  EditIntentMessageDocument,
  DeleteIntentMessageDocument,
  MarkIntentChatReadDocument,
  MuteIntentDocument,
  PublishIntentTypingDocument,
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
/**
 * Get messages with infinite scroll (cursor-based, reverse)
 * Loads newest messages first, then older messages with `before` cursor
 */
export function useGetIntentMessages(
  intentId: string,
  options?: Omit<
    UseInfiniteQueryOptions<GetIntentMessagesQuery, Error>,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam' | 'select'
  >
) {
  return useInfiniteQuery<GetIntentMessagesQuery, Error>({
    queryKey: eventChatKeys.messages(intentId),
    queryFn: async ({ pageParam }) => {
      const res = await gqlClient.request<GetIntentMessagesQuery>(
        GetIntentMessagesDocument,
        {
          intentId,
          first: 20,
          before: pageParam as string | undefined,
        }
      );
      return res;
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      // For reverse scroll: "next" page is actually older messages (before cursor)
      if (lastPage.intentMessages.pageInfo.hasPreviousPage) {
        return lastPage.intentMessages.pageInfo.startCursor;
      }
      return undefined;
    },
    enabled: !!intentId,
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
    mutationKey: ['SendIntentMessage'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<SendIntentMessageMutation>(
        SendIntentMessageDocument,
        variables
      );
      return res;
    },
    meta: {
      successMessage: 'Message sent',
    },
    onSuccess: (_, variables) => {
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
    mutationKey: ['EditIntentMessage'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<EditIntentMessageMutation>(
        EditIntentMessageDocument,
        variables
      );
      return res;
    },
    meta: {
      successMessage: 'Message updated',
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
    mutationKey: ['DeleteIntentMessage'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<DeleteIntentMessageMutation>(
        DeleteIntentMessageDocument,
        variables
      );
      return res;
    },
    meta: {
      successMessage: 'Message deleted',
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
    mutationKey: ['MarkIntentChatRead'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<MarkIntentChatReadMutation>(
        MarkIntentChatReadDocument,
        variables
      );
      return res;
    },
    // No toast for this - it's a background action
    onSuccess: (_, variables) => {
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
    mutationKey: ['MuteIntent'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<MuteIntentMutation>(
        MuteIntentDocument,
        variables
      );
      return res;
    },
    meta: {
      successMessage: 'Chat muted successfully',
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

/**
 * Publish typing indicator for intent chat
 */
export function usePublishIntentTyping(
  options?: UseMutationOptions<
    PublishIntentTypingMutation,
    Error,
    PublishIntentTypingMutationVariables
  >
) {
  return useMutation<
    PublishIntentTypingMutation,
    Error,
    PublishIntentTypingMutationVariables
  >({
    mutationKey: ['PublishIntentTyping'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<PublishIntentTypingMutation>(
        PublishIntentTypingDocument,
        variables
      );
      return res;
    },
    // No toast for typing indicator - it's a background action
    ...options,
  });
}
