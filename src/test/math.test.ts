import { describe, it, expect } from 'vitest';
import { lerp, clamp, easeOutCubic, easeInCubic, easeInOut, distance, SeededRandom } from '../utils/Math';

describe('Math utilities', () => {
  describe('lerp', () => {
    it('should return start at t=0', () => {
      expect(lerp(10, 20, 0)).toBe(10);
    });

    it('should return end at t=1', () => {
      expect(lerp(10, 20, 1)).toBe(20);
    });

    it('should return midpoint at t=0.5', () => {
      expect(lerp(0, 100, 0.5)).toBe(50);
    });

    it('should extrapolate beyond t=1', () => {
      expect(lerp(0, 10, 2)).toBe(20);
    });
  });

  describe('clamp', () => {
    it('should return value when within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it('should clamp to min', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('should clamp to max', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('easing functions', () => {
    it('easeOutCubic should return 0 at t=0 and 1 at t=1', () => {
      expect(easeOutCubic(0)).toBe(0);
      expect(easeOutCubic(1)).toBe(1);
    });

    it('easeOutCubic should decelerate (above linear at midpoint)', () => {
      expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
    });

    it('easeInCubic should return 0 at t=0 and 1 at t=1', () => {
      expect(easeInCubic(0)).toBe(0);
      expect(easeInCubic(1)).toBe(1);
    });

    it('easeInCubic should accelerate (below linear at midpoint)', () => {
      expect(easeInCubic(0.5)).toBeLessThan(0.5);
    });

    it('easeInOut should return 0 at t=0 and 1 at t=1', () => {
      expect(easeInOut(0)).toBe(0);
      expect(easeInOut(1)).toBe(1);
    });

    it('easeInOut should be at 0.5 at midpoint', () => {
      expect(easeInOut(0.5)).toBe(0.5);
    });
  });

  describe('distance', () => {
    it('should calculate distance between two points', () => {
      expect(distance(0, 0, 3, 4)).toBe(5);
    });

    it('should return 0 for same point', () => {
      expect(distance(5, 5, 5, 5)).toBe(0);
    });
  });

  describe('SeededRandom', () => {
    it('should produce deterministic sequences', () => {
      const rng1 = new SeededRandom(42);
      const rng2 = new SeededRandom(42);
      for (let i = 0; i < 10; i++) {
        expect(rng1.next()).toBe(rng2.next());
      }
    });

    it('should produce values between 0 and 1', () => {
      const rng = new SeededRandom(123);
      for (let i = 0; i < 100; i++) {
        const v = rng.next();
        expect(v).toBeGreaterThan(0);
        expect(v).toBeLessThan(1);
      }
    });

    it('should produce different values for different seeds', () => {
      const rng1 = new SeededRandom(1);
      const rng2 = new SeededRandom(2);
      expect(rng1.next()).not.toBe(rng2.next());
    });

    it('range should produce values within bounds', () => {
      const rng = new SeededRandom(99);
      for (let i = 0; i < 50; i++) {
        const v = rng.range(10, 20);
        expect(v).toBeGreaterThanOrEqual(10);
        expect(v).toBeLessThan(20);
      }
    });

    it('int should produce integers within bounds', () => {
      const rng = new SeededRandom(77);
      for (let i = 0; i < 50; i++) {
        const v = rng.int(1, 6);
        expect(v).toBeGreaterThanOrEqual(1);
        expect(v).toBeLessThanOrEqual(6);
        expect(Number.isInteger(v)).toBe(true);
      }
    });
  });
});
