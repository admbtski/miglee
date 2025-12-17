import type { GetEventCheckinLogsQueryVariables } from '@/lib/api/__generated__/react-query-update';

export const checkinKeys = {
  all: ['checkin'] as const,
  logs: () => [...checkinKeys.all, 'logs'] as const,
  eventLogs: (variables: GetEventCheckinLogsQueryVariables) =>
    [...checkinKeys.logs(), variables] as const,
};
