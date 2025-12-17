import {
  UpdateMemberRoleDocument,
  UpdateMemberRoleMutation,
  UpdateMemberRoleMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import {
  GET_EVENT_DETAIL_KEY,
  GET_EVENT_MEMBERS_KEY,
} from './events-query-keys';

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
  const qc = getQueryClient();
  return useMutation<
    UpdateMemberRoleMutation,
    unknown,
    UpdateMemberRoleMutationVariables
  >(
    buildUpdateMemberRoleOptions({
      onSuccess: (_data, vars) => {
        const eventId = vars.input?.eventId;
        if (eventId) {
          qc.invalidateQueries({
            queryKey: GET_EVENT_MEMBERS_KEY({
              eventId,
            }) as QueryKey,
          });
          qc.invalidateQueries({
            queryKey: GET_EVENT_DETAIL_KEY({
              id: eventId,
            }) as QueryKey,
          });
        }
      },
      ...(options ?? {}),
    })
  );
}
