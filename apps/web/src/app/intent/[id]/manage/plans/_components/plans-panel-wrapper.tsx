'use client';

import * as React from 'react';
import { PlansPanel } from './plans-panel';
import { CheckoutPanel } from './checkout-panel';
import { ReloadActionsModal } from './reload-actions-modal';
import { SponsorPlan } from '../../subscription/_components/subscription-panel-types';
import { useEventSponsorship } from '@/lib/api/billing';

interface PlansPanelWrapperProps {
  intentId: string;
}

type View = 'plans' | 'checkout' | 'reload';
type ActionType = 'new' | 'upgrade' | 'reload';

export function PlansPanelWrapper({ intentId }: PlansPanelWrapperProps) {
  const [view, setView] = React.useState<View>('plans');
  const [selectedPlan, setSelectedPlan] = React.useState<SponsorPlan | null>(
    null
  );
  const [actionType, setActionType] = React.useState<ActionType>('new');

  // Fetch active sponsorship for this intent (if any)
  const { data: sponsorshipData } = useEventSponsorship(
    { intentId },
    { enabled: !!intentId }
  );

  const handlePurchase = async (
    _intentId: string,
    plan: SponsorPlan,
    action: ActionType
  ) => {
    setSelectedPlan(plan);
    setActionType(action);
    setView('checkout');
  };

  const handleReload = async (_intentId: string, currentPlan: SponsorPlan) => {
    setSelectedPlan(currentPlan);
    setActionType('reload');
    setView('reload');
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
        intentId={intentId}
        selectedPlan={selectedPlan}
        actionType={actionType}
        onBack={handleBackToPlans}
      />
    );
  }

  if (view === 'reload' && selectedPlan) {
    return (
      <ReloadActionsModal
        intentId={intentId}
        currentPlan={selectedPlan}
        onBack={handleBackToPlans}
        onProceedToCheckout={() => {
          setView('checkout');
        }}
      />
    );
  }

  return (
    <PlansPanel
      intentId={intentId}
      onPurchase={handlePurchase}
      onReload={handleReload}
      currentPlan={currentPlanId}
    />
  );
}
