import {
  UncheckInMemberDocument,
  UncheckInMemberMutation,
  UncheckInMemberMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { invalidateCheckinData } from './checkin-api-helpers';

export function useUncheckInMemberMutation(
  options?: UseMutationOptions<
    UncheckInMemberMutation,
    Error,
    UncheckInMemberMutationVariables,
    { previousMembers: unknown }
  >
) {
  const qc = getQueryClient();

  return useMutation<
    UncheckInMemberMutation,
    Error,
    UncheckInMemberMutationVariables,
    { previousMembers: unknown }
  >({
    mutationKey: ['UncheckInMember'],
    mutationFn: async (variables) =>
      gqlClient.request<
        UncheckInMemberMutation,
        UncheckInMemberMutationVariables
      >(UncheckInMemberDocument, variables),
    onMutate: async (variables) => {
      const { eventId, userId, method } = variables.input;

      await qc.cancelQueries({
        queryKey: ['GetEventMembers', { eventId }],
      });

      const previousMembers = qc.getQueryData(['GetEventMembers', { eventId }]);

      qc.setQueryData(['GetEventMembers', { eventId }], (old: any) => {
        if (!old?.eventMembers) return old;

        const members = Array.isArray(old.eventMembers) ? old.eventMembers : [];

        return {
          ...old,
          eventMembers: members.map((member: any) =>
            member.userId === userId
              ? {
                  ...member,
                  isCheckedIn: method
                    ? member.checkinMethods?.length > 1
                    : false,
                  lastCheckinAt: method ? member.lastCheckinAt : null,
                  checkinMethods: method
                    ? member.checkinMethods?.filter((m: string) => m !== method)
                    : [],
                }
              : member
          ),
        };
      });

      return { previousMembers };
    },
    onError: (_error, variables, context) => {
      if (context?.previousMembers) {
        qc.setQueryData(
          ['GetEventMembers', { eventId: variables.input.eventId }],
          context.previousMembers
        );
      }
    },
    onSuccess: (_data, variables) => {
      invalidateCheckinData(variables.input.eventId);
    },
    ...options,
  });
}
