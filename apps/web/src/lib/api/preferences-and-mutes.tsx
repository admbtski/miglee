'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';
import {
  CreateIntentInviteLinkDocument,
  DeleteIntentInviteLinkDocument,
  GetDmMuteDocument,
  IntentInviteLinkDocument,
  IntentInviteLinksDocument,
  GetIntentMuteDocument,
  GetMyNotificationPreferencesDocument,
  MuteDmThreadDocument,
  MuteIntentDocument,
  UpdateNotificationPreferencesDocument,
  UpdateIntentInviteLinkDocument,
  type CreateIntentInviteLinkMutation,
  type CreateIntentInviteLinkMutationVariables,
  type DeleteIntentInviteLinkMutation,
  type DeleteIntentInviteLinkMutationVariables,
  type GetDmMuteQuery,
  type GetDmMuteQueryVariables,
  type IntentInviteLinkQuery,
  type IntentInviteLinkQueryVariables,
  type IntentInviteLinksQuery,
  type IntentInviteLinksQueryVariables,
  type GetIntentMuteQuery,
  type GetIntentMuteQueryVariables,
  type GetMyNotificationPreferencesQuery,
  type MuteDmThreadMutation,
  type MuteDmThreadMutationVariables,
  type MuteIntentMutation,
  type MuteIntentMutationVariables,
  type UpdateNotificationPreferencesMutation,
  type UpdateNotificationPreferencesMutationVariables,
  type UpdateIntentInviteLinkMutation,
  type UpdateIntentInviteLinkMutationVariables,
} from './__generated__/react-query-update';
import { gqlClient } from './client';

// =============================================================================
// Invite Links
// =============================================================================

export const inviteLinkKeys = {
  all: ['inviteLinks'] as const,
  byIntent: (intentId: string) => [...inviteLinkKeys.all, intentId] as const,
  byCode: (code: string) => [...inviteLinkKeys.all, 'code', code] as const,
};

export function useGetIntentInviteLinks(
  variables: IntentInviteLinksQueryVariables,
  options?: Omit<
    UseQueryOptions<IntentInviteLinksQuery, Error>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<IntentInviteLinksQuery, Error>({
    queryKey: inviteLinkKeys.byIntent(variables.intentId),
    queryFn: async () => {
      const res = await gqlClient.request<IntentInviteLinksQuery>(
        IntentInviteLinksDocument,
        variables
      );
      return res;
    },
    enabled: !!variables.intentId,
    ...options,
  });
}

export function useGetIntentInviteLink(
  variables: IntentInviteLinkQueryVariables,
  options?: Omit<
    UseQueryOptions<IntentInviteLinkQuery, Error>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<IntentInviteLinkQuery, Error>({
    queryKey: inviteLinkKeys.byCode(variables.code!),
    queryFn: async () => {
      const res = await gqlClient.request<IntentInviteLinkQuery>(
        IntentInviteLinkDocument,
        variables
      );
      return res;
    },
    enabled: !!variables.code,
    ...options,
  });
}

export function useCreateIntentInviteLink(
  options?: UseMutationOptions<
    CreateIntentInviteLinkMutation,
    Error,
    CreateIntentInviteLinkMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    CreateIntentInviteLinkMutation,
    Error,
    CreateIntentInviteLinkMutationVariables
  >({
    mutationKey: ['CreateIntentInviteLink'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<CreateIntentInviteLinkMutation>(
        CreateIntentInviteLinkDocument,
        variables
      );
      return res;
    },
    meta: {
      successMessage: 'Invite link created successfully',
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: inviteLinkKeys.byIntent(variables.input.intentId),
      });
    },
    ...options,
  });
}

export function useDeleteIntentInviteLink(
  options?: UseMutationOptions<
    DeleteIntentInviteLinkMutation,
    Error,
    DeleteIntentInviteLinkMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    DeleteIntentInviteLinkMutation,
    Error,
    DeleteIntentInviteLinkMutationVariables
  >({
    mutationKey: ['DeleteIntentInviteLink'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<DeleteIntentInviteLinkMutation>(
        DeleteIntentInviteLinkDocument,
        variables
      );
      return res;
    },
    meta: {
      successMessage: 'Invite link deleted successfully',
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inviteLinkKeys.all });
    },
    ...options,
  });
}

