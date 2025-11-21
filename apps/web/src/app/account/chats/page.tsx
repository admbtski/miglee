'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Hash, User2, Loader2 } from 'lucide-react';

// API Hooks
import { useMeQuery } from '@/lib/api/auth';
import {
  useGetDmThreads,
  useGetDmMessagesInfinite,
  useSendDmMessage,
  useMarkDmThreadRead,
  usePublishDmTyping,
  dmKeys,
} from '@/lib/api/dm';
import {
  useGetIntentMessages,
  useSendIntentMessage,
  useMarkIntentChatRead,
  useGetIntentUnreadCount,
  usePublishIntentTyping,
  eventChatKeys,
} from '@/lib/api/event-chat';
import {
  useDmMessageAdded,
  useDmMessageUpdated,
  useDmMessageDeleted,
  useDmTyping,
  useDmThreadsSubscriptions,
} from '@/lib/api/dm-subscriptions';
import {
  useIntentMessageAdded,
  useIntentMessageUpdated,
  useIntentMessageDeleted,
  useIntentTyping,
} from '@/lib/api/event-chat-subscriptions';
import {
  useDmReactionAdded,
  useIntentReactionAdded,
} from '@/lib/api/reactions-subscriptions';
import { useMyMembershipsQuery } from '@/lib/api/intent-members';
import { useQueryClient } from '@tanstack/react-query';
import {
  useAddDmReaction,
  useRemoveDmReaction,
  useAddIntentReaction,
  useRemoveIntentReaction,
} from '@/lib/api/reactions';
// Chat components imported in sub-components
import { EditMessageModal } from '@/components/chat/EditMessageModal';
import { DeleteConfirmModal } from '@/components/chat/DeleteConfirmModal';
import { UserPicker, type PickedUser } from '@/components/chat/UserPicker';

// Custom Hooks
import { useMessageActions } from './_hooks/use-message-actions';
// import { useDmChat } from './_hooks/use-dm-chat';
// import { useChannelChat } from './_hooks/use-channel-chat';

/* ───────────────────────────── Types ───────────────────────────── */

type ChatKind = 'dm' | 'channel';

type Conversation = {
  id: string;
  kind: ChatKind;
  title: string;
  membersCount: number;
  preview: string;
  lastMessageAt: string; // e.g. "1m", "14m"
  unread: number;
  avatar?: string;
  lastReadAt?: number; // epoch ms
};

/* ───────────────────────────── Page ───────────────────────────── */

