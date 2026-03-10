import { describe, it, expect } from 'vitest';

/**
 * Tests for the near-miss combo system logic.
 * Since the combo state lives on Game and is tightly coupled,
 * we test the rules via a minimal simulation.
 */

// Simulate the combo update logic from Game.ts without importing Game
interface ComboState {
  nearMissCombo: number;
  nearMissComboTimer: number;
  bestCombo: number;
  coinsCollected: number;
}

const COMBO_WINDOW = 2.0;
const COMBO_MILESTONES = [5, 10, 20];
const COMBO_BONUS_COINS = [5, 15, 50];

function createComboState(): ComboState {
  return { nearMissCombo: 0, nearMissComboTimer: 0, bestCombo: 0, coinsCollected: 0 };
}

/** Simulate dt passing without near-miss */
function tick(state: ComboState, dt: number): void {
  if (state.nearMissComboTimer > 0) {
    state.nearMissComboTimer -= dt;
    if (state.nearMissComboTimer <= 0) {
      state.nearMissCombo = 0;
    }
  }
}

/** Simulate a near-miss event */
function triggerNearMiss(state: ComboState): { isMilestone: boolean; bonus: number } {
  state.nearMissCombo++;
  state.nearMissComboTimer = COMBO_WINDOW;
  if (state.nearMissCombo > state.bestCombo) {
    state.bestCombo = state.nearMissCombo;
  }

  let isMilestone = false;
  let bonus = 0;
  for (let i = COMBO_MILESTONES.length - 1; i >= 0; i--) {
    if (state.nearMissCombo === COMBO_MILESTONES[i]) {
      isMilestone = true;
      bonus = COMBO_BONUS_COINS[i];
      state.coinsCollected += bonus;
      break;
    }
  }
  return { isMilestone, bonus };
}

describe('Near-miss combo system', () => {
  it('should start at 0 combo', () => {
    const state = createComboState();
    expect(state.nearMissCombo).toBe(0);
    expect(state.nearMissComboTimer).toBe(0);
  });

  it('should increment combo on near-miss', () => {
    const state = createComboState();
    triggerNearMiss(state);
    expect(state.nearMissCombo).toBe(1);
    triggerNearMiss(state);
    expect(state.nearMissCombo).toBe(2);
  });

  it('should reset combo timer on each near-miss', () => {
    const state = createComboState();
    triggerNearMiss(state);
    expect(state.nearMissComboTimer).toBe(COMBO_WINDOW);
    tick(state, 1.5); // 0.5s remaining
    triggerNearMiss(state);
    expect(state.nearMissComboTimer).toBe(COMBO_WINDOW); // refreshed
  });

  it('should reset combo when timer expires', () => {
    const state = createComboState();
    triggerNearMiss(state);
    triggerNearMiss(state);
    expect(state.nearMissCombo).toBe(2);
    tick(state, COMBO_WINDOW + 0.1);
    expect(state.nearMissCombo).toBe(0);
  });

  it('should track bestCombo as the highest reached', () => {
    const state = createComboState();
    for (let i = 0; i < 7; i++) triggerNearMiss(state);
    expect(state.bestCombo).toBe(7);
    // Let combo expire and start new one
    tick(state, COMBO_WINDOW + 0.1);
    triggerNearMiss(state);
    triggerNearMiss(state);
    triggerNearMiss(state);
    expect(state.nearMissCombo).toBe(3);
    expect(state.bestCombo).toBe(7); // best stays at 7
  });

  it('should award 5 bonus coins at 5x milestone', () => {
    const state = createComboState();
    for (let i = 0; i < 4; i++) triggerNearMiss(state);
    const result = triggerNearMiss(state); // 5th
    expect(result.isMilestone).toBe(true);
    expect(result.bonus).toBe(5);
    expect(state.coinsCollected).toBe(5);
  });

  it('should award 15 bonus coins at 10x milestone', () => {
    const state = createComboState();
    for (let i = 0; i < 9; i++) triggerNearMiss(state);
    const result = triggerNearMiss(state); // 10th
    expect(result.isMilestone).toBe(true);
    expect(result.bonus).toBe(15);
    expect(state.coinsCollected).toBe(5 + 15); // 5x + 10x
  });

  it('should award 50 bonus coins at 20x milestone', () => {
    const state = createComboState();
    for (let i = 0; i < 19; i++) triggerNearMiss(state);
    const result = triggerNearMiss(state); // 20th
    expect(result.isMilestone).toBe(true);
    expect(result.bonus).toBe(50);
    expect(state.coinsCollected).toBe(5 + 15 + 50); // all milestones
  });

  it('should not be a milestone at non-milestone counts', () => {
    const state = createComboState();
    for (let i = 0; i < 3; i++) {
      const result = triggerNearMiss(state);
      expect(result.isMilestone).toBe(false);
    }
    // 4th is also not a milestone
    const r4 = triggerNearMiss(state);
    expect(r4.isMilestone).toBe(false);
  });

  it('should handle rapid consecutive near-misses', () => {
    const state = createComboState();
    // 20 near-misses with tiny ticks between them
    for (let i = 0; i < 20; i++) {
      tick(state, 0.1);
      triggerNearMiss(state);
    }
    expect(state.nearMissCombo).toBe(20);
    expect(state.bestCombo).toBe(20);
  });

  it('should correctly handle multiple combo sessions', () => {
    const state = createComboState();
    // Session 1: 3 combos
    for (let i = 0; i < 3; i++) triggerNearMiss(state);
    expect(state.nearMissCombo).toBe(3);
    // Expire
    tick(state, COMBO_WINDOW + 0.1);
    expect(state.nearMissCombo).toBe(0);
    // Session 2: 5 combos — milestone should trigger
    for (let i = 0; i < 4; i++) triggerNearMiss(state);
    const result = triggerNearMiss(state);
    expect(state.nearMissCombo).toBe(5);
    expect(result.isMilestone).toBe(true);
    expect(result.bonus).toBe(5);
  });
});
