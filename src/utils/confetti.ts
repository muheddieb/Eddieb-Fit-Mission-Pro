import confetti from 'canvas-confetti';

/**
 * High-Impact Multi-Stage Achievement Confetti Engine
 * Custom designed for athletic milestones, weight PRs, and volume progression records.
 */
export const ConfettiEffect = {
  /**
   * Fires a multi-stage celebratory fireworks and confetti particle explosion.
   */
  triggerPRAchievement(): void {
    if (typeof window === 'undefined') return;

    try {
      // Color palette: Gold, Crimson Flame, Electric Cyan, Neon Emerald, Royal Violet
      const colors = ['#f59e0b', '#ef4444', '#10b981', '#06b6d4', '#8b5cf6', '#eab308', '#ec4899'];

      // Stage 1: Massive Center Fountain Blast
      confetti({
        particleCount: 75,
        spread: 80,
        startVelocity: 45,
        origin: { x: 0.5, y: 0.65 },
        colors,
        ticks: 280,
        gravity: 0.9,
        scalar: 1.15,
        shapes: ['circle', 'square'],
      });

      // Stage 2: Left Side Cannon with Star Particles (after 120ms)
      setTimeout(() => {
        try {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 60,
            startVelocity: 55,
            origin: { x: 0.05, y: 0.7 },
            colors: ['#f59e0b', '#eab308', '#ffffff', '#10b981'],
            ticks: 250,
            scalar: 1.25,
            shapes: ['star', 'circle'],
          });
        } catch (e) {}
      }, 120);

      // Stage 3: Right Side Cannon with Star Particles (after 240ms)
      setTimeout(() => {
        try {
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 60,
            startVelocity: 55,
            origin: { x: 0.95, y: 0.7 },
            colors: ['#ef4444', '#f59e0b', '#ffffff', '#06b6d4'],
            ticks: 250,
            scalar: 1.25,
            shapes: ['star', 'circle'],
          });
        } catch (e) {}
      }, 240);

      // Stage 4: Gentle Shimmering Star Shower from Top (after 400ms)
      setTimeout(() => {
        try {
          confetti({
            particleCount: 40,
            spread: 100,
            startVelocity: 25,
            origin: { x: 0.5, y: 0.15 },
            colors: ['#eab308', '#f59e0b', '#10b981', '#38bdf8'],
            gravity: 0.65,
            ticks: 300,
            scalar: 0.9,
            shapes: ['circle', 'star'],
          });
        } catch (e) {}
      }, 400);
    } catch (e) {
      console.warn('Confetti trigger failed:', e);
    }
  },

  /**
   * Fast celebratory burst (for set completion or mini-milestones)
   */
  triggerBurst(): void {
    if (typeof window === 'undefined') return;
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10b981', '#6366f1', '#f59e0b'],
      });
    } catch (e) {}
  }
};
