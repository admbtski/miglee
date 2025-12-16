import { GetEventCheckinLogsQueryVariables } from '@/lib/api/__generated__/react-query-update';

export const GET_EVENT_CHECKIN_LOGS_KEY = (
  variables: GetEventCheckinLogsQueryVariables
) => ['GetEventCheckinLogs', variables] as const;
