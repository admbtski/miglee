/**
 * React Query hooks for Event Agenda
 */

import {
  EventAgendaItemsDocument,
  EventAgendaItemsQuery,
  EventAgendaItemsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';

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
