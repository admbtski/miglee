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
  Hash,
  User2,
  Check,
  Loader2,
} from 'lucide-react';

// API Hooks
import { useMeQuery } from '@/lib/api/auth';
import {
  useGetDmThreads,
  useGetDmMessages,
  useSendDmMessage,
  useMarkDmThreadRead,
} from '@/lib/api/dm';
import {
  useGetIntentMessages,
  useSendIntentMessage,
  useMarkIntentChatRead,
  useGetIntentUnreadCount,
} from '@/lib/api/event-chat';
import { useDmMessageAdded, useDmTyping } from '@/lib/api/dm-subscriptions';
import {
  useIntentMessageAdded,
  useIntentTyping,
} from '@/lib/api/event-chat-subscriptions';
import { useMyMembershipsQuery } from '@/lib/api/intent-members';

/* ───────────────────────────── Types ───────────────────────────── */

type ChatKind = 'dm' | 'channel';

export type Conversation = {
  id: string;
  kind: ChatKind;
  title: string;
  membersCount: number;
  preview: string;
  lastMessageAt: string; // e.g. "1m", "14m"
  unread: number;
  avatar?: string;
  lastReadAt?: number; // epoch ms
};

export type Message = {
  id: string;
  text: string;
  at: number; // epoch ms
  side: 'left' | 'right';
  author: { id: string; name: string; avatar?: string };
  block?: boolean;
};

/* ───────────────────────────── Page ───────────────────────────── */

