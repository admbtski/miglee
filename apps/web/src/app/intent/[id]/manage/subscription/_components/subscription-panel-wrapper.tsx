'use client';

import { SubscriptionPanel } from './subscription-panel';

interface SubscriptionPanelWrapperProps {
  intentId: string;
}

export function SubscriptionPanelWrapper({
  intentId,
}: SubscriptionPanelWrapperProps) {
  // TODO: Fetch actual sponsorship data from API
  const mockSponsorship = {
    plan: 'Basic' as const,
    usedBoosts: 0,
    usedPushes: 0,
    badgeEnabled: true,
    highlighted: false,
    highlightTone: undefined,
    subscriptionPlan: 'None' as const,
  };

  const handleBoostEvent = async (intentId: string) => {
    console.info('[boost]', intentId);
    // TODO: Implement boost logic
  };

  const handleSendLocalPush = async (intentId: string) => {
    console.info('[push]', intentId);
    // TODO: Implement push logic
  };

  const handleToggleSponsoredBadge = async (
    intentId: string,
    enabled: boolean
  ) => {
    console.info('[badge]', { intentId, enabled });
    // TODO: Implement badge toggle logic
  };

  const handleToggleHighlight = async (
    intentId: string,
    enabled: boolean,
    tone?: any
  ) => {
    console.info('[highlight]', { intentId, enabled, tone });
    // TODO: Implement highlight toggle logic
  };

  const handleUpgradeSponsorshipPlan = async (
    intentId: string,
    newPlan: any
  ) => {
    console.info('[upgrade]', { intentId, newPlan });
    // TODO: Implement upgrade logic
  };

  return (
    <SubscriptionPanel
      intentId={intentId}
      sponsorship={mockSponsorship}
      onBoostEvent={handleBoostEvent}
      onSendLocalPush={handleSendLocalPush}
      onToggleSponsoredBadge={handleToggleSponsoredBadge}
      onToggleHighlight={handleToggleHighlight}
      onUpgradeSponsorshipPlan={handleUpgradeSponsorshipPlan}
    />
  );
}
