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
  GetIntentInviteLinkDocument,
  GetIntentInviteLinksDocument,
  GetIntentMuteDocument,
  GetMyNotificationPreferencesDocument,
  MuteDmThreadDocument,
  MuteIntentDocument,
  UpdateNotificationPreferencesDocument,
  UseIntentInviteLinkDocument,
  type CreateIntentInviteLinkMutation,
  type CreateIntentInviteLinkMutationVariables,
  type DeleteIntentInviteLinkMutation,
  type DeleteIntentInviteLinkMutationVariables,
  type GetDmMuteQuery,
  type GetDmMuteQueryVariables,
  type GetIntentInviteLinkQuery,
  type GetIntentInviteLinkQueryVariables,
  type GetIntentInviteLinksQuery,
  type GetIntentInviteLinksQueryVariables,
  type GetIntentMuteQuery,
  type GetIntentMuteQueryVariables,
  type GetMyNotificationPreferencesQuery,
  type MuteDmThreadMutation,
  type MuteDmThreadMutationVariables,
  type MuteIntentMutation,
  type MuteIntentMutationVariables,
  type UpdateNotificationPreferencesMutation,
  type UpdateNotificationPreferencesMutationVariables,
  type UseIntentInviteLinkMutation,
  type UseIntentInviteLinkMutationVariables,
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
  variables: GetIntentInviteLinksQueryVariables,
  options?: Omit<
    UseQueryOptions<GetIntentInviteLinksQuery, Error>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<GetIntentInviteLinksQuery, Error>({
    queryKey: inviteLinkKeys.byIntent(variables.intentId),
    queryFn: async () => {
      const res = await gqlClient.request<GetIntentInviteLinksQuery>(
        GetIntentInviteLinksDocument,
        variables
      );
      return res;
    },
    enabled: !!variables.intentId,
    ...options,
  });
}

export function useGetIntentInviteLink(
  variables: GetIntentInviteLinkQueryVariables,
  options?: Omit<
    UseQueryOptions<GetIntentInviteLinkQuery, Error>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<GetIntentInviteLinkQuery, Error>({
    queryKey: inviteLinkKeys.byCode(variables.code),
    queryFn: async () => {
      const res = await gqlClient.request<GetIntentInviteLinkQuery>(
        GetIntentInviteLinkDocument,
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
    mutationFn: async (variables) => {
      const res = await gqlClient.request<CreateIntentInviteLinkMutation>(
        CreateIntentInviteLinkDocument,
        variables
      );
      return res;
    },
    onSuccess: (data, variables) => {
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
    mutationFn: async (variables) => {
      const res = await gqlClient.request<DeleteIntentInviteLinkMutation>(
        DeleteIntentInviteLinkDocument,
        variables
      );
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inviteLinkKeys.all });
    },
    ...options,
  });
}

export function useUseIntentInviteLink(
  options?: UseMutationOptions<
    UseIntentInviteLinkMutation,
    Error,
    UseIntentInviteLinkMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    UseIntentInviteLinkMutation,
    Error,
    UseIntentInviteLinkMutationVariables
  >({
    mutationFn: async (variables) => {
      const res = await gqlClient.request<UseIntentInviteLinkMutation>(
        UseIntentInviteLinkDocument,
        variables
      );
      return res;
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
    mutationFn: async (variables) => {
      const res =
        await gqlClient.request<UpdateNotificationPreferencesMutation>(
          UpdateNotificationPreferencesDocument,
          variables
        );
      return res;
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
    mutationFn: async (variables) => {
      const res = await gqlClient.request<MuteIntentMutation>(
        MuteIntentDocument,
        variables
      );
      return res;
    },
    onSuccess: (data, variables) => {
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
    mutationFn: async (variables) => {
      const res = await gqlClient.request<MuteDmThreadMutation>(
        MuteDmThreadDocument,
        variables
      );
      return res;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: muteKeys.dm(variables.threadId),
      });
    },
    ...options,
  });
}
