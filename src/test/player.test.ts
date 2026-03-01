import { describe, it, expect } from 'vitest';
import { Player } from '../game/Player';

describe('Player physics modes', () => {
  it('should default to ship mode', () => {
    const p = new Player();
    expect(p.physicsMode).toBe('ship');
  });

  it('should reset to ship mode on reset()', () => {
    const p = new Player();
    p.physicsMode = 'wave';
    p.reset(100, 300);
    expect(p.physicsMode).toBe('ship');
  });

  describe('Ship mode', () => {
    it('should accelerate downward when not holding', () => {
      const p = new Player();
      p.reset(0, 300);
      p.physicsMode = 'ship';
      p.update(0.016, false, 200);
      expect(p.vy).toBeGreaterThan(0); // falling down
    });

    it('should accelerate upward when holding', () => {
      const p = new Player();
      p.reset(0, 300);
      p.physicsMode = 'ship';
      p.update(0.016, true, 200);
      expect(p.vy).toBeLessThan(0); // going up
    });

    it('should have momentum — velocity carries over', () => {
      const p = new Player();
      p.reset(0, 300);
      p.physicsMode = 'ship';
      // Build up upward velocity
      for (let i = 0; i < 10; i++) p.update(0.016, true, 200);
      const vyBefore = p.vy;
      expect(vyBefore).toBeLessThan(0);

      // Release — velocity shouldn't instantly flip (momentum)
      p.update(0.016, false, 200);
      // vy should still be negative or only slightly positive (cut + one gravity tick)
      // The momentum cut makes it vy * 0.3, then gravity adds ~19.2
      // So it should still be fairly negative
      expect(p.vy).toBeLessThan(vyBefore * 0.3 + 1200 * 0.016 + 1);
    });

    it('should clamp velocity to maxVelocity', () => {
      const p = new Player();
      p.reset(0, 300);
      p.physicsMode = 'ship';
      // Hold for a long time
      for (let i = 0; i < 100; i++) p.update(0.016, true, 200);
      expect(p.vy).toBeGreaterThanOrEqual(-450);
    });

    it('should have smooth rotation based on velocity', () => {
      const p = new Player();
      p.reset(0, 300);
      p.physicsMode = 'ship';
      p.update(0.016, true, 200);
      // Rotation should be proportional to vy, between -0.6 and 0.6
      expect(Math.abs(p.rotation)).toBeLessThanOrEqual(0.6);
      expect(p.rotation).toBeLessThan(0); // going up = negative rotation
    });
  });

  describe('Wave mode', () => {
    it('should move at fixed speed upward when holding', () => {
      const p = new Player();
      p.reset(0, 300);
      p.physicsMode = 'wave';
      const scrollSpeed = 200;
      p.update(0.016, true, scrollSpeed);
      // vy should be exactly -scrollSpeed * 0.85
      expect(p.vy).toBe(-scrollSpeed * 0.85);
    });

    it('should move at fixed speed downward when not holding', () => {
      const p = new Player();
      p.reset(0, 300);
      p.physicsMode = 'wave';
      const scrollSpeed = 200;
      p.update(0.016, false, scrollSpeed);
      expect(p.vy).toBe(scrollSpeed * 0.85);
    });

    it('should have zero momentum — instant direction change', () => {
      const p = new Player();
      p.reset(0, 300);
      p.physicsMode = 'wave';
      const scrollSpeed = 200;

      // Build up "upward" state
      p.update(0.016, true, scrollSpeed);
      expect(p.vy).toBeLessThan(0);

      // Instantly switch to downward
      p.update(0.016, false, scrollSpeed);
      expect(p.vy).toBeGreaterThan(0);
      // Should be exactly the wave speed, not a blend
      expect(p.vy).toBe(scrollSpeed * 0.85);
    });

    it('should snap rotation to ±0.75 radians', () => {
      const p = new Player();
      p.reset(0, 300);
      p.physicsMode = 'wave';
      p.update(0.016, true, 200);
      expect(p.rotation).toBe(-0.75);
      p.update(0.016, false, 200);
      expect(p.rotation).toBe(0.75);
    });
  });

  describe('Mode switching', () => {
    it('should switch from ship to wave cleanly', () => {
      const p = new Player();
      p.reset(0, 300);
      p.physicsMode = 'ship';
      // Build up some velocity in ship mode
      for (let i = 0; i < 5; i++) p.update(0.016, true, 200);
      expect(p.vy).toBeLessThan(0);

      // Switch to wave mode
      p.physicsMode = 'wave';
      p.vy = 0; // game resets vy on mode switch
      p.update(0.016, false, 200);
      // Should immediately be at wave speed
      expect(p.vy).toBe(200 * 0.85);
    });
  });
});
