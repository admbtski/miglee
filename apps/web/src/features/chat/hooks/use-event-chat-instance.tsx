/**
 * Custom hook for Event Chat instance
 *
 * @description
 * Encapsulates all event chat logic including:
 * - Fetching and transforming messages
 * - Real-time subscriptions (new, edit, delete)
 * - Typing indicators with auto-clear
 * - Reactions
 * - Edit/Delete modals state
 * - Message sending with optimistic updates
 * - Error handling with toast notifications
 * - Retry logic for failed messages
 *
 * Used by both EventChatModal and EventChatManagement components.
 *
 * @example
 * ```tsx
 * const chat = useEventChatInstance({
 *   eventId: 'event-123',
 *   enabled: true,
 * });
 *
 * // Render messages (includes pending messages)
 * <ChatThread messages={chat.messages} onSend={chat.handleSend} />
 *
 * // Retry failed message
 * chat.retryFailedMessage(messageId);
 * ```
 */

// TODO i18n: All toast messages need translation keys

'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useMeQuery } from '@/features/auth';
import type { Message } from '../types';

// API hooks
import {
  useGetEventMessages,
  useSendEventMessage,
  useMarkEventChatRead,
  usePublishEventTyping,
  eventChatKeys,
} from '../api/event-chat';
import {
  useEventMessageAdded,
  useEventMessageUpdated,
  useEventMessageDeleted,
  useEventTyping,
} from '../api/event-chat-subscriptions';
import { useAddEventReaction, useRemoveEventReaction } from '../api/reactions';
import { useEventReactionAdded } from '../api/reactions-subscriptions';
import {
  useEditEventMessage,
  useDeleteEventMessage,
} from '../api/message-actions';

// =============================================================================
// Types
// =============================================================================

interface UseEventChatInstanceProps {
  /** Event ID to connect to */
  eventId: string;
  /** Whether the chat is active (modal open or component mounted) */
  enabled?: boolean;
}

/** Pending message that hasn't been confirmed by server yet */
interface PendingMessage {
  id: string;
  content: string;
  replyToId?: string;
  status: 'sending' | 'failed';
  createdAt: number;
  retryCount: number;
}

interface UseEventChatInstanceReturn {
  // Data
  messages: Message[];
  currentUserId: string | undefined;
  typingUserNames: string[] | null;

  // Loading states
  isLoading: boolean;
  isSending: boolean;
  isEditPending: boolean;
  isDeletePending: boolean;

  // Pagination
  hasNextPage: boolean;
  fetchNextPage: () => void;

  // Handlers
  handleSend: (text: string, replyToId?: string) => void;
  handleTyping: (isTyping: boolean) => void;
  handleAddReaction: (messageId: string, emoji: string) => void;
  handleRemoveReaction: (messageId: string, emoji: string) => void;

  // Retry failed messages
  retryFailedMessage: (pendingId: string) => void;
  dismissFailedMessage: (pendingId: string) => void;
  hasPendingMessages: boolean;

  // Edit modal
  editingMessage: { id: string; content: string } | null;
  openEditModal: (messageId: string, content: string) => void;
  closeEditModal: () => void;
  handleSaveEdit: (newContent: string) => Promise<void>;

  // Delete modal
  deletingMessageId: string | null;
  openDeleteModal: (messageId: string) => void;
  closeDeleteModal: () => void;
  handleConfirmDelete: () => Promise<void>;
}

// =============================================================================
// Constants
// =============================================================================

const MAX_RETRY_COUNT = 3;
const PENDING_MESSAGE_PREFIX = 'pending-';

// =============================================================================
// Hook
// =============================================================================

