/**
 * Types for chat functionality
 */

export type ChatKind = 'dm' | 'channel';

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
  reactions?: Array<{
    emoji: string;
    count: number;
    users: Array<{ id: string; name: string; avatarKey?: string | null }>;
    reacted: boolean;
  }>;
  readAt?: string | null;
  editedAt?: string | null;
  deletedAt?: string | null;
  replyTo?: {
    id: string;
    author: { id: string; name: string };
    content: string;
  } | null;
};

export type PaneView = 'list' | 'thread' | 'details';
