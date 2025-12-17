'use client';

// TODO i18n: Button labels are handled but formatTime should use locale-aware formatting

import { useLocalePath } from '@/hooks/use-locale-path';
import { useNotificationContent } from '@/lib/i18n/use-notification-content';
import {
  AlertCircle,
  Ban,
  Bell,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  CreditCard,
  ExternalLink,
  Info,
  MessageCircle,
  MessageSquare,
  Star,
  Trash2,
  User,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface NotificationItemProps {
  notification: {
    id: string;
    kind: string;
    title?: string | null;
    body?: string | null;
    entityType?: string | null;
    entityId?: string | null;
    readAt?: string | null;
    createdAt: string;
    data?: Record<string, unknown> | null;
    actor?: {
      name?: string | null;
    } | null;
    event?: {
      id?: string | null;
      title?: string | null;
    } | null;
  };
  onMarkRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  isMarkingRead?: boolean;
  isDeleting?: boolean;
}

/**
 * Notification kinds that should link to an event
 */
const EVENT_LINKED_KINDS = new Set([
  'EVENT_CREATED',
  'EVENT_UPDATED',
  'EVENT_CANCELED',
  'EVENT_DELETED',
  'EVENT_INVITE',
  'EVENT_INVITE_ACCEPTED',
  'EVENT_MEMBERSHIP_APPROVED',
  'EVENT_MEMBERSHIP_REJECTED',
  'EVENT_MEMBER_KICKED',
  'EVENT_MEMBER_ROLE_CHANGED',
  'JOIN_REQUEST',
  'BANNED',
  'UNBANNED',
  'WAITLIST_JOINED',
  'WAITLIST_PROMOTED',
  'EVENT_REVIEW_RECEIVED',
  'EVENT_FEEDBACK_RECEIVED',
  'EVENT_FEEDBACK_REQUEST',
  'REVIEW_HIDDEN',
  'EVENT_COMMENT_ADDED',
  'COMMENT_REPLY',
  'COMMENT_HIDDEN',
  'EVENT_CHAT_MESSAGE',
  'EVENT_REMINDER',
]);

/**
 * Get the event URL for a notification
 */
function getNotificationEventUrl(
  notification: NotificationItemProps['notification'],
  localePath: (path: string) => string
): string | null {
  // Check if this notification kind should link to an event
  if (!EVENT_LINKED_KINDS.has(notification.kind)) {
    return null;
  }

  // Try to get event ID from various sources
  const eventId =
    notification.event?.id ||
    (notification.data?.eventId as string | undefined) ||
    (notification.entityType === 'EVENT' ? notification.entityId : null);

  if (!eventId) {
    return null;
  }

  return localePath(`/event/${eventId}`);
}

/**
 * Get icon based on notification kind (more specific than entityType)
 */
function getNotificationIcon(kind: string, entityType?: string | null) {
  // First check by kind for specific icons
  switch (kind) {
    // Membership
    case 'EVENT_INVITE':
    case 'EVENT_INVITE_ACCEPTED':
      return (
        <UserPlus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      );
    case 'JOIN_REQUEST':
      return <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
    case 'EVENT_MEMBERSHIP_APPROVED':
      return (
        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
      );
    case 'EVENT_MEMBERSHIP_REJECTED':
      return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
    case 'EVENT_MEMBER_KICKED':
    case 'BANNED':
      return <Ban className="h-4 w-4 text-red-600 dark:text-red-400" />;
    case 'UNBANNED':
      return (
        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
      );

    // Waitlist
    case 'WAITLIST_JOINED':
    case 'WAITLIST_PROMOTED':
      return <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />;

    // Reviews & Feedback
    case 'EVENT_REVIEW_RECEIVED':
    case 'NEW_REVIEW':
    case 'EVENT_FEEDBACK_RECEIVED':
      return <Star className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />;
    case 'EVENT_FEEDBACK_REQUEST':
      return (
        <MessageCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
      );
    case 'REVIEW_HIDDEN':
      return (
        <XCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
      );

    // Comments
    case 'EVENT_COMMENT_ADDED':
    case 'COMMENT_REPLY':
    case 'NEW_COMMENT':
      return (
        <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      );
    case 'COMMENT_HIDDEN':
      return (
        <XCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
      );

    // Messages
    case 'NEW_MESSAGE':
    case 'EVENT_CHAT_MESSAGE':
      return (
        <MessageSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      );

    // Event lifecycle
    case 'EVENT_REMINDER':
      return <Bell className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />;
    case 'EVENT_UPDATED':
    case 'EVENT_CREATED':
      return <Calendar className="h-4 w-4 text-sky-600 dark:text-sky-400" />;
    case 'EVENT_CANCELED':
    case 'EVENT_DELETED':
      return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;

    // System
    case 'SYSTEM':
      return <Info className="h-4 w-4 text-violet-600 dark:text-violet-400" />;
  }

  // Fallback to entityType
  switch (entityType) {
    case 'EVENT':
      return <Calendar className="h-4 w-4 text-sky-600 dark:text-sky-400" />;
    case 'MESSAGE':
      return (
        <MessageSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      );
    case 'PAYMENT':
    case 'INVOICE':
      return (
        <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      );
    case 'USER':
      return <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />;
    case 'SYSTEM':
      return <Info className="h-4 w-4 text-violet-600 dark:text-violet-400" />;
    case 'REVIEW':
      return <Star className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />;
    default:
      return (
        <AlertCircle className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
      );
  }
}

/**
 * Format time with locale support
 */
function formatTime(iso: string, locale: string) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return iso;
  }
}

