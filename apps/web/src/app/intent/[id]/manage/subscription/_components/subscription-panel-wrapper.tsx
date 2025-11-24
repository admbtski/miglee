'use client';

import { SubscriptionPanel } from './subscription-panel';
import { useEventSponsorship } from '@/lib/api/billing';
import { useBoost, useLocalPush } from '@/lib/api/billing';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { billingKeys } from '@/lib/api/billing';

interface SubscriptionPanelWrapperProps {
  intentId: string;
}

export function SubscriptionPanelWrapper({
  intentId,
}: SubscriptionPanelWrapperProps) {
  const queryClient = useQueryClient();

  // Fetch active sponsorship data
  const { data, isLoading } = useEventSponsorship(
    { intentId },
    { enabled: !!intentId }
  );

  const boostMutation = useBoost();
  const pushMutation = useLocalPush();

  const handleBoostEvent = async (intentId: string) => {
    try {
      await boostMutation.mutateAsync({ intentId });
      toast.success('Wydarzenie zostało podbite!');

      // Invalidate query to refetch sponsorship data
      queryClient.invalidateQueries({
        queryKey: billingKeys.eventSponsorship(intentId),
      });
    } catch (error: any) {
      console.error('[boost error]', error);
      toast.error(error.message || 'Nie udało się podbić wydarzenia.');
    }
  };

  const handleSendLocalPush = async (intentId: string) => {
    try {
      await pushMutation.mutateAsync({ intentId });
      toast.success('Powiadomienie zostało wysłane!');

      // Invalidate query to refetch sponsorship data
      queryClient.invalidateQueries({
        queryKey: billingKeys.eventSponsorship(intentId),
      });
    } catch (error: any) {
      console.error('[push error]', error);
      toast.error(error.message || 'Nie udało się wysłać powiadomienia.');
    }
  };

  const handleToggleSponsoredBadge = async (
    intentId: string,
    enabled: boolean
  ) => {
    console.info('[badge]', { intentId, enabled });
    // TODO: Implement badge toggle API mutation
    toast.info('Funkcja wkrótce dostępna');
  };

  const handleToggleHighlight = async (
    intentId: string,
    enabled: boolean,
    tone?: any
  ) => {
    console.info('[highlight]', { intentId, enabled, tone });
    // TODO: Implement highlight toggle API mutation
    toast.info('Funkcja wkrótce dostępna');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto border-4 rounded-full animate-spin border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Ładowanie danych sponsorowania...
          </p>
        </div>
      </div>
    );
  }

  // No active sponsorship
  if (!data?.eventSponsorship) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            Brak aktywnego sponsorowania
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
            To wydarzenie nie ma aktywnego pakietu sponsorowania. Wróć do
            zakładki „Plany" aby wykupić pakiet.
          </p>
          <a
            href={`/intent/${intentId}/manage/plans`}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white transition-colors bg-indigo-600 rounded-2xl hover:bg-indigo-500"
          >
            Przejdź do planów
          </a>
        </div>
      </div>
    );
  }

  const sponsorship = data.eventSponsorship;

  // Map sponsorship data to SubscriptionPanel props
  const sponsorshipState = {
    plan:
      sponsorship.plan === 'PLUS'
        ? ('Plus' as const)
        : sponsorship.plan === 'PRO'
          ? ('Pro' as const)
          : ('Free' as const),
    usedBoosts: sponsorship.boostsUsed,
    usedPushes: sponsorship.localPushesUsed,
    totalBoosts: sponsorship.boostsTotal, // Real value from backend
    totalPushes: sponsorship.localPushesTotal, // Real value from backend
    badgeEnabled: true, // TODO: Get from backend
    highlighted: false, // TODO: Get from backend
    highlightTone: undefined, // TODO: Get from backend
    subscriptionPlan: 'None' as const, // Event sponsorship is separate from user subscription
  };

  return (
    <SubscriptionPanel
      intentId={intentId}
      sponsorship={sponsorshipState}
      onBoostEvent={handleBoostEvent}
      onSendLocalPush={handleSendLocalPush}
      onToggleSponsoredBadge={handleToggleSponsoredBadge}
      onToggleHighlight={handleToggleHighlight}
    />
  );
}
