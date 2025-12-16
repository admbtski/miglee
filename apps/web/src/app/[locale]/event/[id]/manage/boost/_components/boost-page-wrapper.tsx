'use client';

import { BoostPage } from './boost-page';
import { useSubscriptionData } from '@/features/events/hooks/use-subscription-data';
import { useEventDetailQuery } from '@/features/events/api/events';
import {
  PlanUpgradeBanner,
  type SponsorshipPlan,
} from '../../_components/plan-upgrade-banner';

type BoostPageWrapperProps = {
  eventId: string;
};

export function BoostPageWrapper({ eventId }: BoostPageWrapperProps) {
  const { sponsorship, onBoostEvent } = useSubscriptionData(eventId);

  // Fetch event to check plan
  const { data: eventData, isLoading: eventLoading } = useEventDetailQuery({
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
    boostedAt: null,
  };

  return (
    <PlanUpgradeBanner
      currentPlan={currentPlan}
      requiredPlan="PLUS"
      featureName="Podbicia wydarzeń dostępne w planach Plus i Pro"
      featureDescription="Wynieś swoje wydarzenie na szczyt listy na 24 godziny. Zwiększ widoczność i przyciągnij więcej uczestników dzięki podbiciom."
      eventId={eventId}
    >
      {sponsorship ? (
        <BoostPage
          eventId={eventId}
          sponsorship={sponsorship}
          onBoostEvent={onBoostEvent}
        />
      ) : (
        <BoostPage
          eventId={eventId}
          sponsorship={mockSponsorship}
          onBoostEvent={async () => {}}
        />
      )}
    </PlanUpgradeBanner>
  );
}
