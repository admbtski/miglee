'use client';

import * as React from 'react';
import {
  Bell,
  Send,
  Loader2,
  Users,
  UserPlus,
  Clock,
  Info,
} from 'lucide-react';
import { useEventMemberStatsQuery } from '@/features/events/api/event-members';
import { toast } from 'sonner';

interface NotificationsPanelProps {
  eventId: string;
}

type TargetGroup = 'JOINED' | 'INVITED' | 'PENDING';

const TARGET_CONFIG: Record<
  TargetGroup,
  { label: string; description: string; icon: typeof Users }
> = {
  JOINED: {
    label: 'Joined Members',
    description: 'Members who have confirmed attendance',
    icon: Users,
  },
  INVITED: {
    label: 'Invited',
    description: 'People who received an invitation',
    icon: UserPlus,
  },
  PENDING: {
    label: 'Pending',
    description: 'Awaiting approval to join',
    icon: Clock,
  },
};

export function NotificationsPanel({ eventId }: NotificationsPanelProps) {
  const [targets, setTargets] = React.useState<Record<TargetGroup, boolean>>({
    JOINED: true,
    INVITED: false,
    PENDING: false,
  });

  const [message, setMessage] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [charCount, setCharCount] = React.useState(0);

  const MAX_LENGTH = 500;

  const { data: statsData, isLoading: statsLoading } = useEventMemberStatsQuery(
    {
      eventId,
    }
  );

  const counts = React.useMemo(
    () => ({
      JOINED: statsData?.eventMemberStats.joined ?? 0,
      INVITED: statsData?.eventMemberStats.invited ?? 0,
      PENDING: statsData?.eventMemberStats.pending ?? 0,
    }),
    [statsData]
  );

  const selectedCount = React.useMemo(() => {
    return (Object.keys(targets) as TargetGroup[]).reduce((acc, key) => {
      return acc + (targets[key] ? counts[key] : 0);
    }, 0);
  }, [targets, counts]);

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_LENGTH) {
      setMessage(value);
      setCharCount(value.length);
    }
  };

  const handleToggleTarget = (target: TargetGroup) => {
    setTargets((prev) => ({ ...prev, [target]: !prev[target] }));
  };

  async function handleSendNotifications() {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (selectedCount === 0) {
      toast.error('Please select at least one recipient group');
      return;
    }

    try {
      setSending(true);
      // TODO: Implement actual notification sending
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success(`Notification sent to ${selectedCount} recipients`);
      setMessage('');
      setCharCount(0);
    } catch (error) {
      toast.error('Failed to send notification');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
            <Bell className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Quick Notification
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Send a message to your event participants
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recipients Selection */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Recipients
          </h3>
          <div className="space-y-3">
            {(Object.keys(TARGET_CONFIG) as TargetGroup[]).map((target) => {
              const config = TARGET_CONFIG[target];
              const Icon = config.icon;
              const count = counts[target];
              const isSelected = targets[target];

              return (
                <button
                  key={target}
                  type="button"
                  onClick={() => handleToggleTarget(target)}
                  disabled={count === 0}
                  className={[
                    'w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left',
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-500/20'
                      : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-600',
                    count === 0 && 'opacity-50 cursor-not-allowed',
                  ].join(' ')}
                >
                  <div
                    className={[
                      'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
                      isSelected
                        ? 'bg-indigo-100 dark:bg-indigo-900/40'
                        : 'bg-zinc-100 dark:bg-zinc-700',
                    ].join(' ')}
                  >
                    <Icon
                      className={[
                        'h-5 w-5 transition-colors',
                        isSelected
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-zinc-500 dark:text-zinc-400',
                      ].join(' ')}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span
                        className={[
                          'font-medium',
                          isSelected
                            ? 'text-indigo-900 dark:text-indigo-100'
                            : 'text-zinc-900 dark:text-zinc-100',
                        ].join(' ')}
                      >
                        {config.label}
                      </span>
                      <span
                        className={[
                          'text-sm font-semibold tabular-nums px-2 py-0.5 rounded-lg',
                          isSelected
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                            : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400',
                        ].join(' ')}
                      >
                        {statsLoading ? '...' : count}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {config.description}
                    </p>
                  </div>
                  <div
                    className={[
                      'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0',
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500'
                        : 'border-zinc-300 dark:border-zinc-600',
                    ].join(' ')}
                  >
                    {isSelected && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Count */}
          <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">
                Total recipients
              </span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {selectedCount} {selectedCount === 1 ? 'person' : 'people'}
              </span>
            </div>
          </div>
        </div>

        {/* Message Composer */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Message
          </h3>
          <div className="space-y-4">
            <div>
              <textarea
                className="w-full h-40 resize-none rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 transition-all"
                value={message}
                onChange={handleMessageChange}
                placeholder="Hey! We have an update about the event..."
              />
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  Keep it short and clear
                </p>
                <p
                  className={[
                    'text-xs font-medium tabular-nums',
                    charCount >= MAX_LENGTH
                      ? 'text-red-500'
                      : charCount >= MAX_LENGTH * 0.9
                        ? 'text-amber-500'
                        : 'text-zinc-400 dark:text-zinc-500',
                  ].join(' ')}
                >
                  {charCount}/{MAX_LENGTH}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={sending || !message.trim() || selectedCount === 0}
              onClick={handleSendNotifications}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white transition-all bg-indigo-600 rounded-xl hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send notification
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/50 dark:bg-blue-950/30">
        <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
        <div className="text-sm text-blue-900 dark:text-blue-100">
          <p className="font-medium">About Notifications</p>
          <p className="mt-1 text-blue-700 dark:text-blue-300">
            Recipients will receive your message via email and in-app
            notification. Use this feature responsibly to keep participants
            informed about important updates.
          </p>
        </div>
      </div>
    </div>
  );
}
