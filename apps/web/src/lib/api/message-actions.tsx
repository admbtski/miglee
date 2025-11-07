'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UpdateDmMessageDocument,
  DeleteDmMessageDocument,
  EditIntentMessageDocument,
  DeleteIntentMessageDocument,
  type UpdateDmMessageMutationVariables,
  type DeleteDmMessageMutationVariables,
  type EditIntentMessageMutationVariables,
  type DeleteIntentMessageMutationVariables,
} from './__generated__/react-query-update';
import { gqlClient } from './client';
import { dmKeys } from './dm';
import { eventChatKeys } from './event-chat';

// ============ DM Message Actions ============

export function useUpdateDmMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: UpdateDmMessageMutationVariables) => {
      console.log('[useUpdateDmMessage] Calling mutation with:', variables);
      const result = await gqlClient.request(
        UpdateDmMessageDocument,
        variables
      );
      console.log('[useUpdateDmMessage] Result:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('[useUpdateDmMessage] onSuccess:', data);
      // Invalidate messages for this thread
      const message = data.updateDmMessage;
      if (message?.threadId) {
        queryClient.invalidateQueries({
          queryKey: ['dm', 'messages', message.threadId],
        });
        queryClient.invalidateQueries({
          queryKey: dmKeys.threads(),
        });
      }
    },
  });
}

export function useDeleteDmMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      variables: DeleteDmMessageMutationVariables & { threadId: string }
    ) => {
      return gqlClient.request(DeleteDmMessageDocument, { id: variables.id });
    },
    onSuccess: (_data, variables) => {
      // deleteDmMessage returns boolean, so we use variables.threadId
      if (variables.threadId) {
        queryClient.invalidateQueries({
          queryKey: ['dm', 'messages', variables.threadId],
        });
        queryClient.invalidateQueries({
          queryKey: dmKeys.threads(),
        });
      }
    },
  });
}

// ============ Intent Message Actions ============

export function useEditIntentMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: EditIntentMessageMutationVariables) => {
      console.log('[useEditIntentMessage] Calling mutation with:', variables);
      const result = await gqlClient.request(
        EditIntentMessageDocument,
        variables
      );
      console.log('[useEditIntentMessage] Result:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('[useEditIntentMessage] onSuccess:', data);
      const message = data.editIntentMessage;
      if (message?.intentId) {
        queryClient.invalidateQueries({
          queryKey: eventChatKeys.messages(message.intentId),
        });
      }
    },
  });
}

export function useDeleteIntentMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      variables: DeleteIntentMessageMutationVariables & { intentId: string }
    ) => {
      return gqlClient.request(DeleteIntentMessageDocument, {
        id: variables.id,
        soft: variables.soft,
      });
    },
    onSuccess: (_data, variables) => {
      // deleteIntentMessage returns boolean, so we use variables.intentId
      if (variables.intentId) {
        queryClient.invalidateQueries({
          queryKey: eventChatKeys.messages(variables.intentId),
        });
      }
    },
  });
}
