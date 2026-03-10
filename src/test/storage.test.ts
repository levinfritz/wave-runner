import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadSave, updateSave, saveToDisk, getDailySeed } from '../utils/Storage';

// Mock localStorage
const mockStore: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => mockStore[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { mockStore[key] = value; }),
  removeItem: vi.fn((key: string) => { delete mockStore[key]; }),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(() => null),
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

// Storage uses an in-memory cache. To reset it between tests, we
// write a known state to localStorage and let loadSave() pick it up.
// Since cachedData is module-private, we force-reset by clearing then loading.

function resetStorage(data?: Record<string, unknown>): void {
  for (const k in mockStore) delete mockStore[k];
  if (data) {
    mockStore['wave_runner_save'] = JSON.stringify(data);
  }
  // Force cache invalidation by directly calling updateSave with all defaults
  // This is a workaround since cachedData is private
}

describe('Storage', () => {
  // Note: Because of module-level caching, tests in this file share
  // the same cache. We work around this by using updateSave to set known state.

  it('should persist data via updateSave', () => {
    updateSave({ highScore: 999 });
    expect(localStorageMock.setItem).toHaveBeenCalled();
    const stored = JSON.parse(mockStore['wave_runner_save']);
    expect(stored.highScore).toBe(999);
  });

  it('should accumulate updates', () => {
    updateSave({ coins: 42 });
    const save = loadSave();
    expect(save.coins).toBe(42);
    expect(save.highScore).toBe(999); // from previous test
  });

  it('should update settings without overwriting other settings', () => {
    updateSave({ settings: { musicVolume: 0 } } as any);
    const save = loadSave();
    expect(save.settings.musicVolume).toBe(0);
    expect(save.settings.particles).toBe(true); // preserved
  });

  it('should track bestCombo', () => {
    updateSave({ bestCombo: 7 });
    expect(loadSave().bestCombo).toBe(7);
  });

  it('should have unlockedSkins with default', () => {
    const save = loadSave();
    expect(save.unlockedSkins).toContain('default');
  });

  it('should generate consistent daily seed', () => {
    const seed1 = getDailySeed();
    const seed2 = getDailySeed();
    expect(seed1).toBe(seed2);
    expect(typeof seed1).toBe('number');
    expect(seed1).toBeGreaterThanOrEqual(0);
  });

  it('should store topRuns array', () => {
    updateSave({ topRuns: [{ distance: 100, date: '2026-01-01', mode: 'endless' }] });
    const save = loadSave();
    expect(save.topRuns).toHaveLength(1);
    expect(save.topRuns[0].distance).toBe(100);
  });
});
