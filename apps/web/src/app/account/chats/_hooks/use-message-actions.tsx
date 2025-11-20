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
  useEditIntentMessage,
  useDeleteIntentMessage,
} from '@/lib/api/message-actions';
import {
  useAddDmReaction,
  useRemoveDmReaction,
  useAddIntentReaction,
  useRemoveIntentReaction,
} from '@/lib/api/reactions';

// =============================================================================
// Types
// =============================================================================

type UseMessageActionsProps = {
  /** Chat type: 'dm' for direct messages, 'channel' for intent chats */
  kind: 'dm' | 'channel';
  /** DM thread ID (required if kind is 'dm') */
  threadId?: string;
  /** Intent ID (required if kind is 'channel') */
  intentId?: string;
};

// =============================================================================
// Hook
// =============================================================================

export function useMessageActions({
  kind,
  threadId,
  intentId,
}: UseMessageActionsProps) {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(
    null
  );

  // Edit/Delete mutations
  const updateDmMessage = useUpdateDmMessage();
  const deleteDmMessage = useDeleteDmMessage();
  const editIntentMessage = useEditIntentMessage();
  const deleteIntentMessage = useDeleteIntentMessage();

  // Reaction mutations
  const addDmReaction = useAddDmReaction();
  const removeDmReaction = useRemoveDmReaction();
  const addIntentReaction = useAddIntentReaction();
  const removeIntentReaction = useRemoveIntentReaction();

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
    } else if (kind === 'channel' && intentId) {
      editIntentMessage.mutate(
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
    } else if (kind === 'channel' && intentId) {
      deleteIntentMessage.mutate(
        { id: deletingMessageId, intentId },
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
      addIntentReaction.mutate({ messageId, emoji });
    }
  };

  const handleRemoveReaction = (messageId: string, emoji: string) => {
    if (kind === 'dm') {
      removeDmReaction.mutate({ messageId, emoji });
    } else if (kind === 'channel') {
      removeIntentReaction.mutate({ messageId, emoji });
    }
  };

  return {
    // Edit state
    editingMessageId,
    editingContent,
    setEditingContent,
    isEditLoading: updateDmMessage.isPending || editIntentMessage.isPending,

    // Delete state
    deletingMessageId,
    isDeleteLoading: deleteDmMessage.isPending || deleteIntentMessage.isPending,

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
