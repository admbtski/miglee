/**
 * Custom hook for DM (Direct Message) chat functionality
 *
 * @description
 * Provides complete DM chat functionality including:
 * - Fetching and transforming DM threads
 * - Fetching and transforming messages with infinite scroll
 * - Sending messages with optimistic updates
 * - Real-time subscriptions (new messages, edits, deletes, reactions, typing)
 * - Typing indicators with auto-clear
 * - Mark as read
 * - Error handling with toast notifications
 * - Retry logic for failed messages
 *
 * @example
 * ```tsx
 * const dmChat = useDmChat({
 *   myUserId: 'user-123',
 *   activeThreadId: 'thread-456',
 * });
 *
 * // Send message
 * dmChat.sendMessage('Hello!', replyToId);
 *
 * // Load more messages
 * if (dmChat.hasMore) {
 *   dmChat.loadMore();
 * }
 *
 * // Retry failed message
 * dmChat.retryFailedMessage(pendingId);
 * ```
 */

// TODO i18n: All toast messages need translation keys

'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetDmThreads,
  useGetDmMessagesInfinite,
  useSendDmMessage,
  useMarkDmThreadRead,
  usePublishDmTyping,
  dmKeys,
} from '@/features/chat';
import type { GetDmMessagesQuery } from '@/lib/api/__generated__/react-query-update';
import {
  useDmMessageAdded,
  useDmMessageUpdated,
  useDmMessageDeleted,
  useDmTyping,
  useDmThreadsSubscriptions,
} from '@/features/chat';
import { useDmReactionAdded } from '@/features/chat';
import {
  useAddDmReaction,
  useRemoveDmReaction,
} from '@/features/chat';
import {
  useUpdateDmMessage,
  useDeleteDmMessage,
} from '@/features/chat';
import type { Message } from '../types';

// =============================================================================
// Types
// =============================================================================

type UseDmChatProps = {
  /** Current user ID for determining message sides and reactions */
  myUserId?: string;
  /** Active DM thread ID to fetch messages for */
  activeThreadId?: string;
};

/** Pending message that hasn't been confirmed by server yet */
interface PendingMessage {
  id: string;
  content: string;
  replyToId?: string;
  status: 'sending' | 'failed';
  createdAt: number;
  retryCount: number;
}

// =============================================================================
// Constants
// =============================================================================

const MAX_RETRY_COUNT = 3;
const PENDING_MESSAGE_PREFIX = 'dm-pending-';

// =============================================================================
// Utilities
// =============================================================================

/** Format relative time for thread preview */
function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

// =============================================================================
// Hook
// =============================================================================

