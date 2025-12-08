'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Client, SubscribePayload } from 'graphql-ws';
import { print } from 'graphql';
import {
  OnDmMessageAddedDocument,
  type OnDmMessageAddedSubscription,
  OnDmMessageUpdatedDocument,
  type OnDmMessageUpdatedSubscription,
  OnDmMessageDeletedDocument,
  type OnDmMessageDeletedSubscription,
  OnDmTypingDocument,
  type OnDmTypingSubscription,
} from '@/lib/api/__generated__/react-query-update';
import { getWsClient } from '@/lib/api/ws-client';
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
                console.log(
                  '[DM Sub] Message received:',
                  message.id,
                  'ThreadID:',
                  threadId
                );
                if (onMessageRef.current) {
                  onMessageRef.current(message);
                } else {
                  // Default: invalidate messages query
                  console.log(
                    '[DM Sub] Invalidating queries for threadId:',
                    threadId
                  );
                  // Invalidate all messages queries for this thread (regardless of filters)
                  queryClient.invalidateQueries({
                    queryKey: ['dm', 'messages', threadId],
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
 * Subscribe to ALL DM threads for a user (for badge updates)
 * This subscribes to all threads in the list to catch new messages in background
 */
export function useDmThreadsSubscriptions(params: {
  threadIds: string[];
  enabled?: boolean;
}) {
  const { threadIds, enabled = true } = params;
  const queryClient = useQueryClient();
  const unsubscribesRef = useRef<Map<string, () => void>>(new Map());
  const [connectedCount, setConnectedCount] = useState(0);

  useEffect(() => {
    if (!enabled || threadIds.length === 0) return;

    const setupSubscriptions = async () => {
      try {
        const client = (await getWsClient()) as Client;

        // Unsubscribe from threads that are no longer in the list
        const currentThreadIds = new Set(threadIds);
        for (const [threadId, unsubscribe] of unsubscribesRef.current) {
          if (!currentThreadIds.has(threadId)) {
            try {
              unsubscribe();
            } catch {}
            unsubscribesRef.current.delete(threadId);
          }
        }

        // Subscribe to new threads
        for (const threadId of threadIds) {
          if (unsubscribesRef.current.has(threadId)) continue;

          const payload: SubscribePayload = {
            query: print(OnDmMessageAddedDocument),
            variables: { threadId },
          };

          const unsubscribe = client.subscribe<OnDmMessageAddedSubscription>(
            payload,
            {
              next: (result) => {
                if (result.errors?.length) {
                  console.error(
                    `❌ DM threads subscription error for ${threadId}:`,
                    result.errors
                  );
                  return;
                }

                const message = result.data?.dmMessageAdded;
                if (message) {
                  console.log(
                    `[DM Threads Sub] New message in thread ${threadId}`
                  );
                  // Invalidate threads list to update badges and last message
                  queryClient.invalidateQueries({
                    queryKey: ['dm', 'threads'],
                  });
                  // Also invalidate messages for this specific thread
                  queryClient.invalidateQueries({
                    queryKey: ['dm', 'messages', threadId],
                  });
                }
              },
              error: (err) => {
                console.error(
                  `❌ DM threads subscription error for ${threadId}:`,
                  err
                );
              },
              complete: () => {
                console.log(
                  `[DM Threads Sub] Subscription completed for ${threadId}`
                );
              },
            }
          );

          unsubscribesRef.current.set(threadId, unsubscribe);
        }

        setConnectedCount(unsubscribesRef.current.size);
      } catch (err) {
        console.error('❗ DM threads subscriptions setup failed:', err);
      }
    };

    void setupSubscriptions();

    return () => {
      // Cleanup all subscriptions
      for (const [, unsubscribe] of unsubscribesRef.current) {
        try {
          unsubscribe();
        } catch {}
      }
      unsubscribesRef.current.clear();
      setConnectedCount(0);
    };
  }, [threadIds, enabled, queryClient]);

  return { connectedCount };
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

/**
 * Subscribe to message updates in a DM thread
 */
export function useDmMessageUpdated(params: {
  threadId: string;
  onMessageUpdated?: (
    message: NonNullable<OnDmMessageUpdatedSubscription['dmMessageUpdated']>
  ) => void;
  enabled?: boolean;
}) {
  const { threadId, onMessageUpdated, enabled = true } = params;
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
    console.log(
      '[DM Sub Hook UPDATE] useEffect triggered, enabled:',
      enabled,
      'threadId:',
      threadId
    );
    if (!enabled || !threadId) {
      console.log('[DM Sub Hook UPDATE] Not enabled or no threadId, returning');
      return;
    }

    console.log('[DM Sub Hook UPDATE] Starting subscription setup...');
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
      console.log(
        '[DM Sub Hook UPDATE] subscribeOnce called, getting WS client...'
      );
      try {
        const client = (await getWsClient()) as Client;
        console.log('[DM Sub Hook UPDATE] WS client obtained, subscribing...');
        if (!isActive || mySession !== sessionRef.current) return;

        const payload: SubscribePayload = {
          query: print(OnDmMessageUpdatedDocument),
          variables: { threadId },
        };
        console.log('[DM Sub Hook UPDATE] Payload:', payload);

        if (unsubscribeRef.current) {
          try {
            unsubscribeRef.current();
          } catch {}
          unsubscribeRef.current = null;
        }

        unsubscribeRef.current =
          client.subscribe<OnDmMessageUpdatedSubscription>(payload, {
            next: (result) => {
              if (!connected) setConnected(true);

              if (result.errors?.length) {
                console.error(
                  '❌ DM message updated subscription errors:',
                  result.errors
                );
                return;
              }

              const message = result.data?.dmMessageUpdated;
              if (message) {
                console.log(
                  '[DM Sub Hook] Message updated received:',
                  message.id,
                  'ThreadID:',
                  threadId,
                  'Has callback:',
                  !!onMessageUpdatedRef.current
                );
                if (onMessageUpdatedRef.current) {
                  console.log('[DM Sub Hook] Calling callback...');
                  onMessageUpdatedRef.current(message);
                  console.log('[DM Sub Hook] Callback called!');
                } else {
                  console.log(
                    '[DM Sub Hook] No callback, invalidating queries'
                  );
                  // Default: invalidate messages query
                  queryClient.invalidateQueries({
                    queryKey: dmKeys.messages(threadId),
                  });
                }
              } else {
                console.log('[DM Sub Hook] No message in result.data');
              }
            },
            error: (err) => {
              if (!isActive || mySession !== sessionRef.current) return;
              console.error('❌ DM message updated subscription error:', err);
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
        console.error('❗ DM message updated subscription setup failed:', err);
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
 * Subscribe to message deletions in a DM thread
 */
export function useDmMessageDeleted(params: {
  threadId: string;
  onMessageDeleted?: (
    event: NonNullable<OnDmMessageDeletedSubscription['dmMessageDeleted']>
  ) => void;
  enabled?: boolean;
}) {
  const { threadId, onMessageDeleted, enabled = true } = params;
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
    console.log(
      '[DM Sub Hook DELETE] useEffect triggered, enabled:',
      enabled,
      'threadId:',
      threadId
    );
    if (!enabled || !threadId) {
      console.log('[DM Sub Hook DELETE] Not enabled or no threadId, returning');
      return;
    }

    console.log('[DM Sub Hook DELETE] Starting subscription setup...');
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
      console.log(
        '[DM Sub Hook DELETE] subscribeOnce called, getting WS client...'
      );
      try {
        const client = (await getWsClient()) as Client;
        console.log('[DM Sub Hook DELETE] WS client obtained, subscribing...');
        if (!isActive || mySession !== sessionRef.current) return;

        const payload: SubscribePayload = {
          query: print(OnDmMessageDeletedDocument),
          variables: { threadId },
        };
        console.log('[DM Sub Hook DELETE] Payload:', payload);

        if (unsubscribeRef.current) {
          try {
            unsubscribeRef.current();
          } catch {}
          unsubscribeRef.current = null;
        }

        unsubscribeRef.current =
          client.subscribe<OnDmMessageDeletedSubscription>(payload, {
            next: (result) => {
              if (!connected) setConnected(true);

              if (result.errors?.length) {
                console.error(
                  '❌ DM message deleted subscription errors:',
                  result.errors
                );
                return;
              }

              const event = result.data?.dmMessageDeleted;
              if (event) {
                console.log(
                  '[DM Sub Hook] Message deleted received:',
                  event.messageId,
                  'ThreadID:',
                  threadId,
                  'Has callback:',
                  !!onMessageDeletedRef.current
                );
                if (onMessageDeletedRef.current) {
                  console.log('[DM Sub Hook] Calling delete callback...');
                  onMessageDeletedRef.current(event);
                  console.log('[DM Sub Hook] Delete callback called!');
                } else {
                  console.log(
                    '[DM Sub Hook] No callback, invalidating queries'
                  );
                  // Default: invalidate messages query
                  queryClient.invalidateQueries({
                    queryKey: dmKeys.messages(threadId),
                  });
                }
              } else {
                console.log('[DM Sub Hook] No event in result.data');
              }
            },
            error: (err) => {
              if (!isActive || mySession !== sessionRef.current) return;
              console.error('❌ DM message deleted subscription error:', err);
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
        console.error('❗ DM message deleted subscription setup failed:', err);
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