export default function ChatsPageIntegrated() {
  const { data: meData } = useMeQuery();
  const currentUserId = meData?.me?.id;

  const [tab, setTab] = useState<ChatKind>('dm');

  // Independent active selections per tab
  const [activeDmId, setActiveDmId] = useState<string | undefined>();
  const [activeChId, setActiveChId] = useState<string | undefined>();

  // Typing indicators state
  const [dmTypingUsers, setDmTypingUsers] = useState<Set<string>>(new Set());
  const [channelTypingUsers, setChannelTypingUsers] = useState<Set<string>>(
    new Set()
  );

  // Fetch DM threads
  const { data: dmThreadsData, isLoading: dmThreadsLoading } = useGetDmThreads(
    { limit: 50, offset: 0 },
    { enabled: !!currentUserId }
  );

  // Fetch user's intent memberships (for channels)
  const { data: membershipsData, isLoading: membershipsLoading } =
    useMyMembershipsQuery(
      { limit: 100, offset: 0 },
      { enabled: !!currentUserId }
    );

  // Fetch DM messages for active thread
  const { data: dmMessagesData, isLoading: dmMessagesLoading } =
    useGetDmMessages(
      { threadId: activeDmId!, limit: 100, offset: 0 },
      { enabled: !!activeDmId }
    );

  // Fetch intent messages for active channel
  const {
    data: intentMessagesData,
    isLoading: intentMessagesLoading,
    fetchNextPage: fetchNextIntentPage,
    hasNextPage: hasNextIntentPage,
  } = useGetIntentMessages({ intentId: activeChId!, limit: 50 }, {
    enabled: !!activeChId,
  } as any);

  // Fetch unread count for active channel
  const { data: intentUnreadData } = useGetIntentUnreadCount(
    { intentId: activeChId! },
    { enabled: !!activeChId, refetchInterval: 10000 } // Refetch every 10s
  );

  // Mutations
  const sendDmMessage = useSendDmMessage();
  const sendIntentMessage = useSendIntentMessage();
  const markDmRead = useMarkDmThreadRead();
  const markIntentRead = useMarkIntentChatRead();

  // Subscriptions
  useDmMessageAdded({
    threadId: activeDmId!,
    enabled: !!activeDmId && tab === 'dm',
  });

  useIntentMessageAdded({
    intentId: activeChId!,
    enabled: !!activeChId && tab === 'channel',
  });

  // Typing indicators subscriptions
  useDmTyping({
    threadId: activeDmId!,
    enabled: !!activeDmId && tab === 'dm',
    onTyping: ({ userId, isTyping }) => {
      // Don't show typing for current user
      if (userId === currentUserId) return;

      setDmTypingUsers((prev) => {
        const next = new Set(prev);
        if (isTyping) {
          next.add(userId);
        } else {
          next.delete(userId);
        }
        return next;
      });
    },
  });

  useIntentTyping({
    intentId: activeChId!,
    enabled: !!activeChId && tab === 'channel',
    onTyping: ({ userId, isTyping }) => {
      // Don't show typing for current user
      if (userId === currentUserId) return;

      setChannelTypingUsers((prev) => {
        const next = new Set(prev);
        if (isTyping) {
          next.add(userId);
        } else {
          next.delete(userId);
        }
        return next;
      });
    },
  });

  // Map DM threads to conversations
  const dmConversations: Conversation[] = useMemo(() => {
    if (!dmThreadsData?.dmThreads?.items || !currentUserId) return [];

    return dmThreadsData.dmThreads.items.map((thread) => {
      const otherUser =
        thread.aUserId === currentUserId ? thread.bUser : thread.aUser;
      const lastMsg = thread.lastMessage;

      return {
        id: thread.id,
        kind: 'dm' as const,
        title: otherUser.name || 'Unknown',
        membersCount: 2,
        preview: lastMsg?.content || 'No messages yet',
        lastMessageAt: formatRelativeTime(
          thread.lastMessageAt || thread.createdAt
        ),
        unread: thread.unreadCount || 0,
        avatar: otherUser.imageUrl || undefined,
      };
    });
  }, [dmThreadsData, currentUserId]);

  // Map user's intent memberships to channel conversations
  const channelConversations: Conversation[] = useMemo(() => {
    const items = (membershipsData?.myMemberships as any)?.items;
    if (!items || !currentUserId) return [];

    return items
      .filter((membership: any) => {
        // Only show JOINED members
        return membership.status === 'JOINED';
      })
      .map((membership: any) => {
        const intent = membership.intent;
        if (!intent) return null;

        // Get last message from intent (if available)
        const lastMessage =
          intent.messagesCount > 0 ? 'Recent activity' : 'No messages yet';

        // Use unread count from query if this is the active channel
        const unreadCount =
          intent.id === activeChId
            ? (intentUnreadData?.intentUnreadCount ?? 0)
            : 0;

        return {
          id: intent.id,
          kind: 'channel' as const,
          title: intent.title || 'Untitled Event',
          membersCount: intent.joinedCount || 0,
          preview: lastMessage,
          lastMessageAt: formatRelativeTime(intent.updatedAt),
          unread: unreadCount,
          avatar: intent.owner?.imageUrl || undefined,
        };
      })
      .filter((c: Conversation | null): c is Conversation => c !== null);
  }, [membershipsData, currentUserId, activeChId, intentUnreadData]);

  const conversations: Conversation[] =
    tab === 'dm' ? dmConversations : channelConversations;
  const activeId = tab === 'dm' ? activeDmId : activeChId;

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId),
    [conversations, activeId]
  );

  // Set first conversation as active on load
  useEffect(() => {
    if (tab === 'dm' && !activeDmId && dmConversations.length > 0) {
      setActiveDmId(dmConversations[0]?.id);
    }
  }, [tab, activeDmId, dmConversations]);

  useEffect(() => {
    if (tab === 'channel' && !activeChId && channelConversations.length > 0) {
      setActiveChId(channelConversations[0]?.id);
    }
  }, [tab, activeChId, channelConversations]);

  function handlePick(id: string) {
    if (tab === 'dm') setActiveDmId(id);
    else setActiveChId(id);
  }

  function handleSend(text: string) {
    if (!active || !currentUserId) return;

    if (active.kind === 'dm') {
      // Get the other user ID from the thread
      const thread = dmThreadsData?.dmThreads?.items?.find(
        (t) => t.id === activeDmId
      );
      if (!thread) return;

      const recipientId =
        thread.aUserId === currentUserId ? thread.bUserId : thread.aUserId;

      sendDmMessage.mutate({
        input: {
          recipientId,
          content: text,
        },
      });
    } else {
      sendIntentMessage.mutate({
        input: {
          intentId: active.id,
          content: text,
        },
      });
    }
  }

  // Map messages
  const messages = useMemo(() => {
    if (!active || !currentUserId) return [];

    if (active.kind === 'dm') {
      // dmMessages returns array directly, not { items: [] }
      const items = dmMessagesData?.dmMessages;

      if (!items || items.length === 0) {
        return [];
      }

      return items.map((msg: any) => ({
        id: msg.id,
        text: msg.content,
        at: new Date(msg.createdAt).getTime(),
        side: (msg.senderId === currentUserId ? 'right' : 'left') as
          | 'left'
          | 'right',
        author: {
          id: msg.sender.id,
          name: msg.sender.name || 'Unknown',
          avatar: msg.sender.imageUrl || undefined,
        },
        block: !!msg.deletedAt,
      }));
    } else {
      const pages = intentMessagesData?.pages;
      if (!pages) return [];

      const allMessages = pages.flatMap(
        (page: any) => page.intentMessages?.items || []
      );

      return allMessages.map((msg: any) => ({
        id: msg.id,
        text: msg.content,
        at: new Date(msg.createdAt).getTime(),
        side: (msg.authorId === currentUserId ? 'right' : 'left') as
          | 'left'
          | 'right',
        author: {
          id: msg.author.id,
          name: msg.author.name || 'Unknown',
          avatar: msg.author.imageUrl || undefined,
        },
        block: !!msg.deletedAt,
      }));
    }
  }, [active, currentUserId, dmMessagesData, intentMessagesData]);

  // Mark as read when opening a conversation
  useEffect(() => {
    if (!active) return;

    if (active.kind === 'dm' && activeDmId) {
      markDmRead.mutate({ threadId: activeDmId });
    } else if (active.kind === 'channel' && activeChId) {
      markIntentRead.mutate({ intentId: activeChId });
    }
  }, [activeDmId, activeChId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Get typing user names for display
  const typingUserNames = useMemo(() => {
    const typingUsers = tab === 'dm' ? dmTypingUsers : channelTypingUsers;
    if (typingUsers.size === 0) return null;

    // For DM, get the other user's name
    if (tab === 'dm' && active) {
      const thread = dmThreadsData?.dmThreads?.items?.find(
        (t) => t.id === activeDmId
      );
      if (!thread) return null;

      const otherUser =
        thread.aUserId === currentUserId ? thread.bUser : thread.aUser;
      return [otherUser.name || 'Someone'];
    }

    // For channels, we'd need to fetch user names (simplified for now)
    return [
      `${typingUsers.size} ${typingUsers.size === 1 ? 'person' : 'people'}`,
    ];
  }, [
    tab,
    dmTypingUsers,
    channelTypingUsers,
    active,
    dmThreadsData,
    activeDmId,
    currentUserId,
  ]);

  if (!currentUserId) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <ChatShell listVisible>
      <ChatShell.ListPane>
        <ChatTabs tab={tab} setTab={setTab} />
        {(dmThreadsLoading && tab === 'dm') ||
        (membershipsLoading && tab === 'channel') ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        ) : (
          <ChatList
            items={conversations}
            activeId={activeId}
            onPick={(id) => handlePick(id)}
          />
        )}
      </ChatShell.ListPane>

      <ChatShell.ThreadPane>
        {active ? (
          <ChatThread
            kind={active.kind}
            title={active.title}
            members={active.membersCount}
            avatar={active.avatar}
            lastReadAt={active.lastReadAt}
            messages={messages}
            loading={tab === 'dm' ? dmMessagesLoading : intentMessagesLoading}
            typingUserNames={typingUserNames}
            onBackMobile={() => {}}
            onSend={handleSend}
            onLoadMore={
              tab === 'channel' && hasNextIntentPage
                ? () => fetchNextIntentPage()
                : undefined
            }
          />
        ) : (
          <EmptyThread onBackMobile={() => {}} />
        )}
      </ChatShell.ThreadPane>
    </ChatShell>
  );
}

