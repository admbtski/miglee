// apps/web/src/hooks/notifications.ts
import {
  NotificationAddedDocument,
  type NotificationAddedSubscription,
} from '@/lib/api/__generated__/react-query-update';
import { getWsClient } from '@/lib/api/ws-client';
import { print } from 'graphql';
import type { Client, SubscribePayload } from 'graphql-ws';
import { useEffect, useRef, useState } from 'react';
import { appendNotificationToCache } from './notifications-query-helpers';
import { OnNotification } from './notifications-query-types';

export function useNotificationAdded(params: {
  recipientId: string;
  onMessage?: OnNotification;
}) {
  const { recipientId, onMessage } = params;
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef = useRef(0);
  const onMessageRef = useRef<OnNotification | undefined>(onMessage);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    let isActive = true;
    const mySession = ++sessionRef.current;
    const backoffMs = [1000, 2000, 5000, 10000] as const;
    let attempt = 0;

    const scheduleRetry = () => {
      const delay = backoffMs[Math.min(attempt, backoffMs.length - 1)];
      attempt += 1;
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = setTimeout(() => {
        if (!isActive || mySession !== sessionRef.current) return;
        void subscribeOnce();
      }, delay);
    };

    const subscribeOnce = async () => {
      try {
        const client = (await getWsClient()) as Client;
        if (!isActive || mySession !== sessionRef.current) return;

        const payload: SubscribePayload = {
          query: print(NotificationAddedDocument),
          variables: { recipientId },
        };

        // zamknij poprzednią subskrypcję
        if (unsubscribeRef.current) {
          try {
            unsubscribeRef.current();
          } catch {}
          unsubscribeRef.current = null;
        }

        unsubscribeRef.current =
          client.subscribe<NotificationAddedSubscription>(payload, {
            next: (result) => {
              if (!connected) setConnected(true);

              if (result.errors?.length) {
                console.error('❌ GraphQL errors:', result.errors);
                return;
              }
              const node = result.data?.notificationAdded;
              if (node) {
                if (onMessageRef.current) {
                  onMessageRef.current(node);
                } else {
                  appendNotificationToCache(node, { recipientId });
                }
              }
            },
            error: (err) => {
              if (!isActive || mySession !== sessionRef.current) return;
              console.error('❌ Subscription error:', err);
              setConnected(false);
              scheduleRetry();
            },
            complete: () => {
              if (!isActive || mySession !== sessionRef.current) return;
              setConnected(false);
              scheduleRetry();
            },
          });
      } catch (err) {
        if (!isActive || mySession !== sessionRef.current) return;
        console.error('❗ Subscription setup failed:', err);
        setConnected(false);
        scheduleRetry();
      }
    };

    void subscribeOnce();

    return () => {
      isActive = false;
      sessionRef.current++;
      setConnected(false);

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      if (unsubscribeRef.current) {
        try {
          unsubscribeRef.current();
        } catch {}
        unsubscribeRef.current = null;
      }
    };
  }, [recipientId]); // eslint-disable-line react-hooks/exhaustive-deps

  return { connected };
}
