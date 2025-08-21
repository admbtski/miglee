'use client';

import { useEffect, useRef, useState } from 'react';
import type { Client, SubscribePayload } from 'graphql-ws';
import { print } from 'graphql';
import { getWsClient } from '@/graphql/wsClient';

// typy z codegena
import {
  NotificationAddedDocument,
  type NotificationAddedSubscription,
} from '@/graphql/__generated__/react-query';

type NotificationNode = NonNullable<
  NotificationAddedSubscription['notificationAdded']
>;
type OnMessage = (notification: NotificationNode) => void;
type Unsubscribe = () => void;

export function useNotificationAdded(onMessage?: OnMessage): {
  connected: boolean;
} {
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef = useRef(0);
  const onMessageRef = useRef<OnMessage | undefined>(onMessage);
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

    const subscribeOnce = async (): Promise<void> => {
      try {
        const client = (await getWsClient()) as Client;
        if (!isActive || mySession !== sessionRef.current) return;

        // 👇 Zamiana TypedDocumentNode -> string (wymóg Twojego SubscribePayload)
        const payload: SubscribePayload = {
          query: print(NotificationAddedDocument),
          // variables: {} // jeśli kiedyś dodasz zmienne do subskrypcji
        };

        // zamknij poprzednią subskrypcję
        if (unsubscribeRef.current) {
          try {
            unsubscribeRef.current();
          } catch {}
          unsubscribeRef.current = null;
        }

        setConnected(true);

        unsubscribeRef.current =
          client.subscribe<NotificationAddedSubscription>(payload, {
            next: (result) => {
              if (result.errors?.length) {
                console.error('❌ GraphQL errors:', result.errors);
                return;
              }
              const node = result.data?.notificationAdded;
              if (node) {
                onMessageRef.current
                  ? onMessageRef.current(node)
                  : console.log('📨 notificationAdded:', node);
              }
            },
            error: (err: unknown) => {
              if (!isActive || mySession !== sessionRef.current) return;
              console.error('❌ Subscription error:', err);
              setConnected(false);
              scheduleRetry();
            },
            complete: () => {
              if (!isActive || mySession !== sessionRef.current) return;
              console.log('ℹ️ Subscription completed');
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
  }, []);

  return { connected };
}
