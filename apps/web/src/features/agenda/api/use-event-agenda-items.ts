import {
  EventAgendaItemsDocument,
  EventAgendaItemsQuery,
  EventAgendaItemsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { gqlClient } from '@/lib/api/client';
import { QueryKey, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { agendaKeys } from './agenda-query-keys';

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
    queryKey: agendaKeys.list(variables) as unknown as QueryKey,
    queryFn: async () =>
      gqlClient.request<EventAgendaItemsQuery, EventAgendaItemsQueryVariables>(
        EventAgendaItemsDocument,
        variables
      ),
    select: (data) => data.eventAgendaItems,
    ...(options ?? {}),
  };
}

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
