'use client';

import { Check, CheckCheck } from 'lucide-react';

interface ReadReceiptProps {
  readAt?: string | null;
  isSent?: boolean;
  isLastMessage?: boolean;
}

export function ReadReceipt({
  readAt,
  isSent = true,
  isLastMessage = false,
}: ReadReceiptProps) {
  // Only show on last message in DM
  if (!isLastMessage) return null;

  if (!isSent) {
    return (
      <div className="flex items-center gap-1 text-xs text-zinc-400">
        <Check className="h-3 w-3" />
        <span>Sending...</span>
      </div>
    );
  }

  if (readAt) {
    return (
      <div className="flex items-center gap-1 text-xs text-indigo-500">
        <CheckCheck className="h-3 w-3" />
        <span>Seen</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-xs text-zinc-400">
      <CheckCheck className="h-3 w-3" />
      <span>Delivered</span>
    </div>
  );
}

interface ChannelReadReceiptProps {
  readCount: number;
  totalMembers: number;
}

export function ChannelReadReceipt({
  readCount,
  totalMembers,
}: ChannelReadReceiptProps) {
  if (readCount === 0) return null;

  return (
    <div className="text-xs text-zinc-500 dark:text-zinc-400">
      Seen by {readCount}/{totalMembers}
    </div>
  );
}

interface ReadByAvatarsProps {
  users: Array<{
    id: string;
    name: string;
    imageUrl?: string | null;
  }>;
  maxShow?: number;
}

export function ReadByAvatars({ users, maxShow = 3 }: ReadByAvatarsProps) {
  const displayed = users.slice(0, maxShow);
  const remaining = users.length - maxShow;

  if (users.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      <div className="flex -space-x-2">
        {displayed.map((user) => (
          <div
            key={user.id}
            className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 ring-2 ring-white dark:ring-zinc-900"
            title={user.name}
          >
            {user.imageUrl ? (
              <img
                src={user.imageUrl}
                alt={user.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-300">
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        ))}
      </div>
      {remaining > 0 && (
        <span className="text-xs text-zinc-500">+{remaining}</span>
      )}
    </div>
  );
}