/* ───────────────────────────── Shell & panes ───────────────────────────── */

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

/* ───────────────────────────── Tabs ───────────────────────────── */

function ChatTabs({
  tab,
  setTab,
}: {
  tab: ChatKind;
  setTab: (t: ChatKind) => void;
}) {
  return (
    <div className="mb-2 grid grid-cols-2 gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-1 text-sm dark:border-zinc-700 dark:bg-zinc-900">
      <button
        className={[
          'inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 transition-colors',
          tab === 'dm'
            ? 'bg-white shadow-sm ring-1 ring-black/5 dark:bg-zinc-800'
            : 'text-zinc-600 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60',
        ].join(' ')}
        onClick={() => setTab('dm')}
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
        onClick={() => setTab('channel')}
      >
        <Hash className="w-4 h-4" />
        Channels
      </button>
    </div>
  );
}

/* ───────────────────────────── List ───────────────────────────── */

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
    <div className="grid h-[calc(100%-2.5rem)] grid-rows-[auto_1fr_auto] gap-3">
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
                  <div className="flex items-center gap-2">
                    {c.kind === 'channel' ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600 ring-1 ring-black/5 dark:bg-zinc-800 dark:text-zinc-300">
                        <Hash className="w-3 h-3" /> Channel
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600 ring-1 ring-black/5 dark:bg-zinc-800 dark:text-zinc-300">
                        <User2 className="w-3 h-3" /> DM
                      </span>
                    )}
                    <div className="font-medium truncate">{c.title}</div>
                  </div>
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

/* ───────────────────────────── Thread ───────────────────────────── */

