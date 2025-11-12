'use client';

import {
  useMutation,
  type UseMutationOptions,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
  useInfiniteQuery,
  type UseInfiniteQueryOptions,
} from '@tanstack/react-query';
import {
  CreateOrGetDmThreadDocument,
  type CreateOrGetDmThreadMutation,
  type CreateOrGetDmThreadMutationVariables,
  DeleteDmMessageDocument,
  type DeleteDmMessageMutation,
  type DeleteDmMessageMutationVariables,
  DeleteDmThreadDocument,
  type DeleteDmThreadMutation,
  type DeleteDmThreadMutationVariables,
  GetDmMessagesDocument,
  type GetDmMessagesQuery,
  type GetDmMessagesQueryVariables,
  GetDmThreadDocument,
  type GetDmThreadQuery,
  type GetDmThreadQueryVariables,
  GetDmThreadsDocument,
  type GetDmThreadsQuery,
  type GetDmThreadsQueryVariables,
  MarkDmMessageReadDocument,
  type MarkDmMessageReadMutation,
  type MarkDmMessageReadMutationVariables,
  MarkDmThreadReadDocument,
  type MarkDmThreadReadMutation,
  type MarkDmThreadReadMutationVariables,
  MuteDmThreadDocument,
  type MuteDmThreadMutation,
  type MuteDmThreadMutationVariables,
  SendDmMessageDocument,
  type SendDmMessageMutation,
  type SendDmMessageMutationVariables,
  UpdateDmMessageDocument,
  type UpdateDmMessageMutation,
  type UpdateDmMessageMutationVariables,
  PublishDmTypingDocument,
  type PublishDmTypingMutation,
  type PublishDmTypingMutationVariables,
} from './__generated__/react-query-update';
import { gqlClient } from './client';

// =============================================================================
// Query Keys
// =============================================================================

export const dmKeys = {
  all: ['dm'] as const,
  threads: () => [...dmKeys.all, 'threads'] as const,
  threadsList: (filters?: GetDmThreadsQueryVariables) =>
    [...dmKeys.threads(), filters] as const,
  thread: (id?: string, otherUserId?: string) =>
    [...dmKeys.threads(), 'detail', id, otherUserId] as const,
  messages: (
    threadId: string,
    filters?: Omit<GetDmMessagesQueryVariables, 'threadId'>
  ) => [...dmKeys.all, 'messages', threadId, filters] as const,
  mute: (threadId: string) => [...dmKeys.all, 'mute', threadId] as const,
};

// =============================================================================
// Queries
// =============================================================================

/**
 * Get all DM threads for current user
 */
export function useGetDmThreads(
  variables?: GetDmThreadsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetDmThreadsQuery, Error>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<GetDmThreadsQuery, Error>({
    queryKey: dmKeys.threadsList(variables),
    queryFn: async () => {
      const res = await gqlClient.request<GetDmThreadsQuery>(
        GetDmThreadsDocument,
        variables
      );
      return res;
    },
    ...options,
  });
}

/**
 * Get a specific DM thread
 */
export function useGetDmThread(
  variables: GetDmThreadQueryVariables,
  options?: Omit<
    UseQueryOptions<GetDmThreadQuery, Error>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<GetDmThreadQuery, Error>({
    queryKey: dmKeys.thread(variables.id!, variables.otherUserId!),
    queryFn: async () => {
      const res = await gqlClient.request<GetDmThreadQuery>(
        GetDmThreadDocument,
        variables
      );
      return res;
    },
    enabled: !!(variables.id || variables.otherUserId),
    ...options,
  });
}

/**
 * Get messages in a thread (legacy - for backward compatibility)
 */
export function useGetDmMessages(
  variables: GetDmMessagesQueryVariables,
  options?: Omit<
    UseQueryOptions<GetDmMessagesQuery, Error>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<GetDmMessagesQuery, Error>({
    queryKey: dmKeys.messages(variables.threadId, {
      first: variables.first,
      before: variables.before,
      after: variables.after,
    }),
    queryFn: async () => {
      const res = await gqlClient.request<GetDmMessagesQuery>(
        GetDmMessagesDocument,
        variables
      );
      return res;
    },
    enabled: !!variables.threadId,
    ...options,
  });
}

