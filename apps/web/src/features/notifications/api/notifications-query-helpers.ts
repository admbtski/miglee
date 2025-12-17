import {
  GetNotificationsQuery,
  GetNotificationsQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { getQueryClient } from '@/lib/config/query-client';
import { QueryKey } from '@tanstack/react-query';
import { GET_NOTIFICATIONS_KEY } from './notifications-query-keys';
import { NotificationNode } from './notifications-query-types';
import { MAX_NOTIFS } from './notifications-query-constants';

export function mutateCache(
  updater: (
    prev: GetNotificationsQuery | undefined
  ) => GetNotificationsQuery | undefined,
  variables?: GetNotificationsQueryVariables
) {
  const qc = getQueryClient();
  const key = GET_NOTIFICATIONS_KEY(variables) as unknown as QueryKey;
  qc.setQueryData<GetNotificationsQuery>(key, (old) => updater(old));
}

/** Pobierz bezpiecznie listę items (może być pusta struktura). */
export function getItems(old?: GetNotificationsQuery) {
  return old?.notifications?.items ?? [];
}

/** Zapisz nową listę items, zachowując pageInfo jeśli istnieje. */
export function setItems(
  old: GetNotificationsQuery | undefined,
  items: any[]
): GetNotificationsQuery {
  return {
    notifications: {
      __typename: old?.notifications?.__typename ?? 'NotificationsResult',
      items,
      pageInfo: old?.notifications?.pageInfo ?? {
        __typename: 'PageInfo',
        total: items.length,
        limit: items.length,
        offset: 0,
        hasPrev: false,
        hasNext: false,
      },
    },
  } as GetNotificationsQuery;
}

/** Dopisanie notyfikacji do cache (dedupe po id + limit) */
export function appendNotificationToCache(
  n: NotificationNode,
  variables?: GetNotificationsQueryVariables
) {
  mutateCache((old) => {
    const items = getItems(old);
    if (items.some((x: any) => x.id === (n as any).id)) return old; // już jest
    const next = [n as any, ...items].slice(0, MAX_NOTIFS);
    return setItems(old, next);
  }, variables);
}

/** Oznacz jedną notyfikację jako przeczytaną (optimistic) */
export function markOneReadInCache(
  id: string,
  variables?: GetNotificationsQueryVariables
) {
  mutateCache((old) => {
    const items = getItems(old);
    if (items.length === 0) return old;
    const now = new Date().toISOString();
    const next = items.map((x: any) =>
      x.id === id && !x.readAt ? { ...x, readAt: now } : x
    );
    return setItems(old, next);
  }, variables);
}

/** Usuń jedną notyfikację z cache (optimistic) */
export function removeOneFromCache(
  id: string,
  variables?: GetNotificationsQueryVariables
) {
  mutateCache((old) => {
    const items = getItems(old);
    if (items.length === 0) return old;
    const next = items.filter((x: any) => x.id !== id);
    return setItems(old, next);
  }, variables);
}

/** Oznacz wszystkie notyfikacje jako przeczytane (optimistic) */
export function markAllReadInCache(variables?: GetNotificationsQueryVariables) {
  mutateCache((old) => {
    const items = getItems(old);
    if (items.length === 0) return old;
    const now = new Date().toISOString();
    const next = items.map((x: any) => (x.readAt ? x : { ...x, readAt: now }));
    return setItems(old, next);
  }, variables);
}
