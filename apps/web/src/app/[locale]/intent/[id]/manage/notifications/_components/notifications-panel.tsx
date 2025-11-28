'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useIntentMemberStatsQuery } from '@/lib/api/intent-members';

interface NotificationsPanelProps {
  intentId: string;
}

export function NotificationsPanel({ intentId }: NotificationsPanelProps) {
  const [notifyTargets, setNotifyTargets] = React.useState<{
    JOINED: boolean;
    INVITED: boolean;
    PENDING: boolean;
  }>({ JOINED: true, INVITED: false, PENDING: false });

  const [notifyMsg, setNotifyMsg] = React.useState(
    'Hej! Mamy aktualizację dot. wydarzenia…'
  );

  const [sending, setSending] = React.useState(false);

  const { data: statsData } = useIntentMemberStatsQuery({ intentId });

  const counts = React.useMemo(
    () => ({
      JOINED: statsData?.intentMemberStats.joined ?? 0,
      INVITED: statsData?.intentMemberStats.invited ?? 0,
      PENDING: statsData?.intentMemberStats.pending ?? 0,
    }),
    [statsData]
  );

  async function handleSendNotifications() {
    try {
      setSending(true);
      console.info('[notify]', {
        intentId,
        targets: notifyTargets,
        message: notifyMsg,
      });
      // TODO: Implement actual notification sending
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h3 className="text-base font-semibold">Szybkie powiadomienie</h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Wyślij krótką wiadomość do wybranych grup uczestników wydarzenia.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="mb-3 text-sm font-medium">Odbiorcy</div>
          <label className="mb-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-zinc-900 dark:accent-zinc-100"
              checked={notifyTargets.JOINED}
              onChange={(e) =>
                setNotifyTargets((s) => ({ ...s, JOINED: e.target.checked }))
              }
            />
            JOINED ({counts.JOINED})
          </label>
          <label className="mb-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-zinc-900 dark:accent-zinc-100"
              checked={notifyTargets.INVITED}
              onChange={(e) =>
                setNotifyTargets((s) => ({ ...s, INVITED: e.target.checked }))
              }
            />
            INVITED ({counts.INVITED})
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-zinc-900 dark:accent-zinc-100"
              checked={notifyTargets.PENDING}
              onChange={(e) =>
                setNotifyTargets((s) => ({ ...s, PENDING: e.target.checked }))
              }
            />
            PENDING ({counts.PENDING})
          </label>
        </div>

        <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="mb-2 text-sm font-medium">Wiadomość</div>
          <textarea
            className="h-28 w-full resize-none rounded-xl border border-zinc-300 bg-white p-3 text-sm outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500"
            value={notifyMsg}
            onChange={(e) => setNotifyMsg(e.target.value)}
            placeholder="Treść komunikatu…"
          />
          <div className="mt-3 flex items-center justify-end">
            <Button
              type="button"
              disabled={sending}
              onClick={handleSendNotifications}
              variant="default"
              size="default"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Wysyłanie…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Wyślij
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
