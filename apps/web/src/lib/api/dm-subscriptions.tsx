'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Client, SubscribePayload } from 'graphql-ws';
import { print } from 'graphql';
import {
  OnDmMessageAddedDocument,
  type OnDmMessageAddedSubscription,
  OnDmTypingDocument,
  type OnDmTypingSubscription,
} from './__generated__/react-query-update';
import { getWsClient } from './ws-client';
import { dmKeys } from './dm';

/**
 * Subscribe to new messages in a DM thread
 */
export function useDmMessageAdded(params: {
  threadId: string;
  onMessage?: (
    message: NonNullable<OnDmMessageAddedSubscription['dmMessageAdded']>
  ) => void;
  enabled?: boolean;
}) {
  const { threadId, onMessage, enabled = true } = params;
  const queryClient = useQueryClient();
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef = useRef(0);
  const onMessageRef = useRef(onMessage);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!enabled || !threadId) return;

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
          query: print(OnDmMessageAddedDocument),
          variables: { threadId },
        };

        if (unsubscribeRef.current) {
          try {
            unsubscribeRef.current();
          } catch {}
          unsubscribeRef.current = null;
        }

        unsubscribeRef.current = client.subscribe<OnDmMessageAddedSubscription>(
          payload,
          {
            next: (result) => {
              if (!connected) setConnected(true);

              if (result.errors?.length) {
                console.error(
                  '❌ DM subscription GraphQL errors:',
                  result.errors
                );
                return;
              }

              const message = result.data?.dmMessageAdded;
              if (message) {
                if (onMessageRef.current) {
                  onMessageRef.current(message);
                } else {
                  // Default: invalidate messages query
                  queryClient.invalidateQueries({
                    queryKey: dmKeys.messages(threadId),
                  });
                  queryClient.invalidateQueries({
                    queryKey: dmKeys.thread(threadId),
                  });
                  queryClient.invalidateQueries({
                    queryKey: dmKeys.threads(),
                  });
                }
              }
            },
            error: (err) => {
              if (!isActive || mySession !== sessionRef.current) return;
              console.error('❌ DM subscription error:', err);
              setConnected(false);
              scheduleRetry();
            },
            complete: () => {
              if (!isActive || mySession !== sessionRef.current) return;
              setConnected(false);
              scheduleRetry();
            },
          }
        );
      } catch (err) {
        if (!isActive || mySession !== sessionRef.current) return;
        console.error('❗ DM subscription setup failed:', err);
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
  }, [threadId, enabled, queryClient]);

  return { connected };
}

/**
 * Subscribe to typing indicators in a DM thread
 */
export function useDmTyping(params: {
  threadId: string;
  onTyping?: (data: { userId: string; isTyping: boolean }) => void;
  enabled?: boolean;
}) {
  const { threadId, onTyping, enabled = true } = params;
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef = useRef(0);
  const onTypingRef = useRef(onTyping);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    onTypingRef.current = onTyping;
  }, [onTyping]);

  useEffect(() => {
    if (!enabled || !threadId) return;

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
          query: print(OnDmTypingDocument),
          variables: { threadId },
        };

        if (unsubscribeRef.current) {
          try {
            unsubscribeRef.current();
          } catch {}
          unsubscribeRef.current = null;
        }

        unsubscribeRef.current = client.subscribe<OnDmTypingSubscription>(
          payload,
          {
            next: (result) => {
              if (!connected) setConnected(true);

              if (result.errors?.length) {
                console.error(
                  '❌ DM typing subscription errors:',
                  result.errors
                );
                return;
              }

              const data = result.data?.dmTyping;
              if (data && onTypingRef.current) {
                onTypingRef.current({
                  userId: data.userId,
                  isTyping: data.isTyping,
                });
              }
            },
            error: (err) => {
              if (!isActive || mySession !== sessionRef.current) return;
              console.error('❌ DM typing subscription error:', err);
              setConnected(false);
              scheduleRetry();
            },
            complete: () => {
              if (!isActive || mySession !== sessionRef.current) return;
              setConnected(false);
              scheduleRetry();
            },
          }
        );
      } catch (err) {
        if (!isActive || mySession !== sessionRef.current) return;
        console.error('❗ DM typing subscription setup failed:', err);
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
  }, [threadId, enabled]);

  return { connected };
}
