import {
  CheckInMemberDocument,
  CheckInMemberMutation,
  CheckInMemberMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { invalidateCheckinData } from './checkin-api-helpers';

export function useCheckInMemberMutation(
  options?: UseMutationOptions<
    CheckInMemberMutation,
    Error,
    CheckInMemberMutationVariables,
    { previousMembers: unknown }
  >
) {
  const qc = getQueryClient();

  return useMutation<
    CheckInMemberMutation,
    Error,
    CheckInMemberMutationVariables,
    { previousMembers: unknown }
  >({
    mutationKey: ['CheckInMember'],
    mutationFn: async (variables) =>
      gqlClient.request<CheckInMemberMutation, CheckInMemberMutationVariables>(
        CheckInMemberDocument,
        variables
      ),
    onMutate: async (variables) => {
      const { eventId, userId } = variables.input;

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
                  isCheckedIn: true,
                  lastCheckinAt: new Date().toISOString(),
                  checkinMethods: member.checkinMethods?.includes(
                    variables.input.method
                  )
                    ? member.checkinMethods
                    : [
                        ...(member.checkinMethods || []),
                        variables.input.method,
                      ],
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
