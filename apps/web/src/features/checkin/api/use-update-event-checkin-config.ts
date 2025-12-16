import {
  UpdateEventCheckinConfigDocument,
  UpdateEventCheckinConfigMutation,
  UpdateEventCheckinConfigMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { invalidateCheckinData } from './checkin-api-helpers';

export function useUpdateEventCheckinConfigMutation(
  options?: UseMutationOptions<
    UpdateEventCheckinConfigMutation,
    Error,
    UpdateEventCheckinConfigMutationVariables,
    { previousEvent: unknown }
  >
) {
  const qc = getQueryClient();

  return useMutation<
    UpdateEventCheckinConfigMutation,
    Error,
    UpdateEventCheckinConfigMutationVariables,
    { previousEvent: unknown }
  >({
    mutationKey: ['UpdateEventCheckinConfig'],
    mutationFn: async (variables) =>
      gqlClient.request<
        UpdateEventCheckinConfigMutation,
        UpdateEventCheckinConfigMutationVariables
      >(UpdateEventCheckinConfigDocument, variables),
    onMutate: async (variables) => {
      const { eventId, checkinEnabled, enabledCheckinMethods } =
        variables.input;

      await qc.cancelQueries({
        queryKey: ['GetEventDetail', { id: eventId }],
      });

      const previousEvent = qc.getQueryData([
        'GetEventDetail',
        { id: eventId },
      ]);

      qc.setQueryData(['GetEventDetail', { id: eventId }], (old: any) => {
        if (!old?.event) return old;

        return {
          ...old,
          event: {
            ...old.event,
            checkinEnabled: checkinEnabled ?? old.event.checkinEnabled,
            enabledCheckinMethods:
              enabledCheckinMethods ?? old.event.enabledCheckinMethods,
          },
        };
      });

      return { previousEvent };
    },
    onError: (_error, variables, context) => {
      if (context?.previousEvent) {
        qc.setQueryData(
          ['GetEventDetail', { id: variables.input.eventId }],
          context.previousEvent
        );
      }
    },
    onSuccess: (_data, variables) => {
      invalidateCheckinData(variables.input.eventId);
    },
    ...options,
  });
}
