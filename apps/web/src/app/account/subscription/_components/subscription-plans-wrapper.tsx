'use client';

import * as React from 'react';
import { SubscriptionPlans } from './subscription-plans';
import { AccountCheckoutPanel } from './account-checkout-panel';

export type PlanType = 'free' | 'plus' | 'pro';
export type BillingType =
  | 'monthly-subscription'
  | 'monthly-onetime'
  | 'annual-onetime';

interface SubscriptionPlanData {
  id: PlanType;
  name: string;
  billingType: BillingType;
  price: number;
}

type View = 'plans' | 'checkout';

export function SubscriptionPlansWrapper() {
  const [view, setView] = React.useState<View>('plans');
  const [selectedPlan, setSelectedPlan] =
    React.useState<SubscriptionPlanData | null>(null);

  const handlePlanSelect = (plan: SubscriptionPlanData) => {
    setSelectedPlan(plan);
    setView('checkout');
  };

  const handleBackToPlans = () => {
    setView('plans');
    setSelectedPlan(null);
  };

  if (view === 'checkout' && selectedPlan) {
    return (
      <AccountCheckoutPanel
        selectedPlan={selectedPlan}
        onBack={handleBackToPlans}
      />
    );
  }

  return <SubscriptionPlans onPlanSelect={handlePlanSelect} />;
}
