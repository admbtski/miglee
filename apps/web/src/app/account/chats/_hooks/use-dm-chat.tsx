/**
 * Custom hook for DM chat functionality
 */

'use client';

import { useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetDmThreads,
  useGetDmMessagesInfinite,
  useSendDmMessage,
  useMarkDmThreadRead,
  usePublishDmTyping,
  dmKeys,
} from '@/lib/api/dm';
import {
  useDmMessageAdded,
  useDmMessageUpdated,
  useDmMessageDeleted,
  useDmTyping,
  useDmThreadsSubscriptions,
} from '@/lib/api/dm-subscriptions';
import { useDmReactionAdded } from '@/lib/api/reactions-subscriptions';
import type { Message } from '../_types';
import { formatRelativeTime } from '../page';

type UseDmChatProps = {
  myUserId?: string;
  activeThreadId?: string;
};

export function useDmChat({ myUserId, activeThreadId }: UseDmChatProps) {
  const queryClient = useQueryClient();

  // Fetch threads
  const { data: threadsData, isLoading: threadsLoading } = useGetDmThreads();

  // Fetch messages for active thread
  const {
    data: messagesData,
    isLoading: messagesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetDmMessagesInfinite(
    { threadId: activeThreadId ?? '' },
    { enabled: !!activeThreadId }
  );

  // Mutations
  const sendMessage = useSendDmMessage();
  const markAsRead = useMarkDmThreadRead();
  const publishTyping = usePublishDmTyping();

  // Subscriptions
  useDmThreadsSubscriptions();
  useDmMessageAdded(activeThreadId, (message) => {
    console.log('[DM Hook] Message added:', message.id);
  });
  useDmMessageUpdated(activeThreadId, (message) => {
    console.log('[DM Hook] Message updated:', message.id);
  });
  useDmMessageDeleted(activeThreadId, (messageId) => {
    console.log('[DM Hook] Message deleted:', messageId);
  });
  useDmReactionAdded(activeThreadId);

  // Typing subscription
  const typingUsers = useDmTyping(activeThreadId);

  // Transform threads to conversations
  const conversations = useMemo(() => {
    if (!threadsData?.dmThreads) return [];

    return threadsData.dmThreads.map((thread) => {
      const otherUser = thread.participants.find((p) => p.id !== myUserId);
      return {
        id: thread.id,
        kind: 'dm' as const,
        title: otherUser?.name || 'Unknown',
        membersCount: thread.participants.length,
        preview: thread.lastMessage?.content || 'No messages yet',
        lastMessageAt: thread.lastMessage?.createdAt
          ? formatRelativeTime(thread.lastMessage.createdAt)
          : '',
        unread: thread.unreadCount || 0,
        avatar: otherUser?.imageUrl || undefined,
        lastReadAt: thread.lastReadAt
          ? new Date(thread.lastReadAt).getTime()
          : undefined,
      };
    });
  }, [threadsData, myUserId]);

  // Transform messages
  const messages = useMemo(() => {
    if (!messagesData?.pages || !myUserId) return [];

    const allMessages: Message[] = [];
    for (const page of messagesData.pages) {
      for (const msg of page.messages) {
        allMessages.push({
          id: msg.id,
          text: msg.content,
          at: new Date(msg.createdAt).getTime(),
          side: msg.authorId === myUserId ? 'right' : 'left',
          author: {
            id: msg.author.id,
            name: msg.author.name,
            avatar: msg.author.imageUrl || undefined,
          },
          reactions: msg.reactions?.map((r) => ({
            emoji: r.emoji,
            count: r.users.length,
            users: r.users.map((u) => ({
              id: u.id,
              name: u.name,
              imageUrl: u.imageUrl,
            })),
            reacted: r.users.some((u) => u.id === myUserId),
          })),
          readAt: msg.readAt,
          editedAt: msg.updatedAt !== msg.createdAt ? msg.updatedAt : null,
          deletedAt: msg.deletedAt,
          replyTo: msg.replyTo
            ? {
                id: msg.replyTo.id,
                author: {
                  id: msg.replyTo.author.id,
                  name: msg.replyTo.author.name,
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
    if (!activeThreadId || !content.trim()) return;

    sendMessage.mutate({
      threadId: activeThreadId,
      content: content.trim(),
      replyToId,
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
    const thread = threadsData.dmThreads.find((t) => t.id === activeThreadId);
    if (!thread) return null;

    const otherUser = thread.participants.find((p) => p.id !== myUserId);
    return {
      id: thread.id,
      title: otherUser?.name || 'Unknown',
      avatar: otherUser?.imageUrl || undefined,
      members: thread.participants.length,
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
