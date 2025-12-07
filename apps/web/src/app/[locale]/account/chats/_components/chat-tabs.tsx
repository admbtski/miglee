/**
 * Chat tabs component (DM / Channels)
 */

'use client';

import { memo, useCallback } from 'react';
import { User2, Hash } from 'lucide-react';
import type { ChatKind } from '@/features/chat/types';

type ChatTabsProps = {
  tab: ChatKind;
  setTab: (t: ChatKind) => void;
};

export const ChatTabs = memo(function ChatTabs({ tab, setTab }: ChatTabsProps) {
  const handleDmClick = useCallback(() => setTab('dm'), [setTab]);
  const handleChannelClick = useCallback(() => setTab('channel'), [setTab]);

  return (
    <div className="mb-2 grid grid-cols-2 gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-1 text-sm dark:border-zinc-700 dark:bg-zinc-900">
      <button
        className={[
          'inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 transition-colors',
          tab === 'dm'
            ? 'bg-white shadow-sm ring-1 ring-black/5 dark:bg-zinc-800'
            : 'text-zinc-600 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60',
        ].join(' ')}
        onClick={handleDmClick}
      >
        <User2 className="w-4 h-4" />
        DM
      </button>
      <button
        className={[
          'inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 transition-colors',
          tab === 'channel'
            ? 'bg-white shadow-sm ring-1 ring-black/5 dark:bg-zinc-800'
            : 'text-zinc-600 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60',
        ].join(' ')}
        onClick={handleChannelClick}
      >
        <Hash className="w-4 h-4" />
        Channels
      </button>
    </div>
  );
});
