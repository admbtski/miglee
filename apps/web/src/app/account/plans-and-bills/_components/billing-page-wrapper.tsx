'use client';

import React from 'react';
import { ArrowRight, Download, Eye, Users } from 'lucide-react';
import Link from 'next/link';
import {
  useMyPlan,
  useMySubscription,
  useMyPlanPeriods,
  useMyEventSponsorships,
  useCancelSubscription,
  useGetUserPlanReceiptUrl,
  useGetEventSponsorshipReceiptUrl,
} from '@/lib/api/billing';
import { Badge, Progress, Th, Td, SmallButton } from './ui';
import { CancelSubscriptionModal } from './cancel-subscription-modal';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils/currency';

export function BillingPageWrapper() {
  const { data: planData, isLoading: planLoading } = useMyPlan();
  const { data: subData, isLoading: subLoading } = useMySubscription();
  const { data: periodsData, isLoading: periodsLoading } = useMyPlanPeriods({
    limit: 50,
  });
  const { data: sponsorshipsData, isLoading: sponsorshipsLoading } =
    useMyEventSponsorships({
      limit: 50,
    });
  const cancelSubscription = useCancelSubscription();
  const getUserPlanReceiptUrl = useGetUserPlanReceiptUrl();
  const getEventSponsorshipReceiptUrl = useGetEventSponsorshipReceiptUrl();

  const [cancelSubOpen, setCancelSubOpen] = React.useState(false);

  const handleCancelSubscription = async () => {
    try {
      await cancelSubscription.mutateAsync({ immediately: false });
      toast.success(
        'Subskrypcja zostanie anulowana na koniec okresu rozliczeniowego'
      );
      setCancelSubOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Nie udało się anulować subskrypcji');
    }
  };

  const handleViewReceipt = async (
    periodId: string,
    type: 'user-plan' | 'event-sponsorship'
  ) => {
    try {
      let url: string | null | undefined = null;

      if (type === 'user-plan') {
        const result = await getUserPlanReceiptUrl.mutateAsync({ periodId });
        url = result.getUserPlanReceiptUrl;
      } else {
        const result = await getEventSponsorshipReceiptUrl.mutateAsync({
          periodId,
        });
        url = result.getEventSponsorshipReceiptUrl;
      }

      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        toast.error('Faktura nie jest jeszcze dostępna');
      }
    } catch (error: any) {
      toast.error(error.message || 'Nie udało się pobrać faktury');
    }
  };

  const handleDownloadReceipt = async (
    periodId: string,
    type: 'user-plan' | 'event-sponsorship'
  ) => {
    try {
      let url: string | null | undefined = null;

      if (type === 'user-plan') {
        const result = await getUserPlanReceiptUrl.mutateAsync({ periodId });
        url = result.getUserPlanReceiptUrl;
      } else {
        const result = await getEventSponsorshipReceiptUrl.mutateAsync({
          periodId,
        });
        url = result.getEventSponsorshipReceiptUrl;
      }

      if (url) {
        // Open in new tab - browser will handle download if PDF
        window.open(url, '_blank', 'noopener,noreferrer');
        toast.success('Otwieranie faktury...');
      } else {
        toast.error('Faktura nie jest jeszcze dostępna');
      }
    } catch (error: any) {
      toast.error(error.message || 'Nie udało się pobrać faktury');
    }
  };

  if (planLoading || subLoading || periodsLoading || sponsorshipsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 mx-auto border-4 rounded-full animate-spin border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Ładowanie informacji rozliczeniowych...
          </p>
        </div>
      </div>
    );
  }

  const plan = planData?.myPlan;
  const subscription = subData?.mySubscription;

  // Combine user plan periods and event sponsorships into unified payment history
  const userPeriods = (periodsData?.myPlanPeriods || []).map((period) => ({
    type: 'user-plan' as const,
    id: period.id,
    date: new Date(period.startsAt),
    plan: period.plan,
    source: period.source,
    billingPeriod: period.billingPeriod,
    amount: period.amount,
    currency: period.currency,
    startsAt: period.startsAt,
    endsAt: period.endsAt,
  }));

  const eventSponsorships = (sponsorshipsData?.myEventSponsorships || []).map(
    (sponsorship) => ({
      type: 'event-sponsorship' as const,
      id: sponsorship.id,
      date: new Date(sponsorship.createdAt),
      plan: sponsorship.plan,
      actionType: sponsorship.actionType,
      boostsAdded: sponsorship.boostsAdded,
      localPushesAdded: sponsorship.localPushesAdded,
      amount: sponsorship.amount,
      currency: sponsorship.currency,
      intentId: sponsorship.intentId,
      intentTitle: sponsorship.intent?.title,
    })
  );

  // Combine and sort by date (newest first)
  const paymentHistory = [...userPeriods, ...eventSponsorships].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );

  // Determine plan details
  const planName = plan?.plan || 'FREE';
  const isActive = planName !== 'FREE';
  const planEndsAt = plan?.planEndsAt ? new Date(plan.planEndsAt) : null;

  // Find the most recent active user plan period for displaying price
  const activePeriod = userPeriods.find(
    (p) => p.endsAt && new Date(p.endsAt) > new Date()
  );
  const price = activePeriod?.amount || 0;
  const currency = activePeriod?.currency || 'pln';

  // Calculate planStartsAt based on planEndsAt and billing period
  const planStartsAt =
    planEndsAt && plan?.billingPeriod
      ? new Date(
          planEndsAt.getTime() -
            (plan.billingPeriod === 'YEARLY' ? 365 : 30) * 24 * 60 * 60 * 1000
        )
      : null;

  const renewsOn = planEndsAt
    ? planEndsAt.toLocaleDateString('pl-PL', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'N/A';

  // Calculate time progress
  const now = new Date();
  let timeProgress = 0;
  let daysRemaining = 0;
  let totalDays = 0;

  if (planStartsAt && planEndsAt) {
    totalDays = Math.ceil(
      (planEndsAt.getTime() - planStartsAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const elapsed = Math.ceil(
      (now.getTime() - planStartsAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    daysRemaining = Math.ceil(
      (planEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    timeProgress = Math.min(
      100,
      Math.max(0, Math.round((elapsed / totalDays) * 100))
    );
  }

  const cycle =
    plan?.source === 'SUBSCRIPTION'
      ? 'monthly subscription'
      : plan?.billingPeriod === 'YEARLY'
        ? 'yearly'
        : 'monthly';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
            Plany i faktury
          </h1>
          <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-[70ch]">
            Zarządzaj swoją subskrypcją i informacjami rozliczeniowymi
          </p>
        </div>
      </div>

      {/* Current Plan Card */}
      <div className="rounded-[32px] border-2 border-zinc-200/80 dark:border-white/5 bg-white dark:bg-[#10121a] p-6 md:p-8 shadow-sm">
        <div className="flex flex-col justify-between gap-6 mb-6 md:flex-row md:items-start">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center flex-shrink-0 shadow-lg w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 ring-1 ring-black/5">
              <Users className="text-white w-7 h-7" strokeWidth={2} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-2xl font-bold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
                  {planName}
                </h3>
                <Badge tone={isActive ? 'indigo' : 'zinc'}>
                  {isActive ? 'Aktywny' : 'Darmowy'}
                </Badge>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {isActive
                  ? `${plan?.source === 'SUBSCRIPTION' ? 'Odnawia się' : 'Wygasa'} ${renewsOn}`
                  : 'Brak aktywnego planu'}
              </p>
            </div>
          </div>
          <div className="text-left md:text-right">
            <div className="text-4xl font-bold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
              {formatCurrency(price, currency)}
            </div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {cycle}
            </div>
          </div>
        </div>

        {/* Time Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {plan?.source === 'SUBSCRIPTION'
                ? 'Czas do odnowienia'
                : 'Czas do wygaśnięcia'}
            </span>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {isActive
                ? `${daysRemaining} ${daysRemaining === 1 ? 'dzień' : 'dni'} pozostało`
                : 'Brak aktywnego planu'}
            </span>
          </div>
          <Progress value={timeProgress} />
          {isActive && (
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Plan {plan?.source === 'SUBSCRIPTION' ? 'odnowi się' : 'wygaśnie'}{' '}
              {renewsOn}
            </p>
          )}
        </div>

        {/* Plan Details */}
        {isActive && (
          <div className="mb-6 p-4 rounded-2xl bg-zinc-50 dark:bg-[#0a0b12] border border-zinc-200 dark:border-white/5">
            <h4 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Szczegóły planu
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">Typ</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  {plan?.source === 'SUBSCRIPTION'
                    ? 'Subskrypcja'
                    : 'Jednorazowa'}
                </p>
              </div>
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">Okres</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  {plan?.billingPeriod === 'YEARLY' ? 'Roczny' : 'Miesięczny'}
                </p>
              </div>
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">
                  Data rozpoczęcia
                </p>
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  {planStartsAt?.toLocaleDateString('pl-PL', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">
                  {plan?.source === 'SUBSCRIPTION'
                    ? 'Odnowienie'
                    : 'Wygaśnięcie'}
                </p>
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  {renewsOn}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {!isActive && (
            <Link
              href="/account/subscription"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white transition-colors rounded-2xl bg-zinc-900 dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100"
            >
              Ulepsz plan <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          {isActive && (
            <>
              <Link
                href="/account/subscription"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white transition-colors rounded-2xl bg-zinc-900 dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100"
              >
                Zmień plan <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
          {subscription && subscription.status === 'ACTIVE' && (
            <button
              type="button"
              onClick={() => setCancelSubOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 ml-auto text-sm font-medium text-red-700 transition-colors border-2 border-red-300 rounded-2xl dark:border-red-800 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Anuluj subskrypcję
            </button>
          )}
        </div>
      </div>

      {/* Payment History */}
      <div className="rounded-[32px] border-2 border-zinc-200/80 dark:border-white/5 bg-white dark:bg-[#10121a] shadow-sm overflow-hidden">
        <div className="px-6 py-6 border-b md:px-8 border-zinc-200 dark:border-white/5">
          <h3 className="text-xl font-bold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50 mb-1">
            Historia płatności
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Przeglądaj swoją historię rozliczeń i faktury
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-white/5">
            <thead>
              <tr className="text-sm text-left bg-zinc-50 dark:bg-[#0a0b12]">
                <Th>Data</Th>
                <Th>Opis</Th>
                <Th>Kwota</Th>
                <Th>Status</Th>
                <Th className="pr-6 text-right md:pr-8">Akcje</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
              {paymentHistory.length > 0 ? (
                paymentHistory.map((item) => {
                  if (item.type === 'user-plan') {
                    const isActivePeriod =
                      item.endsAt && new Date(item.endsAt) > new Date();

                    const periodCycle =
                      item.source === 'SUBSCRIPTION'
                        ? 'subskrypcja miesięczna'
                        : item.billingPeriod === 'YEARLY'
                          ? 'roczny'
                          : 'miesięczny';

                    return (
                      <tr
                        key={`user-${item.id}`}
                        className="text-sm hover:bg-zinc-50 dark:hover:bg-[#0a0b12] transition-colors"
                      >
                        <Td>
                          <div className="space-y-1">
                            <span className="text-zinc-600 dark:text-zinc-400">
                              {new Date(item.startsAt).toLocaleDateString(
                                'pl-PL',
                                {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                }
                              )}
                            </span>
                            <div className="text-xs text-zinc-500 dark:text-zinc-500">
                              do{' '}
                              {new Date(item.endsAt).toLocaleDateString(
                                'pl-PL',
                                {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                }
                              )}
                            </div>
                          </div>
                        </Td>
                        <Td>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                              Plan {item.plan} - {periodCycle}
                            </span>
                            {isActivePeriod && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                                Aktywny
                              </span>
                            )}
                          </div>
                        </Td>
                        <Td>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                            {formatCurrency(item.amount, item.currency)}
                          </span>
                        </Td>
                        <Td>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                            Opłacono
                          </span>
                        </Td>
                        <Td className="pr-6 text-right md:pr-8">
                          <div className="flex justify-end gap-2">
                            <SmallButton
                              onClick={() =>
                                handleViewReceipt(item.id, 'user-plan')
                              }
                            >
                              <Eye className="w-4 h-4" />
                              <span className="hidden sm:inline">Podgląd</span>
                            </SmallButton>
                            <SmallButton
                              onClick={() =>
                                handleDownloadReceipt(item.id, 'user-plan')
                              }
                            >
                              <Download className="w-4 h-4" />
                              <span className="hidden sm:inline">Faktura</span>
                            </SmallButton>
                          </div>
                        </Td>
                      </tr>
                    );
                  } else {
                    // Event sponsorship
                    const actionType = item.actionType;
                    const amount = item.amount;
                    const currency = item.currency;
                    const boostsAdded = item.boostsAdded;
                    const localPushesAdded = item.localPushesAdded;

                    // Generate descriptive label based on actionType
                    let description = '';
                    if (actionType === 'reload') {
                      description = `Doładowanie akcji (+${boostsAdded} boostów, +${localPushesAdded} pushów)`;
                    } else if (actionType === 'upgrade') {
                      description = `Upgrade do ${item.plan}`;
                    } else {
                      description = `Event ${item.plan}`;
                    }

                    return (
                      <tr
                        key={`event-${item.id}`}
                        className="text-sm hover:bg-zinc-50 dark:hover:bg-[#0a0b12] transition-colors"
                      >
                        <Td>
                          <div className="space-y-1">
                            <span className="text-zinc-600 dark:text-zinc-400">
                              {item.date.toLocaleDateString('pl-PL', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </Td>
                        <Td>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                                {description}
                              </span>
                            </div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">
                              {item.intentTitle || 'Wydarzenie'}
                            </div>
                          </div>
                        </Td>
                        <Td>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                            {formatCurrency(amount, currency)}
                          </span>
                        </Td>
                        <Td>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                            Opłacono
                          </span>
                        </Td>
                        <Td className="pr-6 text-right md:pr-8">
                          <div className="flex justify-end gap-2">
                            <SmallButton
                              onClick={() =>
                                handleViewReceipt(item.id, 'event-sponsorship')
                              }
                            >
                              <Eye className="w-4 h-4" />
                              <span className="hidden sm:inline">Podgląd</span>
                            </SmallButton>
                            <SmallButton
                              onClick={() =>
                                handleDownloadReceipt(
                                  item.id,
                                  'event-sponsorship'
                                )
                              }
                            >
                              <Download className="w-4 h-4" />
                              <span className="hidden sm:inline">Faktura</span>
                            </SmallButton>
                          </div>
                        </Td>
                      </tr>
                    );
                  }
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Brak historii płatności
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancel Subscription Modal */}
      <CancelSubscriptionModal
        open={cancelSubOpen}
        renewDate={renewsOn}
        onClose={() => setCancelSubOpen(false)}
        onConfirm={handleCancelSubscription}
      />
    </div>
  );
}
