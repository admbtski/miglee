'use client';

import { useQuery } from '@tanstack/react-query';
import { gqlClient } from '@/lib/api/client';
import {
  EventAppearanceDocument,
  type EventAppearanceQuery,
  type EventAppearanceQueryVariables,
} from '@/lib/api/__generated__/react-query-update';
import { AppearancePage } from './appearance-page';
import { useEventDetailQuery } from '@/features/events/api/events';
import {
  PlanUpgradeBanner,
  type SponsorshipPlan,
} from '@/features/event-management/components/plan-upgrade-banner';

type AppearancePageWrapperProps = {
  eventId: string;
};

export function AppearancePageWrapper({ eventId }: AppearancePageWrapperProps) {
  // Fetch event to check plan
  const { data: eventData, isLoading: eventLoading } = useEventDetailQuery({
    id: eventId,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['EventAppearance', eventId],
    queryFn: () =>
      gqlClient.request<EventAppearanceQuery, EventAppearanceQueryVariables>(
        EventAppearanceDocument,
        { eventId }
      ),
    enabled: !!eventId,
  });

  const currentPlan = eventData?.event?.sponsorshipPlan as SponsorshipPlan;

  if (isLoading || eventLoading) {
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

  const appearance = data?.event?.appearance;
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
      eventId={eventId}
    >
      <AppearancePage
        eventId={eventId}
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
