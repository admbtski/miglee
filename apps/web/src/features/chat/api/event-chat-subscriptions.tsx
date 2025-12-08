'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Client, SubscribePayload } from 'graphql-ws';
import { print } from 'graphql';
import {
  OnEventMessageAddedDocument,
  type OnEventMessageAddedSubscription,
  OnEventMessageUpdatedDocument,
  type OnEventMessageUpdatedSubscription,
  OnEventMessageDeletedDocument,
  type OnEventMessageDeletedSubscription,
  OnEventTypingDocument,
  type OnEventTypingSubscription,
} from '@/lib/api/__generated__/react-query-update';
import { getWsClient } from '@/lib/api/ws-client';
import { eventChatKeys } from './event-chat';

/**
 * Subscribe to new messages in an event chat
 */
export function useEventMessageAdded(params: {
  eventId: string;
  onMessage?: (
    message: NonNullable<OnEventMessageAddedSubscription['eventMessageAdded']>
  ) => void;
  enabled?: boolean;
}) {
  const { eventId, onMessage, enabled = true } = params;
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
    if (!enabled || !eventId) return;

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
          query: print(OnEventMessageAddedDocument),
          variables: { eventId },
        };

        if (unsubscribeRef.current) {
          try {
            unsubscribeRef.current();
          } catch {}
          unsubscribeRef.current = null;
        }

        unsubscribeRef.current =
          client.subscribe<OnEventMessageAddedSubscription>(payload, {
            next: (result) => {
              if (!connected) setConnected(true);

              if (result.errors?.length) {
                console.error(
                  '❌ Event chat subscription GraphQL errors:',
                  result.errors
                );
                return;
              }

              const message = result.data?.eventMessageAdded;
              if (message) {
                if (onMessageRef.current) {
                  onMessageRef.current(message);
                } else {
                  // Default: invalidate messages query
                  queryClient.invalidateQueries({
                    queryKey: eventChatKeys.messages(eventId),
                  });
                  queryClient.invalidateQueries({
                    queryKey: eventChatKeys.unreadCount(eventId),
                  });
                  queryClient.invalidateQueries({
                    queryKey: ['events', 'detail', eventId],
                  });
                }
              }
            },
            error: (err) => {
              if (!isActive || mySession !== sessionRef.current) return;
              console.error('❌ Event chat subscription error:', err);
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
        console.error('❗ Event chat subscription setup failed:', err);
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
  }, [eventId, enabled, queryClient]);

  return { connected };
}

/**
 * Subscribe to typing indicators in an event chat
 */
export function useEventTyping(params: {
  eventId: string;
  onTyping?: (data: { userId: string; isTyping: boolean }) => void;
  enabled?: boolean;
}) {
  const { eventId, onTyping, enabled = true } = params;
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef = useRef(0);
  const onTypingRef = useRef(onTyping);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    onTypingRef.current = onTyping;
  }, [onTyping]);

  useEffect(() => {
    if (!enabled || !eventId) return;

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
          query: print(OnEventTypingDocument),
          variables: { eventId },
        };

        if (unsubscribeRef.current) {
          try {
            unsubscribeRef.current();
          } catch {}
          unsubscribeRef.current = null;
        }

        unsubscribeRef.current = client.subscribe<OnEventTypingSubscription>(
          payload,
          {
            next: (result) => {
              if (!connected) setConnected(true);

              if (result.errors?.length) {
                console.error(
                  '❌ Event typing subscription errors:',
                  result.errors
                );
                return;
              }

              const data = result.data?.eventTyping;
              if (data && onTypingRef.current) {
                onTypingRef.current({
                  userId: data.userId,
                  isTyping: data.isTyping,
                });
              }
            },
            error: (err) => {
              if (!isActive || mySession !== sessionRef.current) return;
              console.error('❌ Event typing subscription error:', err);
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
        console.error('❗ Event typing subscription setup failed:', err);
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
  }, [eventId, enabled]);

  return { connected };
}

/**
 * Subscribe to message updates in an event chat
 */
export function useEventMessageUpdated(params: {
  eventId: string;
  onMessageUpdated?: (
    message: NonNullable<
      OnEventMessageUpdatedSubscription['eventMessageUpdated']
    >
  ) => void;
  enabled?: boolean;
}) {
  const { eventId, onMessageUpdated, enabled = true } = params;
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
    if (!enabled || !eventId) return;

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
          query: print(OnEventMessageUpdatedDocument),
          variables: { eventId },
        };

        if (unsubscribeRef.current) {
          try {
            unsubscribeRef.current();
          } catch {}
          unsubscribeRef.current = null;
        }

        unsubscribeRef.current =
          client.subscribe<OnEventMessageUpdatedSubscription>(payload, {
            next: (result) => {
              if (!connected) setConnected(true);

              if (result.errors?.length) {
                console.error(
                  '❌ Event message updated subscription errors:',
                  result.errors
                );
                return;
              }

              const message = result.data?.eventMessageUpdated;
              if (message) {
                console.log(
                  '[Event Sub] Message updated:',
                  message.id,
                  'EventID:',
                  eventId
                );
                if (onMessageUpdatedRef.current) {
                  onMessageUpdatedRef.current(message);
                } else {
                  // Default: invalidate messages query
                  queryClient.invalidateQueries({
                    queryKey: eventChatKeys.messages(eventId),
                  });
                }
              }
            },
            error: (err) => {
              if (!isActive || mySession !== sessionRef.current) return;
              console.error(
                '❌ Event message updated subscription error:',
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
          '❗ Event message updated subscription setup failed:',
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
  }, [eventId, enabled, queryClient]);

  return { connected };
}

/**
 * Subscribe to message deletions in an event chat
 */
export function useEventMessageDeleted(params: {
  eventId: string;
  onMessageDeleted?: (
    event: NonNullable<OnEventMessageDeletedSubscription['eventMessageDeleted']>
  ) => void;
  enabled?: boolean;
}) {
  const { eventId, onMessageDeleted, enabled = true } = params;
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
    if (!enabled || !eventId) return;

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
          query: print(OnEventMessageDeletedDocument),
          variables: { eventId },
        };

        if (unsubscribeRef.current) {
          try {
            unsubscribeRef.current();
          } catch {}
          unsubscribeRef.current = null;
        }

        unsubscribeRef.current =
          client.subscribe<OnEventMessageDeletedSubscription>(payload, {
            next: (result) => {
              if (!connected) setConnected(true);

              if (result.errors?.length) {
                console.error(
                  '❌ Event message deleted subscription errors:',
                  result.errors
                );
                return;
              }

              const event = result.data?.eventMessageDeleted;
              if (event) {
                console.log(
                  '[Event Sub] Message deleted:',
                  event.messageId,
                  'EventID:',
                  eventId
                );
                if (onMessageDeletedRef.current) {
                  onMessageDeletedRef.current(event);
                } else {
                  // Default: invalidate messages query
                  queryClient.invalidateQueries({
                    queryKey: eventChatKeys.messages(eventId),
                  });
                }
              }
            },
            error: (err) => {
              if (!isActive || mySession !== sessionRef.current) return;
              console.error(
                '❌ Event message deleted subscription error:',
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
          '❗ Event message deleted subscription setup failed:',
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
  }, [eventId, enabled, queryClient]);

  return { connected };
}
