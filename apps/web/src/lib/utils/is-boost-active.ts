/**
 * Check if a boost is currently active (within 24 hours of boostedAt timestamp)
 */
export function isBoostActive(boostedAt: string | null | undefined): boolean {
  if (!boostedAt) return false;

  const boostedTime = new Date(boostedAt).getTime();
  const now = Date.now();
  const elapsed = now - boostedTime;

  // 24 hours in milliseconds
  return elapsed < 24 * 60 * 60 * 1000;
}
