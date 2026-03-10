import { describe, it, expect, vi } from 'vitest';
import { ACHIEVEMENTS, checkAchievements } from '../game/Achievements';
import { loadSave, updateSave } from '../utils/Storage';

// Mock localStorage
const mockStore: Record<string, string> = {};
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: vi.fn((key: string) => mockStore[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { mockStore[key] = value; }),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(() => null),
  },
  writable: true,
});

describe('Achievements', () => {
  it('should have unique achievement IDs', () => {
    const ids = ACHIEVEMENTS.map(a => a.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('should include 3 combo achievements', () => {
    const comboAchs = ACHIEVEMENTS.filter(a => a.id.startsWith('combo_'));
    expect(comboAchs.length).toBe(3);
    expect(comboAchs.map(a => a.id)).toEqual(['combo_5', 'combo_10', 'combo_20']);
  });

  it('should have all required fields on every achievement', () => {
    for (const ach of ACHIEVEMENTS) {
      expect(ach.id).toBeTruthy();
      expect(ach.name).toBeTruthy();
      expect(ach.desc).toBeTruthy();
      expect(ach.icon.length).toBeGreaterThan(0);
      expect(typeof ach.check).toBe('function');
    }
  });

  it('should unlock distance achievement when highScore qualifies', () => {
    // Reset achievements list and set highScore
    updateSave({ achievements: [], highScore: 100 });
    const newlyUnlocked = checkAchievements();
    expect(newlyUnlocked).toContain('dist_100');
    expect(loadSave().achievements).toContain('dist_100');
  });

  it('should not double-unlock achievements', () => {
    // dist_100 was unlocked in previous test
    const newlyUnlocked = checkAchievements();
    expect(newlyUnlocked).not.toContain('dist_100');
  });

  it('should unlock combo achievements at bestCombo >= 5', () => {
    updateSave({ achievements: [], bestCombo: 5 });
    const unlocked = checkAchievements();
    expect(unlocked).toContain('combo_5');
    expect(unlocked).not.toContain('combo_10');
  });

  it('should unlock all combo achievements at bestCombo >= 20', () => {
    updateSave({ achievements: [], bestCombo: 20 });
    const unlocked = checkAchievements();
    expect(unlocked).toContain('combo_5');
    expect(unlocked).toContain('combo_10');
    expect(unlocked).toContain('combo_20');
  });

  it('should unlock coin achievements based on totalCoinsEarned', () => {
    updateSave({ achievements: [], totalCoinsEarned: 1000 });
    const unlocked = checkAchievements();
    expect(unlocked).toContain('coins_100');
    expect(unlocked).toContain('coins_1000');
    expect(unlocked).not.toContain('coins_5000');
  });

  it('should unlock death persistence achievements', () => {
    updateSave({ achievements: [], totalDeaths: 50 });
    const unlocked = checkAchievements();
    expect(unlocked).toContain('deaths_50');
    expect(unlocked).not.toContain('deaths_200');
  });

  it('should unlock games played achievements', () => {
    updateSave({ achievements: [], gamesPlayed: 10 });
    const unlocked = checkAchievements();
    expect(unlocked).toContain('games_10');
    expect(unlocked).not.toContain('games_50');
  });

  it('should have at least 24 achievements total', () => {
    // 5 dist + 4 coins + 4 levels + 3 deaths + 3 games + 2 total + 3 combo = 24
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(24);
  });
});
