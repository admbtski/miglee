/**
 * Event Chat Modal Component
 *
 * Modal wrapper for event chat displayed on event detail page.
 * Uses the shared useEventChatInstance hook for chat functionality.
 */

// TODO i18n: Modal strings need translation
// - "Czat wydarzenia"

'use client';

import { X } from 'lucide-react';
import { Modal } from '@/components/feedback/modal';
import { useEventChatInstance } from '@/features/chat/hooks/use-event-chat-instance';
import { ChatThread } from '@/features/chat/components/chat-thread';
import { EditMessageModal } from '@/features/chat/components/EditMessageModal';
import { DeleteConfirmModal } from '@/features/chat/components/DeleteConfirmModal';
import { ChatLoadingSkeleton } from '@/features/chat/components/message-skeleton';
import { ChatErrorWrapper } from '@/features/chat/components/chat-error-boundary';

// =============================================================================
// Types
// =============================================================================

type EventChatModalProps = {
  open: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  membersCount?: number;
};

// =============================================================================
// Component
// =============================================================================

export function EventChatModal({
  open,
  onClose,
  eventId,
  eventTitle,
  membersCount = 0,
}: EventChatModalProps) {
  // Use shared chat hook
  const chat = useEventChatInstance({
    eventId,
    enabled: open,
  });

  // ---------------------------------------------------------------------------
  // Header
  // ---------------------------------------------------------------------------
  const header = (
    <div className="flex items-center justify-between">
      <div>
        {/* TODO i18n */}
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Czat wydarzenia
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{eventTitle}</p>
      </div>
      <button
        onClick={onClose}
        className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
        aria-label="Zamknij"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Content
  // ---------------------------------------------------------------------------
  const content = (
    <ChatErrorWrapper>
      <div className="h-[calc(100vh-200px)] min-h-[500px]">
        {chat.isLoading ? (
          <ChatLoadingSkeleton />
        ) : (
          <ChatThread
            kind="channel"
            title={eventTitle}
            members={membersCount}
            messages={chat.messages}
            loading={chat.isLoading}
            typingUserNames={chat.typingUserNames}
            onBackMobile={() => {}}
            onSend={chat.handleSend}
            onLoadMore={chat.hasNextPage ? chat.fetchNextPage : undefined}
            onTyping={chat.handleTyping}
            onAddReaction={chat.handleAddReaction}
            onRemoveReaction={chat.handleRemoveReaction}
            onEditMessage={chat.openEditModal}
            onDeleteMessage={chat.openDeleteModal}
          />
        )}

        {/* Edit Message Modal */}
        <EditMessageModal
          isOpen={!!chat.editingMessage}
          onClose={chat.closeEditModal}
          onSave={chat.handleSaveEdit}
          initialContent={chat.editingMessage?.content || ''}
          isLoading={chat.isEditPending}
        />

        {/* Delete Confirm Modal */}
        <DeleteConfirmModal
          isOpen={!!chat.deletingMessageId}
          onClose={chat.closeDeleteModal}
          onConfirm={chat.handleConfirmDelete}
          isLoading={chat.isDeletePending}
        />
      </div>
    </ChatErrorWrapper>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
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
