'use client';

// TODO i18n: All Polish strings need translation keys
// TODO i18n: Currency formatting should be locale-aware

import * as React from 'react';
import { ArrowLeft, Clock, Lock, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SponsorPlan } from '@/features/events/types/sponsorship';
import {
  useCreateEventSponsorshipCheckout,
  EVENT_PLAN_PRICES,
} from '@/features/billing';
import { EventPlan } from '@/lib/api/__generated__/react-query-update';
import { toast } from 'sonner';

interface CheckoutPanelProps {
  eventId: string;
  selectedPlan: SponsorPlan;
  actionType?: 'new' | 'upgrade' | 'reload';
  onBack: () => void;
}

export function CheckoutPanel({
  eventId,
  selectedPlan,
  actionType = 'new',
  onBack,
}: CheckoutPanelProps) {
  const [agreeToTerms, setAgreeToTerms] = React.useState(false);
  const createCheckout = useCreateEventSponsorshipCheckout();

  // Map frontend plan names to backend price keys
  const planKey = selectedPlan.toLowerCase() as 'free' | 'plus' | 'pro';
  const price = EVENT_PLAN_PRICES[planKey];

  const getActionTitle = () => {
    if (actionType === 'upgrade') {
      return `Upgrade do planu ${selectedPlan}`;
    } else if (actionType === 'reload') {
      return `Doładowanie akcji ${selectedPlan}`;
    }
    return `Wykup planu ${selectedPlan}`;
  };

  const getActionDescription = () => {
    if (actionType === 'upgrade') {
      return 'Ulepsz swoje wydarzenie do wyższego planu';
    } else if (actionType === 'reload') {
      return 'Dokup dodatkowe podbicia i powiadomienia push';
    }
    return 'Jednorazowa płatność za wyróżnienie wydarzenia';
  };

  const handleProceedToPayment = async () => {
    if (!agreeToTerms) {
      toast.error('Musisz zaakceptować regulamin i politykę prywatności.');
      return;
    }

    try {
      // Convert plan to GraphQL enum: Free, Plus, Pro -> FREE, PLUS, PRO
      const planMap: Record<SponsorPlan, EventPlan> = {
        Free: EventPlan.Free,
        Plus: EventPlan.Plus,
        Pro: EventPlan.Pro,
      };

      const result = await createCheckout.mutateAsync({
        input: {
          eventId,
          plan: planMap[selectedPlan],
          actionType,
        },
      });

      // Redirect to Stripe Checkout
      window.location.href = result.createEventSponsorshipCheckout.checkoutUrl;
    } catch (error: any) {
      console.error('Failed to create event sponsorship checkout:', error);
      toast.error(error.message || 'Nie udało się utworzyć sesji płatności.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#05060a]">
      <div className="max-w-4xl px-6 py-10 mx-auto">
        {/* Back button */}
        <button
          onClick={onBack}
          disabled={createCheckout.isPending}
          className="inline-flex items-center gap-2 mb-6 text-sm font-medium transition-colors text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100 disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Powrót do planów
        </button>

        {/* Main checkout card */}
        <div className="rounded-[32px] bg-white dark:bg-[#10121a] border border-zinc-200/50 dark:border-white/5 shadow-sm p-8 space-y-8">
          {/* SUMMARY SECTION */}
          <section>
            <h2 className="text-xs font-bold tracking-[0.2em] text-zinc-500 dark:text-zinc-400 uppercase mb-4">
              Podsumowanie zamówienia
            </h2>
            <div className="rounded-2xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-[#0a0b12] overflow-hidden">
              {/* Table row */}
              <div className="px-6 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                        <Sparkles
                          className="w-6 h-6 text-white"
                          strokeWidth={2}
                        />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                          {getActionTitle()}
                        </p>
                        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                          {getActionDescription()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                      {price.toFixed(2)} zł
                    </p>
                  </div>
                </div>
              </div>

              {/* Active period */}
              <div className="px-6 py-4 border-t border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-[#050608]">
                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <Clock className="w-4 h-4" />
                  <span>
                    Twój pakiet sponsorowania będzie aktywny przez{' '}
                    <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                      30 dni
                    </span>{' '}
                    od momentu zakupu
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* PLAN FEATURES */}
          <section>
            <h2 className="text-xs font-bold tracking-[0.2em] text-zinc-500 dark:text-zinc-400 uppercase mb-4">
              Co otrzymujesz
            </h2>
            <div className="rounded-2xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-[#0a0b12] p-6">
              <ul className="space-y-3">
                {selectedPlan === 'Plus' && (
                  <>
                    <li className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        ✓
                      </span>
                      <span>Wszystko z planu Free</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        ✓
                      </span>
                      <span>Brak limitu uczestników + chat grupowy</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        ✓
                      </span>
                      <span>Wydarzenia hybrydowe (onsite + online)</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        ✓
                      </span>
                      <span>Badge „Promowane" + wyróżniony kafelek</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        ✓
                      </span>
                      <span>
                        1 podbicie wydarzenia (stackuje się po zakupie kolejnych
                        pakietów)
                      </span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        ✓
                      </span>
                      <span>1 lokalne powiadomienie push (stackuje się)</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        ✓
                      </span>
                      <span>Formularze dołączenia + check-in</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        ✓
                      </span>
                      <span>Współorganizatorzy + podstawowa analityka</span>
                    </li>
                  </>
                )}
                {selectedPlan === 'Pro' && (
                  <>
                    <li className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        ✓
                      </span>
                      <span>Wszystko z planu Plus</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        ✓
                      </span>
                      <span>Zaawansowana analityka (trendy, źródła ruchu)</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        ✓
                      </span>
                      <span>Narzędzia komunikacji masowej (broadcasty)</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        ✓
                      </span>
                      <span>
                        3 podbicia wydarzenia (stackują się po zakupie kolejnych
                        pakietów)
                      </span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        ✓
                      </span>
                      <span>3 lokalne powiadomienia push (stackują się)</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        ✓
                      </span>
                      <span>Opłaty za bilety (ticketing)</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        ✓
                      </span>
                      <span>Priorytetowa widoczność w listingu</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        ✓
                      </span>
                      <span>Eksperckie wsparcie premium</span>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </section>

          {/* SECURITY & AGREEMENTS */}
          <section className="space-y-4">
            {/* Security notice */}
            <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
              <Lock className="w-4 h-4" />
              <span className="font-medium">
                Wszystkie transakcje są bezpieczne i szyfrowane przez Stripe
              </span>
            </div>

            {/* Terms checkbox */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="w-4 h-4 mt-1 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Wyrażam zgodę na natychmiastowe wykonanie Umowy i przyjmuję do
                wiadomości, że w związku z tym utracę prawo do odstąpienia od
                Umowy. Zapoznałem/am się z{' '}
                <a
                  href="#"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Regulaminem
                </a>{' '}
                i{' '}
                <a
                  href="#"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Polityką Prywatności
                </a>
                .
              </span>
            </label>
          </section>

          {/* TOTAL & CTA */}
          <section className="pt-6 border-t border-zinc-200 dark:border-white/5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="mb-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Suma całkowita
                </p>
                <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  {price.toFixed(2)} PLN
                </p>
              </div>
              <button
                type="button"
                onClick={handleProceedToPayment}
                disabled={!agreeToTerms || createCheckout.isPending}
                className={cn(
                  'inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold transition-colors rounded-2xl',
                  'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900',
                  'hover:bg-zinc-800 dark:hover:bg-zinc-100',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {createCheckout.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Przekierowywanie...
                  </>
                ) : (
                  <>Przejdź do płatności</>
                )}
              </button>
            </div>

            {/* Payment logos */}
            <div className="flex flex-wrap items-center gap-4 pt-6 mt-6 border-t border-zinc-200 dark:border-white/5">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Obsługiwane metody płatności:
              </p>
              <div className="flex flex-wrap gap-3">
                {['BLIK', 'Visa', 'Mastercard', 'Google Pay', 'Apple Pay'].map(
                  (logo) => (
                    <div
                      key={logo}
                      className="px-3 py-1 text-xs font-medium rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                    >
                      {logo}
                    </div>
                  )
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