export function useUseIntentInviteLink(
  options?: UseMutationOptions<
    UpdateIntentInviteLinkMutation,
    Error,
    UpdateIntentInviteLinkMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateIntentInviteLinkMutation,
    Error,
    UpdateIntentInviteLinkMutationVariables
  >({
    mutationKey: ['UseIntentInviteLink'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<UpdateIntentInviteLinkMutation>(
        UpdateIntentInviteLinkDocument,
        variables
      );
      return res;
    },
    meta: {
      successMessage: 'Joined event successfully',
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intents'] });
      queryClient.invalidateQueries({ queryKey: ['myMemberships'] });
    },
    ...options,
  });
}

// =============================================================================
// Notification Preferences
// =============================================================================

export const preferencesKeys = {
  all: ['notificationPreferences'] as const,
  my: () => [...preferencesKeys.all, 'my'] as const,
};

export function useGetMyNotificationPreferences(
  options?: Omit<
    UseQueryOptions<GetMyNotificationPreferencesQuery, Error>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<GetMyNotificationPreferencesQuery, Error>({
    queryKey: preferencesKeys.my(),
    queryFn: async () => {
      const res = await gqlClient.request<GetMyNotificationPreferencesQuery>(
        GetMyNotificationPreferencesDocument
      );
      return res;
    },
    ...options,
  });
}

export function useUpdateNotificationPreferences(
  options?: UseMutationOptions<
    UpdateNotificationPreferencesMutation,
    Error,
    UpdateNotificationPreferencesMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateNotificationPreferencesMutation,
    Error,
    UpdateNotificationPreferencesMutationVariables
  >({
    mutationKey: ['UpdateNotificationPreferences'],
    mutationFn: async (variables) => {
      const res =
        await gqlClient.request<UpdateNotificationPreferencesMutation>(
          UpdateNotificationPreferencesDocument,
          variables
        );
      return res;
    },
    meta: {
      successMessage: 'Preferences updated successfully',
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: preferencesKeys.my() });
    },
    ...options,
  });
}

// =============================================================================
// Mutes
// =============================================================================

export const muteKeys = {
  all: ['mutes'] as const,
  intent: (intentId: string) => [...muteKeys.all, 'intent', intentId] as const,
  dm: (threadId: string) => [...muteKeys.all, 'dm', threadId] as const,
};

export function useGetIntentMute(
  variables: GetIntentMuteQueryVariables,
  options?: Omit<
    UseQueryOptions<GetIntentMuteQuery, Error>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<GetIntentMuteQuery, Error>({
    queryKey: muteKeys.intent(variables.intentId),
    queryFn: async () => {
      const res = await gqlClient.request<GetIntentMuteQuery>(
        GetIntentMuteDocument,
        variables
      );
      return res;
    },
    enabled: !!variables.intentId,
    ...options,
  });
}

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
      successMessage: 'Event muted successfully',
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: muteKeys.intent(variables.intentId),
      });
    },
    ...options,
  });
}

export function useGetDmMute(
  variables: GetDmMuteQueryVariables,
  options?: Omit<UseQueryOptions<GetDmMuteQuery, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<GetDmMuteQuery, Error>({
    queryKey: muteKeys.dm(variables.threadId),
    queryFn: async () => {
      const res = await gqlClient.request<GetDmMuteQuery>(
        GetDmMuteDocument,
        variables
      );
      return res;
    },
    enabled: !!variables.threadId,
    ...options,
  });
}

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
    mutationKey: ['MuteDmThread'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<MuteDmThreadMutation>(
        MuteDmThreadDocument,
        variables
      );
      return res;
    },
    meta: {
      successMessage: 'Conversation muted successfully',
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: muteKeys.dm(variables.threadId),
      });
    },
    ...options,
  });
}
