'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Client, SubscribePayload } from 'graphql-ws';
import { print } from 'graphql';
import {
  OnIntentMessageAddedDocument,
  type OnIntentMessageAddedSubscription,
  OnIntentMessageUpdatedDocument,
  type OnIntentMessageUpdatedSubscription,
  OnIntentMessageDeletedDocument,
  type OnIntentMessageDeletedSubscription,
  OnIntentTypingDocument,
  type OnIntentTypingSubscription,
} from '@/lib/api/__generated__/react-query-update';
import { getWsClient } from '@/lib/api/ws-client';
import { eventChatKeys } from './event-chat';

/**
 * Subscribe to new messages in an intent chat
 */
export function useIntentMessageAdded(params: {
  intentId: string;
  onMessage?: (
    message: NonNullable<OnIntentMessageAddedSubscription['intentMessageAdded']>
  ) => void;
  enabled?: boolean;
}) {
  const { intentId, onMessage, enabled = true } = params;
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
          query: print(OnIntentMessageAddedDocument),
          variables: { intentId },
        };

        if (unsubscribeRef.current) {
          try {
            unsubscribeRef.current();
          } catch {}
          unsubscribeRef.current = null;
        }

        unsubscribeRef.current =
          client.subscribe<OnIntentMessageAddedSubscription>(payload, {
            next: (result) => {
              if (!connected) setConnected(true);

              if (result.errors?.length) {
                console.error(
                  '❌ Intent chat subscription GraphQL errors:',
                  result.errors
                );
                return;
              }

              const message = result.data?.intentMessageAdded;
              if (message) {
                if (onMessageRef.current) {
                  onMessageRef.current(message);
                } else {
                  // Default: invalidate messages query
                  queryClient.invalidateQueries({
                    queryKey: eventChatKeys.messages(intentId),
                  });
                  queryClient.invalidateQueries({
                    queryKey: eventChatKeys.unreadCount(intentId),
                  });
                  queryClient.invalidateQueries({
                    queryKey: ['intents', 'detail', intentId],
                  });
                }
              }
            },
            error: (err) => {
              if (!isActive || mySession !== sessionRef.current) return;
              console.error('❌ Intent chat subscription error:', err);
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
        console.error('❗ Intent chat subscription setup failed:', err);
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
  }, [intentId, enabled, queryClient]);

  return { connected };
}

/**
 * Subscribe to typing indicators in an intent chat
 */
export function useIntentTyping(params: {
  intentId: string;
  onTyping?: (data: { userId: string; isTyping: boolean }) => void;
  enabled?: boolean;
}) {
  const { intentId, onTyping, enabled = true } = params;
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef = useRef(0);
  const onTypingRef = useRef(onTyping);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    onTypingRef.current = onTyping;
  }, [onTyping]);

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
          query: print(OnIntentTypingDocument),
          variables: { intentId },
        };

        if (unsubscribeRef.current) {
          try {
            unsubscribeRef.current();
          } catch {}
          unsubscribeRef.current = null;
        }

        unsubscribeRef.current = client.subscribe<OnIntentTypingSubscription>(
          payload,
          {
            next: (result) => {
              if (!connected) setConnected(true);

              if (result.errors?.length) {
                console.error(
                  '❌ Intent typing subscription errors:',
                  result.errors
                );
                return;
              }

              const data = result.data?.intentTyping;
              if (data && onTypingRef.current) {
                onTypingRef.current({
                  userId: data.userId,
                  isTyping: data.isTyping,
                });
              }
            },
            error: (err) => {
              if (!isActive || mySession !== sessionRef.current) return;
              console.error('❌ Intent typing subscription error:', err);
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
        console.error('❗ Intent typing subscription setup failed:', err);
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
  }, [intentId, enabled]);

  return { connected };
}

/**
 * Subscribe to message updates in an intent chat
 */
export function useIntentMessageUpdated(params: {
  intentId: string;
  onMessageUpdated?: (
    message: NonNullable<
      OnIntentMessageUpdatedSubscription['intentMessageUpdated']
    >
  ) => void;
  enabled?: boolean;
}) {
  const { intentId, onMessageUpdated, enabled = true } = params;
  const queryClient = useQueryClient();
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef = useRef(0);
  const onMessageUpdatedRef = useRef(onMessageUpdated);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    onMessageUpdatedRef.current = onMessageUpdated;
  }, [onMessageUpdated]);

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
          query: print(OnIntentMessageUpdatedDocument),
          variables: { intentId },
        };

        if (unsubscribeRef.current) {
          try {
            unsubscribeRef.current();
          } catch {}
          unsubscribeRef.current = null;
        }

        unsubscribeRef.current =
          client.subscribe<OnIntentMessageUpdatedSubscription>(payload, {
            next: (result) => {
              if (!connected) setConnected(true);

              if (result.errors?.length) {
                console.error(
                  '❌ Intent message updated subscription errors:',
                  result.errors
                );
                return;
              }

              const message = result.data?.intentMessageUpdated;
              if (message) {
                console.log(
                  '[Intent Sub] Message updated:',
                  message.id,
                  'IntentID:',
                  intentId
                );
                if (onMessageUpdatedRef.current) {
                  onMessageUpdatedRef.current(message);
                } else {
                  // Default: invalidate messages query
                  queryClient.invalidateQueries({
                    queryKey: eventChatKeys.messages(intentId),
                  });
                }
              }
            },
            error: (err) => {
              if (!isActive || mySession !== sessionRef.current) return;
              console.error(
                '❌ Intent message updated subscription error:',
                err
              );
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
        console.error(
          '❗ Intent message updated subscription setup failed:',
          err
        );
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
  }, [intentId, enabled, queryClient]);

  return { connected };
}

/**
 * Subscribe to message deletions in an intent chat
 */
export function useIntentMessageDeleted(params: {
  intentId: string;
  onMessageDeleted?: (
    event: NonNullable<
      OnIntentMessageDeletedSubscription['intentMessageDeleted']
    >
  ) => void;
  enabled?: boolean;
}) {
  const { intentId, onMessageDeleted, enabled = true } = params;
  const queryClient = useQueryClient();
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef = useRef(0);
  const onMessageDeletedRef = useRef(onMessageDeleted);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    onMessageDeletedRef.current = onMessageDeleted;
  }, [onMessageDeleted]);

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
          query: print(OnIntentMessageDeletedDocument),
          variables: { intentId },
        };

        if (unsubscribeRef.current) {
          try {
            unsubscribeRef.current();
          } catch {}
          unsubscribeRef.current = null;
        }

        unsubscribeRef.current =
          client.subscribe<OnIntentMessageDeletedSubscription>(payload, {
            next: (result) => {
              if (!connected) setConnected(true);

              if (result.errors?.length) {
                console.error(
                  '❌ Intent message deleted subscription errors:',
                  result.errors
                );
                return;
              }

              const event = result.data?.intentMessageDeleted;
              if (event) {
                console.log(
                  '[Intent Sub] Message deleted:',
                  event.messageId,
                  'IntentID:',
                  intentId
                );
                if (onMessageDeletedRef.current) {
                  onMessageDeletedRef.current(event);
                } else {
                  // Default: invalidate messages query
                  queryClient.invalidateQueries({
                    queryKey: eventChatKeys.messages(intentId),
                  });
                }
              }
            },
            error: (err) => {
              if (!isActive || mySession !== sessionRef.current) return;
              console.error(
                '❌ Intent message deleted subscription error:',
                err
              );
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
        console.error(
          '❗ Intent message deleted subscription setup failed:',
          err
        );
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
  }, [intentId, enabled, queryClient]);

  return { connected };
}
