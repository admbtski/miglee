'use client';

import {
  useMutation,
  type UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import {
  AddDmReactionDocument,
  type AddDmReactionMutation,
  type AddDmReactionMutationVariables,
  RemoveDmReactionDocument,
  type RemoveDmReactionMutation,
  type RemoveDmReactionMutationVariables,
  AddEventReactionDocument,
  type AddEventReactionMutation,
  type AddEventReactionMutationVariables,
  RemoveEventReactionDocument,
  type RemoveEventReactionMutation,
  type RemoveEventReactionMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { dmKeys } from './dm';
import { eventChatKeys } from './event-chat';

// =============================================================================
// DM Reactions
// =============================================================================

/**
 * Add reaction to DM message
 */
export function useAddDmReaction(
  options?: UseMutationOptions<
    AddDmReactionMutation,
    Error,
    AddDmReactionMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    AddDmReactionMutation,
    Error,
    AddDmReactionMutationVariables
  >({
    mutationKey: ['AddDmReaction'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<AddDmReactionMutation>(
        AddDmReactionDocument,
        variables
      );
      return res;
    },
    meta: {
      successMessage: 'Reaction added',
    },
    onSuccess: () => {
      // Invalidate messages to refetch with new reactions
      // We don't know threadId from messageId, so invalidate all DM queries
      queryClient.invalidateQueries({ queryKey: dmKeys.all });
    },
    ...options,
  });
}

/**
 * Remove reaction from DM message
 */
export function useRemoveDmReaction(
  options?: UseMutationOptions<
    RemoveDmReactionMutation,
    Error,
    RemoveDmReactionMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    RemoveDmReactionMutation,
    Error,
    RemoveDmReactionMutationVariables
  >({
    mutationKey: ['RemoveDmReaction'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<RemoveDmReactionMutation>(
        RemoveDmReactionDocument,
        variables
      );
      return res;
    },
    meta: {
      successMessage: 'Reaction removed',
    },
    onSuccess: () => {
      // Invalidate messages to refetch with updated reactions
      queryClient.invalidateQueries({ queryKey: dmKeys.all });
    },
    ...options,
  });
}

// =============================================================================
// Event Reactions
// =============================================================================

/**
 * Add reaction to Event chat message
 */
export function useAddEventReaction(
  options?: UseMutationOptions<
    AddEventReactionMutation,
    Error,
    AddEventReactionMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    AddEventReactionMutation,
    Error,
    AddEventReactionMutationVariables
  >({
    mutationKey: ['AddEventReaction'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<AddEventReactionMutation>(
        AddEventReactionDocument,
        variables
      );
      return res;
    },
    meta: {
      successMessage: 'Reaction added',
    },
    onSuccess: () => {
      // Invalidate messages to refetch with new reactions
      queryClient.invalidateQueries({ queryKey: eventChatKeys.all });
    },
    ...options,
  });
}

/**
 * Remove reaction from Event chat message
 */
export function useRemoveEventReaction(
  options?: UseMutationOptions<
    RemoveEventReactionMutation,
    Error,
    RemoveEventReactionMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    RemoveEventReactionMutation,
    Error,
    RemoveEventReactionMutationVariables
  >({
    mutationKey: ['RemoveEventReaction'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<RemoveEventReactionMutation>(
        RemoveEventReactionDocument,
        variables
      );
      return res;
    },
    meta: {
      successMessage: 'Reaction removed',
    },
    onSuccess: () => {
      // Invalidate messages to refetch with updated reactions
      queryClient.invalidateQueries({ queryKey: eventChatKeys.all });
    },
    ...options,
  });
}
