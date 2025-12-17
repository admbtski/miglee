import { getQueryClient } from '@/lib/config/query-client';

export function invalidateMembers(eventId: string) {
  const qc = getQueryClient();
  qc.invalidateQueries({
    predicate: (q) =>
      Array.isArray(q.queryKey) &&
      q.queryKey[0] === 'GetEventMembers' &&
      (q.queryKey[1] as any)?.eventId === eventId,
  });
  qc.invalidateQueries({
    predicate: (q) =>
      Array.isArray(q.queryKey) &&
      q.queryKey[0] === 'GetEventMemberStats' &&
      (q.queryKey[1] as any)?.eventId === eventId,
  });
  // odśwież szczegół i listę eventów (np. badge liczb)
  qc.invalidateQueries({
    predicate: (q) =>
      Array.isArray(q.queryKey) && q.queryKey[0] === 'GetEventDetail',
  });
  qc.invalidateQueries({
    predicate: (q) =>
      Array.isArray(q.queryKey) && q.queryKey[0] === 'GetEventDetail',
  });
}
