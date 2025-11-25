export type SponsorPlan = 'Free' | 'Plus' | 'Pro';

export type SponsorshipState = {
  plan: SponsorPlan;
  usedBoosts: number;
  usedPushes: number;
  totalBoosts: number; // Total available boosts (from backend)
  totalPushes: number; // Total available pushes (from backend)
  highlightColor: string | null; // Hex color for highlight ring
  boostedAt?: string | null; // ISO timestamp of last boost
};
