/**
 * Custom hook for Channel (Intent) chat functionality
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
 *   activeIntentId: 'intent-456',
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
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetIntentMessages,
  useSendIntentMessage,
  useMarkIntentChatRead,
  useGetIntentUnreadCount,
  usePublishIntentTyping,
  eventChatKeys,
} from '@/lib/api/event-chat';
import {
  useIntentMessageAdded,
  useIntentMessageUpdated,
  useIntentMessageDeleted,
  useIntentTyping,
} from '@/lib/api/event-chat-subscriptions';
import { useIntentReactionAdded } from '@/lib/api/reactions-subscriptions';
import { useMyMembershipsQuery } from '@/lib/api/intent-members';
import type { Message } from '../_types';

// =============================================================================
// Types
// =============================================================================

type UseChannelChatProps = {
  /** Current user ID for determining message sides and reactions */
  myUserId?: string;
  /** Active intent (channel) ID to fetch messages for */
  activeIntentId?: string;
};

// =============================================================================
// Hook
// =============================================================================

export function useChannelChat({
  myUserId,
  activeIntentId,
}: UseChannelChatProps) {
  const queryClient = useQueryClient();

  // Fetch memberships (channels)
  const { data: membershipsData, isLoading: membershipsLoading } =
    useMyMembershipsQuery();

  // Fetch messages for active channel
  const { data: messagesData, isLoading: messagesLoading } =
    useGetIntentMessages(
      { intentId: activeIntentId ?? '' },
      { enabled: !!activeIntentId }
    );

  // Unread count
  const { data: unreadData } = useGetIntentUnreadCount(
    { intentId: activeIntentId ?? '' },
    { enabled: !!activeIntentId }
  );

  // Mutations
  const sendMessage = useSendIntentMessage();
  const markAsRead = useMarkIntentChatRead();
  const publishTyping = usePublishIntentTyping();

  // Subscriptions
  useIntentMessageAdded(activeIntentId, (message) => {
    console.log('[Channel Hook] Message added:', message.id);
  });
  useIntentMessageUpdated(activeIntentId, (message) => {
    console.log('[Channel Hook] Message updated:', message.id);
  });
  useIntentMessageDeleted(activeIntentId, (messageId) => {
    console.log('[Channel Hook] Message deleted:', messageId);
  });
  useIntentReactionAdded(activeIntentId);

  // Typing subscription
  const typingUsers = useIntentTyping(activeIntentId);

  // Transform memberships to conversations
  const conversations = useMemo(() => {
    if (!membershipsData?.myMemberships) return [];

    return membershipsData.myMemberships.map((membership) => {
      const intent = membership.intent;
      return {
        id: intent.id,
        kind: 'channel' as const,
        title: intent.title,
        membersCount: intent.participantCount || 0,
        preview: intent.description || 'No description',
        lastMessageAt: '', // TODO: Add last message time from API
        unread: 0, // TODO: Add unread count from API
        avatar: intent.avatarKey || undefined,
      };
    });
  }, [membershipsData]);

  // Transform messages
  const messages = useMemo(() => {
    if (!messagesData?.intentMessages || !myUserId) return [];

    return messagesData.intentMessages.map(
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
      })
    );
  }, [messagesData, myUserId]);

  // Send message handler
  const handleSendMessage = (content: string, replyToId?: string) => {
    if (!activeIntentId || !content.trim()) return;

    sendMessage.mutate({
      intentId: activeIntentId,
      content: content.trim(),
      replyToId,
    });
  };

  // Typing handler
  const handleTyping = (isTyping: boolean) => {
    if (!activeIntentId) return;
    publishTyping.mutate({ intentId: activeIntentId, isTyping });
  };

  // Mark as read when channel changes
  useEffect(() => {
    if (activeIntentId) {
      markAsRead.mutate({ intentId: activeIntentId });
    }
  }, [activeIntentId, markAsRead]);

  // Get active channel info
  const activeChannel = useMemo(() => {
    if (!activeIntentId || !membershipsData?.myMemberships) return null;
    const membership = membershipsData.myMemberships.find(
      (m) => m.intent.id === activeIntentId
    );
    if (!membership) return null;

    const intent = membership.intent;
    return {
      id: intent.id,
      title: intent.title,
      avatar: intent.avatarKey || undefined,
      members: intent.participantCount || 0,
    };
  }, [activeIntentId, membershipsData]);

  return {
    // Data
    conversations,
    messages,
    activeChannel,
    typingUsers,
    unreadCount: unreadData?.unreadCount || 0,

    // Loading states
    isLoadingChannels: membershipsLoading,
    isLoadingMessages: messagesLoading,
    isSending: sendMessage.isPending,

    // Handlers
    sendMessage: handleSendMessage,
    handleTyping,
  };
}
