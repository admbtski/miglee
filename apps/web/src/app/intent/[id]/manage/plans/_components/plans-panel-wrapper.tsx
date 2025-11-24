'use client';

import * as React from 'react';
import { PlansPanel } from './plans-panel';
import { CheckoutPanel } from './checkout-panel';
import { SponsorPlan } from '../../subscription/_components/subscription-panel-types';
import { useMyPlan } from '@/lib/api/billing';

interface PlansPanelWrapperProps {
  intentId: string;
}

type View = 'plans' | 'checkout';

export function PlansPanelWrapper({ intentId }: PlansPanelWrapperProps) {
  const [view, setView] = React.useState<View>('plans');
  const [selectedPlan, setSelectedPlan] = React.useState<SponsorPlan | null>(
    null
  );

  // Fetch user's current plan to check if they have access via subscription
  const { data: myPlanData } = useMyPlan();

  const handlePurchase = async (_intentId: string, plan: SponsorPlan) => {
    setSelectedPlan(plan);
    setView('checkout');
  };

  const handleBackToPlans = () => {
    setView('plans');
    setSelectedPlan(null);
  };

  // Map user's subscription plan to sponsor plan
  const userSubscriptionPlan = myPlanData?.myPlan?.plan;
  const subscriptionSponsorPlan: SponsorPlan | 'None' =
    userSubscriptionPlan === 'PRO'
      ? 'Pro'
      : userSubscriptionPlan === 'PLUS'
        ? 'Plus'
        : 'None';

  if (view === 'checkout' && selectedPlan) {
    return (
      <CheckoutPanel
        intentId={intentId}
        selectedPlan={selectedPlan}
        onBack={handleBackToPlans}
      />
    );
  }

  return (
    <PlansPanel
      intentId={intentId}
      onPurchase={handlePurchase}
      subscriptionPlan={subscriptionSponsorPlan}
    />
  );
}
