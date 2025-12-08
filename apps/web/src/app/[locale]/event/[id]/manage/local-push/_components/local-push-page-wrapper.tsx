'use client';

import { LocalPushPage } from '@/features/events/components/local-push-page';
import { useSubscriptionData } from '@/features/events/hooks/use-subscription-data';
import { useEventQuery } from '@/features/events/api/events';
import {
  PlanUpgradeBanner,
  type SponsorshipPlan,
} from '../../_components/plan-upgrade-banner';

type LocalPushPageWrapperProps = {
  eventId: string;
};

export function LocalPushPageWrapper({ eventId }: LocalPushPageWrapperProps) {
  const { sponsorship, onSendLocalPush } = useSubscriptionData(eventId);

  // Fetch event to check plan
  const { data: eventData, isLoading: eventLoading } = useEventQuery({
    id: eventId,
  });

  const currentPlan = eventData?.event?.sponsorshipPlan as SponsorshipPlan;

  if (eventLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            Ładowanie...
          </p>
        </div>
      </div>
    );
  }

  // Create mock sponsorship data for preview
  const mockSponsorship = {
    plan: 'Plus' as const,
    usedBoosts: 0,
    totalBoosts: 3,
    usedPushes: 0,
    totalPushes: 5,
  };

  return (
    <PlanUpgradeBanner
      currentPlan={currentPlan}
      requiredPlan="PLUS"
      featureName="Powiadomienia lokalne dostępne w planach Plus i Pro"
      featureDescription="Wyślij powiadomienia push do użytkowników w okolicy Twojego wydarzenia. Zwiększ zasięg i przyciągnij więcej uczestników z pobliskich lokalizacji."
      eventId={eventId}
    >
      {sponsorship ? (
        <LocalPushPage
          eventId={eventId}
          sponsorship={sponsorship}
          onSendLocalPush={onSendLocalPush}
        />
      ) : (
        <LocalPushPage
          eventId={eventId}
          sponsorship={mockSponsorship}
          onSendLocalPush={async () => {}}
        />
      )}
    </PlanUpgradeBanner>
  );
}
