'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Send,
  Search,
  MoreHorizontal,
  Bell,
  Pin,
  ChevronDown,
  Image as ImageIcon,
  Palette,
  ThumbsUp,
  Users,
  Shield,
  Link as LinkIcon,
  Pencil,
} from 'lucide-react';

export type Conversation = {
  id: string;
  title: string;
  membersCount: number;
  preview: string;
  lastMessageAt: string;
  unread: number;
  avatar?: string;
};

export type Message = {
  id: string;
  text: string;
  at: string;
  side: 'left' | 'right';
  author: { id: string; name: string; avatar?: string };
  block?: boolean;
};

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
      at: '09:12',
      side: 'left',
      author: { id: 'u2', name: 'Louise' },
    },
    {
      id: 'm2',
      text: 'Hi Louise',
      at: '09:13',
      side: 'right',
      author: { id: 'me', name: 'You' },
    },
    {
      id: 'm3',
      text: 'How are you?',
      at: '09:13',
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
      at: '10:26',
      side: 'left',
      author: { id: 'u4', name: 'Sam' },
    },
    {
      id: 'm6',
      text: 'Great! 👍',
      at: '10:27',
      side: 'right',
      author: { id: 'me', name: 'You' },
    },
    {
      id: 'm7',
      text: 'We also need to add pagination to messages API.',
      at: '13:01',
      side: 'left',
      author: { id: 'u3', name: 'Alex' },
    },
    {
      id: 'm8',
      text: 'Yep, cursor-based please (createdAt, id).',
      at: '13:05',
      side: 'right',
      author: { id: 'me', name: 'You' },
    },
    {
      id: 'm9',
      text: 'And unread separator based on lastReadAt.',
      at: '13:06',
      side: 'right',
      author: { id: 'me', name: 'You' },
    },
    {
      id: 'm10',
      text: 'Roger. I’ll wire React Query + websocket live updates.',
      at: '13:08',
      side: 'left',
      author: { id: 'u2', name: 'Louise' },
    },
    {
      id: 'm11',
      text: 'Don’t forget optimistic UI + retry queue.',
      at: '13:09',
      side: 'right',
      author: { id: 'me', name: 'You' },
    },
    {
      id: 'm12',
      text: 'Copy that. Also draft typing indicators.',
      at: '13:11',
      side: 'left',
      author: { id: 'u4', name: 'Sam' },
    },
    {
      id: 'm13',
      text: 'We can fake them with timers for now.',
      at: '13:12',
      side: 'right',
      author: { id: 'me', name: 'You' },
    },
    {
      id: 'm14',
      text: 'Ok. I’ll add skeleton loader when fetching older items.',
      at: '13:13',
      side: 'left',
      author: { id: 'u2', name: 'Louise' },
    },
    {
      id: 'm15',
      text: 'Nice. Let’s ship MVP today.',
      at: '13:15',
      side: 'right',
      author: { id: 'me', name: 'You' },
    },
  ],
  t2: [
    {
      id: 'c1',
      text: 'Hey Costa, did you check the docs?',
      at: '08:01',
      side: 'right',
      author: { id: 'me', name: 'You' },
    },
    {
      id: 'c2',
      text: 'Yes, you can!',
      at: '08:02',
      side: 'left',
      author: { id: 'u5', name: 'Costa' },
    },
  ],
  t3: [
    {
      id: 'r1',
      text: 'Using the static method might be fine, but prefer DI.',
      at: '11:44',
      side: 'left',
      author: { id: 'u6', name: 'Rachel' },
    },
    {
      id: 'r2',
      text: 'Agree, let’s keep it pure.',
      at: '11:45',
      side: 'right',
      author: { id: 'me', name: 'You' },
    },
  ],
  t4: [
    {
      id: 'b1',
      text: 'I found a bug…',
      at: '16:20',
      side: 'left',
      author: { id: 'u7', name: 'QA' },
    },
    {
      id: 'b2',
      text: 'Steps?',
      at: '16:21',
      side: 'right',
      author: { id: 'me', name: 'You' },
    },
    {
      id: 'b3',
      text: 'Open profile, click edit, save → 500.',
      at: '16:22',
      side: 'left',
      author: { id: 'u7', name: 'QA' },
    },
  ],
};

