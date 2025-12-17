/**
 * Custom hook for Channel (Event) chat functionality
 *
 * @description
 * Provides complete Channel chat functionality including:
 * - Fetching and transforming user memberships (channels)
 * - Fetching and transforming channel messages with infinite scroll
 * - Sending messages with optimistic updates
 * - Real-time subscriptions (new messages, edits, deletes, reactions, typing)
 * - Typing indicators with auto-clear
 * - Mark as read
 * - Unread count tracking
 * - Edit and delete messages
 * - Error handling with toast notifications
 * - Retry logic for failed messages
 *
 * @example
 * ```tsx
 * const channelChat = useChannelChat({
 *   myUserId: 'user-123',
 *   activeEventId: 'event-456',
 * });
 *
 * // Send message
 * channelChat.sendMessage('Hello channel!', replyToId);
 *
 * // Load more messages
 * if (channelChat.hasMore) {
 *   channelChat.loadMore();
 * }
 * ```
 */

// TODO i18n: All toast messages need translation keys

'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetEventMessages,
  useSendEventMessage,
  useMarkEventChatRead,
  useGetEventUnreadCount,
  usePublishEventTyping,
  eventChatKeys,
} from '@/features/chat';
import {
  useEventMessageAdded,
  useEventMessageUpdated,
  useEventMessageDeleted,
  useEventTyping,
} from '@/features/chat';
import {
  useAddEventReaction,
  useRemoveEventReaction,
} from '@/features/chat';
import { useEventReactionAdded } from '@/features/chat';
import {
  useEditEventMessage,
  useDeleteEventMessage,
} from '@/features/chat';
import { useMyMembershipsQuery } from '@/features/events';
import { useMeQuery } from '@/features/auth';
import type { Message } from '../types';

// =============================================================================
// Types
// =============================================================================

type UseChannelChatProps = {
  /** Active event (channel) ID to fetch messages for */
  activeEventId?: string;
};

type PendingMessage = Message & {
  status: 'pending' | 'failed';
  retries: number;
  originalContent: string;
};

type Conversation = {
  id: string;
  kind: 'channel';
  title: string;
  membersCount: number;
  preview: string;
  lastMessageAt: string;
  unread: number;
  avatar?: string;
};

// =============================================================================
// Constants
// =============================================================================

const MAX_RETRIES = 3;

// =============================================================================
// Helpers
// =============================================================================

function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);

  // TODO i18n
  if (diffMins < 1) return 'teraz';
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

// =============================================================================
// Hook
// =============================================================================