export function ChatThread({
  kind,
  title,
  members,
  avatar,
  messages,
  lastReadAt,
  loading,
  typingUserNames,
  onBackMobile,
  onSend,
  onLoadMore,
}: {
  kind: ChatKind;
  title: string;
  members: number;
  avatar?: string;
  messages: Message[];
  lastReadAt?: number;
  loading?: boolean;
  typingUserNames?: string[] | null;
  onBackMobile: () => void;
  onSend: (text: string) => void;
  onLoadMore?: () => void;
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

  const [older, newer] = useMemo(() => {
    if (!lastReadAt) return [messages, []] as const;
    const older = messages.filter((m) => m.at <= lastReadAt);
    const newer = messages.filter((m) => m.at > lastReadAt);
    return [older, newer] as const;
  }, [messages, lastReadAt]);

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
            <div className="text-sm font-semibold truncate">
              {kind === 'channel' ? `#${title}` : title}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {kind === 'channel' ? `${members} members` : 'Direct message'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {kind === 'channel' && (
            <button
              className="inline-flex items-center justify-center h-9 w-9 rounded-xl text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              aria-label="Pinned"
              title="Pinned"
            >
              <Pin className="w-5 h-5" />
            </button>
          )}
          <button
            className="inline-flex items-center justify-center h-9 w-9 rounded-xl text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            title="More options"
            aria-label="More options"
            onClick={() => setShowDetails(true)}
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showDetails ? (
        <ChatDetails onClose={() => setShowDetails(false)} kind={kind} />
      ) : (
        <>
          <div
            ref={listRef}
            className="min-h-0 p-4 overflow-auto md:p-5"
            aria-live="polite"
          >
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
              </div>
            )}

            {!loading && onLoadMore && (
              <div className="flex justify-center mb-4">
                <button
                  onClick={onLoadMore}
                  className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Load more
                </button>
              </div>
            )}

            {!loading &&
              older.map((m) =>
                m.side === 'right' ? (
                  <MsgOut key={m.id} time={fmtTime(m.at)}>
                    {m.text}
                  </MsgOut>
                ) : (
                  <MsgIn key={m.id} time={fmtTime(m.at)} block={m.block}>
                    {m.text}
                  </MsgIn>
                )
              )}

            {newer.length > 0 && <UnreadSeparator />}

            {!loading &&
              newer.map((m) =>
                m.side === 'right' ? (
                  <MsgOut key={m.id} time={fmtTime(m.at)}>
                    {m.text}
                  </MsgOut>
                ) : (
                  <MsgIn key={m.id} time={fmtTime(m.at)} block={m.block}>
                    {m.text}
                  </MsgIn>
                )
              )}

            {/* Typing indicator */}
            {typingUserNames && typingUserNames.length > 0 && (
              <TypingIndicator names={typingUserNames} />
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
                placeholder={
                  kind === 'channel' ? `Message #${title}` : `Message ${title}`
                }
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

function fmtTime(epoch: number) {
  const d = new Date(epoch);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

function UnreadSeparator() {
  return (
    <div className="relative my-4 flex items-center justify-center">
      <div className="absolute inset-x-0 h-px bg-zinc-200 dark:bg-zinc-800" />
      <span className="relative z-10 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-600 ring-1 ring-black/5 dark:bg-zinc-900 dark:text-zinc-300">
        <Check className="w-3 h-3" /> Unread
      </span>
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

function TypingIndicator({ names }: { names: string[] }) {
  const text =
    names.length === 1
      ? `${names[0]} is typing`
      : `${names.join(', ')} are typing`;

  return (
    <div className="flex w-full mb-2 animate-fade-in">
      <div className="max-w-[80%] rounded-2xl px-3 py-2 text-sm inline-flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800">
        <span className="text-xs text-zinc-600 dark:text-zinc-400">{text}</span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400 opacity-60" />
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400 opacity-60 [animation-delay:120ms]" />
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400 opacity-60 [animation-delay:240ms]" />
        </span>
      </div>
    </div>
  );
}

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

/* ───────────────────────────── Details (kind-aware) ───────────────────────────── */

function ChatDetails({
  onClose,
  kind,
}: {
  onClose: () => void;
  kind: ChatKind;
}) {
  const [openCustomize, setOpenCustomize] = useState(true);
  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
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

      <div className="min-h-0 p-4 overflow-auto md:p-5">
        <div className="flex gap-3 mb-4">
          <button className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-xl border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
            <Bell className="w-4 h-4" /> Mute
          </button>
          <button className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-xl border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
            <Search className="w-4 h-4" /> Search
          </button>
        </div>

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
                label={
                  kind === 'channel'
                    ? 'Change channel name'
                    : 'Change chat name'
                }
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

        <Section
          title={kind === 'channel' ? 'Channel members' : 'Participants'}
        >
          <Row
            icon={<Users className="w-4 h-4" />}
            label={kind === 'channel' ? 'Manage members' : 'View profile'}
          />
        </Section>

        <Section title="Media, files and links">
          <Row icon={<ImageIcon className="w-4 h-4" />} label="Media" />
          <Row icon={<LinkIcon className="w-4 h-4" />} label="Links" />
        </Section>

        <Section title="Privacy & support">
          <Row
            icon={<Shield className="w-4 h-4" />}
            label={
              kind === 'channel' ? 'Channel privacy' : 'Conversation privacy'
            }
          />
          {kind === 'channel' && (
            <Row
              icon={<Pin className="w-4 h-4" />}
              label="View pinned messages"
            />
          )}
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
