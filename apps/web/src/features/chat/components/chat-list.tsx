/**
 * Chat List Component - List of conversations
 */

// TODO i18n: Strings need translation keys
// - "Inbox", "Newest", "No messages yet", "Start a conversation", "New conversation"

'use client';

import { Search, User2 } from 'lucide-react';
import type { Conversation } from '@/features/chat/types';
import { Avatar } from './avatar';

type ChatListProps = {
  items: Conversation[];
  activeId?: string;
  onPick: (id: string) => void;
  onStartConversation?: () => void;
  showStartButton?: boolean;
};

export function ChatList({
  items,
  activeId,
  onPick,
  onStartConversation,
  showStartButton,
}: ChatListProps) {
  return (
    <div className="grid h-[calc(100%-2.5rem)] grid-rows-[auto_1fr_auto] gap-3">
      <div className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-900/10 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-900">
        <div className="font-semibold">Inbox</div>
        <div className="flex items-center gap-2 text-zinc-400">
          <span>Newest</span>
          <Search className="w-4 h-4" />
        </div>
      </div>

      <div className="min-h-0 space-y-2 overflow-auto">
        {/* Show "Start a conversation" button when no DMs */}
        {showStartButton && onStartConversation && (
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800">
              <User2 className="w-8 h-8 text-zinc-400" />
            </div>
            <div>
              <h3 className="mb-1 text-sm font-semibold">No messages yet</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Start a conversation with someone
              </p>
            </div>
            <button
              onClick={onStartConversation}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-indigo-600 rounded-xl hover:bg-indigo-500"
            >
              <User2 className="w-4 h-4" />
              Start a conversation
            </button>
          </div>
        )}

        {/* Show smaller "Start" button when DMs exist */}
        {!showStartButton && onStartConversation && items.length > 0 && (
          <button
            onClick={onStartConversation}
            className="flex items-center justify-center w-full gap-2 px-3 py-2 text-sm font-medium transition-colors border rounded-xl border-zinc-200 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <User2 className="w-4 h-4" />
            New conversation
          </button>
        )}

        {items.map((c) => {
          const active = c.id === activeId;
          return (
            <button
              key={c.id}
              onClick={() => onPick(c.id)}
              className={[
                'group w-full text-left rounded-2xl p-3 transition-colors',
                active
                  ? 'bg-indigo-50 dark:bg-indigo-950/30'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60',
              ].join(' ')}
            >
              <div className="flex items-start gap-3">
                <Avatar token={c.avatar} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <div className="text-sm font-semibold truncate">
                      {c.kind === 'channel' ? `#${c.title}` : c.title}
                    </div>
                    <div className="text-xs text-zinc-400 flex-shrink-0">
                      {c.lastMessageAt}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs truncate text-zinc-600 dark:text-zinc-400">
                      {c.preview}
                    </div>
                    {c.unread > 0 && (
                      <div className="grid flex-shrink-0 w-5 h-5 text-xs font-bold text-white bg-indigo-600 rounded-full place-items-center">
                        {c.unread}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
