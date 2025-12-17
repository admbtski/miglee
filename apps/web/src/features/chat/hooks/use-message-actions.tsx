/**
 * Custom hook for message actions (edit, delete, reactions)
 *
 * @description
 * Provides unified interface for editing, deleting, and reacting to messages
 * in both DM and Channel contexts. Handles state management and API calls.
 *
 * @example
 * ```tsx
 * const messageActions = useMessageActions({
 *   kind: 'dm',
 *   threadId: 'thread-123',
 * });
 *
 * // Edit message
 * messageActions.handleEditMessage(messageId, content);
 * messageActions.handleSaveEdit();
 *
 * // Delete message
 * messageActions.handleDeleteMessage(messageId);
 * messageActions.handleConfirmDelete();
 * ```
 */

'use client';

import { useState } from 'react';
import {
  useUpdateDmMessage,
  useDeleteDmMessage,
  useEditEventMessage,
  useDeleteEventMessage,
} from '@/features/chat';
import {
  useAddDmReaction,
  useRemoveDmReaction,
  useAddEventReaction,
  useRemoveEventReaction,
} from '@/features/chat';

// =============================================================================
// Types
// =============================================================================

type UseMessageActionsProps = {
  /** Chat type: 'dm' for direct messages, 'channel' for event chats */
  kind: 'dm' | 'channel';
  /** DM thread ID (required if kind is 'dm') */
  threadId?: string;
  /** Event ID (required if kind is 'channel') */
  eventId?: string;
};

// =============================================================================
// Hook
// =============================================================================

export function useMessageActions({
  kind,
  threadId,
  eventId,
}: UseMessageActionsProps) {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(
    null
  );

  // Edit/Delete mutations
  const updateDmMessage = useUpdateDmMessage();
  const deleteDmMessage = useDeleteDmMessage();
  const editEventMessage = useEditEventMessage();
  const deleteEventMessage = useDeleteEventMessage();

  // Reaction mutations
  const addDmReaction = useAddDmReaction();
  const removeDmReaction = useRemoveDmReaction();
  const addEventReaction = useAddEventReaction();
  const removeEventReaction = useRemoveEventReaction();

  // Edit handlers
  const handleEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
  };

  const handleSaveEdit = () => {
    if (!editingMessageId || !editingContent.trim()) return;

    if (kind === 'dm' && threadId) {
      updateDmMessage.mutate(
        {
          id: editingMessageId,
          input: {
            content: editingContent,
          },
        },
        {
          onSuccess: () => {
            setEditingMessageId(null);
            setEditingContent('');
          },
        }
      );
    } else if (kind === 'channel' && eventId) {
      editEventMessage.mutate(
        {
          id: editingMessageId,
          input: {
            content: editingContent,
          },
        },
        {
          onSuccess: () => {
            setEditingMessageId(null);
            setEditingContent('');
          },
        }
      );
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  // Delete handlers
  const handleDeleteMessage = (messageId: string) => {
    setDeletingMessageId(messageId);
  };

  const handleConfirmDelete = () => {
    if (!deletingMessageId) return;

    if (kind === 'dm' && threadId) {
      deleteDmMessage.mutate(
        { id: deletingMessageId, threadId },
        {
          onSuccess: () => {
            setDeletingMessageId(null);
          },
        }
      );
    } else if (kind === 'channel' && eventId) {
      deleteEventMessage.mutate(
        { id: deletingMessageId, eventId },
        {
          onSuccess: () => {
            setDeletingMessageId(null);
          },
        }
      );
    }
  };

  // Reaction handlers
  const handleAddReaction = (messageId: string, emoji: string) => {
    if (kind === 'dm') {
      addDmReaction.mutate({ messageId, emoji });
    } else if (kind === 'channel') {
      addEventReaction.mutate({ messageId, emoji });
    }
  };

  const handleRemoveReaction = (messageId: string, emoji: string) => {
    if (kind === 'dm') {
      removeDmReaction.mutate({ messageId, emoji });
    } else if (kind === 'channel') {
      removeEventReaction.mutate({ messageId, emoji });
    }
  };

  return {
    // Edit state
    editingMessageId,
    editingContent,
    setEditingContent,
    isEditLoading: updateDmMessage.isPending || editEventMessage.isPending,

    // Delete state
    deletingMessageId,
    isDeleteLoading: deleteDmMessage.isPending || deleteEventMessage.isPending,

    // Handlers
    handleEditMessage,
    handleSaveEdit,
    handleCancelEdit,
    handleDeleteMessage,
    handleConfirmDelete,
    handleAddReaction,
    handleRemoveReaction,

    // Close modals
    closeEditModal: () => setEditingMessageId(null),
    closeDeleteModal: () => setDeletingMessageId(null),
  };
}
