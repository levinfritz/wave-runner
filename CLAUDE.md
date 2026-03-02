# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Wave Runner — a Space Waves / Geometry Dash-inspired HTML5 canvas game built with TypeScript + Vite. Targeting CrazyGames and Poki platforms. Zero runtime dependencies; everything is vanilla TypeScript + Canvas 2D.

## Commands

```bash
npm run dev              # Start Vite dev server
npm run build            # TypeScript check + Vite production build (output: dist/)
npx tsc --noEmit         # Type-check only
npx vitest run           # Run all tests
npx vitest run src/test/player.test.ts  # Run a single test file
npx vite preview         # Preview production build locally
```

## Architecture

### Entry Point & Game Loop

`src/main.ts` sets up the canvas, creates the `Game` instance, and runs a `requestAnimationFrame` loop at 60fps. It owns UI routing (which menu screen to show) and delegates all click/touch handling to a button-hit-test system from `ui/Screens.ts`.

### State Machine

`Game.ts` is the core class. It holds all game subsystems and manages state:

- **GameState**: `'menu' | 'playing' | 'dead' | 'paused'` — controls what updates/renders
- **GameMode**: `'endless' | 'classic' | 'race'` — determines level rules and scoring
- Menu sub-screens (`'main' | 'settings' | 'shop' | 'level_select' | 'achievements'`) are tracked in `main.ts`, not in `Game`

### Dual Physics

Player switches between two physics modes via in-game portal obstacles:
- **Ship mode**: Gravity-based, hold to thrust up, release to fall
- **Wave mode**: Direct vertical control, hold to go up, release to go down

Input is unified across keyboard (Space/ArrowUp/W), mouse, and touch — combined into a single `isHolding` boolean.

### Procedural Generation

`Corridor.ts` generates wall segments procedurally. `LevelGenerator.ts` spawns obstacles, coins, and portals with proximity checks to avoid overlap. Wall positions are looked up via binary search for performance.

### Rendering Pipeline

Render order (back to front): Background → Corridor walls → Obstacles → Coins → Player (body + trail) → Particles → HUD overlay. All coordinates are world-space; camera offset is applied at render time via `Camera.ts`.

### Theme System

55 themes defined in `themes/themes.ts`. `ThemeManager.ts` auto-cycles themes every 150m with smooth 2s color transitions. All rendering colors come from the active `GameTheme` blended object — never hardcode colors in game rendering.

### Save System

All persistent state is in `localStorage` key `wave_runner_save`, managed by `utils/Storage.ts` with an in-memory cache. The `SaveData` interface defines the shape (high scores, unlocked cosmetics, settings, achievements, daily challenge state). Daily challenges use date-based seeding.

### Platform SDK

`platform/SDK.ts` auto-detects CrazyGames or Poki SDK and wraps ad calls, `happyTime()`, and gameplay lifecycle.

## Key Conventions

- **No external runtime dependencies** — vanilla TypeScript + Canvas 2D only
- **Single-file modules** — each file exports related functions/classes, no barrel exports
- **GC-conscious hot paths** — no allocations in render/update loops; use cached return objects, inline loops, object pooling (`utils/ObjectPool.ts`)
- **Theme-driven rendering** — all colors come from the active `GameTheme`, never hardcode
- **World-space coordinates** — camera offset applied only at render time
- **Obstacle hitboxes** are 0.75–0.85x visual size for fair gameplay
- **DPR-aware canvas** — `Game.resize()` scales for `devicePixelRatio` (capped at 2x)

## Testing

Tests live in `src/test/` and use vitest. A Proxy-based mock canvas context (`src/test/mockCanvas.ts`) tracks all draw calls and canvas state changes — use it for any rendering tests. No DOM or browser APIs are available in tests.

## Build

Vite config (`vite.config.ts`) produces a single JS chunk with inlined assets (<100KB). `base: './'` ensures relative paths for portability across hosting platforms.
