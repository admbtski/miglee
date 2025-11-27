/**
 * Hook to check plan-based feature access
 */

type PlanType = 'free' | 'plus' | 'pro';
type RequiredPlan = 'plus' | 'pro';

export interface PlanAccess {
  hasAccess: boolean;
  currentPlan: PlanType;
  requiredPlan: RequiredPlan | null;
  needsUpgrade: boolean;
  canUpgrade: boolean;
}

/**
 * Check if user has access to a feature based on their plan
 */
export function usePlanAccess(
  currentPlan: PlanType | null | undefined,
  requiredPlan?: RequiredPlan
): PlanAccess {
  const plan = (currentPlan?.toLowerCase() || 'free') as PlanType;

  if (!requiredPlan) {
    return {
      hasAccess: true,
      currentPlan: plan,
      requiredPlan: null,
      needsUpgrade: false,
      canUpgrade: false,
    };
  }

  const hasAccess =
    plan === 'pro' || (plan === 'plus' && requiredPlan === 'plus');

  const needsUpgrade = plan === 'plus' && requiredPlan === 'pro';
  const canUpgrade = plan !== 'pro';

  return {
    hasAccess,
    currentPlan: plan,
    requiredPlan,
    needsUpgrade,
    canUpgrade,
  };
}

/**
 * Get plan display name
 */
export function getPlanDisplayName(plan: PlanType): string {
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

/**
 * Check if a plan meets the requirement
 */
export function checkPlanAccess(
  currentPlan: PlanType | null | undefined,
  requiredPlan: RequiredPlan
): boolean {
  const plan = (currentPlan?.toLowerCase() || 'free') as PlanType;
  return plan === 'pro' || (plan === 'plus' && requiredPlan === 'plus');
}
