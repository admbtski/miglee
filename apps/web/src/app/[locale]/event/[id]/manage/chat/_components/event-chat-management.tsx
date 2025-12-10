/**
 * Event Chat Management Component
 *
 * Embedded chat interface for event management pages.
 * Uses the shared useEventChatInstance hook for chat functionality.
 */

// TODO i18n: All strings need translation keys
// - "Ładowanie czatu...", "Nie znaleziono wydarzenia"
// - "Wiadomości", "Uczestnicy", message counts, person counts

'use client';

import { useEventQuery } from '@/features/events/api/events';
import { useEventChatInstance } from '@/features/chat/hooks/use-event-chat-instance';
import { ChatThread } from '@/features/chat/components/chat-thread';
import { EditMessageModal } from '@/features/chat/components/EditMessageModal';
import { DeleteConfirmModal } from '@/features/chat/components/DeleteConfirmModal';
import { ChatLoadingSkeleton } from '@/features/chat/components/message-skeleton';
import { ChatErrorWrapper } from '@/features/chat/components/chat-error-boundary';

// =============================================================================
// Types
// =============================================================================

interface EventChatManagementProps {
  eventId: string;
}

// =============================================================================
// Component
// =============================================================================

export function EventChatManagement({ eventId }: EventChatManagementProps) {
  // Fetch event details
  const { data: eventData, isLoading: eventLoading } = useEventQuery({
    id: eventId,
  });
  const event = eventData?.event;

  // Use shared chat hook
  const chat = useEventChatInstance({
    eventId,
    enabled: true,
  });

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (eventLoading || chat.isLoading) {
    return (
      <div className="rounded-2xl border-[0.5px] border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <div className="h-[calc(100vh-320px)] min-h-[600px]">
          <ChatLoadingSkeleton />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Event not found
  // ---------------------------------------------------------------------------
  if (!event) {
    return (
      <div className="rounded-2xl border-[0.5px] border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 p-8 text-center shadow-sm">
        <p className="text-zinc-600 dark:text-zinc-400">
          {/* TODO i18n */}
          Nie znaleziono wydarzenia
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  const totalMessages = chat.messages.length;

  return (
    <ChatErrorWrapper>
      <div className="space-y-4">
        {/* Stats Bar */}
        {totalMessages > 0 && (
          <div className="flex items-center gap-4 rounded-xl border-[0.5px] border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
            {/* Messages count */}
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
                {/* TODO i18n */}
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Wiadomości
                </p>
                {/* TODO i18n: proper pluralization */}
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

            {/* Participants count */}
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
                {/* TODO i18n */}
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Uczestnicy
                </p>
                {/* TODO i18n: proper pluralization */}
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
              eventId={eventId}
            />
          </div>
        </div>

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
}
