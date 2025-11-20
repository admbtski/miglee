export type SponsorPlan = 'Basic' | 'Plus' | 'Pro';

export const PLAN_CAPS: Record<
  SponsorPlan,
  { boosts: number; pushes: number }
> = {
  Basic: { boosts: 1, pushes: 1 },
  Plus: { boosts: 3, pushes: 3 },
  Pro: { boosts: 5, pushes: 5 },
};

export type SponsorshipState = {
  plan: SponsorPlan;
  usedBoosts: number;
  usedPushes: number;
  badgeEnabled: boolean;
  highlighted: boolean;
};