export default function ChatsPageIntegrated() {
  const queryClient = useQueryClient();
  const { data: meData } = useMeQuery();
  const currentUserId = meData?.me?.id;

  const [tab, setTab] = useState<ChatKind>('dm');

  // Independent active selections per tab
  const [activeDmId, setActiveDmId] = useState<string | undefined>();
  const [activeChId, setActiveChId] = useState<string | undefined>();

  // Typing indicators state
  const [dmTypingUsers, setDmTypingUsers] = useState<Set<string>>(new Set());
  const [channelTypingUsers, setChannelTypingUsers] = useState<Set<string>>(
    new Set()
  );

  // Use message actions hook
  const messageActions = useMessageActions({
    kind: tab,
    threadId: activeDmId,
    intentId: activeChId,
  });

  // Custom hooks ready for future use
  // TODO: Migrate to custom hooks when data structures are aligned
  // const dmChat = useDmChat({ myUserId: currentUserId, activeThreadId: activeDmId });
  // const channelChat = useChannelChat({ myUserId: currentUserId, activeIntentId: activeChId });

  // User picker state (for "Start a conversation")
  const [showUserPicker, setShowUserPicker] = useState(false);

  // Draft conversation state (before first message is sent)
  const [draftConversation, setDraftConversation] = useState<{
    userId: string;
    userName: string;
    userAvatar?: string | null;
  } | null>(null);

  // Fetch DM threads
  const { data: dmThreadsData, isLoading: dmThreadsLoading } = useGetDmThreads(
    { limit: 50, offset: 0 },
    { enabled: !!currentUserId }
  );

  // Fetch user's intent memberships (for channels)
  const { data: membershipsData, isLoading: membershipsLoading } =
    useMyMembershipsQuery(
      { limit: 100, offset: 0 },
      { enabled: !!currentUserId }
    );

  // Fetch DM messages for active thread (infinite query)
  const {
    data: dmMessagesData,
    isLoading: dmMessagesLoading,
    fetchNextPage: fetchNextDmPage,
    hasNextPage: hasNextDmPage,
    isFetchingNextPage: isFetchingNextDmPage,
  } = useGetDmMessagesInfinite(activeDmId!, {
    enabled: !!activeDmId,
  });

  // Fetch intent messages for active channel
  const {
    data: intentMessagesData,
    isLoading: intentMessagesLoading,
    fetchNextPage: fetchNextIntentPage,
    hasNextPage: hasNextIntentPage,
  } = useGetIntentMessages(activeChId!, {
    enabled: !!activeChId,
  });

  // Fetch unread count for active channel
  const { data: intentUnreadData } = useGetIntentUnreadCount(
    { intentId: activeChId! },
    { enabled: !!activeChId, refetchInterval: 10000 } // Refetch every 10s
  );

  // Mutations
  const sendDmMessage = useSendDmMessage();
  const sendIntentMessage = useSendIntentMessage();
  const markDmRead = useMarkDmThreadRead();
  const publishDmTyping = usePublishDmTyping();
  const publishIntentTyping = usePublishIntentTyping();
  const markIntentRead = useMarkIntentChatRead();

  // Reactions
  const addDmReaction = useAddDmReaction();
  const removeDmReaction = useRemoveDmReaction();
  const addIntentReaction = useAddIntentReaction();
  const removeIntentReaction = useRemoveIntentReaction();

  // Subscriptions
  const dmSubResult = useDmMessageAdded({
    threadId: activeDmId!,
    enabled: !!activeDmId && tab === 'dm',
    onMessage: (message) => {
      // Skip dummy read-event messages to prevent infinite loop
      if (message.id === 'read-event') {
        console.log('[DM Sub] Skipping read-event (prevents loop)');
        return;
      }
    },
  });

  const intentSubResult = useIntentMessageAdded({
    intentId: activeChId!,
    enabled: !!activeChId && tab === 'channel',
    onMessage: (message) => {
      console.log('[Intent Sub] New message received:', message.id);

      // Invalidate queries to refetch messages
      queryClient.invalidateQueries({
        queryKey: eventChatKeys.messages(activeChId!),
      });
      queryClient.invalidateQueries({
        queryKey: eventChatKeys.unreadCount(activeChId!),
      });

      // Auto-mark as read when new message arrives in active channel
      if (activeChId && message.authorId !== currentUserId) {
        console.log('[Intent Sub] Auto-marking as read:', message.id);
        markIntentRead.mutate({ intentId: activeChId });
      }
    },
  });

  // Debug: log subscription status
  useEffect(() => {
    if (tab === 'dm' && activeDmId) {
      console.log(
        '[DM Sub] Connected:',
        dmSubResult.connected,
        'ThreadID:',
        activeDmId
      );
    }
  }, [tab, activeDmId, dmSubResult.connected]);

  useEffect(() => {
    if (tab === 'channel' && activeChId) {
      console.log(
        '[Intent Sub] Connected:',
        intentSubResult.connected,
        'IntentID:',
        activeChId
      );
    }
  }, [tab, activeChId, intentSubResult.connected]);

  // Typing indicators subscriptions with auto-clear
  const typingTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  useDmTyping({
    threadId: activeDmId!,
    enabled: !!activeDmId && tab === 'dm',
    onTyping: ({ userId, isTyping }) => {
      // Don't show typing for current user
      if (userId === currentUserId) return;

      // Clear existing timeout
      const existingTimeout = typingTimeouts.current.get(`dm-${userId}`);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        typingTimeouts.current.delete(`dm-${userId}`);
      }

      setDmTypingUsers((prev) => {
        const next = new Set(prev);
        if (isTyping) {
          next.add(userId);
          // Auto-clear after 5 seconds
          const timeout = setTimeout(() => {
            setDmTypingUsers((p) => {
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

  useIntentTyping({
    intentId: activeChId!,
    enabled: !!activeChId && tab === 'channel',
    onTyping: ({ userId, isTyping }) => {
      // Don't show typing for current user
      if (userId === currentUserId) return;

      // Clear existing timeout
      const existingTimeout = typingTimeouts.current.get(`intent-${userId}`);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        typingTimeouts.current.delete(`intent-${userId}`);
      }

      setChannelTypingUsers((prev) => {
        const next = new Set(prev);
        if (isTyping) {
          next.add(userId);
          // Auto-clear after 5 seconds
          const timeout = setTimeout(() => {
            setChannelTypingUsers((p) => {
              const n = new Set(p);
              n.delete(userId);
              return n;
            });
            typingTimeouts.current.delete(`intent-${userId}`);
          }, 5000);
          typingTimeouts.current.set(`intent-${userId}`, timeout);
        } else {
          next.delete(userId);
        }
        return next;
      });
    },
  });

  // Subscribe to message updates (DM)
  const dmUpdateSubEnabled = !!activeDmId && tab === 'dm';
  console.log(
    '[DM Sub Update] Enabled:',
    dmUpdateSubEnabled,
    'ThreadID:',
    activeDmId,
    'Tab:',
    tab
  );

  useDmMessageUpdated({
    threadId: activeDmId!,
    enabled: dmUpdateSubEnabled,
    onMessageUpdated: (message) => {
      console.log(
        '[DM Sub] ✅ Message updated RECEIVED:',
        message.id,
        message.content
      );

      // Use message.threadId from the event to ensure we update the correct thread
      const threadId = message.threadId;

      // Update cache directly instead of refetching
      // Use the same query key as useGetDmMessagesInfinite
      queryClient.setQueryData(
        // @ts-expect-error - infinite is used internally by react-query
        dmKeys.messages(threadId, { infinite: true }),
        (oldData: any) => {
          console.log(
            '[DM Sub] Updating cache for thread:',
            threadId,
            'oldData:',
            oldData
          );
          if (!oldData?.pages) {
            console.log('[DM Sub] No pages in cache, returning oldData');
            return oldData;
          }

          const updated = {
            ...oldData,
            pages: oldData.pages.map((page: any) => {
              if (!page.dmMessages?.edges) return page;
              return {
                ...page,
                dmMessages: {
                  ...page.dmMessages,
                  edges: page.dmMessages.edges.map((edge: any) =>
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
              };
            }),
          };
          console.log('[DM Sub] Cache updated, new data:', updated);
          return updated;
        }
      );
    },
  });

  // Subscribe to message deletions (DM)
  const dmDeleteSubEnabled = !!activeDmId && tab === 'dm';
  console.log(
    '[DM Sub Delete] Enabled:',
    dmDeleteSubEnabled,
    'ThreadID:',
    activeDmId,
    'Tab:',
    tab
  );

  useDmMessageDeleted({
    threadId: activeDmId!,
    enabled: dmDeleteSubEnabled,
    onMessageDeleted: (event) => {
      console.log(
        '[DM Sub] ✅ Message deleted RECEIVED:',
        event.messageId,
        event.deletedAt
      );

      // We need to find which thread this message belongs to
      // Since we only have messageId, we need to update all thread caches
      // or better - get threadId from the subscription context
      // For now, use activeDmId as we're subscribed to specific thread
      const threadId = activeDmId!;

      // Update cache directly - set deletedAt instead of removing message
      // Use the same query key as useGetDmMessagesInfinite
      queryClient.setQueryData(
        // @ts-expect-error - infinite is used internally by react-query
        dmKeys.messages(threadId, { infinite: true }),
        (oldData: any) => {
          console.log(
            '[DM Sub] Deleting message in cache for thread:',
            threadId,
            'oldData:',
            oldData
          );
          if (!oldData?.pages) {
            console.log('[DM Sub] No pages in cache, returning oldData');
            return oldData;
          }

          const updated = {
            ...oldData,
            pages: oldData.pages.map((page: any) => {
              if (!page.dmMessages?.edges) return page;
              return {
                ...page,
                dmMessages: {
                  ...page.dmMessages,
                  edges: page.dmMessages.edges.map((edge: any) =>
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
              };
            }),
          };
          console.log(
            '[DM Sub] Cache updated after delete, new data:',
            updated
          );
          return updated;
        }
      );
    },
  });

  // Subscribe to message updates (Intent)
  useIntentMessageUpdated({
    intentId: activeChId!,
    enabled: !!activeChId && tab === 'channel',
    onMessageUpdated: (message) => {
      console.log('[Intent Sub] Message updated:', message.id, message.content);

      // Update cache directly instead of refetching
      queryClient.setQueryData(
        eventChatKeys.messages(activeChId!),
        (oldData: any) => {
          console.log('[Intent Sub] Old cache data:', oldData);
          if (!oldData?.pages) return oldData;

          const updated = {
            ...oldData,
            pages: oldData.pages.map((page: any) => {
              if (!page.intentMessages?.edges) return page;
              return {
                ...page,
                intentMessages: {
                  ...page.intentMessages,
                  edges: page.intentMessages.edges.map((edge: any) =>
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
              };
            }),
          };
          console.log('[Intent Sub] Updated cache data:', updated);
          return updated;
        }
      );
    },
  });

  // Subscribe to message deletions (Intent)
  useIntentMessageDeleted({
    intentId: activeChId!,
    enabled: !!activeChId && tab === 'channel',
    onMessageDeleted: (event) => {
      console.log(
        '[Intent Sub] Message deleted:',
        event.messageId,
        event.deletedAt
      );

      // Update cache directly - set deletedAt instead of removing message
      queryClient.setQueryData(
        eventChatKeys.messages(activeChId!),
        (oldData: any) => {
          console.log('[Intent Sub Delete] Old cache data:', oldData);
          if (!oldData?.pages) return oldData;

          const updated = {
            ...oldData,
            pages: oldData.pages.map((page: any) => {
              if (!page.intentMessages?.edges) return page;
              return {
                ...page,
                intentMessages: {
                  ...page.intentMessages,
                  edges: page.intentMessages.edges.map((edge: any) =>
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
              };
            }),
          };
          console.log('[Intent Sub Delete] Updated cache data:', updated);
          return updated;
        }
      );
    },
  });

  // Reaction subscriptions
  useDmReactionAdded({
    threadId: activeDmId!,
    enabled: !!activeDmId && tab === 'dm',
  });

  useIntentReactionAdded({
    intentId: activeChId!,
    enabled: !!activeChId && tab === 'channel',
  });

  // Subscribe to ALL DM threads for badge updates
  const allDmThreadIds = useMemo(() => {
    return dmThreadsData?.dmThreads?.items?.map((t) => t.id) || [];
  }, [dmThreadsData?.dmThreads?.items]);

  const dmThreadsSubResult = useDmThreadsSubscriptions({
    threadIds: allDmThreadIds,
    enabled: !!currentUserId && allDmThreadIds.length > 0,
  });

  // Debug: log threads subscription status
  useEffect(() => {
    if (allDmThreadIds.length > 0) {
      console.log(
        '[DM Threads Sub] Subscribed to',
        dmThreadsSubResult.connectedCount,
        'threads'
      );
    }
  }, [allDmThreadIds.length, dmThreadsSubResult.connectedCount]);

  // Map DM threads to conversations
  const dmConversations: Conversation[] = useMemo(() => {
    if (!dmThreadsData?.dmThreads?.items || !currentUserId) return [];

    return dmThreadsData.dmThreads.items.map((thread) => {
      const otherUser =
        thread.aUserId === currentUserId ? thread.bUser : thread.aUser;
      const lastMsg = thread.lastMessage;

      return {
        id: thread.id,
        kind: 'dm' as const,
        title: otherUser.name || 'Unknown',
        membersCount: 2,
        preview: lastMsg?.content || 'No messages yet',
        lastMessageAt: formatRelativeTime(
          thread.lastMessageAt || thread.createdAt
        ),
        unread: thread.unreadCount || 0,
        avatar: otherUser.avatarKey || undefined,
      };
    });
  }, [dmThreadsData, currentUserId]);

  // Map user's intent memberships to channel conversations
  const channelConversations: Conversation[] = useMemo(() => {
    const memberships = membershipsData?.myMemberships;
    if (!memberships || !currentUserId) return [];

    console.dir({ memberships });

    return memberships
      .filter((membership) => membership.status === 'JOINED')
      .flatMap((membership): Conversation[] => {
        const intent = membership.intent;
        if (!intent) return [];

        // Get last message from intent (if available)
        const lastMessage =
          intent.messagesCount > 0 ? 'Recent activity' : 'No messages yet';

        // Use unread count from query if this is the active channel
        const unreadCount =
          intent.id === activeChId
            ? (intentUnreadData?.intentUnreadCount ?? 0)
            : 0;

        return [
          {
            id: intent.id,
            kind: 'channel' as const,
            title: intent.title || 'Untitled Event',
            membersCount: intent.joinedCount || 0,
            preview: lastMessage,
            lastMessageAt: formatRelativeTime(intent.updatedAt),
            unread: unreadCount,
            avatar: intent.owner?.avatarKey || undefined,
          },
        ];
      });
  }, [membershipsData, currentUserId, activeChId, intentUnreadData]);

  const conversations: Conversation[] =
    tab === 'dm' ? dmConversations : channelConversations;
  const activeId = tab === 'dm' ? activeDmId : activeChId;

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId),
    [conversations, activeId]
  );

  // Set first conversation as active on load (but not if we have a draft)
  useEffect(() => {
    if (
      tab === 'dm' &&
      !activeDmId &&
      !draftConversation &&
      dmConversations.length > 0
    ) {
      setActiveDmId(dmConversations[0]?.id);
    }
  }, [tab, activeDmId, draftConversation, dmConversations]);

  useEffect(() => {
    if (tab === 'channel' && !activeChId && channelConversations.length > 0) {
      setActiveChId(channelConversations[0]?.id);
    }
  }, [tab, activeChId, channelConversations]);

  function handlePick(id: string) {
    if (tab === 'dm') {
      setActiveDmId(id);
      setDraftConversation(null); // Clear draft when picking existing thread
    } else {
      setActiveChId(id);
    }
  }

  // Handle user selection from UserPicker
  const handleSelectUser = async (user: PickedUser) => {
    if (!currentUserId) return;

    console.log('[UserPicker] Selected user:', user);

    // Check if thread already exists with this user
    const existingThread = dmThreadsData?.dmThreads?.items?.find(
      (t) =>
        (t.aUserId === currentUserId && t.bUserId === user.id) ||
        (t.bUserId === currentUserId && t.aUserId === user.id)
    );

    if (existingThread) {
      // Thread exists - open it directly
      console.log('[UserPicker] Found existing thread:', existingThread.id);
      setActiveDmId(existingThread.id);
      setDraftConversation(null);
    } else {
      // No thread exists - create draft conversation
      console.log('[UserPicker] Creating draft conversation with:', user.name);
      setDraftConversation({
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatarKey,
      });
      setActiveDmId(undefined); // Clear active thread
    }

    // Close the user picker modal
    setShowUserPicker(false);
  };

  // Handle "Start a conversation" button click
  const handleStartConversation = () => {
    setShowUserPicker(true);
  };

  function handleSend(text: string, replyToId?: string) {
    // Handle draft conversation (first message creates thread)
    if (draftConversation && !activeDmId && currentUserId) {
      console.log(
        '[Draft] Sending first message to:',
        draftConversation.userName
      );

      sendDmMessage.mutate(
        {
          input: {
            recipientId: draftConversation.userId,
            content: text,
          },
        },
        {
          onSuccess: (data) => {
            console.log('[Draft] First message sent, thread created:', data);

            // Clear draft
            setDraftConversation(null);

            // Set the new thread as active
            const newThreadId = data.sendDmMessage?.threadId;
            if (newThreadId) {
              setActiveDmId(newThreadId);
            }

            // Refresh threads list
            queryClient.invalidateQueries({
              queryKey: dmKeys.threads(),
            });
          },
          onError: (error) => {
            console.error('[Draft] Error sending first message:', error);
          },
        }
      );
      return;
    }

    if (!active || !currentUserId) return;

    if (active.kind === 'dm') {
      // Get the other user ID from the thread
      const thread = dmThreadsData?.dmThreads?.items?.find(
        (t) => t.id === activeDmId
      );
      if (!thread) return;

      const recipientId =
        thread.aUserId === currentUserId ? thread.bUserId : thread.aUserId;

      console.log(
        '[Send DM] ThreadID:',
        activeDmId,
        'RecipientID:',
        recipientId
      );

      sendDmMessage.mutate(
        {
          input: {
            recipientId,
            content: text,
            replyToId: replyToId || undefined,
          },
        },
        {
          onSuccess: (data) => {
            console.log('[Send DM Success]', data);
            // Force refetch to show new message immediately for sender
            // Invalidate all messages queries for this thread (regardless of filters)
            queryClient.invalidateQueries({
              queryKey: ['dm', 'messages', activeDmId],
            });
            queryClient.invalidateQueries({
              queryKey: dmKeys.threads(),
            });
          },
          onError: (error) => {
            console.error('[Send DM Error]', error);
          },
        }
      );
    } else {
      sendIntentMessage.mutate(
        {
          input: {
            intentId: active.id,
            content: text,
            replyToId: replyToId || undefined,
          },
        },
        {
          onSuccess: () => {
            // Force refetch to show new message immediately for sender
            queryClient.invalidateQueries({
              queryKey: eventChatKeys.messages(active.id),
            });
          },
        }
      );
    }
  }

  // Edit/Delete handlers
  // Message actions are now handled by useMessageActions hook
  // No need for separate handlers - use messageActions.handleEditMessage, etc.

  // Map messages
  const messages = useMemo(() => {
    if (!active || !currentUserId) return [];

    if (active.kind === 'dm') {
      // dmMessages now uses infinite query with pages
      const pages = (dmMessagesData as any)?.pages;
      if (!pages) return [];

      // Flatten all pages - pages are loaded newest first, so reverse them
      const reversedPages = [...pages].reverse();
      const allMessages = reversedPages.flatMap(
        (page: any) => page.dmMessages?.edges?.map((e: any) => e.node) || []
      );

      console.log(
        '[Messages] DM items count:',
        allMessages.length,
        'ThreadID:',
        activeDmId
      );

      if (allMessages.length === 0) {
        return [];
      }

      return allMessages.map((msg: any) => {
        // Debug: Check if replyTo exists
        if (msg.replyTo) {
          console.log('[DM Message with Reply]', {
            messageId: msg.id,
            content: msg.content.substring(0, 30),
            replyToId: msg.replyToId,
            replyTo: msg.replyTo,
          });
        }

        return {
          id: msg.id,
          text: msg.content,
          at: new Date(msg.createdAt).getTime(),
          side: (msg.senderId === currentUserId ? 'right' : 'left') as
            | 'left'
            | 'right',
          author: {
            id: msg.sender.id,
            name: msg.sender.name || 'Unknown',
            avatar: msg.sender.avatarKey || undefined,
          },
          block: !!msg.deletedAt,
          reactions: msg.reactions || [],
          readAt: msg.readAt,
          editedAt: msg.editedAt,
          deletedAt: msg.deletedAt,
          replyTo: msg.replyTo
            ? {
                id: msg.replyTo.id,
                author: {
                  id: msg.replyTo.sender.id,
                  name: msg.replyTo.sender.name || 'Unknown',
                },
                content: msg.replyTo.content,
              }
            : null,
        };
      });
    } else {
      const pages = intentMessagesData?.pages;
      if (!pages) return [];

      const allMessages = pages.flatMap(
        (page) => page.intentMessages?.edges?.map((e) => e.node) || []
      );

      return allMessages.map((msg) => {
        return {
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
        };
      });
    }
  }, [active, currentUserId, dmMessagesData, intentMessagesData]);

  // Mark as read when opening a conversation
  useEffect(() => {
    if (!active) return;

    if (active.kind === 'dm' && activeDmId) {
      markDmRead.mutate({ threadId: activeDmId });
    } else if (active.kind === 'channel' && activeChId) {
      markIntentRead.mutate({ intentId: activeChId });
    }
  }, [activeDmId, activeChId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Get typing user names for display
  const typingUserNames = useMemo(() => {
    const typingUsers = tab === 'dm' ? dmTypingUsers : channelTypingUsers;
    if (typingUsers.size === 0) return null;

    // For DM, get the other user's name
    if (tab === 'dm' && active) {
      const thread = dmThreadsData?.dmThreads?.items?.find(
        (t) => t.id === activeDmId
      );
      if (!thread) return null;

      const otherUser =
        thread.aUserId === currentUserId ? thread.bUser : thread.aUser;
      return [otherUser.name || 'Someone'];
    }

    // For channels, we'd need to fetch user names (simplified for now)
    return [
      `${typingUsers.size} ${typingUsers.size === 1 ? 'person' : 'people'}`,
    ];
  }, [
    tab,
    dmTypingUsers,
    channelTypingUsers,
    active,
    dmThreadsData,
    activeDmId,
    currentUserId,
  ]);

  const activeThreadData = useMemo(() => {
    if (tab === 'dm' && activeDmId && !active) {
      const thread = dmThreadsData?.dmThreads?.items?.find(
        (t) => t.id === activeDmId
      );
      if (thread && currentUserId) {
        const otherUser =
          thread.aUserId === currentUserId ? thread.bUser : thread.aUser;
        return {
          kind: 'dm' as const,
          title: otherUser.name || 'Unknown',
          members: 2,
          avatar: otherUser.avatarKey || undefined,
          lastReadAt: undefined,
        };
      }
    }
    return null;
  }, [tab, activeDmId, active, dmThreadsData, currentUserId]);

  if (!currentUserId) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  // Determine what to show in thread pane
  const showDraftConversation =
    draftConversation && !activeDmId && tab === 'dm';
  const showActiveThread =
    (active || activeDmId || activeChId) && !showDraftConversation;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Chats
        </h1>
        <p className="mt-1 text-base text-zinc-600 dark:text-zinc-400">
          Manage your direct messages and event conversations
        </p>
      </div>

      <ChatShell listVisible>
        <ChatShell.ListPane>
          <ChatTabs tab={tab} setTab={setTab} />
          {(dmThreadsLoading && tab === 'dm') ||
          (membershipsLoading && tab === 'channel') ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            </div>
          ) : (
            <ChatList
              items={conversations}
              activeId={activeId}
              onPick={(id) => handlePick(id)}
              onStartConversation={
                tab === 'dm' ? handleStartConversation : undefined
              }
              showStartButton={tab === 'dm' && conversations.length === 0}
            />
          )}
        </ChatShell.ListPane>

        <ChatShell.ThreadPane>
          {showDraftConversation ? (
            <ChatThread
              kind="dm"
              title={draftConversation.userName}
              members={2}
              avatar={draftConversation.userAvatar || undefined}
              messages={[]}
              loading={false}
              typingUserNames={null}
              onBackMobile={() => setDraftConversation(null)}
              onSend={handleSend}
              onAddReaction={() => {}}
              onRemoveReaction={() => {}}
              onTyping={() => {
                // Draft doesn't have threadId yet, so no typing indicator
              }}
              isDraft={true}
            />
          ) : showActiveThread ? (
            <ChatThread
              kind={(active || activeThreadData)?.kind || 'dm'}
              title={(active || activeThreadData)?.title || 'Chat'}
              members={active?.membersCount || activeThreadData?.members || 2}
              avatar={(active || activeThreadData)?.avatar}
              messages={messages}
              loading={
                tab === 'dm'
                  ? dmMessagesLoading || isFetchingNextDmPage
                  : intentMessagesLoading
              }
              typingUserNames={typingUserNames}
              onBackMobile={() => {}}
              onSend={handleSend}
              onAddReaction={(messageId: string, emoji: string) => {
                if ((active || activeThreadData)?.kind === 'dm') {
                  addDmReaction.mutate({ messageId, emoji });
                } else {
                  addIntentReaction.mutate({ messageId, emoji });
                }
              }}
              onRemoveReaction={(messageId: string, emoji: string) => {
                if ((active || activeThreadData)?.kind === 'dm') {
                  removeDmReaction.mutate({ messageId, emoji });
                } else {
                  removeIntentReaction.mutate({ messageId, emoji });
                }
              }}
              onLoadMore={
                tab === 'dm' && hasNextDmPage
                  ? () => {
                      console.log('[LoadMore] Fetching next DM page...');
                      fetchNextDmPage();
                    }
                  : tab === 'channel' && hasNextIntentPage
                    ? () => {
                        console.log('[LoadMore] Fetching next Intent page...');
                        fetchNextIntentPage();
                      }
                    : undefined
              }
              onTyping={(isTyping: boolean) => {
                if ((active || activeThreadData)?.kind === 'dm' && activeDmId) {
                  publishDmTyping.mutate({ threadId: activeDmId, isTyping });
                } else if (
                  (active || activeThreadData)?.kind === 'channel' &&
                  activeChId
                ) {
                  publishIntentTyping.mutate({
                    intentId: activeChId,
                    isTyping,
                  });
                }
              }}
              onEditMessage={(messageId: string, content: string) => {
                messageActions.handleEditMessage(messageId, content);
              }}
              onDeleteMessage={messageActions.handleDeleteMessage}
            />
          ) : (
            <EmptyThread onBackMobile={() => {}} />
          )}
        </ChatShell.ThreadPane>
      </ChatShell>

      {/* Edit Message Modal */}
      <EditMessageModal
        isOpen={!!messageActions.editingMessageId}
        onClose={messageActions.closeEditModal}
        onSave={messageActions.handleSaveEdit}
        initialContent={messageActions.editingContent}
        isLoading={messageActions.isEditLoading}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={!!messageActions.deletingMessageId}
        onClose={messageActions.closeDeleteModal}
        onConfirm={messageActions.handleConfirmDelete}
        isLoading={messageActions.isDeleteLoading}
      />

      {/* User Picker Modal */}
      <UserPicker
        isOpen={showUserPicker}
        onClose={() => setShowUserPicker(false)}
        onSelectUser={handleSelectUser}
      />
    </div>
  );
}

/* ───────────────────────────── Shell & panes ───────────────────────────── */

function ChatShell({
  children,
  listVisible,
}: {
  children: React.ReactNode;
  listVisible: boolean;
}) {
  const [list, thread] = React.Children.toArray(children);
  return (
    <div className="w-full h-full">
      <div className="hidden md:grid md:h-full md:grid-cols-[clamp(260px,20vw,360px)_minmax(0,1fr)] md:gap-6">
        {list}
        {thread}
      </div>
      <div className="md:hidden">{listVisible ? list : thread}</div>
    </div>
  );
}

function PaneBase({
  as: Tag = 'div',
  className = '',
  children,
}: {
  as?: any;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tag
      className={[
        'rounded-xl border border-zinc-200 shadow-sm min-w-0',
        'dark:border-zinc-800',
        className,
      ].join(' ')}
    >
      {children}
    </Tag>
  );
}

ChatShell.ListPane = function ListPane({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PaneBase as="aside" className="h-full p-2 bg-white dark:bg-zinc-900">
      {children}
    </PaneBase>
  );
};
ChatShell.ThreadPane = function ThreadPane({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PaneBase as="section" className="h-full bg-white dark:bg-zinc-900">
      {children}
    </PaneBase>
  );
};

/* ───────────────────────────── Tabs ───────────────────────────── */

function ChatTabs({
  tab,
  setTab,
}: {
  tab: ChatKind;
  setTab: (t: ChatKind) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 p-1 mb-2 text-sm border rounded-2xl border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900">
      <button
        className={[
          'inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 transition-colors',
          tab === 'dm'
            ? 'bg-white shadow-sm ring-1 ring-black/5 dark:bg-zinc-800'
            : 'text-zinc-600 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60',
        ].join(' ')}
        onClick={() => setTab('dm')}
      >
        <User2 className="w-4 h-4" />
        DM
      </button>
      <button
        className={[
          'inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 transition-colors',
          tab === 'channel'
            ? 'bg-white shadow-sm ring-1 ring-black/5 dark:bg-zinc-800'
            : 'text-zinc-600 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60',
        ].join(' ')}
        onClick={() => setTab('channel')}
      >
        <Hash className="w-4 h-4" />
        Channels
      </button>
    </div>
  );
}

/* ───────────────────────────── List ───────────────────────────── */
// ChatList moved to _components/chat-list.tsx
import { ChatList as ChatListComponent } from './_components/chat-list';
const ChatList = ChatListComponent;

/* ───────────────────────────── Thread ───────────────────────────── */
// ChatThread moved to _components/chat-thread.tsx
import { ChatThread as ChatThreadComponent } from './_components/chat-thread';
const ChatThread = ChatThreadComponent;

// Helper functions for time formatting (internal use only)
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

// Components moved to _components/ - imported where needed
import { EmptyThread as EmptyThreadComponent } from './_components/empty-thread';
const EmptyThread = EmptyThreadComponent;

// ============================================================================
// END OF FILE - All components imported from _components/
// ============================================================================
