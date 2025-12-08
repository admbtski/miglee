'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';
import {
  CreateEventInviteLinkDocument,
  DeleteEventInviteLinkDocument,
  GetDmMuteDocument,
  EventInviteLinkDocument,
  EventInviteLinksDocument,
  GetEventMuteDocument,
  GetMyNotificationPreferencesDocument,
  MuteDmThreadDocument,
  MuteEventDocument,
  UpdateNotificationPreferencesDocument,
  UpdateEventInviteLinkDocument,
  type CreateEventInviteLinkMutation,
  type CreateEventInviteLinkMutationVariables,
  type DeleteEventInviteLinkMutation,
  type DeleteEventInviteLinkMutationVariables,
  type GetDmMuteQuery,
  type GetDmMuteQueryVariables,
  type EventInviteLinkQuery,
  type EventInviteLinkQueryVariables,
  type EventInviteLinksQuery,
  type EventInviteLinksQueryVariables,
  type GetEventMuteQuery,
  type GetEventMuteQueryVariables,
  type GetMyNotificationPreferencesQuery,
  type MuteDmThreadMutation,
  type MuteDmThreadMutationVariables,
  type MuteEventMutation,
  type MuteEventMutationVariables,
  type UpdateNotificationPreferencesMutation,
  type UpdateNotificationPreferencesMutationVariables,
  type UpdateEventInviteLinkMutation,
  type UpdateEventInviteLinkMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';

// =============================================================================
// Invite Links
// =============================================================================

export const inviteLinkKeys = {
  all: ['inviteLinks'] as const,
  byEvent: (eventId: string) => [...inviteLinkKeys.all, eventId] as const,
  byCode: (code: string) => [...inviteLinkKeys.all, 'code', code] as const,
};

export function useGetEventInviteLinks(
  variables: EventInviteLinksQueryVariables,
  options?: Omit<
    UseQueryOptions<EventInviteLinksQuery, Error>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<EventInviteLinksQuery, Error>({
    queryKey: inviteLinkKeys.byEvent(variables.eventId),
    queryFn: async () => {
      const res = await gqlClient.request<EventInviteLinksQuery>(
        EventInviteLinksDocument,
        variables
      );
      return res;
    },
    enabled: !!variables.eventId,
    ...options,
  });
}

export function useGetEventInviteLink(
  variables: EventInviteLinkQueryVariables,
  options?: Omit<
    UseQueryOptions<EventInviteLinkQuery, Error>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<EventInviteLinkQuery, Error>({
    queryKey: inviteLinkKeys.byCode(variables.code!),
    queryFn: async () => {
      const res = await gqlClient.request<EventInviteLinkQuery>(
        EventInviteLinkDocument,
        variables
      );
      return res;
    },
    enabled: !!variables.code,
    ...options,
  });
}

export function useCreateEventInviteLink(
  options?: UseMutationOptions<
    CreateEventInviteLinkMutation,
    Error,
    CreateEventInviteLinkMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    CreateEventInviteLinkMutation,
    Error,
    CreateEventInviteLinkMutationVariables
  >({
    mutationKey: ['CreateEventInviteLink'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<CreateEventInviteLinkMutation>(
        CreateEventInviteLinkDocument,
        variables
      );
      return res;
    },
    meta: {
      successMessage: 'Invite link created successfully',
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: inviteLinkKeys.byEvent(variables.input.eventId),
      });
    },
    ...options,
  });
}

export function useDeleteEventInviteLink(
  options?: UseMutationOptions<
    DeleteEventInviteLinkMutation,
    Error,
    DeleteEventInviteLinkMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    DeleteEventInviteLinkMutation,
    Error,
    DeleteEventInviteLinkMutationVariables
  >({
    mutationKey: ['DeleteEventInviteLink'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<DeleteEventInviteLinkMutation>(
        DeleteEventInviteLinkDocument,
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

export function useUseEventInviteLink(
  options?: UseMutationOptions<
    UpdateEventInviteLinkMutation,
    Error,
    UpdateEventInviteLinkMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateEventInviteLinkMutation,
    Error,
    UpdateEventInviteLinkMutationVariables
  >({
    mutationKey: ['UseEventInviteLink'],
    mutationFn: async (variables) => {
      const res = await gqlClient.request<UpdateEventInviteLinkMutation>(
        UpdateEventInviteLinkDocument,
        variables
      );
      return res;
    },
    meta: {
      successMessage: 'Joined event successfully',
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
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
  event: (eventId: string) => [...muteKeys.all, 'event', eventId] as const,
  dm: (threadId: string) => [...muteKeys.all, 'dm', threadId] as const,
};

export function useGetEventMute(
  variables: GetEventMuteQueryVariables,
  options?: Omit<
    UseQueryOptions<GetEventMuteQuery, Error>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<GetEventMuteQuery, Error>({
    queryKey: muteKeys.event(variables.eventId),
    queryFn: async () => {
      const res = await gqlClient.request<GetEventMuteQuery>(
        GetEventMuteDocument,
        variables
      );
      return res;
    },
    enabled: !!variables.eventId,
    ...options,
  });
}

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
      successMessage: 'Event muted successfully',
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: muteKeys.event(variables.eventId),
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
