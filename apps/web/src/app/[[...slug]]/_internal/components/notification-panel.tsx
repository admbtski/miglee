'use client';

import {
  GetNotificationsQuery,
  Notification,
  Subscription,
} from '@/libs/graphql/__generated__/react-query-update';
import { useAddNotificationMutation } from '@/hooks/useAddNotification';
import { useNotificationAdded } from '@/hooks/useNotificationAdded';
import { useGetNotificationsQuery } from '@/hooks/useNotifications';
import { getQueryClient } from '@/libs/query-client/query-client';
import { create } from 'mutative';
import { FormEvent, useState } from 'react';

export function NotificationsPanel() {
  const qc = getQueryClient();
  const [message, setMessage] = useState('');

  const { data, isLoading, isFetching, isError } = useGetNotificationsQuery();
  const notifications = (data?.notifications ?? []) as Notification[];

  const { mutate: addNotification, isPending } = useAddNotificationMutation({
    onSuccess: () => setMessage(''),
  });

  const { connected } = useNotificationAdded(
    (n: Subscription['notificationAdded']) => {
      qc.setQueryData(['GetNotifications'], (old: GetNotificationsQuery) =>
        create(old ?? { notifications: [] }, (draft: GetNotificationsQuery) => {
          if (!draft.notifications.some((x) => x.id === n.id)) {
            draft.notifications.unshift({
              id: n.id,
              message: n.message ?? '', // 🔥 fallback null
            });
          }
        })
      );
    }
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;
    addNotification({ message: trimmed });
  };

  return (
    <div className="mx-auto max-w-xl p-6">
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between border-b border-neutral-200 p-5 dark:border-neutral-800">
          <h2 className="text-lg font-semibold tracking-tight">
            Notifications
          </h2>
          <div className="flex items-center gap-2 text-sm">
            <span
              className={[
                'inline-flex h-2.5 w-2.5 rounded-full',
                connected ? 'bg-green-500' : 'bg-neutral-400',
              ].join(' ')}
              aria-hidden
            />
            <span className="text-neutral-600 dark:text-neutral-300">
              {connected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Formularz */}
        <form onSubmit={handleSubmit} className="p-5">
          <label htmlFor="message" className="sr-only">
            Message
          </label>
          <div className="flex gap-3">
            <input
              id="message"
              name="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a message…"
              className="flex-1 rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm outline-none ring-0 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-neutral-700 dark:bg-neutral-800"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={isPending || !message.trim()}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
                  Sending…
                </span>
              ) : (
                'Send'
              )}
            </button>
          </div>
        </form>

        {/* Lista */}
        <div className="px-5 pb-5">
          {isError && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
              Could not load notifications.
            </p>
          )}

          {isLoading ? (
            <ul className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <li
                  key={i}
                  className="h-12 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800"
                />
              ))}
            </ul>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-neutral-500">No notifications yet.</p>
          ) : (
            <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {notifications.map((n) => (
                <li key={n.id} className="py-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-indigo-500" />
                    <div className="min-w-0">
                      <p className="break-words text-sm text-neutral-900 dark:text-neutral-100">
                        {n.message}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        id: {n.id}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {isFetching && !isLoading && (
            <div className="mt-3 text-xs text-neutral-500">Refreshing…</div>
          )}
        </div>
      </div>
    </div>
  );
}
