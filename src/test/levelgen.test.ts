import { describe, it, expect } from 'vitest';
import { LevelGenerator } from '../game/LevelGenerator';

describe('LevelGenerator portal spawning', () => {
  it('should not spawn portals below difficulty 2', () => {
    const gen = new LevelGenerator();
    // difficulty stays at 0
    const walls = { topY: 100, bottomY: 400 };
    for (let x = 0; x < 5000; x += 200) {
      gen.generate(x, () => walls);
    }

    const portals = gen.obstacles.filter(
      o => o.type === 'portal_ship' || o.type === 'portal_wave'
    );
    expect(portals.length).toBe(0);
  });

  it('should spawn first portal around 600px at high difficulty', () => {
    const gen = new LevelGenerator();
    gen.setFixedDifficulty(10);
    const walls = { topY: 100, bottomY: 400 };

    // Generate enough to reach the first portal (nextPortalX starts at 600)
    gen.generate(0, () => walls);

    const portals = gen.obstacles.filter(
      o => o.type === 'portal_ship' || o.type === 'portal_wave'
    );
    expect(portals.length).toBeGreaterThanOrEqual(1);
    // First portal should be at x=600
    const sorted = portals.sort((a, b) => a.x - b.x);
    expect(sorted[0].x).toBe(600);
  });

  it('should spawn multiple portals as player progresses', () => {
    const gen = new LevelGenerator();
    gen.setFixedDifficulty(10);
    const walls = { topY: 100, bottomY: 400 };

    for (let x = 0; x < 10000; x += 500) {
      gen.generate(x, () => walls);
    }

    const portals = gen.obstacles.filter(
      o => o.type === 'portal_ship' || o.type === 'portal_wave'
    );
    // With shorter spacing, should get plenty of portals
    expect(portals.length).toBeGreaterThanOrEqual(5);
  });

  it('should alternate portal types (first is wave, second is ship)', () => {
    const gen = new LevelGenerator();
    gen.setFixedDifficulty(20);
    const walls = { topY: 100, bottomY: 400 };

    for (let x = 0; x < 10000; x += 500) {
      gen.generate(x, () => walls);
    }

    const portals = gen.obstacles
      .filter(o => o.type === 'portal_ship' || o.type === 'portal_wave')
      .sort((a, b) => a.x - b.x);

    expect(portals.length).toBeGreaterThanOrEqual(2);
    // Starts in ship mode → first portal switches to wave
    expect(portals[0].type).toBe('portal_wave');
    // Second portal switches back to ship
    expect(portals[1].type).toBe('portal_ship');
  });

  it('should maintain minimum spacing of 300px between portals', () => {
    const gen = new LevelGenerator();
    gen.setFixedDifficulty(20);
    const walls = { topY: 100, bottomY: 400 };

    for (let x = 0; x < 50000; x += 500) {
      gen.generate(x, () => walls);
    }

    const portals = gen.obstacles
      .filter(o => o.type === 'portal_ship' || o.type === 'portal_wave')
      .sort((a, b) => a.x - b.x);

    for (let i = 1; i < portals.length; i++) {
      const spacing = portals[i].x - portals[i - 1].x;
      expect(spacing).toBeGreaterThanOrEqual(300);
    }
  });

  it('should set portal height to corridor gap height', () => {
    const gen = new LevelGenerator();
    gen.setFixedDifficulty(20);
    const walls = { topY: 100, bottomY: 400 };

    for (let x = 0; x < 5000; x += 500) {
      gen.generate(x, () => walls);
    }

    const portals = gen.obstacles.filter(
      o => o.type === 'portal_ship' || o.type === 'portal_wave'
    );

    for (const p of portals) {
      expect(p.height).toBe(300); // 400 - 100
    }
  });

  it('should reset portal state on reset()', () => {
    const gen = new LevelGenerator();
    gen.setFixedDifficulty(20);
    const walls = { topY: 100, bottomY: 400 };

    for (let x = 0; x < 5000; x += 500) {
      gen.generate(x, () => walls);
    }

    gen.reset();
    expect(gen.obstacles.length).toBe(0);
    expect(gen.coins.length).toBe(0);
  });
});
