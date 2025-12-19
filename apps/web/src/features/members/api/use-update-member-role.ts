import {
  UpdateMemberRoleDocument,
  UpdateMemberRoleMutation,
  UpdateMemberRoleMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { invalidateMembers } from './members-api-helpers';

export function buildUpdateMemberRoleOptions<TContext = unknown>(
  options?: UseMutationOptions<
    UpdateMemberRoleMutation,
    unknown,
    UpdateMemberRoleMutationVariables,
    TContext
  >
): UseMutationOptions<
  UpdateMemberRoleMutation,
  unknown,
  UpdateMemberRoleMutationVariables,
  TContext
> {
  return {
    mutationKey: ['UpdateMemberRole'] as QueryKey,
    mutationFn: async (variables: UpdateMemberRoleMutationVariables) =>
      gqlClient.request<
        UpdateMemberRoleMutation,
        UpdateMemberRoleMutationVariables
      >(UpdateMemberRoleDocument, variables),
    meta: {
      successMessage: 'Member role updated',
    },
    ...(options ?? {}),
  };
}

export function useUpdateMemberRoleMutation(
  options?: UseMutationOptions<
    UpdateMemberRoleMutation,
    unknown,
    UpdateMemberRoleMutationVariables
  >
) {
  return useMutation<
    UpdateMemberRoleMutation,
    unknown,
    UpdateMemberRoleMutationVariables
  >(
    buildUpdateMemberRoleOptions({
      onSuccess: (_data, vars) => {
        const eventId = vars.input?.eventId;
        if (eventId) {
          invalidateMembers(eventId);
        }
      },
      ...(options ?? {}),
    })
  );
}

