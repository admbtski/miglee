/**
 * Custom hook for DM (Direct Message) chat functionality
 *
 * @description
 * Provides complete DM chat functionality including:
 * - Fetching and transforming DM threads
 * - Fetching and transforming messages with infinite scroll
 * - Sending messages with reply support
 * - Real-time subscriptions (new messages, edits, deletes, reactions, typing)
 * - Typing indicators
 * - Mark as read
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
 * // Typing indicator
 * dmChat.handleTyping(true);
 * ```
 */

'use client';

import { useEffect, useMemo } from 'react';
import {
  useGetDmThreads,
  useGetDmMessagesInfinite,
  useSendDmMessage,
  useMarkDmThreadRead,
  usePublishDmTyping,
} from '@/features/chat/api/dm';
import type { GetDmMessagesQuery } from '@/lib/api/__generated__/react-query-update';
import {
  useDmMessageAdded,
  useDmMessageUpdated,
  useDmMessageDeleted,
  useDmTyping,
  useDmThreadsSubscriptions,
} from '@/features/chat/api/dm-subscriptions';
import { useDmReactionAdded } from '@/features/chat/api/reactions-subscriptions';
import type { Message } from '../types';
// Utility function for time formatting
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
// Types
// =============================================================================

type UseDmChatProps = {
  /** Current user ID for determining message sides and reactions */
  myUserId?: string;
  /** Active DM thread ID to fetch messages for */
  activeThreadId?: string;
};

// =============================================================================
// Hook
// =============================================================================

export function useDmChat({ myUserId, activeThreadId }: UseDmChatProps) {
  // Fetch threads
  const { data: threadsData, isLoading: threadsLoading } = useGetDmThreads();

  // Fetch messages for active thread
  const {
    data: messagesData,
    isLoading: messagesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetDmMessagesInfinite(activeThreadId ?? '', {
    enabled: !!activeThreadId,
  });

  // Mutations
  const sendMessage = useSendDmMessage();
  const markAsRead = useMarkDmThreadRead();
  const publishTyping = usePublishDmTyping();

  // Subscriptions - subscribe to all threads for badge updates
  const allThreadIds = useMemo(
    () => threadsData?.dmThreads?.items?.map((t) => t.id).filter(Boolean) ?? [],
    [threadsData]
  );
  useDmThreadsSubscriptions({ threadIds: allThreadIds, enabled: true });
  useDmMessageAdded({
    threadId: activeThreadId ?? '',
    onMessage: (message) => {
      console.log('[DM Hook] Message added:', message.id);
    },
    enabled: !!activeThreadId,
  });
  useDmMessageUpdated({
    threadId: activeThreadId ?? '',
    onMessageUpdated: (message) => {
      console.log('[DM Hook] Message updated:', message.id);
    },
    enabled: !!activeThreadId,
  });
  useDmMessageDeleted({
    threadId: activeThreadId ?? '',
    onMessageDeleted: (event) => {
      console.log('[DM Hook] Message deleted:', event.messageId);
    },
    enabled: !!activeThreadId,
  });
  useDmReactionAdded({
    threadId: activeThreadId ?? '',
    enabled: !!activeThreadId,
  });

  // Typing subscription
  const typingUsers = useDmTyping({
    threadId: activeThreadId ?? '',
    enabled: !!activeThreadId,
  });

  // Transform threads to conversations
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
      };
    });
  }, [threadsData, myUserId]);

  // Transform messages
  const messages = useMemo(() => {
    if (!(messagesData as any)?.pages || !myUserId) return [];

    const allMessages: Message[] = [];
    for (const page of (messagesData as any).pages as GetDmMessagesQuery[]) {
      if (!page.dmMessages) continue;
      const pageMessages = page.dmMessages.edges.map(
        (edge: { node: any }) => edge.node
      );
      for (const msg of pageMessages) {
        allMessages.push({
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
    return allMessages;
  }, [messagesData, myUserId]);

  // Send message handler
  const handleSendMessage = (content: string, replyToId?: string) => {
    if (!activeThreadId || !activeThread?.recipientId || !content.trim())
      return;

    sendMessage.mutate({
      input: {
        recipientId: activeThread.recipientId,
        content: content.trim(),
        replyToId,
      },
    });
  };

  // Typing handler
  const handleTyping = (isTyping: boolean) => {
    if (!activeThreadId) return;
    publishTyping.mutate({ threadId: activeThreadId, isTyping });
  };

  // Mark as read when thread changes
  useEffect(() => {
    if (activeThreadId) {
      markAsRead.mutate({ threadId: activeThreadId });
    }
  }, [activeThreadId, markAsRead]);

  // Get active thread info
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
      members: 2, // DM always has 2 participants
    };
  }, [activeThreadId, threadsData, myUserId]);

  return {
    // Data
    conversations,
    messages,
    activeThread,
    typingUsers,

    // Loading states
    isLoadingThreads: threadsLoading,
    isLoadingMessages: messagesLoading,
    isSending: sendMessage.isPending,

    // Pagination
    loadMore: fetchNextPage,
    hasMore: hasNextPage,
    isLoadingMore: isFetchingNextPage,

    // Handlers
    sendMessage: handleSendMessage,
    handleTyping,
  };
}
