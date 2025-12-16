/**
 * Confetti effect for event creation/editing success
 */

export const eventCreatedEditedConfetti = async (opts?: {
  intensity?: 'low' | 'normal' | 'high';
}) => {
  const confetti = (await import('canvas-confetti' as any)).default;
  const mult =
    opts?.intensity === 'low' ? 0.5 : opts?.intensity === 'high' ? 1.3 : 1;

  confetti({
    particleCount: Math.round(140 * mult),
    spread: 70,
    startVelocity: 45,
    scalar: 0.9,
    origin: { y: 0.65 },
  });
  setTimeout(() => {
    confetti({
      particleCount: Math.round(90 * mult),
      spread: 60,
      startVelocity: 35,
      scalar: 0.8,
      origin: { x: 0.2, y: 0.7 },
    });
    confetti({
      particleCount: Math.round(90 * mult),
      spread: 60,
      startVelocity: 35,
      scalar: 0.8,
      origin: { x: 0.8, y: 0.7 },
    });
  }, 180);
};

