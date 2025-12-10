/**
 * Chats Page - Direct Messages & Event Channels
 *
 * Features:
 * - DM conversations with other users
 * - Event channel conversations
 * - Real-time message updates via subscriptions
 * - Typing indicators
 * - Message reactions, edit, delete
 *
 * TODO i18n: All hardcoded strings need translation keys
 * TODO i18n: Format date/time with user.timezone + locale
 */

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Hash, Loader2, User2 } from 'lucide-react';

import { useMeQuery } from '@/features/auth/hooks/auth';
import { useDmChat, useChannelChat } from '@/features/chat/hooks';
import { ChatList as ChatListComponent } from '@/features/chat/components/chat-list';
import { ChatThread as ChatThreadComponent } from '@/features/chat/components/chat-thread';
import { DeleteConfirmModal } from '@/features/chat/components/DeleteConfirmModal';
import { EditMessageModal } from '@/features/chat/components/EditMessageModal';
import { EmptyThread as EmptyThreadComponent } from '@/features/chat/components/empty-thread';
import {
  UserPicker,
  type PickedUser,
} from '@/features/chat/components/UserPicker';

// =============================================================================
// Types
// =============================================================================

type ChatKind = 'dm' | 'channel';

type Conversation = {
  id: string;
  kind: ChatKind;
  title: string;
  membersCount: number;
  preview: string;
  lastMessageAt: string;
  unread: number;
  avatar?: string;
};

// =============================================================================
// Page Component
// =============================================================================

