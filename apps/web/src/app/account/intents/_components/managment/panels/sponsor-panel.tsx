'use client';

import * as React from 'react';
import { Megaphone } from 'lucide-react';
import { SponsorPlan } from './sponsorship-types';

function cx(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(' ');
}

function planStyles(plan: SponsorPlan) {
  switch (plan) {
    case 'Basic':
      return {
        card: 'border-emerald-300/60 bg-emerald-50/40 dark:border-emerald-700/50 dark:bg-emerald-900/10',
        button: 'bg-emerald-600 hover:bg-emerald-500 text-white',
        title: 'text-emerald-900 dark:text-emerald-200',
        price: 'text-emerald-800 dark:text-emerald-200',
        pill: 'bg-emerald-600 text-white',
      };
    case 'Plus':
      return {
        card: 'border-indigo-300/60 bg-indigo-50/40 dark:border-indigo-700/50 dark:bg-indigo-900/10',
        button: 'bg-indigo-600 hover:bg-indigo-500 text-white',
        title: 'text-indigo-900 dark:text-indigo-200',
        price: 'text-indigo-800 dark:text-indigo-200',
        pill: 'bg-indigo-600 text-white',
      };
    case 'Pro':
      return {
        card: 'border-amber-400/70 bg-amber-50/45 dark:border-amber-700/60 dark:bg-amber-900/10',
        button: 'bg-amber-600 hover:bg-amber-500 text-white',
        title: 'text-amber-900 dark:text-amber-200',
        price: 'text-amber-800 dark:text-amber-200',
        pill: 'bg-amber-600 text-white',
      };
  }
}

/** hierarchia dostępu subskrypcji -> pakiety sponsorowania */
function hasAccessBySubscription(
  subscription: SponsorPlan | 'None' | undefined,
  target: SponsorPlan
) {
  if (!subscription || subscription === 'None') return false;
  const weight: Record<SponsorPlan, number> = { Basic: 1, Plus: 2, Pro: 3 };
  return weight[subscription] >= weight[target];
}

export function SponsorContent({
  intentId,
  onPurchase,
  subscriptionPlan = 'None',
}: {
  intentId: string;
  onPurchase?: (intentId: string, plan: SponsorPlan) => Promise<void> | void;
  /** aktywny plan subskrypcyjny użytkownika (nie dot. jednorazowych pakietów sponsorowania) */
  subscriptionPlan?: SponsorPlan | 'None';
}) {
  const cards: Array<{ plan: SponsorPlan; price: string; perks: string[] }> = [
    {
      plan: 'Basic',
      price: '5 zł',
      perks: [
        'Wyróżnienie w listingu',
        'Badge „Promowane”',
        'Do 50 uczestników',
        'Push lokalny 1x',
        'Podbij 1x',
      ],
    },
    {
      plan: 'Plus',
      price: '10 zł',
      perks: [
        'Zawiera Basic',
        'Do 150 uczestników',
        'Push lokalny 3x',
        'Podbij 3x',
      ],
    },
    {
      plan: 'Pro',
      price: '15 zł',
      perks: [
        'Zawiera Plus',
        'Brak limitu uczestników',
        'Statystyki i analityka',
        'Push lokalny 5x',
        'Podbij 5x',
      ],
    },
  ];

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h3 className="text-base font-semibold">Wyróżnij wydarzenie</h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Wybierz pakiet sponsorowania. Po zakupie pojawi się zakładka{' '}
          <b>„Pakiet (aktywny)”</b> z dodatkowymi akcjami.
        </p>
        <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
          <b>Informacja:</b> jeśli posiadasz aktywną <b>subskrypcję</b>, to
          część lub wszystkie poniższe pakiety są już dla Ciebie dostępne
          automatycznie.
          <br />• Subskrypcja <b>Basic</b> obejmuje pakiet <b>Basic</b>.<br />•
          Subskrypcja <b>Plus</b> zawiera wszystko z <b>Basic</b> i <b>Plus</b>.
          <br />• Subskrypcja <b>Pro</b> daje dostęp do wszystkich pakietów (
          <b>Basic</b>, <b>Plus</b> i <b>Pro</b>).
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map(({ plan, price, perks }) => {
          const s = planStyles(plan);
          const covered = hasAccessBySubscription(subscriptionPlan, plan);

          return (
            <div
              key={plan}
              className={cx(
                'relative flex flex-col rounded-2xl border p-4 transition-shadow shadow-sm hover:shadow-md',
                s.card
              )}
              data-plan={plan}
            >
              {/* znacznik "W subskrypcji" gdy pokryte */}
              {covered && (
                <span
                  className={cx(
                    'absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                    s.pill
                  )}
                >
                  W subskrypcji
                </span>
              )}

              <div className={cx('text-sm font-semibold', s.title)}>{plan}</div>
              <div className={cx('mb-2 text-2xl font-bold', s.price)}>
                {price}
              </div>

              <ul className="mb-4 list-inside list-disc text-sm text-zinc-700 dark:text-zinc-300">
                {perks.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>

              <button
                type="button"
                className={cx(
                  'mt-auto inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium',
                  covered
                    ? 'cursor-not-allowed bg-zinc-300 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200'
                    : s.button
                )}
                onClick={async () => {
                  if (covered) return;
                  if (onPurchase) await onPurchase(intentId, plan);
                  else console.info('[sponsor] purchase', { intentId, plan });
                }}
                aria-label={
                  covered
                    ? `Plan ${plan} w ramach subskrypcji`
                    : `Wykup plan ${plan}`
                }
                aria-disabled={covered}
                disabled={covered}
              >
                {covered ? 'W ramach subskrypcji' : `Wykup ${plan}`}
              </button>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-indigo-300/40 bg-indigo-50 p-4 text-sm text-indigo-800 dark:border-indigo-700/40 dark:bg-indigo-900/20 dark:text-indigo-200">
        <Megaphone className="mr-2 inline-block h-4 w-4" />
        Po aktywacji planu uzyskasz możliwość podbicia wydarzenia, wysyłki
        powiadomień lokalnych i sterowania badge i wiele innych...
      </div>
    </div>
  );
}