export function useDmChat({ myUserId, activeThreadId }: UseDmChatProps) {
  const queryClient = useQueryClient();

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
  const { data: threadsData, isLoading: threadsLoading } = useGetDmThreads();

  const {
    data: messagesData,
    isLoading: messagesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetDmMessagesInfinite(activeThreadId ?? '', {
    enabled: !!activeThreadId,
  });

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------
  const sendMessage = useSendDmMessage();
  const markAsRead = useMarkDmThreadRead();
  const publishTyping = usePublishDmTyping();
  const addReaction = useAddDmReaction();
  const removeReaction = useRemoveDmReaction();
  const editMessage = useUpdateDmMessage();
  const deleteMessage = useDeleteDmMessage();

  // ---------------------------------------------------------------------------
  // Subscriptions
  // ---------------------------------------------------------------------------
  const allThreadIds = useMemo(
    () => threadsData?.dmThreads?.items?.map((t) => t.id).filter(Boolean) ?? [],
    [threadsData]
  );

  useDmThreadsSubscriptions({ threadIds: allThreadIds, enabled: true });

  useDmMessageAdded({
    threadId: activeThreadId ?? '',
    onMessage: (message) => {
      // Invalidate queries to fetch new messages
      queryClient.invalidateQueries({
        queryKey: dmKeys.messages(activeThreadId ?? ''),
      });

      // Auto-mark as read if not from current user
      if (message.senderId !== myUserId && activeThreadId) {
        markAsRead.mutate({ threadId: activeThreadId });
      }
    },
    enabled: !!activeThreadId,
  });

  useDmMessageUpdated({
    threadId: activeThreadId ?? '',
    onMessageUpdated: (message) => {
      // Update cache directly
      queryClient.setQueryData(
        dmKeys.messages(activeThreadId ?? ''),
        (oldData: any) => {
          if (!oldData?.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              dmMessages: {
                ...page.dmMessages,
                edges: page.dmMessages?.edges?.map((edge: any) =>
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
    enabled: !!activeThreadId,
  });

  useDmMessageDeleted({
    threadId: activeThreadId ?? '',
    onMessageDeleted: (event) => {
      // Update cache directly
      queryClient.setQueryData(
        dmKeys.messages(activeThreadId ?? ''),
        (oldData: any) => {
          if (!oldData?.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              dmMessages: {
                ...page.dmMessages,
                edges: page.dmMessages?.edges?.map((edge: any) =>
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
    enabled: !!activeThreadId,
  });

  useDmReactionAdded({
    threadId: activeThreadId ?? '',
    enabled: !!activeThreadId,
  });

  // Typing subscription with auto-clear
  useDmTyping({
    threadId: activeThreadId ?? '',
    enabled: !!activeThreadId,
    onTyping: ({ userId, isTyping }) => {
      if (userId === myUserId) return;

      const existingTimeout = typingTimeouts.current.get(`dm-${userId}`);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        typingTimeouts.current.delete(`dm-${userId}`);
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
            typingTimeouts.current.delete(`dm-${userId}`);
          }, 5000);
          typingTimeouts.current.set(`dm-${userId}`, timeout);
        } else {
          next.delete(userId);
        }
        return next;
      });
    },
  });

  // ---------------------------------------------------------------------------
  // Transform threads to conversations
  // ---------------------------------------------------------------------------
  const conversations = useMemo(() => {
    if (!threadsData?.dmThreads?.items) return [];

    return threadsData.dmThreads.items.map((thread) => {
      const otherUser = (thread as any).participants?.find(
        (p: any) => p.id !== myUserId
      );
      return {
        id: thread.id,
        kind: 'dm' as const,
        title: otherUser?.name || 'Unknown',
        membersCount: (thread as any).participants?.length || 0,
        preview: thread.lastMessage?.content || 'No messages yet',
        lastMessageAt: thread.lastMessage?.createdAt
          ? formatRelativeTime(thread.lastMessage.createdAt)
          : '',
        unread: thread.unreadCount || 0,
        avatar: otherUser?.avatarKey || undefined,
        otherUserId: otherUser?.id,
      };
    });
  }, [threadsData, myUserId]);

  // ---------------------------------------------------------------------------
  // Get active thread info
  // ---------------------------------------------------------------------------
  const activeThread = useMemo(() => {
    if (!activeThreadId || !threadsData?.dmThreads) return null;
    const thread = threadsData.dmThreads.items.find(
      (t) => t.id === activeThreadId
    );
    if (!thread) return null;

    const otherUser = thread.aUserId === myUserId ? thread.bUser : thread.aUser;
    return {
      id: thread.id,
      title: otherUser?.name || 'Unknown',
      avatar: otherUser?.avatarKey || undefined,
      recipientId: otherUser?.id || '',
      members: 2,
    };
  }, [activeThreadId, threadsData, myUserId]);

  // ---------------------------------------------------------------------------
  // Transform messages (with pending)
  // ---------------------------------------------------------------------------
  const messages = useMemo(() => {
    const serverMessages: Message[] = [];

    if ((messagesData as any)?.pages && myUserId) {
      for (const page of (messagesData as any).pages as GetDmMessagesQuery[]) {
        if (!page.dmMessages) continue;
        const pageMessages = page.dmMessages.edges.map(
          (edge: { node: any }) => edge.node
        );
        for (const msg of pageMessages) {
          serverMessages.push({
            id: msg.id,
            text: msg.content,
            at: new Date(msg.createdAt).getTime(),
            side: msg.senderId === myUserId ? 'right' : 'left',
            author: {
              id: msg.sender.id,
              name: msg.sender.name,
              avatar: msg.sender.avatarKey || undefined,
            },
            reactions: msg.reactions.map((r: any) => ({
              emoji: r.emoji,
              count: r.count,
              users: r.users.map((u: any) => ({
                id: u.id,
                name: u.name,
                avatarKey: u.avatarKey,
              })),
              reacted: r.reacted,
            })),
            readAt: msg.readAt ?? undefined,
            editedAt: msg.editedAt ?? undefined,
            deletedAt: msg.deletedAt ?? undefined,
            replyTo: msg.replyTo
              ? {
                  id: msg.replyTo.id,
                  author: {
                    id: msg.replyTo.sender.id,
                    name: msg.replyTo.sender.name,
                  },
                  content: msg.replyTo.content,
                }
              : null,
          });
        }
      }
    }

    // Add pending messages (optimistic)
    const pendingMsgs: Message[] = [];
    if (myUserId && activeThread) {
      for (const [pendingId, pending] of pendingMessages) {
        pendingMsgs.push({
          id: pendingId,
          text: pending.content,
          at: pending.createdAt,
          side: 'right',
          author: {
            id: myUserId,
            name: 'You',
          },
          block: false,
          reactions: [],
          editedAt: pending.status === 'failed' ? 'failed' : undefined,
          deletedAt: null,
          replyTo: null,
        });
      }
    }

    return [...serverMessages, ...pendingMsgs].sort((a, b) => a.at - b.at);
  }, [messagesData, myUserId, pendingMessages, activeThread]);

  // ---------------------------------------------------------------------------
  // Send message with optimistic update
  // ---------------------------------------------------------------------------
  const sendMessageWithOptimistic = useCallback(
    (content: string, replyToId?: string, existingPendingId?: string) => {
      if (!activeThread?.recipientId) return;

      const pendingId =
        existingPendingId || `${PENDING_MESSAGE_PREFIX}${Date.now()}`;
      const now = Date.now();

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
            recipientId: activeThread.recipientId,
            content,
            replyToId,
          },
        },
        {
          onSuccess: () => {
            setPendingMessages((prev) => {
              const next = new Map(prev);
              next.delete(pendingId);
              return next;
            });

            queryClient.invalidateQueries({
              queryKey: dmKeys.messages(activeThreadId ?? ''),
            });
            queryClient.invalidateQueries({
              queryKey: dmKeys.threads(),
            });
          },
          onError: (error) => {
            setPendingMessages((prev) => {
              const next = new Map(prev);
              const pending = next.get(pendingId);
              if (pending) {
                next.set(pendingId, { ...pending, status: 'failed' });
              }
              return next;
            });

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

            console.error('Failed to send DM:', error);
          },
        }
      );
    },
    [activeThread, activeThreadId, sendMessage, queryClient, pendingMessages]
  );

  const handleSendMessage = useCallback(
    (content: string, replyToId?: string) => {
      if (!content.trim()) return;
      sendMessageWithOptimistic(content.trim(), replyToId);
    },
    [sendMessageWithOptimistic]
  );

  // ---------------------------------------------------------------------------
  // Send message to new recipient (for draft conversations)
  // ---------------------------------------------------------------------------
  const sendMessageToRecipient = useCallback(
    (
      content: string,
      recipientId: string,
      onSuccess?: (threadId: string) => void
    ) => {
      if (!content.trim() || !recipientId) return;

      sendMessage.mutate(
        {
          input: {
            recipientId,
            content: content.trim(),
          },
        },
        {
          onSuccess: (data) => {
            const newThreadId = data.sendDmMessage?.threadId;
            if (newThreadId) {
              queryClient.invalidateQueries({ queryKey: dmKeys.threads() });
              onSuccess?.(newThreadId);
            }
          },
          onError: (error) => {
            toast.error('Nie udało się wysłać wiadomości'); // TODO i18n
            console.error('Failed to send DM to new recipient:', error);
          },
        }
      );
    },
    [sendMessage, queryClient]
  );

  // ---------------------------------------------------------------------------
  // Retry/Dismiss failed messages
  // ---------------------------------------------------------------------------
  const retryFailedMessage = useCallback(
    (pendingId: string) => {
      const pending = pendingMessages.get(pendingId);
      if (!pending || pending.status !== 'failed') return;

      if (pending.retryCount >= MAX_RETRY_COUNT) {
        toast.error('Maksymalna liczba prób osiągnięta', {
          description: 'Usuń wiadomość i spróbuj ponownie',
        });
        return;
      }

      sendMessageWithOptimistic(pending.content, pending.replyToId, pendingId);
    },
    [pendingMessages, sendMessageWithOptimistic]
  );

  const dismissFailedMessage = useCallback((pendingId: string) => {
    setPendingMessages((prev) => {
      const next = new Map(prev);
      next.delete(pendingId);
      return next;
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Reactions
  // ---------------------------------------------------------------------------
  const handleAddReaction = useCallback(
    (messageId: string, emoji: string) => {
      addReaction.mutate(
        { messageId, emoji },
        {
          onError: (error) => {
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
            toast.error('Nie udało się usunąć reakcji');
            console.error('Failed to remove reaction:', error);
          },
        }
      );
    },
    [removeReaction]
  );

  // ---------------------------------------------------------------------------
  // Typing handler
  // ---------------------------------------------------------------------------
  const handleTyping = useCallback(
    (isTyping: boolean) => {
      if (!activeThreadId) return;
      publishTyping.mutate({ threadId: activeThreadId, isTyping });
    },
    [activeThreadId, publishTyping]
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
      if (!editingMessage || !activeThreadId) return;

      try {
        await editMessage.mutateAsync({
          id: editingMessage.id,
          input: { content: newContent },
        });

        queryClient.setQueryData(
          dmKeys.messages(activeThreadId),
          (oldData: any) => {
            if (!oldData?.pages) return oldData;
            return {
              ...oldData,
              pages: oldData.pages.map((page: any) => ({
                ...page,
                dmMessages: {
                  ...page.dmMessages,
                  edges: page.dmMessages?.edges?.map((edge: any) =>
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
        toast.success('Wiadomość została zaktualizowana');
      } catch (error) {
        toast.error('Nie udało się edytować wiadomości');
        console.error('Failed to edit message:', error);
        throw error;
      }
    },
    [editingMessage, editMessage, activeThreadId, queryClient]
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
    if (!deletingMessageId || !activeThreadId) return;

    try {
      await deleteMessage.mutateAsync({
        id: deletingMessageId,
        threadId: activeThreadId,
      });

      queryClient.setQueryData(
        dmKeys.messages(activeThreadId),
        (oldData: any) => {
          if (!oldData?.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              dmMessages: {
                ...page.dmMessages,
                edges: page.dmMessages?.edges?.map((edge: any) =>
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
      toast.success('Wiadomość została usunięta');
    } catch (error) {
      toast.error('Nie udało się usunąć wiadomości');
      console.error('Failed to delete message:', error);
      throw error;
    }
  }, [deletingMessageId, deleteMessage, activeThreadId, queryClient]);

  // ---------------------------------------------------------------------------
  // Mark as read when thread changes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (activeThreadId) {
      markAsRead.mutate({ threadId: activeThreadId });
    }
  }, [activeThreadId, markAsRead]);

  // ---------------------------------------------------------------------------
  // Typing user names
  // ---------------------------------------------------------------------------
  // TODO i18n: proper pluralization
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
    conversations,
    messages,
    activeThread,
    typingUserNames,

    // Loading states
    isLoadingThreads: threadsLoading,
    isLoadingMessages: messagesLoading,
    isSending: sendMessage.isPending || hasPendingMessages,
    isEditPending: editMessage.isPending,
    isDeletePending: deleteMessage.isPending,

    // Pagination
    loadMore: fetchNextPage,
    hasMore: hasNextPage,
    isLoadingMore: isFetchingNextPage,

    // Handlers
    sendMessage: handleSendMessage,
    sendMessageToRecipient,
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
