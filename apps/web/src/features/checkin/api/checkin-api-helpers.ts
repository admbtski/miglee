import { getQueryClient } from '@/lib/config/query-client';

export function invalidateCheckinData(eventId: string) {
  const qc = getQueryClient();

  qc.invalidateQueries({
    predicate: (q) => {
      if (!Array.isArray(q.queryKey)) return false;
      const [key, vars] = q.queryKey;
      if (
        key === 'GetEventCheckinLogs' &&
        vars &&
        typeof vars === 'object' &&
        'eventId' in vars &&
        vars.eventId === eventId
      ) {
        return true;
      }
      if (
        key === 'GetEventMembers' &&
        vars &&
        typeof vars === 'object' &&
        'eventId' in vars &&
        vars.eventId === eventId
      ) {
        return true;
      }
      if (
        key === 'GetEventDetail' &&
        vars &&
        typeof vars === 'object' &&
        'id' in vars &&
        vars.id === eventId
      ) {
        return true;
      }
      return false;
    },
  });
}
