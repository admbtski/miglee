import {
  CancelScheduledPublicationDocument,
  CancelScheduledPublicationMutation,
  CancelScheduledPublicationMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { GET_EVENT_DETAIL_KEY } from './events-query-keys';

export function useCancelScheduledPublicationMutation(
  options?: UseMutationOptions<
    CancelScheduledPublicationMutation,
    Error,
    CancelScheduledPublicationMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    CancelScheduledPublicationMutation,
    Error,
    CancelScheduledPublicationMutationVariables
  >({
    mutationKey: ['CancelScheduledPublication'],
    mutationFn: async (variables) =>
      gqlClient.request<
        CancelScheduledPublicationMutation,
        CancelScheduledPublicationMutationVariables
      >(CancelScheduledPublicationDocument, variables),
    meta: {
      successMessage: 'Scheduled publication cancelled',
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
