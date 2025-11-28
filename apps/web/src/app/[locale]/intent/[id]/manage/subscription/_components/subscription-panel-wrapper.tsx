'use client';

import { SubscriptionPanel } from './subscription-panel';
import { ReloadActionsPanel } from './reload-actions-panel';
import {
  useEventSponsorship,
  useBoost,
  useLocalPush,
  useUpdateIntentHighlightColor,
  billingKeys,
} from '@/lib/api/billing';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

interface SubscriptionPanelWrapperProps {
  intentId: string;
}

export function SubscriptionPanelWrapper({
  intentId,
}: SubscriptionPanelWrapperProps) {
  const queryClient = useQueryClient();
  const [view, setView] = useState<'subscription' | 'reload'>('subscription');

  // Fetch active sponsorship data
  const { data, isLoading } = useEventSponsorship(
    { intentId },
    { enabled: !!intentId }
  );

  const boostMutation = useBoost();
  const pushMutation = useLocalPush();
  const updateColorMutation = useUpdateIntentHighlightColor();

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

  const handleUpdateHighlightColor = async (
    intentId: string,
    color: string | null
  ) => {
    try {
      await updateColorMutation.mutateAsync({ intentId, color });
      toast.success('Kolor wyróżnienia został zapisany!');

      // Invalidate query to refetch sponsorship data
      queryClient.invalidateQueries({
        queryKey: billingKeys.eventSponsorship(intentId),
      });
      queryClient.invalidateQueries({
        queryKey: ['GetIntents'], // Invalidate main intents list to update card color
      });
    } catch (error: any) {
      console.error('[color update error]', error);
      toast.error(error.message || 'Nie udało się zapisać koloru.');
    }
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
    highlightColor: sponsorship.intent?.highlightColor || null, // Real color from backend
    boostedAt: sponsorship.intent?.boostedAt || null, // Timestamp of last boost
    subscriptionPlan: 'None' as const, // Event sponsorship is separate from user subscription
  };

  // Handle reload actions button click
  const handleReloadActions = () => {
    setView('reload');
  };

  // Handle back from reload view
  const handleBackFromReload = () => {
    setView('subscription');
  };

  // If in reload view, show reload panel
  if (view === 'reload') {
    return (
      <ReloadActionsPanel
        intentId={intentId}
        currentPlan={sponsorshipState.plan}
        onBack={handleBackFromReload}
      />
    );
  }

  return (
    <SubscriptionPanel
      intentId={intentId}
      sponsorship={sponsorshipState}
      onBoostEvent={handleBoostEvent}
      onSendLocalPush={handleSendLocalPush}
      onUpdateHighlightColor={handleUpdateHighlightColor}
      onReloadActions={handleReloadActions}
    />
  );
}
