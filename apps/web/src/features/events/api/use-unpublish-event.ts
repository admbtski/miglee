import {
  UnpublishEventDocument,
  UnpublishEventMutation,
  UnpublishEventMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { GET_EVENT_DETAIL_KEY } from './events-query-keys';

export function useUnpublishEventMutation(
  options?: UseMutationOptions<
    UnpublishEventMutation,
    unknown,
    UnpublishEventMutationVariables
  >
) {
  const qc = getQueryClient();
  return useMutation<
    UnpublishEventMutation,
    unknown,
    UnpublishEventMutationVariables
  >({
    mutationKey: ['UnpublishEvent'],
    mutationFn: async (variables) =>
      gqlClient.request<
        UnpublishEventMutation,
        UnpublishEventMutationVariables
      >(UnpublishEventDocument, variables),
    meta: {
      successMessage: 'Event unpublished successfully',
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
