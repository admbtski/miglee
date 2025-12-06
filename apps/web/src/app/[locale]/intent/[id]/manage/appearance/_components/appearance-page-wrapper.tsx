'use client';

import { useQuery } from '@tanstack/react-query';
import { gqlClient } from '@/lib/api/client';
import {
  IntentAppearanceDocument,
  type IntentAppearanceQuery,
  type IntentAppearanceQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { AppearancePage } from './appearance-page';
import { useIntentQuery } from '@/lib/api/intents';
import {
  PlanUpgradeBanner,
  type SponsorshipPlan,
} from '../../_components/plan-upgrade-banner';

type AppearancePageWrapperProps = {
  intentId: string;
};

export function AppearancePageWrapper({
  intentId,
}: AppearancePageWrapperProps) {
  // Fetch intent to check plan
  const { data: intentData, isLoading: intentLoading } = useIntentQuery({
    id: intentId,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['IntentAppearance', intentId],
    queryFn: () =>
      gqlClient.request<IntentAppearanceQuery, IntentAppearanceQueryVariables>(
        IntentAppearanceDocument,
        { intentId }
      ),
    enabled: !!intentId,
  });

  const currentPlan = intentData?.intent?.sponsorshipPlan as SponsorshipPlan;

  if (isLoading || intentLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto border-4 rounded-full animate-spin border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Ładowanie...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[32px] border border-red-200/80 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 shadow-sm p-6">
        <p className="text-sm text-red-600 dark:text-red-400">
          Wystąpił błąd podczas ładowania danych. Spróbuj ponownie później.
        </p>
      </div>
    );
  }

  const appearance = data?.intent?.appearance;
  const config = appearance?.config as
    | {
        card?: { background?: string | null; shadow?: string | null };
        detail?: {
          background?: string | null;
          panel?: { background?: string | null; shadow?: string | null };
        };
      }
    | undefined;

  return (
    <PlanUpgradeBanner
      currentPlan={currentPlan}
      requiredPlan="PLUS"
      featureName="Personalizacja wyglądu dostępna w planach Plus i Pro"
      featureDescription="Wyróżnij swoje wydarzenie niestandardowymi gradientami, poświatami i efektami wizualnymi. Stwórz unikalną kartę wydarzenia, która przyciągnie uwagę."
      intentId={intentId}
    >
      <AppearancePage
        intentId={intentId}
        initialConfig={{
          card: {
            background: config?.card?.background ?? null,
            shadow: config?.card?.shadow ?? null,
          },
          detail: {
            background: config?.detail?.background ?? null,
            panel: {
              background: config?.detail?.panel?.background ?? null,
              shadow: config?.detail?.panel?.shadow ?? null,
            },
          },
        }}
      />
    </PlanUpgradeBanner>
  );
}
