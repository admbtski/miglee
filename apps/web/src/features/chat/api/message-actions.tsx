'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UpdateDmMessageDocument,
  DeleteDmMessageDocument,
  EditEventMessageDocument,
  DeleteEventMessageDocument,
  type UpdateDmMessageMutationVariables,
  type DeleteDmMessageMutationVariables,
  type EditEventMessageMutationVariables,
  type DeleteEventMessageMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
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

// ============ Event Message Actions ============

export function useEditEventMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: EditEventMessageMutationVariables) => {
      console.log('[useEditEventMessage] Calling mutation with:', variables);
      const result = await gqlClient.request(
        EditEventMessageDocument,
        variables
      );
      console.log('[useEditEventMessage] Result:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('[useEditEventMessage] onSuccess:', data);
      const message = data.editEventMessage;
      if (message?.eventId) {
        queryClient.invalidateQueries({
          queryKey: eventChatKeys.messages(message.eventId),
        });
      }
    },
  });
}

export function useDeleteEventMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      variables: DeleteEventMessageMutationVariables & { eventId: string }
    ) => {
      return gqlClient.request(DeleteEventMessageDocument, {
        id: variables.id,
        soft: variables.soft,
      });
    },
    onSuccess: (_data, variables) => {
      // deleteEventMessage returns boolean, so we use variables.eventId
      if (variables.eventId) {
        queryClient.invalidateQueries({
          queryKey: eventChatKeys.messages(variables.eventId),
        });
      }
    },
  });
}
