'use client';

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  useEventSponsorship,
  useBoost,
  useLocalPush,
  useUpdateIntentHighlightColor,
  billingKeys,
} from '@/lib/api/billing';
import { SponsorshipState } from './subscription-panel-types';

export function useSubscriptionData(intentId: string) {
  const queryClient = useQueryClient();

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

      queryClient.invalidateQueries({
        queryKey: billingKeys.eventSponsorship(intentId),
      });
      queryClient.invalidateQueries({
        queryKey: ['GetIntents'],
      });
    } catch (error: any) {
      console.error('[color update error]', error);
      toast.error(error.message || 'Nie udało się zapisać koloru.');
    }
  };

  // Map sponsorship data
  const sponsorship = data?.eventSponsorship
    ? ({
        plan:
          data.eventSponsorship.plan === 'PLUS'
            ? ('Plus' as const)
            : data.eventSponsorship.plan === 'PRO'
              ? ('Pro' as const)
              : ('Free' as const),
        usedBoosts: data.eventSponsorship.boostsUsed,
        usedPushes: data.eventSponsorship.localPushesUsed,
        totalBoosts: data.eventSponsorship.boostsTotal,
        totalPushes: data.eventSponsorship.localPushesTotal,
        highlightColor: data.eventSponsorship.intent?.highlightColor || null,
        boostedAt: data.eventSponsorship.intent?.boostedAt || null,
      } as SponsorshipState & {
        highlightColor?: string | null;
        boostedAt?: string | null;
      })
    : null;

  return {
    sponsorship,
    isLoading,
    onBoostEvent: handleBoostEvent,
    onSendLocalPush: handleSendLocalPush,
    onUpdateHighlightColor: handleUpdateHighlightColor,
  };
}
