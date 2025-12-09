/**
 * React Query hooks for Event Agenda
 */

import {
  EventAgendaItemsDocument,
  EventAgendaItemsQuery,
  EventAgendaItemsQueryVariables,
  UpdateEventAgendaDocument,
  UpdateEventAgendaMutation,
  UpdateEventAgendaMutationVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { getQueryClient } from '@/lib/config/query-client';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from '@tanstack/react-query';

/* --------------------------------- KEYS ---------------------------------- */
export const GET_AGENDA_ITEMS_KEY = (
  variables: EventAgendaItemsQueryVariables
) => ['GetEventAgendaItems', variables] as const;

/* ----------------------------- QUERY BUILDERS ---------------------------- */

// Agenda Items Query
export function buildGetEventAgendaItemsOptions(
  variables: EventAgendaItemsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      EventAgendaItemsQuery,
      Error,
      EventAgendaItemsQuery['eventAgendaItems'],
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryOptions<
  EventAgendaItemsQuery,
  Error,
  EventAgendaItemsQuery['eventAgendaItems'],
  QueryKey
> {
  return {
    queryKey: GET_AGENDA_ITEMS_KEY(variables) as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<EventAgendaItemsQuery, EventAgendaItemsQueryVariables>(
        EventAgendaItemsDocument,
        variables
      ),
    select: (data) => data.eventAgendaItems,
    ...(options ?? {}),
  };
}

/* --------------------------------- HOOKS --------------------------------- */

// Queries
export function useEventAgendaItemsQuery(
  variables: EventAgendaItemsQueryVariables,
  options?: Omit<
    UseQueryOptions<
      EventAgendaItemsQuery,
      Error,
      EventAgendaItemsQuery['eventAgendaItems'],
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery(buildGetEventAgendaItemsOptions(variables, options));
}

// Update Agenda (bulk replace)
export function useUpdateEventAgendaMutation(
  options?: UseMutationOptions<
    UpdateEventAgendaMutation,
    Error,
    UpdateEventAgendaMutationVariables
  >
) {
  const queryClient = getQueryClient();
  return useMutation<
    UpdateEventAgendaMutation,
    Error,
    UpdateEventAgendaMutationVariables
  >({
    mutationKey: ['UpdateEventAgenda'],
    mutationFn: async (variables) =>
      gqlClient.request<
        UpdateEventAgendaMutation,
        UpdateEventAgendaMutationVariables
      >(UpdateEventAgendaDocument, variables),
    onSuccess: (_data, variables) => {
      // Invalidate event detail query to refetch with updated agenda
      if (variables.input.eventId) {
        queryClient.invalidateQueries({
          queryKey: ['GetEventDetail', { id: variables.input.eventId }],
        });
        queryClient.invalidateQueries({
          queryKey: [
            'GetEventAgendaItems',
            { eventId: variables.input.eventId },
          ],
        });
        queryClient.invalidateQueries({
          queryKey: ['GetEvent', { id: variables.input.eventId }],
        });
      }
    },
    ...options,
  });
}