export default function ChatsPage() {
  const { data: meData, isLoading: isLoadingAuth } = useMeQuery();
  const currentUserId = meData?.me?.id;

  const [tab, setTab] = useState<ChatKind>('dm');
  const [activeDmId, setActiveDmId] = useState<string | undefined>();
  const [activeChId, setActiveChId] = useState<string | undefined>();
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [draftConversation, setDraftConversation] = useState<{
    userId: string;
    userName: string;
    userAvatar?: string | null;
  } | null>(null);

  // ---------------------------------------------------------------------------
  // DM Chat Hook
  // ---------------------------------------------------------------------------
  const dmChat = useDmChat({
    myUserId: currentUserId,
    activeThreadId: activeDmId,
  });

  // ---------------------------------------------------------------------------
  // Channel Chat Hook
  // ---------------------------------------------------------------------------
  const channelChat = useChannelChat({
    activeEventId: activeChId,
  });

  // ---------------------------------------------------------------------------
  // Current active data based on tab
  // ---------------------------------------------------------------------------
  const conversations: Conversation[] = useMemo(() => {
    if (tab === 'dm') {
      return dmChat.conversations.map((c) => ({
        ...c,
        kind: 'dm' as const,
      }));
    }
    return channelChat.conversations;
  }, [tab, dmChat.conversations, channelChat.conversations]);

  const activeId = tab === 'dm' ? activeDmId : activeChId;

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId),
    [conversations, activeId]
  );

  const messages = tab === 'dm' ? dmChat.messages : channelChat.messages;
  const isLoadingMessages =
    tab === 'dm' ? dmChat.isLoadingMessages : channelChat.isLoadingMessages;
  const typingUserNames =
    tab === 'dm' ? dmChat.typingUserNames : channelChat.typingUserNames;
  const hasMore = tab === 'dm' ? dmChat.hasMore : channelChat.hasMore;
  const loadMore = tab === 'dm' ? dmChat.loadMore : channelChat.loadMore;

  // ---------------------------------------------------------------------------
  // Auto-select first conversation
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (
      tab === 'dm' &&
      !activeDmId &&
      !draftConversation &&
      dmChat.conversations.length > 0
    ) {
      setActiveDmId(dmChat.conversations[0]?.id);
    }
  }, [tab, activeDmId, draftConversation, dmChat.conversations]);

  useEffect(() => {
    if (
      tab === 'channel' &&
      !activeChId &&
      channelChat.conversations.length > 0
    ) {
      setActiveChId(channelChat.conversations[0]?.id);
    }
  }, [tab, activeChId, channelChat.conversations]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  function handlePick(id: string) {
    if (tab === 'dm') {
      setActiveDmId(id);
      setDraftConversation(null);
    } else {
      setActiveChId(id);
    }
  }

  function handleSend(text: string, replyToId?: string) {
    // Handle draft conversation (first message creates thread)
    if (draftConversation && !activeDmId && tab === 'dm') {
      dmChat.sendMessageToRecipient(
        text,
        draftConversation.userId,
        (newThreadId) => {
          setDraftConversation(null);
          setActiveDmId(newThreadId);
        }
      );
      return;
    }

    if (tab === 'dm') {
      dmChat.sendMessage(text, replyToId);
    } else {
      channelChat.sendMessage(text, replyToId);
    }
  }

  function handleTyping(isTyping: boolean) {
    if (tab === 'dm') {
      dmChat.handleTyping(isTyping);
    } else {
      channelChat.handleTyping(isTyping);
    }
  }

  function handleAddReaction(messageId: string, emoji: string) {
    if (tab === 'dm') {
      dmChat.handleAddReaction(messageId, emoji);
    } else {
      channelChat.handleAddReaction(messageId, emoji);
    }
  }

  function handleRemoveReaction(messageId: string, emoji: string) {
    if (tab === 'dm') {
      dmChat.handleRemoveReaction(messageId, emoji);
    } else {
      channelChat.handleRemoveReaction(messageId, emoji);
    }
  }

  function handleEditMessage(messageId: string, content: string) {
    if (tab === 'dm') {
      dmChat.openEditModal(messageId, content);
    } else {
      channelChat.openEditModal(messageId, content);
    }
  }

  function handleDeleteMessage(messageId: string) {
    if (tab === 'dm') {
      dmChat.openDeleteModal(messageId);
    } else {
      channelChat.openDeleteModal(messageId);
    }
  }

  const handleSelectUser = async (user: PickedUser) => {
    if (!currentUserId) return;

    // Check if thread already exists
    const existingThread = dmChat.conversations.find(
      (c) => c.otherUserId === user.id
    );

    if (existingThread) {
      setActiveDmId(existingThread.id);
      setDraftConversation(null);
    } else {
      setDraftConversation({
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatarKey,
      });
      setActiveDmId(undefined);
    }
    setShowUserPicker(false);
  };

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (isLoadingAuth && !currentUserId) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Determine what to show
  // ---------------------------------------------------------------------------
  const showDraftConversation =
    draftConversation && !activeDmId && tab === 'dm';
  const showActiveThread =
    (active || activeDmId || activeChId) && !showDraftConversation;

  const isListLoading =
    tab === 'dm' ? dmChat.isLoadingThreads : channelChat.isLoadingChannels;

  // Current edit/delete state
  const editingMessage =
    tab === 'dm' ? dmChat.editingMessage : channelChat.editingMessage;
  const deletingMessageId =
    tab === 'dm' ? dmChat.deletingMessageId : channelChat.deletingMessageId;
  const isEditPending =
    tab === 'dm' ? dmChat.isEditPending : channelChat.isEditPending;
  const isDeletePending =
    tab === 'dm' ? dmChat.isDeletePending : channelChat.isDeletePending;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        {/* TODO i18n */}
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Czaty
        </h1>
        <p className="mt-1 text-base text-zinc-600 dark:text-zinc-400">
          Zarządzaj wiadomościami prywatnymi i rozmowami w wydarzeniach
        </p>
      </div>

      <ChatShell listVisible>
        <ChatShell.ListPane>
          <ChatTabs tab={tab} setTab={setTab} />
          {isListLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            </div>
          ) : (
            <ChatListComponent
              items={conversations}
              activeId={activeId}
              onPick={handlePick}
              onStartConversation={
                tab === 'dm' ? () => setShowUserPicker(true) : undefined
              }
              showStartButton={tab === 'dm' && conversations.length === 0}
            />
          )}
        </ChatShell.ListPane>

        <ChatShell.ThreadPane>
          {showDraftConversation ? (
            <ChatThreadComponent
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
              onTyping={() => {}}
              isDraft={true}
            />
          ) : showActiveThread ? (
            <ChatThreadComponent
              kind={tab}
              title={
                tab === 'dm'
                  ? dmChat.activeThread?.title || active?.title || 'Chat'
                  : channelChat.activeChannel?.title || active?.title || 'Chat'
              }
              members={
                tab === 'dm'
                  ? 2
                  : channelChat.activeChannel?.members ||
                    active?.membersCount ||
                    0
              }
              avatar={
                tab === 'dm'
                  ? dmChat.activeThread?.avatar || active?.avatar
                  : channelChat.activeChannel?.avatar || active?.avatar
              }
              messages={messages}
              loading={isLoadingMessages}
              typingUserNames={typingUserNames}
              onBackMobile={() => {}}
              onSend={handleSend}
              onAddReaction={handleAddReaction}
              onRemoveReaction={handleRemoveReaction}
              onLoadMore={hasMore ? loadMore : undefined}
              onTyping={handleTyping}
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
            />
          ) : (
            <EmptyThreadComponent onBackMobile={() => {}} />
          )}
        </ChatShell.ThreadPane>
      </ChatShell>

      {/* Edit Message Modal */}
      <EditMessageModal
        isOpen={!!editingMessage}
        onClose={
          tab === 'dm' ? dmChat.closeEditModal : channelChat.closeEditModal
        }
        onSave={
          tab === 'dm' ? dmChat.handleSaveEdit : channelChat.handleSaveEdit
        }
        initialContent={editingMessage?.content || ''}
        isLoading={isEditPending}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingMessageId}
        onClose={
          tab === 'dm' ? dmChat.closeDeleteModal : channelChat.closeDeleteModal
        }
        onConfirm={
          tab === 'dm'
            ? dmChat.handleConfirmDelete
            : channelChat.handleConfirmDelete
        }
        isLoading={isDeletePending}
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

// =============================================================================
// Shell & Panes
// =============================================================================

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
  as?: React.ElementType;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tag
      className={`rounded-xl border border-zinc-200 shadow-sm min-w-0 dark:border-zinc-800 ${className}`}
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

// =============================================================================
// Tabs
// =============================================================================

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
        type="button"
        className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 transition-colors ${
          tab === 'dm'
            ? 'bg-white shadow-sm ring-1 ring-black/5 dark:bg-zinc-800'
            : 'text-zinc-600 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60'
        }`}
        onClick={() => setTab('dm')}
        aria-pressed={tab === 'dm'}
      >
        <User2 className="w-4 h-4" />
        {/* TODO i18n */}
        DM
      </button>
      <button
        type="button"
        className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 transition-colors ${
          tab === 'channel'
            ? 'bg-white shadow-sm ring-1 ring-black/5 dark:bg-zinc-800'
            : 'text-zinc-600 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60'
        }`}
        onClick={() => setTab('channel')}
        aria-pressed={tab === 'channel'}
      >
        <Hash className="w-4 h-4" />
        {/* TODO i18n */}
        Kanały
      </button>
    </div>
  );
}
