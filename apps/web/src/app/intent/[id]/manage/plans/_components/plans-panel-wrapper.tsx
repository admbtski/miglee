'use client';

import { PlansPanel } from './plans-panel';

interface PlansPanelWrapperProps {
  intentId: string;
}

export function PlansPanelWrapper({ intentId }: PlansPanelWrapperProps) {
  const handlePurchase = async (
    intentId: string,
    plan: 'Basic' | 'Plus' | 'Pro'
  ) => {
    console.info('[sponsor] purchase', { intentId, plan });
    // TODO: Implement purchase logic
  };

  return <PlansPanel intentId={intentId} onPurchase={handlePurchase} />;
}
