/**
 * Chat Thread Component - Main message view with virtualized list
 */

// TODO i18n: All strings need translation keys
// - "X members", "Direct message", "Pinned", "Start your conversation with...", "Odpowiadasz na", "Anuluj odpowiedź"

'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  Send,
  Pin,
  MoreHorizontal,
  ChevronDown,
  User2,
  Loader2,
} from 'lucide-react';
import type { ChatKind, Message } from '@/features/chat/types';

// Import sub-components
import { Avatar } from './chat-avatar';
import { TypingIndicator } from './typing-indicator';
import { ChatDetails } from './chat-details';
import { MsgIn, MsgOut } from './message-bubble';

type ChatThreadProps = {
  kind: ChatKind;
  title: string;
  members: number;
  avatar?: string;
  messages: Message[];
  loading?: boolean;
  typingUserNames?: string[] | null;
  onBackMobile: () => void;
  onSend: (text: string, replyToId?: string) => void;
  onLoadMore?: () => void;
  onTyping?: (isTyping: boolean) => void;
  onAddReaction?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string, emoji: string) => void;
  onEditMessage?: (
    messageId: string,
    content: string,
    threadId?: string,
    eventId?: string
  ) => void;
  onDeleteMessage?: (messageId: string) => void;
  isDraft?: boolean;
  /** Event ID for mute functionality (channel type) */
  eventId?: string;
  /** Thread ID for mute functionality (dm type) */
  threadId?: string;
};

