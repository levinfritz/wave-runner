import { describe, it, expect } from 'vitest';
import { createCoin, updateCoin, checkCoinCollision } from '../game/Coin';

describe('Coin', () => {
  describe('createCoin', () => {
    it('should create a coin at given position', () => {
      const coin = createCoin(100, 200);
      expect(coin.x).toBe(100);
      expect(coin.y).toBe(200);
      expect(coin.collected).toBe(false);
    });

    it('should initialize with random animation timer', () => {
      const coin1 = createCoin(0, 0);
      const coin2 = createCoin(0, 0);
      // Timer is random, just verify it's a number in valid range
      expect(coin1.animTimer).toBeGreaterThanOrEqual(0);
      expect(coin1.animTimer).toBeLessThan(Math.PI * 2);
    });
  });

  describe('updateCoin', () => {
    it('should advance animation timer', () => {
      const coin = createCoin(100, 200);
      const initialTimer = coin.animTimer;
      updateCoin(coin, 0.5);
      expect(coin.animTimer).toBeCloseTo(initialTimer + 1.5, 5); // dt * 3
    });
  });

  describe('checkCoinCollision', () => {
    it('should detect collision when player overlaps coin', () => {
      const coin = createCoin(100, 200);
      expect(checkCoinCollision(coin, 100, 200)).toBe(true); // exact overlap
    });

    it('should detect collision within 20px radius', () => {
      const coin = createCoin(100, 200);
      expect(checkCoinCollision(coin, 115, 200)).toBe(true); // 15px away
    });

    it('should not detect collision beyond 20px radius', () => {
      const coin = createCoin(100, 200);
      expect(checkCoinCollision(coin, 125, 200)).toBe(false); // 25px away
    });

    it('should not detect collision for collected coins', () => {
      const coin = createCoin(100, 200);
      coin.collected = true;
      expect(checkCoinCollision(coin, 100, 200)).toBe(false);
    });

    it('should use circular radius (not square)', () => {
      const coin = createCoin(100, 200);
      // Diagonal distance: sqrt(15^2 + 15^2) ≈ 21.2 > 20 → no collision
      expect(checkCoinCollision(coin, 115, 215)).toBe(false);
      // Diagonal distance: sqrt(14^2 + 14^2) ≈ 19.8 < 20 → collision
      expect(checkCoinCollision(coin, 114, 214)).toBe(true);
    });
  });
});
