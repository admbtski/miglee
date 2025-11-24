export type SponsorPlan = 'Basic' | 'Plus' | 'Pro';

export const PLAN_CAPS: Record<
  SponsorPlan,
  { boosts: number; pushes: number }
> = {
  Basic: { boosts: 0, pushes: 0 }, // FREE plan
  Plus: { boosts: 3, pushes: 3 }, // PLUS: 3 boosts, 3 pushes (stackują się)
  Pro: { boosts: 5, pushes: 5 }, // PRO: 5 boosts, 5 pushes (stackują się)
};

export type SponsorshipState = {
  plan: SponsorPlan;
  usedBoosts: number;
  usedPushes: number;
  badgeEnabled: boolean;
  highlighted: boolean;
};
