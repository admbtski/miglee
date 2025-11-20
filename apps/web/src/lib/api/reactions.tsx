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
  AddIntentReactionDocument,
  type AddIntentReactionMutation,
  type AddIntentReactionMutationVariables,
  RemoveIntentReactionDocument,
  type RemoveIntentReactionMutation,
  type RemoveIntentReactionMutationVariables,
} from './__generated__/react-query-update';
import { gqlClient } from './client';
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
// Intent Reactions
// =============================================================================

/**
 * Add reaction to Intent chat message
 */
export function useAddIntentReaction(
  options?: UseMutationOptions<
    AddIntentReactionMutation,
    Error,
    AddIntentReactionMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    AddIntentReactionMutation,
    Error,
    AddIntentReactionMutationVariables
  >({
    mutationKey: ['AddIntentReaction'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<AddIntentReactionMutation>(
        AddIntentReactionDocument,
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
 * Remove reaction from Intent chat message
 */
export function useRemoveIntentReaction(
  options?: UseMutationOptions<
    RemoveIntentReactionMutation,
    Error,
    RemoveIntentReactionMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    RemoveIntentReactionMutation,
    Error,
    RemoveIntentReactionMutationVariables
  >({
    mutationKey: ['RemoveIntentReaction'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<RemoveIntentReactionMutation>(
        RemoveIntentReactionDocument,
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
