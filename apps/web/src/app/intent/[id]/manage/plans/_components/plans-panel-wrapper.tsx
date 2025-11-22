'use client';

import * as React from 'react';
import { PlansPanel } from './plans-panel';
import { CheckoutPanel } from './checkout-panel';
import { SponsorPlan } from '../../subscription/_components/subscription-panel-types';

interface PlansPanelWrapperProps {
  intentId: string;
}

type View = 'plans' | 'checkout';

export function PlansPanelWrapper({ intentId }: PlansPanelWrapperProps) {
  const [view, setView] = React.useState<View>('plans');
  const [selectedPlan, setSelectedPlan] = React.useState<SponsorPlan | null>(
    null
  );

  const handlePurchase = async (_intentId: string, plan: SponsorPlan) => {
    setSelectedPlan(plan);
    setView('checkout');
  };

  const handleBackToPlans = () => {
    setView('plans');
    setSelectedPlan(null);
  };

  if (view === 'checkout' && selectedPlan) {
    return (
      <CheckoutPanel
        intentId={intentId}
        selectedPlan={selectedPlan}
        onBack={handleBackToPlans}
      />
    );
  }

  return <PlansPanel intentId={intentId} onPurchase={handlePurchase} />;
}