export function useEventChatInstance({
  eventId,
  enabled = true,
}: UseEventChatInstanceProps): UseEventChatInstanceReturn {
  const queryClient = useQueryClient();
  const { data: authData } = useMeQuery();
  const currentUserId = authData?.me?.id;
  const currentUserName = authData?.me?.name;
  const currentUserAvatar = authData?.me?.avatarKey;

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
  // Pending messages state (optimistic updates)
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
  const {
    data: messagesData,
    isLoading,
    fetchNextPage,
    hasNextPage = false,
  } = useGetEventMessages(eventId, {
    enabled: enabled && !!eventId,
  });

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------
  const sendMessage = useSendEventMessage();
  const markRead = useMarkEventChatRead();
  const publishTyping = usePublishEventTyping();
  const addReaction = useAddEventReaction();
  const removeReaction = useRemoveEventReaction();
  const editMessage = useEditEventMessage();
  const deleteMessage = useDeleteEventMessage();

  // ---------------------------------------------------------------------------
  // Subscriptions
  // ---------------------------------------------------------------------------
  useEventMessageAdded({
    eventId,
    enabled: enabled && !!eventId,
    onMessage: (message) => {
      // Invalidate queries to fetch new messages
      queryClient.invalidateQueries({
        queryKey: eventChatKeys.messages(eventId),
      });

      // Auto-mark as read
      if (message.authorId !== currentUserId) {
        markRead.mutate({ eventId });
      }
    },
  });

  useEventMessageUpdated({
    eventId,
    enabled: enabled && !!eventId,
    onMessageUpdated: (message) => {
      // Update cache directly (edges structure)
      queryClient.setQueryData(
        eventChatKeys.messages(eventId),
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
    eventId,
    enabled: enabled && !!eventId,
    onMessageDeleted: (event) => {
      // Update cache directly (edges structure)
      queryClient.setQueryData(
        eventChatKeys.messages(eventId),
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

  // Typing indicator subscription with auto-clear
  useEventTyping({
    eventId,
    enabled: enabled && !!eventId,
    onTyping: ({ userId, isTyping }) => {
      // Don't show typing for current user
      if (userId === currentUserId) return;

      // Clear existing timeout
      const existingTimeout = typingTimeouts.current.get(`event-${userId}`);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        typingTimeouts.current.delete(`event-${userId}`);
      }

      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (isTyping) {
          next.add(userId);
          // Auto-clear after 5 seconds
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

  // Reaction subscription
  useEventReactionAdded({
    eventId,
    enabled: enabled && !!eventId,
  });

  // ---------------------------------------------------------------------------
  // Transform messages to ChatThread format (with pending messages)
  // ---------------------------------------------------------------------------
  const messages: Message[] = useMemo(() => {
    // Server messages
    const serverMessages: Message[] = [];

    if (messagesData?.pages && currentUserId) {
      const pages = messagesData.pages;
      const allMessages = pages.flatMap(
        (page: any) =>
          page.eventMessages?.edges?.map((edge: any) => edge.node) || []
      );

      for (const msg of allMessages) {
        serverMessages.push({
          id: msg.id,
          text: msg.content,
          at: new Date(msg.createdAt).getTime(),
          side: (msg.authorId === currentUserId ? 'right' : 'left') as
            | 'left'
            | 'right',
          author: {
            id: msg.author.id,
            name: msg.author.name || 'Unknown',
            avatar: msg.author.avatarKey || undefined,
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
        });
      }
    }

    // Add pending messages (optimistic)
    const pendingMsgs: Message[] = [];
    if (currentUserId) {
      for (const [pendingId, pending] of pendingMessages) {
        pendingMsgs.push({
          id: pendingId,
          text: pending.content,
          at: pending.createdAt,
          side: 'right',
          author: {
            id: currentUserId,
            name: currentUserName || 'You',
            avatar: currentUserAvatar || undefined,
          },
          block: false,
          reactions: [],
          // Mark failed messages visually
          editedAt: pending.status === 'failed' ? 'failed' : undefined,
          deletedAt: null,
          replyTo: null,
        });
      }
    }

    // Merge and sort by timestamp
    return [...serverMessages, ...pendingMsgs].sort((a, b) => a.at - b.at);
  }, [
    messagesData,
    currentUserId,
    currentUserName,
    currentUserAvatar,
    pendingMessages,
  ]);

  // ---------------------------------------------------------------------------
  // Send message with optimistic update
  // ---------------------------------------------------------------------------
  const sendMessageWithOptimistic = useCallback(
    (content: string, replyToId?: string, existingPendingId?: string) => {
      const pendingId =
        existingPendingId || `${PENDING_MESSAGE_PREFIX}${Date.now()}`;
      const now = Date.now();

      // Get current retry count if retrying
      const existingPending = pendingMessages.get(pendingId);
      const retryCount = existingPending ? existingPending.retryCount + 1 : 0;

      // Add to pending messages (optimistic)
      setPendingMessages((prev) => {
        const next = new Map(prev);
        next.set(pendingId, {
          id: pendingId,
          content,
          replyToId,
          status: 'sending',
          createdAt: existingPending?.createdAt || now,
          retryCount,
        });
        return next;
      });

      sendMessage.mutate(
        {
          input: {
            eventId,
            content,
            replyToId: replyToId || undefined,
          },
        },
        {
          onSuccess: () => {
            // Remove from pending - server message will appear via subscription
            setPendingMessages((prev) => {
              const next = new Map(prev);
              next.delete(pendingId);
              return next;
            });

            // Invalidate to get the real message
            queryClient.invalidateQueries({
              queryKey: eventChatKeys.messages(eventId),
            });
          },
          onError: (error) => {
            // Mark as failed
            setPendingMessages((prev) => {
              const next = new Map(prev);
              const pending = next.get(pendingId);
              if (pending) {
                next.set(pendingId, { ...pending, status: 'failed' });
              }
              return next;
            });

            // Show error toast with retry option
            // TODO i18n: Toast message
            toast.error('Nie udało się wysłać wiadomości', {
              description:
                retryCount < MAX_RETRY_COUNT
                  ? 'Kliknij aby spróbować ponownie'
                  : 'Maksymalna liczba prób osiągnięta',
              action:
                retryCount < MAX_RETRY_COUNT
                  ? {
                      label: 'Ponów',
                      onClick: () =>
                        sendMessageWithOptimistic(
                          content,
                          replyToId,
                          pendingId
                        ),
                    }
                  : undefined,
              duration: 5000,
            });

            console.error('Failed to send message:', error);
          },
        }
      );
    },
    [eventId, sendMessage, queryClient, pendingMessages]
  );

  const handleSend = useCallback(
    (text: string, replyToId?: string) => {
      if (!text.trim()) return;
      sendMessageWithOptimistic(text.trim(), replyToId);
    },
    [sendMessageWithOptimistic]
  );

  // ---------------------------------------------------------------------------
  // Retry failed message
  // ---------------------------------------------------------------------------
  const retryFailedMessage = useCallback(
    (pendingId: string) => {
      const pending = pendingMessages.get(pendingId);
      if (!pending || pending.status !== 'failed') return;

      if (pending.retryCount >= MAX_RETRY_COUNT) {
        // TODO i18n: Toast message
        toast.error('Maksymalna liczba prób osiągnięta', {
          description: 'Usuń wiadomość i spróbuj ponownie',
        });
        return;
      }

      sendMessageWithOptimistic(pending.content, pending.replyToId, pendingId);
    },
    [pendingMessages, sendMessageWithOptimistic]
  );

  // ---------------------------------------------------------------------------
  // Dismiss failed message
  // ---------------------------------------------------------------------------
  const dismissFailedMessage = useCallback((pendingId: string) => {
    setPendingMessages((prev) => {
      const next = new Map(prev);
      next.delete(pendingId);
      return next;
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Other handlers
  // ---------------------------------------------------------------------------
  const handleTyping = useCallback(
    (isTyping: boolean) => {
      publishTyping.mutate({ eventId, isTyping });
    },
    [eventId, publishTyping]
  );

  const handleAddReaction = useCallback(
    (messageId: string, emoji: string) => {
      addReaction.mutate(
        { messageId, emoji },
        {
          onError: (error) => {
            // TODO i18n: Toast message
            toast.error('Nie udało się dodać reakcji');
            console.error('Failed to add reaction:', error);
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
            // TODO i18n: Toast message
            toast.error('Nie udało się usunąć reakcji');
            console.error('Failed to remove reaction:', error);
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
      if (!editingMessage) return;

      try {
        await editMessage.mutateAsync({
          id: editingMessage.id,
          input: { content: newContent },
        });

        // Optimistic update (edges structure)
        queryClient.setQueryData(
          eventChatKeys.messages(eventId),
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
        // TODO i18n: Toast message
        toast.success('Wiadomość została zaktualizowana');
      } catch (error) {
        // TODO i18n: Toast message
        toast.error('Nie udało się edytować wiadomości');
        console.error('Failed to edit message:', error);
        throw error;
      }
    },
    [editingMessage, editMessage, eventId, queryClient]
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
    if (!deletingMessageId) return;

    try {
      await deleteMessage.mutateAsync({
        id: deletingMessageId,
        soft: true,
        eventId,
      });

      // Optimistic update (edges structure)
      queryClient.setQueryData(
        eventChatKeys.messages(eventId),
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
      // TODO i18n: Toast message
      toast.success('Wiadomość została usunięta');
    } catch (error) {
      // TODO i18n: Toast message
      toast.error('Nie udało się usunąć wiadomości');
      console.error('Failed to delete message:', error);
      throw error;
    }
  }, [deletingMessageId, deleteMessage, eventId, queryClient]);

  // ---------------------------------------------------------------------------
  // Typing user names
  // ---------------------------------------------------------------------------
  // TODO i18n: "X osób" should be translatable with proper pluralization
  const typingUserNames =
    typingUsers.size > 0 ? [`${typingUsers.size} osób`] : null;

  // ---------------------------------------------------------------------------
  // Has pending messages
  // ---------------------------------------------------------------------------
  const hasPendingMessages = pendingMessages.size > 0;

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------
  return {
    // Data
    messages,
    currentUserId,
    typingUserNames,

    // Loading states
    isLoading,
    isSending: sendMessage.isPending || hasPendingMessages,
    isEditPending: editMessage.isPending,
    isDeletePending: deleteMessage.isPending,

    // Pagination
    hasNextPage,
    fetchNextPage,

    // Handlers
    handleSend,
    handleTyping,
    handleAddReaction,
    handleRemoveReaction,

    // Retry
    retryFailedMessage,
    dismissFailedMessage,
    hasPendingMessages,

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
