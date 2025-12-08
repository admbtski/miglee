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
  type GetEventMessagesQuery,
  type GetEventUnreadCountQuery,
  type GetEventUnreadCountQueryVariables,
  type SendEventMessageMutation,
  type SendEventMessageMutationVariables,
  type MarkEventChatReadMutation,
  type MarkEventChatReadMutationVariables,
  type MuteEventMutation,
  type MuteEventMutationVariables,
  type PublishEventTypingMutation,
  type PublishEventTypingMutationVariables,
  SendEventMessageDocument,
  MarkEventChatReadDocument,
  MuteEventDocument,
  PublishEventTypingDocument,
  GetEventMessagesDocument,
  GetEventUnreadCountDocument,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';

// =============================================================================
// Query Keys
// =============================================================================

export const eventChatKeys = {
  all: ['eventChat'] as const,
  messages: (eventId: string) =>
    [...eventChatKeys.all, 'messages', eventId] as const,
  unreadCount: (eventId: string) =>
    [...eventChatKeys.all, 'unread', eventId] as const,
};

// =============================================================================
// Queries
// =============================================================================

/**
 * Get messages for an event (infinite scroll with cursor pagination)
 */
/**
 * Get messages with infinite scroll (cursor-based, reverse)
 * Loads newest messages first, then older messages with `before` cursor
 */
export function useGetEventMessages(
  eventId: string,
  options?: Omit<
    UseInfiniteQueryOptions<GetEventMessagesQuery, Error>,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam' | 'select'
  >
) {
  return useInfiniteQuery<GetEventMessagesQuery, Error>({
    queryKey: eventChatKeys.messages(eventId),
    queryFn: async ({ pageParam }) => {
      const res = await gqlClient.request<GetEventMessagesQuery>(
        GetEventMessagesDocument,
        {
          eventId,
          first: 20,
          before: pageParam as string | undefined,
        }
      );
      return res;
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      // For reverse scroll: "next" page is actually older messages (before cursor)
      if (lastPage.eventMessages.pageInfo.hasPreviousPage) {
        return lastPage.eventMessages.pageInfo.startCursor;
      }
      return undefined;
    },
    enabled: !!eventId,
    ...options,
  });
}

/**
 * Get unread count for event chat
 */
export function useGetEventUnreadCount(
  variables: GetEventUnreadCountQueryVariables,
  options?: Omit<
    UseQueryOptions<GetEventUnreadCountQuery, Error>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<GetEventUnreadCountQuery, Error>({
    queryKey: eventChatKeys.unreadCount(variables.eventId),
    queryFn: async () => {
      const res = await gqlClient.request<GetEventUnreadCountQuery>(
        GetEventUnreadCountDocument,
        variables
      );
      return res;
    },
    enabled: !!variables.eventId,
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
export function useSendEventMessage(
  options?: UseMutationOptions<
    SendEventMessageMutation,
    Error,
    SendEventMessageMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    SendEventMessageMutation,
    Error,
    SendEventMessageMutationVariables
  >({
    mutationKey: ['SendEventMessage'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<SendEventMessageMutation>(
        SendEventMessageDocument,
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
        queryKey: eventChatKeys.messages(variables.input.eventId),
      });

      // Invalidate unread count
      queryClient.invalidateQueries({
        queryKey: eventChatKeys.unreadCount(variables.input.eventId),
      });

      // Invalidate event query to update messagesCount
      queryClient.invalidateQueries({
        queryKey: ['events', 'detail', variables.input.eventId],
      });
    },
    ...options,
  });
}

// NOTE: useEditEventMessage and useDeleteEventMessage have been moved to message-actions.tsx
// to avoid duplication and better organize message action hooks

/**
 * Mark event chat as read
 */
export function useMarkEventChatRead(
  options?: UseMutationOptions<
    MarkEventChatReadMutation,
    Error,
    MarkEventChatReadMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    MarkEventChatReadMutation,
    Error,
    MarkEventChatReadMutationVariables
  >({
    mutationKey: ['MarkEventChatRead'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<MarkEventChatReadMutation>(
        MarkEventChatReadDocument,
        variables
      );
      return res;
    },
    // No toast for this - it's a background action
    onSuccess: (_, variables) => {
      // Invalidate unread count
      queryClient.invalidateQueries({
        queryKey: eventChatKeys.unreadCount(variables.eventId),
      });
    },
    ...options,
  });
}

/**
 * Mute/unmute an event chat
 */
export function useMuteEvent(
  options?: UseMutationOptions<
    MuteEventMutation,
    Error,
    MuteEventMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<MuteEventMutation, Error, MuteEventMutationVariables>({
    mutationKey: ['MuteEvent'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<MuteEventMutation>(
        MuteEventDocument,
        variables
      );
      return res;
    },
    meta: {
      successMessage: 'Chat muted successfully',
    },
    onSuccess: (_, variables) => {
      // Invalidate event query to update mute status
      queryClient.invalidateQueries({
        queryKey: ['events', 'detail', variables.eventId],
      });
    },
    ...options,
  });
}

/**
 * Publish typing indicator for event chat
 */
export function usePublishEventTyping(
  options?: UseMutationOptions<
    PublishEventTypingMutation,
    Error,
    PublishEventTypingMutationVariables
  >
) {
  return useMutation<
    PublishEventTypingMutation,
    Error,
    PublishEventTypingMutationVariables
  >({
    mutationKey: ['PublishEventTyping'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<PublishEventTypingMutation>(
        PublishEventTypingDocument,
        variables
      );
      return res;
    },
    // No toast for typing indicator - it's a background action
    ...options,
  });
}
