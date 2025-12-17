import type { EventAgendaItemsQueryVariables } from '@/lib/api/__generated__/react-query-update';

export const agendaKeys = {
  all: ['agenda'] as const,
  lists: () => [...agendaKeys.all, 'list'] as const,
  list: (variables: EventAgendaItemsQueryVariables) =>
    [...agendaKeys.lists(), variables] as const,
};
