/**
 * Custom hook for Channel (Event) chat functionality
 *
 * @description
 * Provides complete Channel chat functionality including:
 * - Fetching and transforming user memberships (channels)
 * - Fetching and transforming channel messages
 * - Sending messages with reply support
 * - Real-time subscriptions (new messages, edits, deletes, reactions, typing)
 * - Typing indicators
 * - Mark as read
 * - Unread count tracking
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
 * // Check unread count
 * console.log(channelChat.unreadCount);
 *
 * // Typing indicator
 * channelChat.handleTyping(true);
 * ```
 */

'use client';

import { useEffect, useMemo } from 'react';
import {
  useGetEventMessages,
  useSendEventMessage,
  useMarkEventChatRead,
  useGetEventUnreadCount,
  usePublishEventTyping,
} from '@/features/chat/api/event-chat';
import {
  useEventMessageAdded,
  useEventMessageUpdated,
  useEventMessageDeleted,
  useEventTyping,
} from '@/features/chat/api/event-chat-subscriptions';
import { useEventReactionAdded } from '@/features/chat/api/reactions-subscriptions';
import { useMyMembershipsQuery } from '@/features/events/api/event-members';
import type { Message } from '../types';

// =============================================================================
// Types
// =============================================================================

type UseChannelChatProps = {
  /** Current user ID for determining message sides and reactions */
  myUserId?: string;
  /** Active event (channel) ID to fetch messages for */
  activeEventId?: string;
};

// =============================================================================
// Hook
// =============================================================================

export function useChannelChat({
  myUserId,
  activeEventId,
}: UseChannelChatProps) {
  // Fetch memberships (channels)
  const { data: membershipsData, isLoading: membershipsLoading } =
    useMyMembershipsQuery();

  // Fetch messages for active channel
  const { data: messagesData, isLoading: messagesLoading } =
    useGetEventMessages(activeEventId ?? '', { enabled: !!activeEventId });

  // Unread count
  const { data: unreadData } = useGetEventUnreadCount(
    { eventId: activeEventId ?? '' },
    { enabled: !!activeEventId }
  );

  // Mutations
  const sendMessage = useSendEventMessage();
  const markAsRead = useMarkEventChatRead();
  const publishTyping = usePublishEventTyping();

  // Subscriptions
  useEventMessageAdded({
    eventId: activeEventId ?? '',
    onMessage: (message) => {
      console.log('[Channel Hook] Message added:', message.id);
    },
    enabled: !!activeEventId,
  });
  useEventMessageUpdated({
    eventId: activeEventId ?? '',
    onMessageUpdated: (message) => {
      console.log('[Channel Hook] Message updated:', message.id);
    },
    enabled: !!activeEventId,
  });
  useEventMessageDeleted({
    eventId: activeEventId ?? '',
    onMessageDeleted: (event) => {
      console.log('[Channel Hook] Message deleted:', event.messageId);
    },
    enabled: !!activeEventId,
  });
  useEventReactionAdded({
    eventId: activeEventId ?? '',
    enabled: !!activeEventId,
  });

  // Typing subscription
  const typingUsers = useEventTyping({
    eventId: activeEventId ?? '',
    enabled: !!activeEventId,
  });

  // Transform memberships to conversations
  const conversations = useMemo(() => {
    if (!membershipsData?.myMemberships) return [];

    return membershipsData.myMemberships.map((membership) => {
      const event = membership.event;
      return {
        id: event.id,
        kind: 'channel' as const,
        title: event.title,
        membersCount: event.joinedCount || 0,
        preview: event.description || 'No description',
        lastMessageAt: '', // TODO: Add last message time from API
        unread: 0, // TODO: Add unread count from API
        avatar: undefined, // TODO: Add coverKey to event fragment
      };
    });
  }, [membershipsData]);

  // Transform messages
  const messages = useMemo(() => {
    if (!messagesData?.pages || !myUserId) return [];

    const allMessages = messagesData.pages.flatMap(
      (page) => page.eventMessages?.edges?.map((edge) => edge.node) || []
    );

    return allMessages.map(
      (msg): Message => ({
        id: msg.id,
        text: msg.content,
        at: new Date(msg.createdAt).getTime(),
        side: msg.authorId === myUserId ? 'right' : 'left',
        author: {
          id: msg.author.id,
          name: msg.author.name,
          avatar: msg.author.avatarKey || undefined,
        },
        reactions: msg.reactions?.map((r) => ({
          emoji: r.emoji,
          count: r.users.length,
          users: r.users.map((u) => ({
            id: u.id,
            name: u.name,
            avatarKey: u.avatarKey,
          })),
          reacted: r.users.some((u) => u.id === myUserId),
        })),
        readAt: undefined, // TODO: Add readAt to message fragment
        editedAt: null, // TODO: Add updatedAt to message fragment
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
      })
    );
  }, [messagesData, myUserId]);

  // Send message handler
  const handleSendMessage = (content: string, replyToId?: string) => {
    if (!activeEventId || !content.trim()) return;

    sendMessage.mutate({
      input: {
        eventId: activeEventId,
        content: content.trim(),
        replyToId,
      },
    });
  };

  // Typing handler
  const handleTyping = (isTyping: boolean) => {
    if (!activeEventId) return;
    publishTyping.mutate({ eventId: activeEventId, isTyping });
  };

  // Mark as read when channel changes
  useEffect(() => {
    if (activeEventId) {
      markAsRead.mutate({ eventId: activeEventId });
    }
  }, [activeEventId, markAsRead]);

  // Get active channel info
  const activeChannel = useMemo(() => {
    if (!activeEventId || !membershipsData?.myMemberships) return null;
    const membership = membershipsData.myMemberships.find(
      (m) => m.event.id === activeEventId
    );
    if (!membership) return null;

    const event = membership.event;
    return {
      id: event.id,
      title: event.title,
      avatar: undefined, // TODO: Add coverKey to event fragment
      members: event.joinedCount || 0,
    };
  }, [activeEventId, membershipsData]);

  return {
    // Data
    conversations,
    messages,
    activeChannel,
    typingUsers,
    unreadCount: (unreadData?.eventUnreadCount as any)?.unreadCount || 0,

    // Loading states
    isLoadingChannels: membershipsLoading,
    isLoadingMessages: messagesLoading,
    isSending: sendMessage.isPending,

    // Handlers
    sendMessage: handleSendMessage,
    handleTyping,
  };
}
