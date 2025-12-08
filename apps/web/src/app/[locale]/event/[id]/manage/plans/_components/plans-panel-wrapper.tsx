'use client';

import * as React from 'react';
import { PlansPanel } from './plans-panel';
import { CheckoutPanel } from './checkout-panel';
import { SponsorPlan } from '@/features/events/components/subscription-panel-types';
import { useEventSponsorship } from '@/features/billing/api/billing';

interface PlansPanelWrapperProps {
  eventId: string;
}

type View = 'plans' | 'checkout';
type ActionType = 'new' | 'upgrade';

export function PlansPanelWrapper({ eventId }: PlansPanelWrapperProps) {
  const [view, setView] = React.useState<View>('plans');
  const [selectedPlan, setSelectedPlan] = React.useState<SponsorPlan | null>(
    null
  );
  const [actionType, setActionType] = React.useState<ActionType>('new');

  // Fetch active sponsorship for this event(if any)
  const { data: sponsorshipData } = useEventSponsorship(
    { eventId },
    { enabled: !!eventId }
  );

  const handlePurchase = async (
    _eventId: string,
    plan: SponsorPlan,
    action: ActionType
  ) => {
    setSelectedPlan(plan);
    setActionType(action);
    setView('checkout');
  };

  const handleBackToPlans = () => {
    setView('plans');
    setSelectedPlan(null);
    setActionType('new');
  };

  // Determine current sponsorship plan
  const currentSponsorshipPlan = sponsorshipData?.eventSponsorship?.plan;
  const currentPlanId =
    currentSponsorshipPlan === 'PRO'
      ? ('pro' as const)
      : currentSponsorshipPlan === 'PLUS'
        ? ('plus' as const)
        : currentSponsorshipPlan === 'FREE'
          ? ('free' as const)
          : null;

  if (view === 'checkout' && selectedPlan) {
    return (
      <CheckoutPanel
        eventId={eevent}
        selectedPlan={selectedPlan}
        actionType={actionType}
        onBack={handleBackToPlans}
      />
    );
  }

  return (
    <PlansPanel
      eventId={eevent}
      onPurchase={handlePurchase}
      currentPlan={currentPlanId}
    />
  );
}
