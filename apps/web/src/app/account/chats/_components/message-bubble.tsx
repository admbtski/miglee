/**
 * Message Bubble Components - Bubble, MsgIn, MsgOut
 */

'use client';

import React, { useState, useRef } from 'react';
import type { Message } from '../_types';
import { MessageReactions } from '@/components/chat/MessageReactions';
import { ReadReceipt } from '@/components/chat/ReadReceipt';
import { MessageActions } from '@/components/chat/MessageActions';
import { ReactionsBar } from '@/components/chat/ReactionsBar';
import { MessageMenuPopover } from '@/components/chat/MessageMenuPopover';

type BubbleProps = {
  align?: 'left' | 'right';
  children: React.ReactNode;
  time?: string;
  block?: boolean;
  editedAt?: string | null;
  deletedAt?: string | null;
  replyTo?: {
    id: string;
    author: { id: string; name: string };
    content: string;
  } | null;
};

export function Bubble({
  align = 'left',
  children,
  time,
  block,
  editedAt,
  deletedAt,
  replyTo,
}: BubbleProps) {
  const base =
    'rounded-2xl px-4 py-2.5 text-sm inline-flex shadow-sm max-w-full break-words';
  const cls =
    align === 'right'
      ? 'bg-[#4A45FF] text-white rounded-br-md'
      : block
        ? 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800/70 dark:text-zinc-100 rounded-bl-md'
        : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800/70 dark:text-zinc-100 rounded-bl-md';
  const timeCls =
    align === 'right' ? 'text-[10px] opacity-90' : 'text-[10px] text-zinc-400';

  return (
    <div className="flex w-full min-w-0">
      <div className={[base, cls].join(' ') + ' flex-col items-start'}>
        {/* Reply Preview */}
        {replyTo && !deletedAt && (
          <div
            className={`mb-2 px-3 py-2 rounded-lg border-l-2 ${
              align === 'right'
                ? 'bg-white/10 border-white/30'
                : 'bg-zinc-200/50 dark:bg-zinc-700/50 border-zinc-400 dark:border-zinc-500'
            }`}
          >
            <div className="text-xs font-medium opacity-80 mb-0.5">
              {replyTo.author.name}
            </div>
            <div className="text-xs opacity-70 line-clamp-2">
              {replyTo.content}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex items-end gap-2 w-full">
          {deletedAt ? (
            <span className="leading-5 italic text-neutral-400">
              Usunięta wiadomość
            </span>
          ) : (
            <>
              <span className="leading-5 whitespace-pre-wrap break-words overflow-wrap-anywhere min-w-0">
                {children}
              </span>
              {editedAt && (
                <span className="text-xs text-neutral-400 ml-1 flex-shrink-0">
                  (edited)
                </span>
              )}
            </>
          )}
          {time && <span className={timeCls + ' flex-shrink-0'}>{time}</span>}
        </div>
      </div>
    </div>
  );
}

type MsgInProps = {
  children: React.ReactNode;
  message: Message;
  time?: string;
  block?: boolean;
  className?: string;
  onAddReaction?: (emoji: string) => void;
  onRemoveReaction?: (emoji: string) => void;
  onReply?: () => void;
  onReport?: () => void;
};

export const MsgIn = ({
  children,
  message,
  time,
  block,
  className = '',
  onAddReaction,
  onRemoveReaction,
  onReply,
  onReport,
}: MsgInProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const [actionsVisible, setActionsVisible] = useState(false);

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const reactionsButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <div
      className={`flex items-start gap-3 py-2 ${className}`}
      onMouseEnter={() => setActionsVisible(true)}
      onMouseLeave={() => setActionsVisible(false)}
    >
      <div className="flex-1 min-w-0">
        <Bubble
          align="left"
          time={time}
          block={block}
          editedAt={message.editedAt}
          deletedAt={message.deletedAt}
          replyTo={message.replyTo}
        >
          {children}
        </Bubble>
        {message.reactions && message.reactions.length > 0 && (
          <MessageReactions
            reactions={message.reactions}
            onReactionClick={(emoji) => {
              const reaction = message.reactions?.find(
                (r) => r.emoji === emoji
              );
              if (reaction?.reacted) {
                onRemoveReaction?.(emoji);
              } else {
                onAddReaction?.(emoji);
              }
            }}
          />
        )}
      </div>

      <MessageActions
        isVisible={actionsVisible}
        align="left"
        onReply={onReply || (() => {})}
        onOpenReactions={() => setReactionsOpen(true)}
        onOpenMenu={() => setMenuOpen(true)}
        reactionsButtonRef={reactionsButtonRef}
        menuButtonRef={menuButtonRef}
      />

      <MessageMenuPopover
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onReport={onReport || (() => {})}
        align="left"
        canEdit={false}
        canDelete={false}
        referenceElement={menuButtonRef.current}
      />

      <ReactionsBar
        isOpen={reactionsOpen}
        onClose={() => setReactionsOpen(false)}
        onSelectEmoji={(emoji) => onAddReaction?.(emoji)}
        referenceElement={reactionsButtonRef.current}
      />
    </div>
  );
};

type MsgOutProps = {
  children: React.ReactNode;
  message: Message;
  time?: string;
  isLast?: boolean;
  className?: string;
  onAddReaction?: (emoji: string) => void;
  onRemoveReaction?: (emoji: string) => void;
  onReply?: () => void;
  onReport?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export const MsgOut = ({
  children,
  message,
  time,
  isLast,
  className = '',
  onAddReaction,
  onRemoveReaction,
  onReply,
  onReport,
  onEdit,
  onDelete,
}: MsgOutProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const [actionsVisible, setActionsVisible] = useState(false);

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const reactionsButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <div
      className={`flex items-start justify-end gap-3 py-2 ${className}`}
      onMouseEnter={() => setActionsVisible(true)}
      onMouseLeave={() => setActionsVisible(false)}
    >
      <MessageActions
        isVisible={actionsVisible}
        align="right"
        onReply={onReply || (() => {})}
        onOpenReactions={() => setReactionsOpen(true)}
        onOpenMenu={() => setMenuOpen(true)}
        reactionsButtonRef={reactionsButtonRef}
        menuButtonRef={menuButtonRef}
      />

      <MessageMenuPopover
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onEdit={onEdit}
        onDelete={onDelete}
        onReport={onReport || (() => {})}
        align="right"
        canEdit={!!onEdit}
        canDelete={!!onDelete}
        referenceElement={menuButtonRef.current}
      />

      <ReactionsBar
        isOpen={reactionsOpen}
        onClose={() => setReactionsOpen(false)}
        onSelectEmoji={(emoji) => onAddReaction?.(emoji)}
        referenceElement={reactionsButtonRef.current}
      />

      <div className="flex flex-col items-end">
        <Bubble
          align="right"
          time={time}
          editedAt={message.editedAt}
          deletedAt={message.deletedAt}
          replyTo={message.replyTo}
        >
          {children}
        </Bubble>
        {message.reactions && message.reactions.length > 0 && (
          <MessageReactions
            reactions={message.reactions}
            onReactionClick={(emoji) => {
              const reaction = message.reactions?.find(
                (r) => r.emoji === emoji
              );
              if (reaction?.reacted) {
                onRemoveReaction?.(emoji);
              } else {
                onAddReaction?.(emoji);
              }
            }}
          />
        )}
        {isLast && message.readAt && <ReadReceipt readAt={message.readAt} />}
      </div>
    </div>
  );
};
