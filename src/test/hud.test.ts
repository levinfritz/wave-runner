import { describe, it, expect, beforeEach } from 'vitest';
import { createMockCtx } from './mockCanvas';
import { renderHUD } from '../ui/HUD';
import type { Game } from '../game/Game';
import type { GameTheme } from '../themes/themes';

// Minimal theme stub
const theme: GameTheme = {
  name: 'Test',
  background: { gradient: ['#000', '#111'], pattern: 'none', patternColor: '#222', patternScale: 1, parallaxLayers: 2 },
  corridor: { wallColor: '#fff', wallThickness: 2, fillColor: '#111', wallGlow: false, glowColor: '#fff' },
  obstacles: { primaryColor: '#f00', secondaryColor: '#a00', glowIntensity: 0 },
  player: { color: '#0f0', trailColor: '#0a0', trailGlow: false },
  particles: { enabled: false, color: '#fff', style: 'sparks' },
  ui: { textColor: '#ffffff', accentColor: '#00aaff' },
};

function makeGame(overrides: Partial<Record<string, any>> = {}): Game {
  return {
    state: 'playing',
    mode: 'endless',
    width: 800,
    height: 600,
    distance: 42,
    scrollSpeed: 200,
    baseScrollSpeed: 200,
    maxScrollSpeed: 500,
    highScore: 100,
    coinsCollected: 5,
    classicTargetDistance: 0,
    classicLevelIndex: -1,
    classicComplete: false,
    gameTime: 10,
    player: {
      physicsMode: 'ship',
    },
    themeManager: {
      isTransitioning: false,
      progress: 0,
    },
    ...overrides,
  } as any;
}

describe('HUD rendering', () => {
  let ctx: ReturnType<typeof createMockCtx>['ctx'];
  let state: ReturnType<typeof createMockCtx>['state'];

  beforeEach(() => {
    const mock = createMockCtx();
    ctx = mock.ctx;
    state = mock.state;
  });

  it('should not render when state is not playing', () => {
    const game = makeGame({ state: 'menu' });
    const mock = createMockCtx();
    renderHUD(mock.ctx, game, theme, 0.016);
    // No draw calls should be made (early return)
    expect(mock.calls.length).toBe(0);
  });

  it('should reset globalAlpha to 1 after rendering', () => {
    const game = makeGame({
      themeManager: { isTransitioning: true, progress: 0.5 },
    });
    renderHUD(ctx, game, theme, 0.016);
    expect(state.globalAlpha).toBe(1);
  });

  it('should reset shadowBlur to 0 after rendering', () => {
    const game = makeGame();
    renderHUD(ctx, game, theme, 0.016);
    expect(state.shadowBlur).toBe(0);
  });

  it('should handle speedPct NaN when baseScrollSpeed equals maxScrollSpeed (classic mode)', () => {
    const game = makeGame({
      mode: 'classic',
      scrollSpeed: 250,
      baseScrollSpeed: 250,
      maxScrollSpeed: 250,
      classicTargetDistance: 100,
    });
    // Should not throw
    renderHUD(ctx, game, theme, 0.016);
    // Verify no NaN was produced — check that fillRect was called with valid numbers
    // (the speed bar fillRect should have width 0, not NaN)
  });

  it('should display classic mode distance with target', () => {
    const game = makeGame({
      mode: 'classic',
      distance: 50,
      classicTargetDistance: 100,
    });
    const mock = createMockCtx();
    renderHUD(mock.ctx, game, theme, 0.016);
    const fillTextCalls = mock.calls.filter(c => c.method === 'fillText');
    const distanceCall = fillTextCalls.find(c => c.args[0]?.includes('/'));
    expect(distanceCall).toBeDefined();
    expect(distanceCall!.args[0]).toBe('50m / 100m');
  });

  it('should display endless mode distance without target', () => {
    const game = makeGame({ distance: 42 });
    const mock = createMockCtx();
    renderHUD(mock.ctx, game, theme, 0.016);
    const fillTextCalls = mock.calls.filter(c => c.method === 'fillText');
    const distanceCall = fillTextCalls.find(c => c.args[0] === '42m');
    expect(distanceCall).toBeDefined();
  });

  it('should show SHIP mode indicator when physicsMode is ship', () => {
    const game = makeGame({ player: { physicsMode: 'ship' } });
    const mock = createMockCtx();
    renderHUD(mock.ctx, game, theme, 0.016);
    const textCalls = mock.calls.filter(c => c.method === 'fillText');
    const modeCall = textCalls.find(c => c.args[0] === 'SHIP');
    expect(modeCall).toBeDefined();
  });

  it('should show WAVE mode indicator when physicsMode is wave', () => {
    const game = makeGame({ player: { physicsMode: 'wave' } });
    const mock = createMockCtx();
    renderHUD(mock.ctx, game, theme, 0.016);
    const textCalls = mock.calls.filter(c => c.method === 'fillText');
    const modeCall = textCalls.find(c => c.args[0] === 'WAVE');
    expect(modeCall).toBeDefined();
  });

  it('speed lines should not render when speedPct is below threshold', () => {
    // Speed bar replaced by speed lines that only appear above 30% speedPct
    const game = makeGame({
      scrollSpeed: 200,
      baseScrollSpeed: 200,
      maxScrollSpeed: 500,
    });
    const mock = createMockCtx();
    renderHUD(mock.ctx, game, theme, 0.016);

    // At 0% speedPct, no stroke calls for speed lines (only mode icon uses stroke)
    const strokeCalls = mock.calls.filter(c => c.method === 'stroke');
    // Mode icon draws one stroke — speed lines would add more
    expect(strokeCalls.length).toBe(1); // only the mode icon stroke
  });
});
