'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Send, Search } from 'lucide-react';

// ===============================
// Domain types
// ===============================
export type Conversation = {
  id: string;
  title: string;
  membersCount: number;
  preview: string;
  lastMessageAt: string; // e.g. "1m", "14m", "2h"
  unread: number;
  avatar?: string; // letter or url
};

export type Message = {
  id: string;
  text: string;
  at: string; // display time e.g. "18:39" (for demo)
  side: 'left' | 'right'; // from viewer perspective
  author: { id: string; name: string; avatar?: string };
  /** larger block message */
  block?: boolean;
};

// ========================================
// Mock data (replace with your data source)
// ========================================
const DEMO_CONVERSATIONS: Conversation[] = [
  {
    id: 't1',
    title: 'Technical issues',
    membersCount: 4,
    preview: 'Great! 👍',
    lastMessageAt: '1m',
    unread: 0,
    avatar: 'T',
  },
  {
    id: 't2',
    title: 'Costa Quinn',
    membersCount: 2,
    preview: 'Yes, you can!',
    lastMessageAt: '1m',
    unread: 0,
    avatar: 'https://i.pravatar.cc/40?img=12',
  },
  {
    id: 't3',
    title: 'Rachel Doe',
    membersCount: 2,
    preview: 'Using the static method…',
    lastMessageAt: '14m',
    unread: 3,
    avatar: 'R',
  },
  {
    id: 't4',
    title: 'Bugs/Improvements',
    membersCount: 18,
    preview: 'I found a bug…',
    lastMessageAt: '1h',
    unread: 0,
    avatar: '🐞',
  },
];

const DEMO_MESSAGES: Record<string, Message[]> = {
  t1: [
    {
      id: 'm1',
      text: 'Hello everyone',
      at: '10:49',
      side: 'left',
      author: { id: 'u2', name: 'Louise' },
    },
    {
      id: 'm2',
      text: 'Hi Louise',
      at: '18:39',
      side: 'right',
      author: { id: 'me', name: 'You' },
    },
    {
      id: 'm3',
      text: 'How are you?',
      at: '18:40',
      side: 'right',
      author: { id: 'me', name: 'You' },
    },
    {
      id: 'm4',
      text: 'After the purchase, user should receive two emails, one from us…',
      at: '10:25',
      side: 'left',
      author: { id: 'u3', name: 'Alex' },
      block: true,
    },
    {
      id: 'm5',
      text: 'ohh I didn’t notice that typo 😳',
      at: '09:30',
      side: 'left',
      author: { id: 'u4', name: 'Sam' },
    },
    {
      id: 'm6',
      text: 'Great! 👍',
      at: '18:39',
      side: 'right',
      author: { id: 'me', name: 'You' },
    },
  ],
  t2: [],
  t3: [],
  t4: [],
};

// ===============================
// Page (export default)
// ===============================
export default function ChatsPage() {
  // No selected conversation on start
  const [activeId, setActiveId] = useState<string | undefined>(undefined);
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list'); // < md

  const conversations = DEMO_CONVERSATIONS; // replace with your query
  const active = useMemo(
    () => conversations.find((c) => c.id === activeId),
    [conversations, activeId]
  );

  return (
    <ChatShell listVisible={mobileView === 'list'}>
      <ChatShell.ListPane>
        <ChatList
          items={conversations}
          activeId={activeId}
          onPick={(id) => {
            setActiveId(id);
            setMobileView('thread');
          }}
        />
      </ChatShell.ListPane>

      <ChatShell.ThreadPane>
        {active ? (
          <ChatThread
            title={active.title}
            members={active.membersCount}
            avatar={active.avatar}
            messages={DEMO_MESSAGES[active.id] ?? []}
            onBackMobile={() => setMobileView('list')}
            onSend={(text) => {
              DEMO_MESSAGES[active.id] = [
                ...(DEMO_MESSAGES[active.id] ?? []),
                {
                  id: 'm' + Math.random().toString(36).slice(2),
                  text,
                  at: new Date().toTimeString().slice(0, 5),
                  side: 'right',
                  author: { id: 'me', name: 'You' },
                },
              ];
            }}
          />
        ) : (
          <EmptyThread onBackMobile={() => setMobileView('list')} />
        )}
      </ChatShell.ThreadPane>
    </ChatShell>
  );
}

