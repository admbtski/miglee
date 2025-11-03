'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import type {
  GetDmThreadsQuery,
  GetDmThreadsQueryVariables,
  GetDmThreadQuery,
  GetDmThreadQueryVariables,
  GetDmMessagesQuery,
  GetDmMessagesQueryVariables,
  GetDmMuteQuery,
  GetDmMuteQueryVariables,
  SendDmMessageMutation,
  SendDmMessageMutationVariables,
  UpdateDmMessageMutation,
  UpdateDmMessageMutationVariables,
  DeleteDmMessageMutation,
  DeleteDmMessageMutationVariables,
  MarkDmMessageReadMutation,
  MarkDmMessageReadMutationVariables,
  MarkDmThreadReadMutation,
  MarkDmThreadReadMutationVariables,
  MuteDmThreadMutation,
  MuteDmThreadMutationVariables,
  DeleteDmThreadMutation,
  DeleteDmThreadMutationVariables,
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
        /* GraphQL */ `
          query GetDmThreads(
            $limit: Int = 20
            $offset: Int = 0
            $unreadOnly: Boolean = false
          ) {
            dmThreads(limit: $limit, offset: $offset, unreadOnly: $unreadOnly) {
              ...DmThreadsResultCore
            }
          }
        `,
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
    queryKey: dmKeys.thread(variables.id, variables.otherUserId),
    queryFn: async () => {
      const res = await gqlClient.request<GetDmThreadQuery>(
        /* GraphQL */ `
          query GetDmThread($id: ID, $otherUserId: ID) {
            dmThread(id: $id, otherUserId: $otherUserId) {
              ...DmThreadCore
            }
          }
        `,
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
        /* GraphQL */ `
          query GetDmMessages(
            $threadId: ID!
            $limit: Int = 50
            $offset: Int = 0
            $beforeMessageId: ID
          ) {
            dmMessages(
              threadId: $threadId
              limit: $limit
              offset: $offset
              beforeMessageId: $beforeMessageId
            ) {
              ...DmMessageCore
            }
          }
        `,
        variables
      );
      return res;
    },
    enabled: !!variables.threadId,
    ...options,
  });
}

/**
 * Get mute status for a thread
 */
export function useGetDmMute(
  variables: GetDmMuteQueryVariables,
  options?: Omit<UseQueryOptions<GetDmMuteQuery, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<GetDmMuteQuery, Error>({
    queryKey: dmKeys.mute(variables.threadId),
    queryFn: async () => {
      const res = await gqlClient.request<GetDmMuteQuery>(
        /* GraphQL */ `
          query GetDmMute($threadId: ID!) {
            dmMute(threadId: $threadId) {
              ...DmMuteCore
            }
          }
        `,
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
        /* GraphQL */ `
          mutation SendDmMessage($input: SendDmMessageInput!) {
            sendDmMessage(input: $input) {
              ...DmMessageCore
            }
          }
        `,
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
        /* GraphQL */ `
          mutation UpdateDmMessage($id: ID!, $input: UpdateDmMessageInput!) {
            updateDmMessage(id: $id, input: $input) {
              ...DmMessageCore
            }
          }
        `,
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
        /* GraphQL */ `
          mutation DeleteDmMessage($id: ID!) {
            deleteDmMessage(id: $id)
          }
        `,
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
        /* GraphQL */ `
          mutation MarkDmMessageRead($id: ID!) {
            markDmMessageRead(id: $id)
          }
        `,
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
        /* GraphQL */ `
          mutation MarkDmThreadRead($threadId: ID!) {
            markDmThreadRead(threadId: $threadId)
          }
        `,
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
 * Mute or unmute a thread
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
        /* GraphQL */ `
          mutation MuteDmThread($input: MuteDmThreadInput!) {
            muteDmThread(input: $input) {
              ...DmMuteCore
            }
          }
        `,
        variables
      );
      return res;
    },
    onSuccess: (data) => {
      const mute = data.muteDmThread;
      if (mute) {
        queryClient.invalidateQueries({
          queryKey: dmKeys.mute(mute.threadId),
        });
        queryClient.invalidateQueries({
          queryKey: dmKeys.thread(mute.threadId),
        });
      }
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
        /* GraphQL */ `
          mutation DeleteDmThread($id: ID!) {
            deleteDmThread(id: $id)
          }
        `,
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
