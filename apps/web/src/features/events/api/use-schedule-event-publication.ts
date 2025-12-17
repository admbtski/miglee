import {
  ScheduleEventPublicationDocument,
  ScheduleEventPublicationMutation,
  ScheduleEventPublicationMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { GET_EVENT_DETAIL_KEY } from './events-query-keys';

// Schedule Event publication
export function useScheduleEventPublicationMutation(
  options?: UseMutationOptions<
    ScheduleEventPublicationMutation,
    Error,
    ScheduleEventPublicationMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    ScheduleEventPublicationMutation,
    Error,
    ScheduleEventPublicationMutationVariables
  >({
    mutationKey: ['ScheduleEventPublication'],
    mutationFn: async (variables) =>
      gqlClient.request<
        ScheduleEventPublicationMutation,
        ScheduleEventPublicationMutationVariables
      >(ScheduleEventPublicationDocument, variables),
    meta: {
      successMessage: 'Publication scheduled successfully',
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey[0] === 'GetEvents',
      });
      if (vars.id) {
        qc.invalidateQueries({
          queryKey: GET_EVENT_DETAIL_KEY({
            id: vars.id,
          }) as unknown as QueryKey,
        });
      }
    },
    ...options,
  });
}
