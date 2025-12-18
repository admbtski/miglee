/**
 * Check-in Panel Wrapper
 * Wraps check-in with plan requirement check
 */

// TODO i18n: Polish strings need translation keys

'use client';

import { useEventManagement } from '@/features/events';
import {
  PlanUpgradeBanner,
  type SponsorshipPlan,
} from '@/features/events';

interface CheckinPanelWrapperProps {
  eventId: string;
  children: React.ReactNode;
}

export function CheckinPanelWrapper({
  eventId,
  children,
}: CheckinPanelWrapperProps) {
  const { event, isLoading } = useEventManagement();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto border-4 rounded-full animate-spin border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Ładowanie...
          </p>
        </div>
      </div>
    );
  }

  const currentPlan = event?.sponsorshipPlan as SponsorshipPlan;

  return (
    <PlanUpgradeBanner
      currentPlan={currentPlan}
      requiredPlan="PRO"
      featureName="Check-in & Obecność dostępna w planie Pro"
      featureDescription="Zarządzaj obecnością uczestników, generuj kody QR, śledź check-iny i analizuj frekwencję. Blokuj użytkowników, monitoruj aktywność i eksportuj listy obecności."
      eventId={eventId}
    >
      {children}
    </PlanUpgradeBanner>
  );
}

