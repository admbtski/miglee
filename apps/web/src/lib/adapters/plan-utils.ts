import type { Plan } from '@/components/ui/plan-theme';

/**
 * Determines plan tier based on index position
 * Used for demo/sponsored badge display
 *
 * @param index - Position in the list (0-based)
 * @returns Plan tier (premium, plus, basic, or default)
 */
export function planForIndex(index: number): Plan {
  if (index % 7 === 0) return 'premium';
  if (index % 5 === 0) return 'plus';
  if (index % 3 === 0) return 'basic';
  return 'default';
}
