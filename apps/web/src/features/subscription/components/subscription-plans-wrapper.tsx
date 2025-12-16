'use client';

import { useMyPlan } from '@/features/billing/api/billing';
import * as React from 'react';

import { AccountCheckoutPanel } from './account-checkout-panel';
import { SubscriptionPlans } from './subscription-plans';

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
  const { data: planData } = useMyPlan();

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

  const currentPlan = planData?.myPlan?.plan || 'FREE';

  if (view === 'checkout' && selectedPlan) {
    return (
      <AccountCheckoutPanel
        selectedPlan={selectedPlan}
        onBack={handleBackToPlans}
      />
    );
  }

  return (
    <SubscriptionPlans
      onPlanSelect={handlePlanSelect}
      currentPlan={currentPlan as 'FREE' | 'PLUS' | 'PRO'}
    />
  );
}
