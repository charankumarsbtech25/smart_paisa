import confetti from 'canvas-confetti';

/**
 * Fires a joyful, accessible confetti celebration
 */
export const triggerConfetti = () => {
  try {
    // Left burst
    confetti({
      particleCount: 40,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ['#10b981', '#34d399', '#059669', '#3b82f6', '#f59e0b'],
    });
    // Right burst
    confetti({
      particleCount: 40,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ['#10b981', '#34d399', '#059669', '#3b82f6', '#f59e0b'],
    });
  } catch {
    // Non-blocking in headless or unsupported environments
  }
};
