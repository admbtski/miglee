'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Client, SubscribePayload } from 'graphql-ws';
import { print } from 'graphql';
import {
  OnDmReactionAddedDocument,
  type OnDmReactionAddedSubscription,
  OnIntentReactionAddedDocument,
  type OnIntentReactionAddedSubscription,
} from './__generated__/react-query-update';
import { getWsClient } from './ws-client';

// =============================================================================
// DM Reaction Subscription
// =============================================================================

export function useDmReactionAdded(params: {
  threadId: string;
  enabled?: boolean;
}) {
  const { threadId, enabled = true } = params;
  const queryClient = useQueryClient();
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef = useRef(0);
  const [connected, setConnected] = useState(false);

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
          query: print(OnDmReactionAddedDocument),
          variables: { threadId },
        };

        if (unsubscribeRef.current) {
          try {
            unsubscribeRef.current();
          } catch {}
          unsubscribeRef.current = null;
        }

        unsubscribeRef.current =
          client.subscribe<OnDmReactionAddedSubscription>(payload, {
            next: (result) => {
              if (!connected) setConnected(true);

              if (result.errors?.length) {
                console.error(
                  '❌ DM reaction subscription GraphQL errors:',
                  result.errors
                );
                return;
              }

              const reaction = result.data?.dmReactionAdded;
              if (reaction) {
                // Invalidate messages to refetch with updated reactions
                // Use prefix match to invalidate all queries for this thread
                queryClient.invalidateQueries({
                  queryKey: ['dm', 'messages', threadId],
                });

                console.log(
                  `[DM Reaction] ${reaction.action} ${reaction.emoji} on message ${reaction.messageId} by user ${reaction.userId}`
                );
              }
            },
            error: (err) => {
              if (!isActive || mySession !== sessionRef.current) return;
              console.error('❌ DM reaction subscription error:', err);
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
        console.error('❗ DM reaction subscription setup failed:', err);
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
  }, [threadId, enabled, queryClient, connected]);

  return { connected };
}

// =============================================================================
// Intent Reaction Subscription
// =============================================================================

export function useIntentReactionAdded(params: {
  intentId: string;
  enabled?: boolean;
}) {
  const { intentId, enabled = true } = params;
  const queryClient = useQueryClient();
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef = useRef(0);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!enabled || !intentId) return;

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
          query: print(OnIntentReactionAddedDocument),
          variables: { intentId },
        };

        if (unsubscribeRef.current) {
          try {
            unsubscribeRef.current();
          } catch {}
          unsubscribeRef.current = null;
        }

        unsubscribeRef.current =
          client.subscribe<OnIntentReactionAddedSubscription>(payload, {
            next: (result) => {
              if (!connected) setConnected(true);

              if (result.errors?.length) {
                console.error(
                  '❌ Intent reaction subscription GraphQL errors:',
                  result.errors
                );
                return;
              }

              const reaction = result.data?.intentReactionAdded;
              if (reaction) {
                // Invalidate messages to refetch with updated reactions
                // Use prefix match to invalidate all queries for this intent
                queryClient.invalidateQueries({
                  queryKey: ['event-chat', 'messages', intentId],
                });

                console.log(
                  `[Intent Reaction] ${reaction.action} ${reaction.emoji} on message ${reaction.messageId} by user ${reaction.userId}`
                );
              }
            },
            error: (err) => {
              if (!isActive || mySession !== sessionRef.current) return;
              console.error('❌ Intent reaction subscription error:', err);
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
        console.error('❗ Intent reaction subscription setup failed:', err);
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
  }, [intentId, enabled, queryClient, connected]);

  return { connected };
}
