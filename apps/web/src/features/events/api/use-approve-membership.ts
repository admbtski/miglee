import {
  ApproveMembershipDocument,
  ApproveMembershipMutation,
  ApproveMembershipMutationVariables,
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
  GET_EVENT_MEMBER_STATS_KEY,
  GET_EVENT_MEMBERS_KEY,
} from './events-query-keys';

export function buildApproveMembershipOptions<TContext = unknown>(
  options?: UseMutationOptions<
    ApproveMembershipMutation,
    unknown,
    ApproveMembershipMutationVariables,
    TContext
  >
): UseMutationOptions<
  ApproveMembershipMutation,
  unknown,
  ApproveMembershipMutationVariables,
  TContext
> {
  return {
    mutationKey: ['ApproveMembership'] as QueryKey,
    mutationFn: async (variables: ApproveMembershipMutationVariables) =>
      gqlClient.request<
        ApproveMembershipMutation,
        ApproveMembershipMutationVariables
      >(ApproveMembershipDocument, variables),
    meta: {
      successMessage: 'Membership approved',
    },
    ...(options ?? {}),
  };
}

export function useApproveMembershipMutation(
  options?: UseMutationOptions<
    ApproveMembershipMutation,
    unknown,
    ApproveMembershipMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    ApproveMembershipMutation,
    unknown,
    ApproveMembershipMutationVariables
  >(
    buildApproveMembershipOptions({
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
          qc.invalidateQueries({
            queryKey: GET_EVENT_MEMBER_STATS_KEY({
              eventId,
            }) as QueryKey,
          });
        }
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'GetEvents',
        });
      },
      ...(options ?? {}),
    })
  );
}
