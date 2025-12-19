import {
  RequestJoinEventDocument,
  RequestJoinEventMutation,
  RequestJoinEventMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { invalidateMembershipChange } from './members-api-helpers';

export function buildRequestJoinEventOptions<TContext = unknown>(
  options?: UseMutationOptions<
    RequestJoinEventMutation,
    unknown,
    RequestJoinEventMutationVariables,
    TContext
  >
): UseMutationOptions<
  RequestJoinEventMutation,
  unknown,
  RequestJoinEventMutationVariables,
  TContext
> {
  return {
    mutationKey: ['RequestJoinEvent'] as QueryKey,
    mutationFn: async (variables: RequestJoinEventMutationVariables) =>
      gqlClient.request<
        RequestJoinEventMutation,
        RequestJoinEventMutationVariables
      >(RequestJoinEventDocument, variables),
    meta: {
      successMessage: 'Join request sent successfully',
    },
    ...(options ?? {}),
  };
}

export function useRequestJoinEventMutation(
  options?: UseMutationOptions<
    RequestJoinEventMutation,
    unknown,
    RequestJoinEventMutationVariables
  >
) {
  return useMutation<
    RequestJoinEventMutation,
    unknown,
    RequestJoinEventMutationVariables
  >(
    buildRequestJoinEventOptions({
      onSuccess: (_data, vars) => {
        if (vars.eventId) {
          invalidateMembershipChange(vars.eventId);
        }
      },
      ...(options ?? {}),
    })
  );
}

