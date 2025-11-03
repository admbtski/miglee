'use client';

import {
  useMutation,
  type UseMutationOptions,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import {
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
  SendDmMessageDocument,
  type SendDmMessageMutation,
  type SendDmMessageMutationVariables,
  UpdateDmMessageDocument,
  type UpdateDmMessageMutation,
  type UpdateDmMessageMutationVariables,
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
 * Get messages in a thread
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
      limit: variables.limit,
      offset: variables.offset,
      beforeMessageId: variables.beforeMessageId,
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

// =============================================================================
// Mutations
// =============================================================================

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
    mutationFn: async (variables) => {
      const res = await gqlClient.request<SendDmMessageMutation>(
        SendDmMessageDocument,
        variables
      );
      return res;
    },
    onSuccess: (data, variables) => {
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
    mutationFn: async (variables) => {
      const res = await gqlClient.request<DeleteDmMessageMutation>(
        DeleteDmMessageDocument,
        variables
      );
      return res;
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