// ===============================
// Shell (responsive, a11y-conscious)
// ===============================
export function ChatShell({
  children,
  listVisible,
}: {
  children: React.ReactNode;
  listVisible: boolean;
}) {
  const [list, thread] = React.Children.toArray(children);
  return (
    <div className="min-h-[calc(100vh-64px)] w-full">
      {/* Desktop: list scales more */}
      <div className="hidden md:grid md:grid-cols-[clamp(280px,22vw,360px)_minmax(0,1fr)] md:gap-6">
        {list}
        {thread}
      </div>
      {/* Mobile */}
      <div className="md:hidden">{listVisible ? list : thread}</div>
    </div>
  );
}

function PaneBase({
  as: Tag = 'div',
  className = '',
  children,
}: {
  as?: any;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tag
      className={[
        'rounded-3xl border border-zinc-200 shadow-sm ring-1 ring-black/5 min-w-0 backdrop-blur-[2px]',
        'dark:border-zinc-700',
        className,
      ].join(' ')}
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
    <PaneBase as="aside" className="p-2 bg-white/90 dark:bg-zinc-900/70">
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
    <PaneBase as="section" className="bg-white/95 dark:bg-[#141518]/80">
      {children}
    </PaneBase>
  );
};

// ===============================
// ChatList – shows Conversation[]
// ===============================
export function ChatList({
  items,
  activeId,
  onPick,
}: {
  items: Conversation[];
  activeId?: string;
  onPick: (id: string) => void;
}) {
  return (
    <div className="grid gap-3">
      {/* header */}
      <div className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-900/10 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-900">
        <div className="font-semibold">Inbox</div>
        <div className="flex items-center gap-2 text-zinc-400">
          <span>Newest</span>
          <Search className="w-4 h-4" />
        </div>
      </div>

      {/* rows */}
      <div className="space-y-2">
        {items.map((c) => {
          const active = c.id === activeId;
          return (
            <button
              key={c.id}
              onClick={() => onPick(c.id)}
              className={[
                'w-full rounded-2xl border px-3 py-3 text-left transition-colors',
                active
                  ? 'border-indigo-500/40 bg-indigo-600/10 ring-1 ring-indigo-400/20'
                  : 'border-zinc-200 hover:bg-zinc-100/70 dark:border-zinc-700 dark:hover:bg-zinc-800/60',
              ].join(' ')}
              aria-current={active ? 'page' : undefined}
            >
              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                <Avatar token={c.avatar} />
                <div className="min-w-0">
                  <div className="font-medium truncate">{c.title}</div>
                  <div className="mt-0.5 text-sm truncate text-zinc-600 dark:text-zinc-400">
                    {c.preview}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 ml-2 shrink-0">
                  <div className="text-xs text-zinc-500">{c.lastMessageAt}</div>
                  {c.unread > 0 && (
                    <span className="inline-flex h-5 min-w-[1.25rem] shrink-0 justify-center items-center rounded-full bg-indigo-600 px-2 text-[11px] font-semibold leading-none text-white">
                      {c.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* promo */}
      <div className="p-3 text-xs border rounded-2xl border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
        Need more power?
        <br />
        Supercharge your workspace with Pro features.{' '}
        <a
          className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
          href="#"
        >
          Learn more
        </a>
      </div>
    </div>
  );
}

function Avatar({ token }: { token?: string }) {
  if (!token) {
    return (
      <div className="grid text-xs font-semibold bg-white border h-9 w-9 place-items-center rounded-xl border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800">
        ?
      </div>
    );
  }
  const isUrl = /^(https?:)?\/\//.test(token);
  return isUrl ? (
    <img alt="" src={token} className="object-cover h-9 w-9 rounded-xl" />
  ) : (
    <div className="grid text-xs font-semibold text-white bg-indigo-600 h-9 w-9 place-items-center rounded-xl">
      {token.slice(0, 2)}
    </div>
  );
}

// ===============================
// ChatThread – messages + composer
// ===============================
export function ChatThread({
  title,
  members,
  avatar,
  messages,
  onBackMobile,
  onSend,
}: {
  title: string;
  members: number;
  avatar?: string;
  messages: Message[];
  onBackMobile: () => void;
  onSend: (text: string) => void;
}) {
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  function submit() {
    const text = input.trim();
    if (!text) return;
    onSend(text);
    setInput('');
  }

  return (
    <div className="grid h-full min-h-[540px] min-w-0 grid-rows-[auto_1fr_auto]">
      {/* header */}
      <div className="flex items-center justify-between gap-3 p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center min-w-0 gap-2">
          <button
            className="inline-flex items-center justify-center mr-1 h-9 w-9 rounded-xl text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 md:hidden"
            onClick={onBackMobile}
            aria-label="Chat"
            title="Chat"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Avatar token={avatar} />
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{title}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {members} members
            </div>
          </div>
        </div>
        <div className="text-zinc-400" aria-hidden>
          …
        </div>
      </div>

      {/* messages */}
      <div
        ref={listRef}
        className="min-h-0 p-4 overflow-auto md:p-5"
        aria-live="polite"
      >
        {/* Optional: Day separators can be computed; here static examples */}
        <DateSeparator>01 May</DateSeparator>
        {messages.slice(0, 3).map((m) =>
          m.side === 'right' ? (
            <MsgOut key={m.id} time={m.at}>
              {m.text}
            </MsgOut>
          ) : (
            <MsgIn key={m.id} time={m.at} block={m.block}>
              {m.text}
            </MsgIn>
          )
        )}
        <DateSeparator>02 May</DateSeparator>
        {messages.slice(3).map((m) =>
          m.side === 'right' ? (
            <MsgOut key={m.id} time={m.at}>
              {m.text}
            </MsgOut>
          ) : (
            <MsgIn key={m.id} time={m.at} block={m.block}>
              {m.text}
            </MsgIn>
          )
        )}
      </div>

      {/* composer – no attach/link, icon-only send */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="mx-auto grid max-w-3xl grid-cols-[1fr_auto] items-center gap-2 rounded-2xl border border-zinc-200 bg-white/90 px-3 py-2 shadow-sm ring-1 ring-black/5 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message Group"
            className="min-w-0 py-2 text-sm bg-transparent outline-none resize-none max-h-40 placeholder:text-zinc-400"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center text-white bg-indigo-600 h-9 w-9 rounded-xl hover:bg-indigo-500"
            aria-label="Send"
            title="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

function DateSeparator({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-4 text-center text-[11px] uppercase tracking-wide text-zinc-500">
      {children}
    </div>
  );
}

function Bubble({
  align = 'left',
  children,
  time,
  block,
}: {
  align?: 'left' | 'right';
  children: React.ReactNode;
  time?: string;
  block?: boolean;
}) {
  const base =
    'max-w-[80%] rounded-2xl px-3 py-2 text-sm inline-flex items-end gap-2';
  const cls =
    align === 'right'
      ? 'ml-auto bg-indigo-600 text-white'
      : block
        ? 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800/70 dark:text-zinc-100'
        : 'bg-zinc-800/70 text-zinc-100 dark:bg-zinc-800';
  const timeCls =
    align === 'right' ? 'text-[10px] opacity-90' : 'text-[10px] text-zinc-400';
  return (
    <div className="flex w-full mb-2">
      <div className={[base, cls].join(' ')}>
        <span className="leading-5 whitespace-pre-wrap">{children}</span>
        {time && <span className={timeCls}>{time}</span>}
      </div>
    </div>
  );
}
const MsgIn = ({
  children,
  time,
  block,
}: {
  children: React.ReactNode;
  time?: string;
  block?: boolean;
}) => (
  <Bubble align="left" time={time} block={block}>
    {children}
  </Bubble>
);
const MsgOut = ({
  children,
  time,
}: {
  children: React.ReactNode;
  time?: string;
}) => (
  <Bubble align="right" time={time}>
    {children}
  </Bubble>
);

// ===============================
// Empty thread placeholder
// ===============================
function EmptyThread({ onBackMobile }: { onBackMobile: () => void }) {
  return (
    <div className="grid h-full min-h-[540px] grid-rows-[auto_1fr]">
      <div className="flex items-center gap-2 p-4 border-b border-zinc-200 dark:border-zinc-800">
        <button
          className="inline-flex items-center justify-center mr-1 h-9 w-9 rounded-xl text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 md:hidden"
          onClick={onBackMobile}
          aria-label="Chat"
          title="Chat"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-sm font-semibold">Wybierz chat</div>
      </div>
      <div className="grid p-8 text-center place-items-center text-zinc-500">
        <div className="max-w-sm text-sm">
          Wybierz chat z listy po lewej, aby zobaczyć wiadomości.
        </div>
      </div>
    </div>
  );
}

// ===============================
// Notes for production wiring
// ===============================
// 1) Replace DEMO_CONVERSATIONS/DEMO_MESSAGES with data from your API (React Query/GraphQL).
// 2) Consider message virtualization for long threads (react-virtuoso).
// 3) Use ISO timestamps in Message and derive human labels in a formatter util.
// 4) Apply optimistic UI for sends + retry queue; disable send while offline.
// 5) Add read markers/unread separator based on lastReadAt per conversation.
// 6) Security: sanitize message text if you allow rich content.
// 7) A11y: announce new messages via aria-live.
// 8) Tests: unit test Bubble variants; integration test sending flow; visual test for dark/light.