/**
 * Get messages with infinite scroll (cursor-based, reverse)
 * Loads newest messages first, then older messages with `before` cursor
 */
export function useGetDmMessagesInfinite(
  threadId: string,
  options?: Omit<
    UseInfiniteQueryOptions<GetDmMessagesQuery, Error>,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
  >
) {
  return useInfiniteQuery<GetDmMessagesQuery, Error>({
    queryKey: dmKeys.messages(threadId, { infinite: true }),
    queryFn: async ({ pageParam }) => {
      const res = await gqlClient.request<GetDmMessagesQuery>(
        GetDmMessagesDocument,
        {
          threadId,
          first: 20,
          before: pageParam as string | undefined,
        }
      );
      return res;
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      // For reverse scroll: "next" page is actually older messages (before cursor)
      if (lastPage.dmMessages.pageInfo.hasPreviousPage) {
        return lastPage.dmMessages.pageInfo.startCursor;
      }
      return undefined;
    },
    enabled: !!threadId,
    ...options,
  });
}

// =============================================================================
// Mutations
// =============================================================================

/**
 * Create or get existing DM thread
 */
export function useCreateOrGetDmThread(
  options?: UseMutationOptions<
    CreateOrGetDmThreadMutation,
    Error,
    CreateOrGetDmThreadMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    CreateOrGetDmThreadMutation,
    Error,
    CreateOrGetDmThreadMutationVariables
  >({
    mutationKey: ['CreateOrGetDmThread'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<CreateOrGetDmThreadMutation>(
        CreateOrGetDmThreadDocument,
        variables
      );
      return res;
    },
    meta: {
      successMessage: 'Conversation started',
    },
    onSuccess: (data) => {
      // Invalidate threads list
      queryClient.invalidateQueries({ queryKey: dmKeys.threads() });

      // Cache the thread
      const thread = data.createOrGetDmThread;
      if (thread) {
        queryClient.setQueryData(dmKeys.thread(thread.id), {
          dmThread: thread,
        });
      }
    },
    ...options,
  });
}

/**
 * Send a new DM message
 */
export function useSendDmMessage(
  options?: UseMutationOptions<
    SendDmMessageMutation,
    Error,
    SendDmMessageMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    SendDmMessageMutation,
    Error,
    SendDmMessageMutationVariables
  >({
    mutationKey: ['SendDmMessage'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<SendDmMessageMutation>(
        SendDmMessageDocument,
        variables
      );
      return res;
    },
    meta: {
      successMessage: 'Message sent',
    },
    onSuccess: (data) => {
      // Invalidate threads list
      queryClient.invalidateQueries({ queryKey: dmKeys.threads() });

      // Invalidate specific thread
      const message = data.sendDmMessage;
      if (message) {
        queryClient.invalidateQueries({
          queryKey: dmKeys.thread(message.threadId),
        });
        queryClient.invalidateQueries({
          queryKey: dmKeys.messages(message.threadId),
        });
      }
    },
    ...options,
  });
}

/**
 * Update a DM message
 */
export function useUpdateDmMessage(
  options?: UseMutationOptions<
    UpdateDmMessageMutation,
    Error,
    UpdateDmMessageMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateDmMessageMutation,
    Error,
    UpdateDmMessageMutationVariables
  >({
    mutationFn: async (variables) => {
      const res = await gqlClient.request<UpdateDmMessageMutation>(
        UpdateDmMessageDocument,
        variables
      );
      return res;
    },
    onSuccess: (data) => {
      const message = data.updateDmMessage;
      if (message) {
        queryClient.invalidateQueries({
          queryKey: dmKeys.messages(message.threadId),
        });
      }
    },
    ...options,
  });
}

