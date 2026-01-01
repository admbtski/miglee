/**
 * Activity Panel Wrapper
 * Wraps activity log with plan requirement check and archive status
 */

// TODO i18n: Polish strings need translation keys

'use client';

import { format, pl } from '@/lib/date';
import {
  PlanUpgradeBanner,
  useEventManagement,
  type SponsorshipPlan,
} from '@/features/events';
import { Archive, Calendar } from 'lucide-react';

interface ActivityPanelWrapperProps {
  eventId: string;
  children: React.ReactNode;
}

export function ActivityPanelWrapper({
  eventId,
  children,
}: ActivityPanelWrapperProps) {
  const { event, isLoading } = useEventManagement();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto border-4 rounded-full animate-spin border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400" />
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Ładowanie... {/* TODO i18n */}
          </p>
        </div>
      </div>
    );
  }

  const currentPlan = event?.sponsorshipPlan as SponsorshipPlan;
  const auditArchivedAt = event?.auditArchivedAt;

  return (
    <PlanUpgradeBanner
      currentPlan={currentPlan}
      requiredPlan="PRO"
      featureName="Historia aktywności dostępna w planie Pro" /* TODO i18n */
      featureDescription="Przeglądaj pełną historię zmian wydarzenia, członków, moderacji i check-inów. Śledź kto, kiedy i co zmienił w Twoim wydarzeniu." /* TODO i18n */
      eventId={eventId}
    >
      {/* Archive Status Banner */}
      {auditArchivedAt && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-900/20 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <Archive className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                Logi zostały zarchiwizowane {/* TODO i18n */}
              </h3>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                Historia aktywności tego wydarzenia została przeniesiona do
                archiwum. Aktywne logi nie są już dostępne w tej widoku.{' '}
                {/* TODO i18n */}
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  Zarchiwizowano:{' '}
                  {format(new Date(auditArchivedAt), 'PPP, HH:mm', {
                    locale: pl,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {children}
    </PlanUpgradeBanner>
  );
}
