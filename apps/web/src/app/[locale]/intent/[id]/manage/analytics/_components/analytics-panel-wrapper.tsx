/**
 * Analytics Panel Wrapper
 * Wraps analytics with plan requirement check
 */

'use client';

import { useIntentManagement } from '../../_components/intent-management-provider';
import {
  PlanUpgradeBanner,
  type SponsorshipPlan,
} from '../../_components/plan-upgrade-banner';

interface AnalyticsPanelWrapperProps {
  intentId: string;
  children: React.ReactNode;
}

export function AnalyticsPanelWrapper({
  intentId,
  children,
}: AnalyticsPanelWrapperProps) {
  const { intent, isLoading } = useIntentManagement();

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

  const currentPlan = intent?.sponsorshipPlan as SponsorshipPlan;

  return (
    <PlanUpgradeBanner
      currentPlan={currentPlan}
      requiredPlan="PRO"
      featureName="Zaawansowana analityka dostępna w planie Pro"
      featureDescription="Uzyskaj dostęp do zaawansowanych statystyk, trendów, źródeł ruchu i aktywności uczestników. Śledź konwersje i optymalizuj swoje wydarzenia."
      intentId={intentId}
    >
      {children}
    </PlanUpgradeBanner>
  );
}