function fmtTime(epoch: number) {
  const d = new Date(epoch);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function ChatThread({
  kind,
  title,
  members,
  avatar,
  messages,
  loading,
  typingUserNames,
  onBackMobile,
  onSend,
  onLoadMore,
  onTyping,
  onAddReaction = () => {},
  onRemoveReaction = () => {},
  onEditMessage,
  onDeleteMessage,
  isDraft = false,
  eventId,
  threadId,
}: ChatThreadProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Reply state
  const [replyToMessage, setReplyToMessage] = useState<{
    id: string;
    text: string;
    author: string;
  } | null>(null);

  // Track the last message ID to detect new messages
  const lastMessageIdRef = useRef<string | null>(
    messages.length > 0 ? (messages[messages.length - 1]?.id ?? null) : null
  );

  // Track if we're loading more to prevent scroll jumping
  const isLoadingMoreRef = useRef(false);

  // Throttled typing handler - max 1 request per 2s
  const lastTypingSent = useRef<number>(0);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const throttledTyping = useMemo(
    () => (text: string) => {
      const now = Date.now();
      const isTyping = text.length > 0;

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      // If stopped typing, send immediately
      if (!isTyping) {
        onTyping?.(false);
        lastTypingSent.current = 0;
        return;
      }

      // Throttle: only send if 2s passed since last send
      const timeSinceLastSend = now - lastTypingSent.current;
      if (timeSinceLastSend >= 2000) {
        onTyping?.(true);
        lastTypingSent.current = now;
      } else {
        // Schedule send after remaining time
        const remainingTime = 2000 - timeSinceLastSend;
        typingTimeoutRef.current = setTimeout(() => {
          onTyping?.(true);
          lastTypingSent.current = Date.now();
        }, remainingTime);
      }
    },
    [onTyping]
  );

  // Check if user is at bottom
  const checkIfAtBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return false;

    const threshold = 100;
    const isAtBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <=
      threshold;
    setIsAtBottom(isAtBottom);
    return isAtBottom;
  }, []);

  // Auto-scroll to bottom on new messages if already at bottom
  useEffect(() => {
    if (messages.length === 0) return;

    const currentLastMessage = messages[messages.length - 1];
    if (!currentLastMessage) return;

    const lastMessageId = lastMessageIdRef.current;

    // Check if the last message changed (new message appended)
    if (lastMessageId && currentLastMessage.id !== lastMessageId) {
      // New message was added at the end
      if (isAtBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setNewMessagesCount(0);
      } else {
        // User scrolled up, increment counter
        setNewMessagesCount((prev) => prev + 1);
      }
    }

    // Update the last message ID
    lastMessageIdRef.current = currentLastMessage.id;
  }, [messages, isAtBottom]);

  // Initial scroll to bottom
  useEffect(() => {
    if (messages.length > 0 && !isLoadingMoreRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages.length]);

  // Scroll listener
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      checkIfAtBottom();
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [checkIfAtBottom]);

  // IntersectionObserver for loading older messages
  useEffect(() => {
    if (!loadMoreSentinelRef.current || !onLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (
          first &&
          first.isIntersecting &&
          !loading &&
          !isLoadingMoreRef.current
        ) {
          console.log('[Chat] Load more triggered');
          isLoadingMoreRef.current = true;
          onLoadMore();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(loadMoreSentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [onLoadMore, loading]);

  // Reset loading flag when messages change
  useEffect(() => {
    if (isLoadingMoreRef.current) {
      isLoadingMoreRef.current = false;
    }
  }, [messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setNewMessagesCount(0);
  };

  function submit() {
    const text = input.trim();
    if (!text) return;
    onSend(text, replyToMessage?.id);
    setInput('');
    setReplyToMessage(null);
    onTyping?.(false);
  }

  return (
    <div className="grid h-full max-h-screen min-h-[540px] min-w-0 grid-rows-[auto_1fr_auto]">
      {/* Header */}
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

      {/* Content: Details or Messages */}
      {showDetails ? (
        <ChatDetails
          onClose={() => setShowDetails(false)}
          kind={kind}
          eventId={eventId}
          threadId={threadId}
          chatName={title}
        />
      ) : (
        <>
          {/* Messages Area */}
          <div
            ref={messagesContainerRef}
            className="min-h-0 max-h-[calc(100vh-200px)] relative overflow-y-auto overflow-x-hidden"
          >
            {/* Draft empty state */}
            {isDraft && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <div className="p-4 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                  <User2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-semibold">
                    Start your conversation with {title}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Send your first message to begin chatting
                  </p>
                </div>
              </div>
            )}

            {/* Messages List */}
            {messages.length > 0 && (
              <>
                {/* Load more sentinel (at top) */}
                {loading && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                  </div>
                )}
                <div ref={loadMoreSentinelRef} className="h-px" />

                {/* Messages */}
                {messages.map((m, index) =>
                  m.side === 'right' ? (
                    <MsgOut
                      key={m.id}
                      className="pr-2"
                      message={m}
                      time={fmtTime(m.at)}
                      isLast={index === messages.length - 1}
                      onAddReaction={(emoji) => onAddReaction?.(m.id, emoji)}
                      onRemoveReaction={(emoji) =>
                        onRemoveReaction?.(m.id, emoji)
                      }
                      onReply={() => {
                        setReplyToMessage({
                          id: m.id,
                          text: m.text,
                          author: title || 'User',
                        });
                      }}
                      onReport={() => {
                        console.log('Report message:', m.id);
                      }}
                      onEdit={() => {
                        onEditMessage?.(m.id, m.text);
                      }}
                      onDelete={() => {
                        onDeleteMessage?.(m.id);
                      }}
                    >
                      {m.text}
                    </MsgOut>
                  ) : (
                    <MsgIn
                      key={m.id}
                      className="pl-2"
                      message={m}
                      time={fmtTime(m.at)}
                      block={m.block}
                      onAddReaction={(emoji) => onAddReaction?.(m.id, emoji)}
                      onRemoveReaction={(emoji) =>
                        onRemoveReaction?.(m.id, emoji)
                      }
                      onReply={() => {
                        setReplyToMessage({
                          id: m.id,
                          text: m.text,
                          author: title || 'User',
                        });
                      }}
                      onReport={() => {
                        console.log('Report message:', m.id);
                      }}
                    >
                      {m.text}
                    </MsgIn>
                  )
                )}

                {/* Typing indicator */}
                <div className="px-4 md:px-5 min-h-[28px]">
                  {typingUserNames && typingUserNames.length > 0 ? (
                    <TypingIndicator names={typingUserNames} />
                  ) : null}
                </div>

                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
              </>
            )}

            {/* Scroll to bottom button */}
            {!isAtBottom && (
              <div className="absolute bottom-20 right-6 z-10">
                <button
                  onClick={scrollToBottom}
                  className="flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:bg-indigo-500"
                  aria-label="Scroll to bottom"
                >
                  {newMessagesCount > 0 && (
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-indigo-600">
                      {newMessagesCount}
                    </span>
                  )}
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
            {/* Reply Preview */}
            {replyToMessage && (
              <div className="mx-auto max-w-3xl mb-3 flex items-start gap-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 px-4 py-3 border-l-4 border-indigo-500 shadow-sm">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      Odpowiadasz na
                    </span>
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {replyToMessage.author}
                    </span>
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 italic">
                    "{replyToMessage.text}"
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyToMessage(null)}
                  className="flex-shrink-0 p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-white/50 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50 transition-colors"
                  aria-label="Anuluj odpowiedź"
                  title="Anuluj odpowiedź"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
              className="mx-auto grid max-w-3xl grid-cols-[1fr_auto] items-center gap-2 rounded-2xl border border-zinc-200 bg-white/90 px-3 py-2 shadow-sm ring-1 ring-black/5 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <textarea
                value={input}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setInput(newValue);
                  throttledTyping(newValue);
                }}
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
