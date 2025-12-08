'use client';

import { useState, useMemo, useRef } from 'react';
import {
  useGetEventMessages,
  useSendEventMessage,
  useMarkEventChatRead,
  usePublishEventTyping,
  eventChatKeys,
} from '@/features/chat/api/event-chat';
import {
  useEventMessageAdded,
  useEventMessageUpdated,
  useEventMessageDeleted,
  useEventTyping,
} from '@/features/chat/api/event-chat-subscriptions';
import {
  useAddEventReaction,
  useRemoveEventReaction,
} from '@/features/chat/api/reactions';
import { useEventReactionAdded } from '@/features/chat/api/reactions-subscriptions';
import {
  useEditEventMessage,
  useDeleteEventMessage,
} from '@/features/chat/api/message-actions';
import { useQueryClient } from '@tanstack/react-query';
import { useMeQuery } from '@/features/auth/hooks/auth';
import { ChatThread } from '@/features/chat/components/chat-thread';
import { Message as ChatMessage } from '@/features/chat/types';
import { EditMessageModal } from '@/features/chat/components/EditMessageModal';
import { DeleteConfirmModal } from '@/features/chat/components/DeleteConfirmModal';
import { useEventQuery } from '@/features/events/api/events';
import { Loader2 } from 'lucide-react';

interface EventChatManagementProps {
  eventId: string;
}

/**
 * Chat management component for event/event
 * Embedded version of the chat modal for management pages
 */
export function EventChatManagement({ eventId }: EventChatManagementProps) {
  const queryClient = useQueryClient();
  const { data: authData } = useMeQuery();
  const currentUserId = authData?.me?.id;

  // Fetch event details
  const { data: eventData, isLoading: eventLoading } = useEventQuery({
    id: eventId,
  });
  const event = eventData?.event;

  // Edit/Delete state
  const [editingMessage, setEditingMessage] = useState<{
    id: string;
    content: string;
  } | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(
    null
  );

  // Typing state with auto-clear timeouts
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  // Fetch messages (infinite query)
  const {
    data: messagesData,
    isLoading: messagesLoading,
    fetchNextPage,
    hasNextPage,
  } = useGetEventMessages(eventId, {
    enabled: true,
  });

  // Mutations
  const sendMessage = useSendEventMessage();
  const markRead = useMarkEventChatRead();
  const publishTyping = usePublishEventTyping();
  const addReaction = useAddEventReaction();
  const removeReaction = useRemoveEventReaction();
  const editMessage = useEditEventMessage();
  const deleteMessage = useDeleteEventMessage();

  // Subscriptions
  useEventMessageAdded({
    eventId,
    enabled: true,
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
    enabled: true,
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
    enabled: true,
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
    enabled: true,
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
    enabled: true,
  });

  // Map messages to ChatThread format
  const messages: ChatMessage[] = useMemo(() => {
    if (!messagesData?.pages || !currentUserId) return [];

    const pages = messagesData.pages;
    // Extract messages from edges structure: { edges: [{ node, cursor }], pageInfo }
    const allMessages = pages.flatMap(
      (page: any) =>
        page.eventMessages?.edges?.map((edge: any) => edge.node) || []
    );

    return allMessages.map((msg: any) => ({
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
        avatarBlurhash: msg.author.avatarBlurhash || undefined,
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
    }));
  }, [messagesData, currentUserId]);

  // Handlers
  const handleSend = (text: string, replyToId?: string) => {
    sendMessage.mutate(
      {
        input: {
          eventId,
          content: text,
          replyToId: replyToId || undefined,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: eventChatKeys.messages(eventId),
          });
        },
      }
    );
  };

  const handleEditMessage = (messageId: string, content: string) => {
    setEditingMessage({ id: messageId, content });
  };

  const handleSaveEdit = async (newContent: string) => {
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
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    setDeletingMessageId(messageId);
  };

  const handleConfirmDelete = async () => {
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
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  // Get typing user names (simplified - would need to fetch user data)
  const typingUserNames =
    typingUsers.size > 0 ? [`${typingUsers.size} osób`] : null;

  if (eventLoading || messagesLoading) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-indigo-600 dark:text-indigo-400" />
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Ładowanie czatu...
          </p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="rounded-2xl border-[0.5px] border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 p-8 text-center shadow-sm">
        <p className="text-zinc-600 dark:text-zinc-400">
          Nie znaleziono wydarzenia
        </p>
      </div>
    );
  }

  const totalMessages = messages.length;

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      {totalMessages > 0 && (
        <div className="flex items-center gap-4 rounded-xl border-[0.5px] border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
              <svg
                className="h-5 w-5 text-indigo-600 dark:text-indigo-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Wiadomości
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {totalMessages}{' '}
                {totalMessages === 1
                  ? 'wiadomość'
                  : totalMessages < 5
                    ? 'wiadomości'
                    : 'wiadomości'}
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <svg
                className="h-5 w-5 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Uczestnicy
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {event.joinedCount || 0}{' '}
                {event.joinedCount === 1 ? 'osoba' : 'osób'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chat Container */}
      <div className="rounded-2xl border-[0.5px] border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <div className="h-[calc(100vh-320px)] min-h-[600px]">
          <ChatThread
            kind="channel"
            title={event.title}
            members={event.joinedCount || 0}
            messages={messages}
            loading={messagesLoading}
            typingUserNames={typingUserNames}
            onBackMobile={() => {}}
            onSend={handleSend}
            onLoadMore={hasNextPage ? fetchNextPage : undefined}
            onTyping={(isTyping) => {
              publishTyping.mutate({ eventId, isTyping });
            }}
            onAddReaction={(messageId, emoji) => {
              addReaction.mutate({ messageId, emoji });
            }}
            onRemoveReaction={(messageId, emoji) => {
              removeReaction.mutate({ messageId, emoji });
            }}
            onEditMessage={(messageId, content) => {
              handleEditMessage(messageId, content);
            }}
            onDeleteMessage={handleDeleteMessage}
          />
        </div>
      </div>

      {/* Edit Message Modal */}
      <EditMessageModal
        isOpen={!!editingMessage}
        onClose={() => setEditingMessage(null)}
        onSave={handleSaveEdit}
        initialContent={editingMessage?.content || ''}
        isLoading={editMessage.isPending}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingMessageId}
        onClose={() => setDeletingMessageId(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMessage.isPending}
      />
    </div>
  );
}
