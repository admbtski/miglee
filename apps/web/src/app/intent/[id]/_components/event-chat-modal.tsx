'use client';

import { Modal } from '@/components/feedback/modal';
import { X } from 'lucide-react';
import { useState, useMemo, useRef } from 'react';
import {
  useGetIntentMessages,
  useSendIntentMessage,
  useMarkIntentChatRead,
  usePublishIntentTyping,
  eventChatKeys,
} from '@/lib/api/event-chat';
import {
  useIntentMessageAdded,
  useIntentMessageUpdated,
  useIntentMessageDeleted,
  useIntentTyping,
} from '@/lib/api/event-chat-subscriptions';
import {
  useAddIntentReaction,
  useRemoveIntentReaction,
} from '@/lib/api/reactions';
import { useIntentReactionAdded } from '@/lib/api/reactions-subscriptions';
import {
  useEditIntentMessage,
  useDeleteIntentMessage,
} from '@/lib/api/message-actions';
import { useQueryClient } from '@tanstack/react-query';
import { useMeQuery } from '@/lib/api/auth';
import { ChatThread, type Message } from '@/app/account/chats/page';
import { EditMessageModal } from '@/components/chat/EditMessageModal';
import { DeleteConfirmModal } from '@/components/chat/DeleteConfirmModal';

type EventChatModalProps = {
  open: boolean;
  onClose: () => void;
  intentId: string;
  intentTitle: string;
  membersCount?: number;
};

export function EventChatModal({
  open,
  onClose,
  intentId,
  intentTitle,
  membersCount = 0,
}: EventChatModalProps) {
  const queryClient = useQueryClient();
  const { data: authData } = useMeQuery();
  const currentUserId = authData?.me?.id;

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
    isLoading,
    fetchNextPage,
    hasNextPage,
  } = useGetIntentMessages(intentId, {
    enabled: open,
  });

  // Mutations
  const sendMessage = useSendIntentMessage();
  const markRead = useMarkIntentChatRead();
  const publishTyping = usePublishIntentTyping();
  const addReaction = useAddIntentReaction();
  const removeReaction = useRemoveIntentReaction();
  const editMessage = useEditIntentMessage();
  const deleteMessage = useDeleteIntentMessage();

  // Subscriptions
  useIntentMessageAdded({
    intentId,
    enabled: open,
    onMessage: (message) => {
      // Invalidate queries to fetch new messages
      queryClient.invalidateQueries({
        queryKey: eventChatKeys.messages(intentId),
      });

      // Auto-mark as read
      if (message.authorId !== currentUserId) {
        markRead.mutate({ intentId });
      }
    },
  });

  useIntentMessageUpdated({
    intentId,
    enabled: open,
    onMessageUpdated: (message) => {
      // Update cache directly (edges structure)
      queryClient.setQueryData(
        eventChatKeys.messages(intentId),
        (oldData: any) => {
          if (!oldData?.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              intentMessages: {
                ...page.intentMessages,
                edges: page.intentMessages?.edges?.map((edge: any) =>
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

  useIntentMessageDeleted({
    intentId,
    enabled: open,
    onMessageDeleted: (event) => {
      // Update cache directly (edges structure)
      queryClient.setQueryData(
        eventChatKeys.messages(intentId),
        (oldData: any) => {
          if (!oldData?.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              intentMessages: {
                ...page.intentMessages,
                edges: page.intentMessages?.edges?.map((edge: any) =>
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
  useIntentTyping({
    intentId,
    enabled: open,
    onTyping: ({ userId, isTyping }) => {
      // Don't show typing for current user
      if (userId === currentUserId) return;

      // Clear existing timeout
      const existingTimeout = typingTimeouts.current.get(`intent-${userId}`);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        typingTimeouts.current.delete(`intent-${userId}`);
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

  // Reaction subscription
  useIntentReactionAdded({
    intentId,
    enabled: open,
  });

  // Map messages to ChatThread format
  const messages: Message[] = useMemo(() => {
    if (!messagesData?.pages || !currentUserId) return [];

    const pages = messagesData.pages;
    // Extract messages from edges structure: { edges: [{ node, cursor }], pageInfo }
    const allMessages = pages.flatMap(
      (page: any) =>
        page.intentMessages?.edges?.map((edge: any) => edge.node) || []
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
        avatar: msg.author.imageUrl || undefined,
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
          intentId,
          content: text,
          replyToId: replyToId || undefined,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: eventChatKeys.messages(intentId),
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
        eventChatKeys.messages(intentId),
        (oldData: any) => {
          if (!oldData?.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              intentMessages: {
                ...page.intentMessages,
                edges: page.intentMessages?.edges?.map((edge: any) =>
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
        intentId,
      });

      // Optimistic update (edges structure)
      queryClient.setQueryData(
        eventChatKeys.messages(intentId),
        (oldData: any) => {
          if (!oldData?.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              intentMessages: {
                ...page.intentMessages,
                edges: page.intentMessages?.edges?.map((edge: any) =>
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

  const header = (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Czat wydarzenia
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {intentTitle}
        </p>
      </div>
      <button
        onClick={onClose}
        className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );

  const content = (
    <div className="h-[calc(100vh-200px)] min-h-[500px]">
      <ChatThread
        kind="channel"
        title={intentTitle}
        members={membersCount}
        messages={messages}
        loading={isLoading}
        typingUserNames={typingUserNames}
        onBackMobile={() => {}}
        onSend={handleSend}
        onLoadMore={hasNextPage ? fetchNextPage : undefined}
        onTyping={(isTyping) => {
          publishTyping.mutate({ intentId, isTyping });
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      density="compact"
      header={header}
      content={content}
    />
  );
}