export function useChannelChat({ activeEventId }: UseChannelChatProps) {
  const queryClient = useQueryClient();
  const { data: authData } = useMeQuery();
  const myUserId = authData?.me?.id;

  // ---------------------------------------------------------------------------
  // Edit/Delete state
  // ---------------------------------------------------------------------------
  const [editingMessage, setEditingMessage] = useState<{
    id: string;
    content: string;
  } | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(
    null
  );

  // ---------------------------------------------------------------------------
  // Pending messages state (for optimistic UI and retries)
  // ---------------------------------------------------------------------------
  const [pendingMessages, setPendingMessages] = useState<
    Map<string, PendingMessage>
  >(new Map());

  // ---------------------------------------------------------------------------
  // Typing state with auto-clear timeouts
  // ---------------------------------------------------------------------------
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------
  const { data: membershipsData, isLoading: membershipsLoading } =
    useMyMembershipsQuery({ limit: 100, offset: 0 }, { enabled: !!myUserId });

  const {
    data: messagesData,
    isLoading: messagesLoading,
    fetchNextPage,
    hasNextPage = false,
    isFetchingNextPage,
  } = useGetEventMessages(activeEventId ?? '', {
    enabled: !!activeEventId,
  });

  const { data: unreadData } = useGetEventUnreadCount(
    { eventId: activeEventId ?? '' },
    { enabled: !!activeEventId, refetchInterval: 10000 }
  );

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------
  const sendMessage = useSendEventMessage();
  const markAsRead = useMarkEventChatRead();
  const publishTyping = usePublishEventTyping();
  const addReaction = useAddEventReaction();
  const removeReaction = useRemoveEventReaction();
  const editMessage = useEditEventMessage();
  const deleteMessage = useDeleteEventMessage();

  // ---------------------------------------------------------------------------
  // Subscriptions
  // ---------------------------------------------------------------------------
  useEventMessageAdded({
    eventId: activeEventId ?? '',
    enabled: !!activeEventId,
    onMessage: (message) => {
      // If this message was a pending message, remove it from pending
      if (pendingMessages.has(message.id)) {
        setPendingMessages((prev) => {
          const next = new Map(prev);
          next.delete(message.id);
          return next;
        });
      }

      queryClient.invalidateQueries({
        queryKey: eventChatKeys.messages(activeEventId!),
      });

      // Auto-mark as read
      if (message.authorId !== myUserId) {
        markAsRead.mutate({ eventId: activeEventId! });
      }
    },
  });

  useEventMessageUpdated({
    eventId: activeEventId ?? '',
    enabled: !!activeEventId,
    onMessageUpdated: (message) => {
      queryClient.setQueryData(
        eventChatKeys.messages(activeEventId!),
        (oldData: any) => {
          if (!oldData?.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              eventMessages: {
                ...page.eventMessages,
                edges: page.eventMessages?.edges?.map((edge: any) =>
                  edge.node.id === message.id
                    ? {
                        ...edge,
                        node: {
                          ...edge.node,
                          content: message.content,
                          editedAt: message.editedAt,
                        },
                      }
                    : edge
                ),
              },
            })),
          };
        }
      );
    },
  });

  useEventMessageDeleted({
    eventId: activeEventId ?? '',
    enabled: !!activeEventId,
    onMessageDeleted: (event) => {
      queryClient.setQueryData(
        eventChatKeys.messages(activeEventId!),
        (oldData: any) => {
          if (!oldData?.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              eventMessages: {
                ...page.eventMessages,
                edges: page.eventMessages?.edges?.map((edge: any) =>
                  edge.node.id === event.messageId
                    ? {
                        ...edge,
                        node: {
                          ...edge.node,
                          deletedAt: event.deletedAt,
                        },
                      }
                    : edge
                ),
              },
            })),
          };
        }
      );
    },
  });

  useEventTyping({
    eventId: activeEventId ?? '',
    enabled: !!activeEventId,
    onTyping: ({ userId, isTyping }) => {
      if (userId === myUserId) return;

      const existingTimeout = typingTimeouts.current.get(`event-${userId}`);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        typingTimeouts.current.delete(`event-${userId}`);
      }

      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (isTyping) {
          next.add(userId);
          const timeout = setTimeout(() => {
            setTypingUsers((p) => {
              const n = new Set(p);
              n.delete(userId);
              return n;
            });
            typingTimeouts.current.delete(`event-${userId}`);
          }, 5000);
          typingTimeouts.current.set(`event-${userId}`, timeout);
        } else {
          next.delete(userId);
        }
        return next;
      });
    },
  });

  useEventReactionAdded({
    eventId: activeEventId ?? '',
    enabled: !!activeEventId,
  });

  // ---------------------------------------------------------------------------
  // Transform memberships to conversations
  // ---------------------------------------------------------------------------
  const conversations: Conversation[] = useMemo(() => {
    const memberships = membershipsData?.myMemberships;
    if (!memberships || !myUserId) return [];

    return memberships
      .filter((membership) => membership.status === 'JOINED')
      .flatMap((membership): Conversation[] => {
        const event = membership.event;
        if (!event) return [];

        // TODO i18n
        const lastMessage =
          event.messagesCount > 0 ? 'Ostatnia aktywność' : 'Brak wiadomości';

        return [
          {
            id: event.id,
            kind: 'channel' as const,
            title: event.title || 'Bez tytułu',
            membersCount: event.joinedCount || 0,
            preview: lastMessage,
            lastMessageAt: formatRelativeTime(event.updatedAt),
            unread: 0, // Will be updated per-channel when selected
            avatar: event.owner?.avatarKey || undefined,
          },
        ];
      });
  }, [membershipsData, myUserId]);

  // ---------------------------------------------------------------------------
  // Transform messages
  // ---------------------------------------------------------------------------
  const messages: Message[] = useMemo(() => {
    if (!messagesData?.pages || !myUserId) return [];

    const allMessages = messagesData.pages.flatMap(
      (page: any) => page.eventMessages?.edges?.map((e: any) => e.node) || []
    );

    // Combine with pending messages
    const combinedMessages = [...allMessages];
    for (const pendingMsg of pendingMessages.values()) {
      if (!combinedMessages.some((msg) => msg.id === pendingMsg.id)) {
        combinedMessages.push(pendingMsg);
      }
    }

    combinedMessages.sort((a, b) => {
      const aTime = new Date(a.createdAt || a.at).getTime();
      const bTime = new Date(b.createdAt || b.at).getTime();
      return aTime - bTime;
    });

    return combinedMessages.map((msg: any) => ({
      id: msg.id,
      text: msg.content,
      at: new Date(msg.createdAt || msg.at).getTime(),
      side: (msg.authorId === myUserId ? 'right' : 'left') as 'left' | 'right',
      author: {
        id: msg.author?.id || myUserId,
        name: msg.author?.name || authData?.me?.name || 'Unknown',
        avatar: msg.author?.avatarKey || authData?.me?.avatarKey || undefined,
      },
      block: !!msg.deletedAt,
      reactions: msg.reactions || [],
      editedAt: msg.editedAt,
      deletedAt: msg.deletedAt,
      replyTo: msg.replyTo
        ? {
            id: msg.replyTo.id,
            author: {
              id: msg.replyTo.author.id,
              name: msg.replyTo.author.name || 'Unknown',
            },
            content: msg.replyTo.content,
          }
        : null,
      status: msg.status,
      retries: msg.retries,
      originalContent: msg.originalContent,
    }));
  }, [
    messagesData,
    myUserId,
    pendingMessages,
    authData?.me?.name,
    authData?.me?.avatarKey,
  ]);

  // ---------------------------------------------------------------------------
  // Get active channel info
  // ---------------------------------------------------------------------------
  const activeChannel = useMemo(() => {
    if (!activeEventId || !membershipsData?.myMemberships) return null;
    const membership = membershipsData.myMemberships.find(
      (m) => m.event.id === activeEventId
    );
    if (!membership) return null;

    const event = membership.event;
    return {
      id: event.id,
      kind: 'channel' as const,
      title: event.title || 'Bez tytułu',
      avatar: event.owner?.avatarKey || undefined,
      members: event.joinedCount || 0,
    };
  }, [activeEventId, membershipsData]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleSendMessage = useCallback(
    (text: string, replyToId?: string) => {
      if (!myUserId || !activeEventId) {
        toast.error('Musisz być zalogowany, aby wysłać wiadomość.'); // TODO i18n
        return;
      }

      const trimmedText = text.trim();
      if (!trimmedText) return;

      const tempId = `channel-pending-${Date.now()}`;
      const now = Date.now();

      const optimisticMessage: PendingMessage = {
        id: tempId,
        text: trimmedText,
        at: now,
        side: 'right',
        author: {
          id: myUserId,
          name: authData?.me?.name || 'You',
          avatar: authData?.me?.avatarKey || undefined,
        },
        status: 'pending',
        retries: 0,
        originalContent: trimmedText,
        reactions: [],
        replyTo: replyToId
          ? { id: replyToId, author: { id: '', name: '' }, content: '' }
          : null,
      };

      setPendingMessages((prev) =>
        new Map(prev).set(tempId, optimisticMessage)
      );

      sendMessage.mutate(
        {
          input: {
            eventId: activeEventId,
            content: trimmedText,
            replyToId: replyToId || undefined,
          },
        },
        {
          onSuccess: (data) => {
            setPendingMessages((prev) => {
              const next = new Map(prev);
              if (data.sendEventMessage?.id) {
                next.delete(tempId);
              }
              return next;
            });
            queryClient.invalidateQueries({
              queryKey: eventChatKeys.messages(activeEventId),
            });
          },
          onError: (error) => {
            console.error('Failed to send message:', error);
            setPendingMessages((prev) => {
              const next = new Map(prev);
              const failedMsg = next.get(tempId);
              if (failedMsg) {
                next.set(tempId, { ...failedMsg, status: 'failed' });
              }
              return next;
            });
            toast.error('Nie udało się wysłać wiadomości.', {
              // TODO i18n
              description: error.message,
            });
          },
        }
      );
    },
    [
      activeEventId,
      sendMessage,
      queryClient,
      myUserId,
      authData?.me?.name,
      authData?.me?.avatarKey,
    ]
  );

  const retryFailedMessage = useCallback(
    (pendingId: string) => {
      const messageToRetry = pendingMessages.get(pendingId);
      if (
        !messageToRetry ||
        messageToRetry.retries >= MAX_RETRIES ||
        !activeEventId
      ) {
        if (messageToRetry && messageToRetry.retries >= MAX_RETRIES) {
          toast.error('Przekroczono limit prób wysłania wiadomości.'); // TODO i18n
        }
        return;
      }

      setPendingMessages((prev) => {
        const next = new Map(prev);
        next.set(pendingId, {
          ...messageToRetry,
          status: 'pending',
          retries: messageToRetry.retries + 1,
        });
        return next;
      });

      sendMessage.mutate(
        {
          input: {
            eventId: activeEventId,
            content: messageToRetry.originalContent,
            replyToId: messageToRetry.replyTo?.id || undefined,
          },
        },
        {
          onSuccess: (data) => {
            setPendingMessages((prev) => {
              const next = new Map(prev);
              if (data.sendEventMessage?.id) {
                next.delete(pendingId);
              }
              return next;
            });
            queryClient.invalidateQueries({
              queryKey: eventChatKeys.messages(activeEventId),
            });
          },
          onError: (error) => {
            console.error('Failed to retry message:', error);
            setPendingMessages((prev) => {
              const next = new Map(prev);
              const failedMsg = next.get(pendingId);
              if (failedMsg) {
                next.set(pendingId, { ...failedMsg, status: 'failed' });
              }
              return next;
            });
            toast.error('Ponowna próba nieudana.'); // TODO i18n
          },
        }
      );
    },
    [activeEventId, sendMessage, queryClient, pendingMessages]
  );

  const dismissFailedMessage = useCallback((pendingId: string) => {
    setPendingMessages((prev) => {
      const next = new Map(prev);
      next.delete(pendingId);
      return next;
    });
    toast.info('Wiadomość została odrzucona.'); // TODO i18n
  }, []);

  const handleTyping = useCallback(
    (isTyping: boolean) => {
      if (!activeEventId) return;
      publishTyping.mutate({ eventId: activeEventId, isTyping });
    },
    [activeEventId, publishTyping]
  );

  const handleAddReaction = useCallback(
    (messageId: string, emoji: string) => {
      addReaction.mutate(
        { messageId, emoji },
        {
          onError: (error) => {
            toast.error('Nie udało się dodać reakcji.', {
              description: error.message,
            }); // TODO i18n
          },
        }
      );
    },
    [addReaction]
  );

  const handleRemoveReaction = useCallback(
    (messageId: string, emoji: string) => {
      removeReaction.mutate(
        { messageId, emoji },
        {
          onError: (error) => {
            toast.error('Nie udało się usunąć reakcji.', {
              description: error.message,
            }); // TODO i18n
          },
        }
      );
    },
    [removeReaction]
  );

  // ---------------------------------------------------------------------------
  // Edit modal handlers
  // ---------------------------------------------------------------------------
  const openEditModal = useCallback((messageId: string, content: string) => {
    setEditingMessage({ id: messageId, content });
  }, []);

  const closeEditModal = useCallback(() => {
    setEditingMessage(null);
  }, []);

  const handleSaveEdit = useCallback(
    async (newContent: string) => {
      if (!editingMessage || !activeEventId) return;

      try {
        await editMessage.mutateAsync({
          id: editingMessage.id,
          input: { content: newContent },
        });

        queryClient.setQueryData(
          eventChatKeys.messages(activeEventId),
          (oldData: any) => {
            if (!oldData?.pages) return oldData;
            return {
              ...oldData,
              pages: oldData.pages.map((page: any) => ({
                ...page,
                eventMessages: {
                  ...page.eventMessages,
                  edges: page.eventMessages?.edges?.map((edge: any) =>
                    edge.node.id === editingMessage.id
                      ? {
                          ...edge,
                          node: {
                            ...edge.node,
                            content: newContent,
                            editedAt: new Date().toISOString(),
                          },
                        }
                      : edge
                  ),
                },
              })),
            };
          }
        );

        setEditingMessage(null);
        toast.success('Wiadomość została zedytowana.'); // TODO i18n
      } catch (error: any) {
        console.error('Failed to edit message:', error);
        toast.error('Nie udało się zedytować wiadomości.', {
          description: error.message,
        }); // TODO i18n
        throw error;
      }
    },
    [editingMessage, editMessage, activeEventId, queryClient]
  );

  // ---------------------------------------------------------------------------
  // Delete modal handlers
  // ---------------------------------------------------------------------------
  const openDeleteModal = useCallback((messageId: string) => {
    setDeletingMessageId(messageId);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setDeletingMessageId(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingMessageId || !activeEventId) return;

    try {
      await deleteMessage.mutateAsync({
        id: deletingMessageId,
        soft: true,
        eventId: activeEventId,
      });

      queryClient.setQueryData(
        eventChatKeys.messages(activeEventId),
        (oldData: any) => {
          if (!oldData?.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              eventMessages: {
                ...page.eventMessages,
                edges: page.eventMessages?.edges?.map((edge: any) =>
                  edge.node.id === deletingMessageId
                    ? {
                        ...edge,
                        node: {
                          ...edge.node,
                          deletedAt: new Date().toISOString(),
                        },
                      }
                    : edge
                ),
              },
            })),
          };
        }
      );

      setDeletingMessageId(null);
      toast.success('Wiadomość została usunięta.'); // TODO i18n
    } catch (error: any) {
      console.error('Failed to delete message:', error);
      toast.error('Nie udało się usunąć wiadomości.', {
        description: error.message,
      }); // TODO i18n
      throw error;
    }
  }, [deletingMessageId, deleteMessage, activeEventId, queryClient]);

  // ---------------------------------------------------------------------------
  // Mark as read when channel changes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (activeEventId) {
      markAsRead.mutate({ eventId: activeEventId });
    }
  }, [activeEventId, markAsRead]);

  // ---------------------------------------------------------------------------
  // Typing user names
  // ---------------------------------------------------------------------------
  // TODO i18n: proper pluralization
  const typingUserNames =
    typingUsers.size > 0 ? [`${typingUsers.size} osób`] : null;

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------
  return {
    // Data
    conversations,
    messages,
    activeChannel,
    typingUserNames,
    unreadCount: unreadData?.eventUnreadCount ?? 0,

    // Loading states
    isLoadingChannels: membershipsLoading,
    isLoadingMessages: messagesLoading,
    isSending: sendMessage.isPending || pendingMessages.size > 0,
    isEditPending: editMessage.isPending,
    isDeletePending: deleteMessage.isPending,

    // Pagination
    loadMore: fetchNextPage,
    hasMore: hasNextPage,
    isLoadingMore: isFetchingNextPage,

    // Handlers
    sendMessage: handleSendMessage,
    handleTyping,
    handleAddReaction,
    handleRemoveReaction,

    // Retry
    retryFailedMessage,
    dismissFailedMessage,
    hasPendingMessages: pendingMessages.size > 0,

    // Edit modal
    editingMessage,
    openEditModal,
    closeEditModal,
    handleSaveEdit,

    // Delete modal
    deletingMessageId,
    openDeleteModal,
    closeDeleteModal,
    handleConfirmDelete,
  };
}