/**
 * Delete a DM message
 */
export function useDeleteDmMessage(
  options?: UseMutationOptions<
    DeleteDmMessageMutation,
    Error,
    DeleteDmMessageMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    DeleteDmMessageMutation,
    Error,
    DeleteDmMessageMutationVariables
  >({
    mutationKey: ['DeleteDmMessage'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<DeleteDmMessageMutation>(
        DeleteDmMessageDocument,
        variables
      );
      return res;
    },
    meta: {
      successMessage: 'Message deleted',
    },
    onSuccess: () => {
      // Invalidate all messages (we don't know which thread)
      queryClient.invalidateQueries({ queryKey: dmKeys.all });
    },
    ...options,
  });
}

/**
 * Mark a message as read
 */
export function useMarkDmMessageRead(
  options?: UseMutationOptions<
    MarkDmMessageReadMutation,
    Error,
    MarkDmMessageReadMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    MarkDmMessageReadMutation,
    Error,
    MarkDmMessageReadMutationVariables
  >({
    mutationFn: async (variables) => {
      const res = await gqlClient.request<MarkDmMessageReadMutation>(
        MarkDmMessageReadDocument,
        variables
      );
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dmKeys.all });
    },
    ...options,
  });
}

/**
 * Mark all messages in a thread as read
 */
export function useMarkDmThreadRead(
  options?: UseMutationOptions<
    MarkDmThreadReadMutation,
    Error,
    MarkDmThreadReadMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    MarkDmThreadReadMutation,
    Error,
    MarkDmThreadReadMutationVariables
  >({
    mutationFn: async (variables) => {
      const res = await gqlClient.request<MarkDmThreadReadMutation>(
        MarkDmThreadReadDocument,
        variables
      );
      return res;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: dmKeys.threads() });
      queryClient.invalidateQueries({
        queryKey: dmKeys.thread(variables.threadId),
      });
      queryClient.invalidateQueries({
        queryKey: dmKeys.messages(variables.threadId),
      });
    },
    ...options,
  });
}

/**
 * Delete entire thread
 */
export function useDeleteDmThread(
  options?: UseMutationOptions<
    DeleteDmThreadMutation,
    Error,
    DeleteDmThreadMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    DeleteDmThreadMutation,
    Error,
    DeleteDmThreadMutationVariables
  >({
    mutationFn: async (variables) => {
      const res = await gqlClient.request<DeleteDmThreadMutation>(
        DeleteDmThreadDocument,
        variables
      );
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dmKeys.threads() });
    },
    ...options,
  });
}

/**
 * Mute/unmute a DM thread
 */
export function useMuteDmThread(
  options?: UseMutationOptions<
    MuteDmThreadMutation,
    Error,
    MuteDmThreadMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    MuteDmThreadMutation,
    Error,
    MuteDmThreadMutationVariables
  >({
    mutationFn: async (variables) => {
      const res = await gqlClient.request<MuteDmThreadMutation>(
        MuteDmThreadDocument,
        variables
      );
      return res;
    },
    onSuccess: (_, variables) => {
      // Invalidate mute query
      queryClient.invalidateQueries({
        queryKey: dmKeys.mute(variables.threadId),
      });
      // Invalidate thread to update mute status
      queryClient.invalidateQueries({
        queryKey: dmKeys.thread(variables.threadId),
      });
    },
    ...options,
  });
}

/**
 * Publish typing indicator for DM thread
 */
export function usePublishDmTyping(
  options?: UseMutationOptions<
    PublishDmTypingMutation,
    Error,
    PublishDmTypingMutationVariables
  >
) {
  return useMutation<
    PublishDmTypingMutation,
    Error,
    PublishDmTypingMutationVariables
  >({
    mutationFn: async (variables) => {
      const res = await gqlClient.request<PublishDmTypingMutation>(
        PublishDmTypingDocument,
        variables
      );
      return res;
    },
    ...options,
  });
}
