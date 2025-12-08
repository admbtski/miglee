'use client';

import { Bell, Loader2, Target } from 'lucide-react';
import * as React from 'react';

import { QuotaBar } from '@/components/ui/quota-bar';
import { useCooldown } from '@/hooks/use-cooldown';
import { ActionButton } from './action-button';
import { SponsorshipState } from '../types/sponsorship';

type LocalPushPageProps = {
  eventId: string;
  sponsorship: SponsorshipState;
  onSendLocalPush?: (eventId: string) => Promise<void> | void;
};

export function LocalPushPage({
  eventId,
  sponsorship,
  onSendLocalPush,
}: LocalPushPageProps) {
  const [busy, setBusy] = React.useState(false);
  const [local, setLocal] = React.useState(sponsorship);
  const cooldown = useCooldown();

  React.useEffect(() => {
    setLocal(sponsorship);
  }, [sponsorship.usedPushes, sponsorship.totalPushes]);

  const pushesLeft = Math.max(0, local.totalPushes - local.usedPushes);

  const doPush = async () => {
    if (pushesLeft <= 0 || cooldown.isCooling('push')) return;
    try {
      setBusy(true);
      await onSendLocalPush?.(eventId);
      setLocal((s) => ({ ...s, usedPushes: s.usedPushes + 1 }));
      cooldown.start('push', 5);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[32px] border border-zinc-200/80 dark:border-white/5 bg-white dark:bg-[#10121a] shadow-sm p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 text-xl font-bold text-zinc-900 dark:text-zinc-50">
              <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <Target
                  className="w-6 h-6 text-emerald-600 dark:text-emerald-400"
                  strokeWidth={2}
                />
              </div>
              <span className="truncate">Push lokalny</span>
            </div>
            <div className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Wyślij powiadomienie push do użytkowników w okolicy Twojego
              wydarzenia.
            </div>
          </div>
          <div className="shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-4 py-2 text-sm font-bold text-zinc-700 dark:text-zinc-300">
            {local.usedPushes}/{local.totalPushes}
          </div>
        </div>

        <QuotaBar used={local.usedPushes} total={local.totalPushes} />

        <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Pozostało:{' '}
          <span className="font-semibold text-zinc-900 dark:text-zinc-50">
            {pushesLeft}
          </span>
        </div>
      </div>

      {/* Action Button */}
      <div className="rounded-[32px] border border-zinc-200/80 dark:border-white/5 bg-white dark:bg-[#10121a] shadow-sm p-6">
        <ActionButton
          label={
            cooldown.isCooling('push')
              ? 'Odczekaj chwilę…'
              : 'Wyślij powiadomienie'
          }
          icon={<Bell className="w-4 h-4" strokeWidth={2} />}
          busyIcon={<Loader2 className="w-4 h-4 animate-spin" />}
          onClick={doPush}
          disabled={pushesLeft <= 0 || busy}
          isCooling={cooldown.isCooling('push')}
          cooldownSeconds={cooldown.get('push')}
        />
      </div>

      {/* Help Section */}
      <div className="rounded-[32px] border border-blue-200/80 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20 shadow-sm p-6">
        <h3 className="mb-3 text-sm font-bold text-blue-900 dark:text-blue-50">
          Jak działają powiadomienia lokalne?
        </h3>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <li className="flex gap-2">
            <span className="flex-shrink-0">•</span>
            <span>
              Powiadomienie zostanie wysłane do użytkowników w promieniu 50 km
            </span>
          </li>
          <li className="flex gap-2">
            <span className="flex-shrink-0">•</span>
            <span>Użytkownicy muszą mieć włączone powiadomienia push</span>
          </li>
          <li className="flex gap-2">
            <span className="flex-shrink-0">•</span>
            <span>
              Powiadomienie zawiera tytuł wydarzenia i podstawowe informacje
            </span>
          </li>
          <li className="flex gap-2">
            <span className="flex-shrink-0">•</span>
            <span>Najlepszy efekt osiągniesz wysyłając w godzinach 10-20</span>
          </li>
        </ul>
      </div>

      {/* Warning */}
      <div className="rounded-[32px] border border-amber-200/80 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 shadow-sm p-6">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40">
            <Bell
              className="w-5 h-5 text-amber-600 dark:text-amber-400"
              strokeWidth={2}
            />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-50">
              Ważne informacje
            </h3>
            <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
              Użyj powiadomień lokalnych z umiarem. Zbyt częste wysyłanie może
              zniechęcić użytkowników. Zalecamy maksymalnie 1-2 powiadomienia na
              wydarzenie.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
