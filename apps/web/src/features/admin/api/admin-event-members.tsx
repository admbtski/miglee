'use client';

import {
  useMutation,
  type UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';
import {
  AdminUpdateMemberRoleDocument,
  type AdminUpdateMemberRoleMutation,
  type AdminUpdateMemberRoleMutationVariables,
  AdminKickMemberDocument,
  type AdminKickMemberMutation,
  type AdminKickMemberMutationVariables,
  AdminBanMemberDocument,
  type AdminBanMemberMutation,
  type AdminBanMemberMutationVariables,
  AdminUnbanMemberDocument,
  type AdminUnbanMemberMutation,
  type AdminUnbanMemberMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { GET_EVENT_MEMBERS_KEY } from '@/features/events/api/event-members';

// =============================================================================
// Mutations
// =============================================================================

/**
 * Admin: Update member role
 */
export function useAdminUpdateMemberRoleMutation(
  options?: UseMutationOptions<
    AdminUpdateMemberRoleMutation,
    unknown,
    AdminUpdateMemberRoleMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    AdminUpdateMemberRoleMutation,
    unknown,
    AdminUpdateMemberRoleMutationVariables
  >({
    mutationFn: async (variables) => {
      return await gqlClient.request<
        AdminUpdateMemberRoleMutation,
        AdminUpdateMemberRoleMutationVariables
      >(AdminUpdateMemberRoleDocument, variables);
    },
    onSuccess: (_data, variables) => {
      // Invalidate event members query
      queryClient.invalidateQueries({
        queryKey: GET_EVENT_MEMBERS_KEY({
          eventId: variables.input.eventId,
        }),
      });
    },
    ...options,
  });
}

/**
 * Admin: Kick member
 */
export function useAdminKickMemberMutation(
  options?: UseMutationOptions<
    AdminKickMemberMutation,
    unknown,
    AdminKickMemberMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    AdminKickMemberMutation,
    unknown,
    AdminKickMemberMutationVariables
  >({
    mutationFn: async (variables) => {
      return await gqlClient.request<
        AdminKickMemberMutation,
        AdminKickMemberMutationVariables
      >(AdminKickMemberDocument, variables);
    },
    onSuccess: (_data, variables) => {
      // Invalidate event members query
      queryClient.invalidateQueries({
        queryKey: GET_EVENT_MEMBERS_KEY({
          eventId: variables.input.eventId,
        }),
      });
    },
    ...options,
  });
}

/**
 * Admin: Ban member
 */
export function useAdminBanMemberMutation(
  options?: UseMutationOptions<
    AdminBanMemberMutation,
    unknown,
    AdminBanMemberMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    AdminBanMemberMutation,
    unknown,
    AdminBanMemberMutationVariables
  >({
    mutationFn: async (variables) => {
      return await gqlClient.request<
        AdminBanMemberMutation,
        AdminBanMemberMutationVariables
      >(AdminBanMemberDocument, variables);
    },
    onSuccess: (_data, variables) => {
      // Invalidate event members query
      queryClient.invalidateQueries({
        queryKey: GET_EVENT_MEMBERS_KEY({
          eventId: variables.input.eventId,
        }),
      });
    },
    ...options,
  });
}

/**
 * Admin: Unban member
 */
export function useAdminUnbanMemberMutation(
  options?: UseMutationOptions<
    AdminUnbanMemberMutation,
    unknown,
    AdminUnbanMemberMutationVariables
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    AdminUnbanMemberMutation,
    unknown,
    AdminUnbanMemberMutationVariables
  >({
    mutationFn: async (variables) => {
      return await gqlClient.request<
        AdminUnbanMemberMutation,
        AdminUnbanMemberMutationVariables
      >(AdminUnbanMemberDocument, variables);
    },
    onSuccess: (_data, variables) => {
      // Invalidate event members query
      queryClient.invalidateQueries({
        queryKey: GET_EVENT_MEMBERS_KEY({
          eventId: variables.input.eventId,
        }),
      });
    },
    ...options,
  });
}