/**
 * Get localized button labels
 */
type ButtonLabels = { markRead: string; delete: string };

const buttonLabelsMap: Record<string, ButtonLabels> = {
  pl: { markRead: 'Przeczytane', delete: 'Usuń' },
  de: { markRead: 'Gelesen', delete: 'Löschen' },
  en: { markRead: 'Mark read', delete: 'Delete' },
};

function getButtonLabels(locale: string): ButtonLabels {
  return buttonLabelsMap[locale] ?? buttonLabelsMap['en']!;
}

export function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
  isMarkingRead = false,
  isDeleting = false,
}: NotificationItemProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { localePath } = useLocalePath();
  const { title, body } = useNotificationContent(notification);
  const unread = !notification.readAt;
  const buttonLabels = getButtonLabels(locale);

  // Get link URL for this notification
  const linkUrl = getNotificationEventUrl(notification, localePath);
  const isClickable = !!linkUrl;

  // Content that's rendered inside both clickable and non-clickable versions
  const content = (
    <div className="flex items-start gap-3 px-4 py-3">
      {/* Icon based on kind */}
      <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800">
        {getNotificationIcon(notification.kind, notification.entityType)}
      </div>

      {/* Unread indicator */}
      <span className="relative mt-2 inline-flex h-2.5 w-2.5">
        {unread ? (
          <>
            <span className="absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-sky-500 opacity-70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sky-500" />
          </>
        ) : (
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-transparent" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center justify-between gap-2">
          <div className="line-clamp-1 text-sm font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            {title}
            {isClickable && (
              <ExternalLink className="h-3 w-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
          <div className="shrink-0 text-[10px] text-zinc-500">
            {formatTime(notification.createdAt, locale)}
          </div>
        </div>
        {body && (
          <div className="line-clamp-2 text-xs text-zinc-600 dark:text-zinc-300">
            {body}
          </div>
        )}

        {/* Action buttons with higher z-index and stopPropagation */}
        <div className="relative z-10 mt-2 flex items-center gap-2">
          {unread && onMarkRead && (
            <button
              type="button"
              disabled={isMarkingRead}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMarkRead(notification.id);
              }}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-700 transition hover:bg-zinc-200 disabled:opacity-60 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              <Check className="h-3.5 w-3.5" />
              {buttonLabels.markRead}
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(notification.id);
              }}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-700 transition hover:bg-zinc-200 disabled:opacity-60 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {buttonLabels.delete}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <li
      className={[
        'group relative overflow-hidden rounded-xl border',
        unread
          ? 'border-blue-200/60 bg-white shadow-sm dark:border-blue-900/40 dark:bg-zinc-900'
          : 'border-zinc-200/60 bg-white dark:border-zinc-800/60 dark:bg-zinc-900',
        'transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800',
        isClickable ? 'cursor-pointer' : '',
      ].join(' ')}
    >
      {isClickable ? (
        <Link href={linkUrl} className="block">
          {content}
        </Link>
      ) : (
        content
      )}
    </li>
  );
}
