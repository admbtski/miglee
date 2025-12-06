'use client';

import { LocalPushPage } from '../../subscription/_components/local-push-page';
import { useSubscriptionData } from '../../subscription/_components/use-subscription-data';
import { useIntentQuery } from '@/lib/api/intents';
import {
  PlanUpgradeBanner,
  type SponsorshipPlan,
} from '../../_components/plan-upgrade-banner';

type LocalPushPageWrapperProps = {
  intentId: string;
};

export function LocalPushPageWrapper({ intentId }: LocalPushPageWrapperProps) {
  const { sponsorship, onSendLocalPush } = useSubscriptionData(intentId);

  // Fetch intent to check plan
  const { data: intentData, isLoading: intentLoading } = useIntentQuery({
    id: intentId,
  });

  const currentPlan = intentData?.intent?.sponsorshipPlan as SponsorshipPlan;

  if (intentLoading) {
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
      intentId={intentId}
    >
      {sponsorship ? (
        <LocalPushPage
          intentId={intentId}
          sponsorship={sponsorship}
          onSendLocalPush={onSendLocalPush}
        />
      ) : (
        <LocalPushPage
          intentId={intentId}
          sponsorship={mockSponsorship}
          onSendLocalPush={async () => {}}
        />
      )}
    </PlanUpgradeBanner>
  );
}
