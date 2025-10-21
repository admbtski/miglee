export const intentCreatedConfetti = async () => {
  const confetti = (await import('canvas-confetti' as any)).default;
  confetti({
    particleCount: 140,
    spread: 70,
    startVelocity: 45,
    scalar: 0.9,
    origin: { y: 0.65 },
  });
  setTimeout(() => {
    confetti({
      particleCount: 90,
      spread: 60,
      startVelocity: 35,
      scalar: 0.8,
      origin: { x: 0.2, y: 0.7 },
    });
    confetti({
      particleCount: 90,
      spread: 60,
      startVelocity: 35,
      scalar: 0.8,
      origin: { x: 0.8, y: 0.7 },
    });
  }, 180);
};