export default function ChatsPage() {
  const [activeId, setActiveId] = useState<string | undefined>(undefined);
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list');

  const conversations = DEMO_CONVERSATIONS;
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

export function ChatShell({
  children,
  listVisible,
}: {
  children: React.ReactNode;
  listVisible: boolean;
}) {
  const [list, thread] = React.Children.toArray(children);
  return (
    <div className="w-full h-full">
      <div className="hidden md:grid md:h-full md:grid-cols-[clamp(280px,22vw,360px)_minmax(0,1fr)] md:gap-6">
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
    <PaneBase as="aside" className="h-full p-2 bg-white/90 dark:bg-zinc-900/70">
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
    <PaneBase as="section" className="bg-white/95 dark:bg-[#141518]/80 h-full">
      {children}
    </PaneBase>
  );
};

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
    <div className="grid h-full grid-rows-[auto_1fr_auto] gap-3">
      <div className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-900/10 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-900">
        <div className="font-semibold">Inbox</div>
        <div className="flex items-center gap-2 text-zinc-400">
          <span>Newest</span>
          <Search className="w-4 h-4" />
        </div>
      </div>

      <div className="min-h-0 space-y-2 overflow-auto">
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
                    <span className="inline-flex h-5 min-w-[1.25rem] shrink-0 justify-center rounded-full bg-indigo-600 px-2 text-[11px] font-semibold leading-none text-white">
                      {c.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
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
  const [showDetails, setShowDetails] = useState(false);

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
        <button
          className="inline-flex items-center justify-center h-9 w-9 rounded-xl text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          title="More options"
          aria-label="More options"
          onClick={() => setShowDetails(true)}
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {showDetails ? (
        <ChatDetails onClose={() => setShowDetails(false)} />
      ) : (
        <>
          <div
            ref={listRef}
            className="min-h-0 p-4 overflow-auto md:p-5"
            aria-live="polite"
          >
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
        </>
      )}
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

// Chat details panel (replaces thread content when "..." is clicked)
function ChatDetails({ onClose }: { onClose: () => void }) {
  const [openCustomize, setOpenCustomize] = useState(true);
  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      {/* Details header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center h-9 w-9 rounded-xl text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            aria-label="Back to chat"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-sm font-semibold">Chat info</div>
        </div>
      </div>

      {/* Body */}
      <div className="min-h-0 p-4 overflow-auto md:p-5">
        {/* Quick actions */}
        <div className="flex gap-3 mb-4">
          <button className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-xl border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
            <Bell className="w-4 h-4" /> Mute
          </button>
          <button className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-xl border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
            <Search className="w-4 h-4" /> Search
          </button>
        </div>

        {/* Section: Customize chat */}
        <div className="mb-6 overflow-hidden border rounded-2xl border-zinc-200 dark:border-zinc-700">
          <button
            className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
            onClick={() => setOpenCustomize((v) => !v)}
            aria-expanded={openCustomize}
            aria-controls="customize-panel"
          >
            <span>Customize chat</span>
            <ChevronDown
              className={[
                'h-4 w-4 transition-transform',
                openCustomize ? 'rotate-180' : 'rotate-0',
              ].join(' ')}
            />
          </button>
          {openCustomize && (
            <div
              id="customize-panel"
              className="divide-y divide-zinc-200 dark:divide-zinc-800"
            >
              <Row
                icon={<Pencil className="w-4 h-4" />}
                label="Change chat name"
              />
              <Row
                icon={<ImageIcon className="w-4 h-4" />}
                label="Change photo"
              />
              <Row
                icon={<Palette className="w-4 h-4" />}
                label="Change theme"
              />
              <Row
                icon={<ThumbsUp className="w-4 h-4" />}
                label="Change emoji"
              />
            </div>
          )}
        </div>

        {/* Section: Members */}
        <Section title="Chat members">
          <Row icon={<Users className="w-4 h-4" />} label="Manage members" />
        </Section>

        {/* Section: Media, files and links */}
        <Section title="Media, files and links">
          <Row icon={<ImageIcon className="w-4 h-4" />} label="Media" />
          <Row icon={<LinkIcon className="w-4 h-4" />} label="Links" />
        </Section>

        {/* Section: Privacy & support */}
        <Section title="Privacy & support">
          <Row icon={<Shield className="w-4 h-4" />} label="Privacy settings" />
          <Row
            icon={<Pin className="w-4 h-4" />}
            label="View pinned messages"
          />
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="px-1 pb-2 text-xs font-semibold tracking-wide uppercase text-zinc-500">
        {title}
      </div>
      <div className="overflow-hidden border rounded-2xl border-zinc-200 dark:border-zinc-700">
        {children}
      </div>
    </div>
  );
}

function Row({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex items-center w-full gap-3 px-4 py-3 text-sm text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/60">
      <span className="grid w-8 h-8 border place-items-center rounded-xl border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
        {icon}
      </span>
      <span className="flex-1">{label}</span>
    </button>
  );
}
