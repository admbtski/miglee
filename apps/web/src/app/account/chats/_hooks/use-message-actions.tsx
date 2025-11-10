/**
 * Custom hook for message actions (edit, delete, reactions)
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

type UseMessageActionsProps = {
  kind: 'dm' | 'channel';
  threadId?: string;
  intentId?: string;
};

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
          messageId: editingMessageId,
          content: editingContent,
          threadId,
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
          messageId: editingMessageId,
          content: editingContent,
          intentId,
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
        { messageId: deletingMessageId, threadId },
        {
          onSuccess: () => {
            setDeletingMessageId(null);
          },
        }
      );
    } else if (kind === 'channel' && intentId) {
      deleteIntentMessage.mutate(
        { messageId: deletingMessageId, intentId },
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
    if (kind === 'dm' && threadId) {
      addDmReaction.mutate({ messageId, emoji, threadId });
    } else if (kind === 'channel' && intentId) {
      addIntentReaction.mutate({ messageId, emoji, intentId });
    }
  };

  const handleRemoveReaction = (messageId: string, emoji: string) => {
    if (kind === 'dm' && threadId) {
      removeDmReaction.mutate({ messageId, emoji, threadId });
    } else if (kind === 'channel' && intentId) {
      removeIntentReaction.mutate({ messageId, emoji, intentId });
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
