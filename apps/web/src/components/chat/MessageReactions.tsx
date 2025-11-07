'use client';

import { useState } from 'react';
import { Smile } from 'lucide-react';

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export interface MessageReaction {
  emoji: string;
  count: number;
  users: Array<{ id: string; name: string }>;
  reacted: boolean;
}

interface MessageReactionsProps {
  messageId: string;
  reactions: MessageReaction[];
  onAddReaction: (emoji: string) => void;
  onRemoveReaction: (emoji: string) => void;
  currentUserId?: string;
}

export function MessageReactions({
  reactions,
  onAddReaction,
  onRemoveReaction,
}: Omit<MessageReactionsProps, 'messageId' | 'currentUserId'>) {
  const [showPicker, setShowPicker] = useState(false);
  const [pendingReactions, setPendingReactions] = useState<Set<string>>(
    new Set()
  );

  const handleEmojiClick = (emoji: string) => {
    // Prevent double-clicks (debounce)
    if (pendingReactions.has(emoji)) {
      return;
    }

    setPendingReactions((prev) => new Set(prev).add(emoji));

    const existing = reactions.find((r) => r.emoji === emoji);
    if (existing?.reacted) {
      onRemoveReaction(emoji);
    } else {
      onAddReaction(emoji);
    }
    setShowPicker(false);

    // Clear pending after 500ms
    setTimeout(() => {
      setPendingReactions((prev) => {
        const next = new Set(prev);
        next.delete(emoji);
        return next;
      });
    }, 500);
  };

  const getTooltip = (reaction: MessageReaction) => {
    if (reaction.count === 1) {
      return reaction.users[0]?.name || 'Someone';
    }
    if (reaction.count === 2) {
      return `${reaction.users[0]?.name} and ${reaction.users[1]?.name}`;
    }
    if (reaction.count === 3) {
      return `${reaction.users[0]?.name}, ${reaction.users[1]?.name}, and ${reaction.users[2]?.name}`;
    }
    return `${reaction.users[0]?.name}, ${reaction.users[1]?.name}, and ${
      reaction.count - 2
    } others`;
  };

  return (
    <div className="flex flex-wrap items-center gap-1 mt-1">
      {/* Existing reactions */}
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => handleEmojiClick(reaction.emoji)}
          disabled={pendingReactions.has(reaction.emoji)}
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-all duration-200 transform hover:scale-110 active:scale-95 ${
            reaction.reacted
              ? 'bg-indigo-100 dark:bg-indigo-900/30 ring-1 ring-indigo-500'
              : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          } ${
            pendingReactions.has(reaction.emoji) ? 'opacity-50 cursor-wait' : ''
          }`}
          title={getTooltip(reaction)}
        >
          <span>{reaction.emoji}</span>
          <span className="font-medium">{reaction.count}</span>
        </button>
      ))}

      {/* Add reaction button */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
          aria-label="Add reaction"
        >
          <Smile className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
        </button>

        {/* Emoji picker dropdown */}
        {showPicker && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowPicker(false)}
            />

            {/* Picker */}
            <div className="absolute bottom-full left-0 mb-1 z-20 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 p-2">
              <div className="flex gap-1">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiClick(emoji)}
                    className="inline-flex items-center justify-center h-8 w-8 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-lg"
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
