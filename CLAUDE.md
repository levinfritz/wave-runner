# Wave Runner

A Space Waves / Geometry Dash-inspired HTML5 canvas game built with TypeScript + Vite. Targeting CrazyGames and Poki platforms.

## Quick Start

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (Vite)
npm run build        # TypeScript check + Vite production build
npx tsc --noEmit     # Type-check only
npx vitest run       # Run tests
npx vite preview     # Preview production build locally
```

## Project Structure

```
src/
  main.ts                 # Entry point: canvas setup, game loop (60fps), UI routing, input handling
  game/
    Game.ts               # Core game class: state machine (menu/playing/dead/paused), physics, scoring
    Player.ts             # Player rendering, trail effects (15 styles), death particles, dual physics
    Corridor.ts           # Procedural corridor walls, binary search for wall positions, wall rendering
    LevelGenerator.ts     # Obstacle/coin/portal spawning with proximity checks
    Collision.ts          # Wall + obstacle collision detection (optimized: inline loops, no allocations)
    Obstacle.ts           # 9 obstacle types: sawblade, spike, block, gate, portal, laser, pulse_orb
    Coin.ts               # Coin spawning and rendering
    Camera.ts             # Smooth camera follow with screen shake
    Background.ts         # Parallax background with cached gradients
    ParticleSystem.ts     # 12 particle styles (sparks, bubbles, snow, fire, etc.)
    Skins.ts              # 20 player skins (shapes + colors)
    Levels.ts             # 12 campaign levels with difficulty/speed/star thresholds
    Achievements.ts       # 24 achievements with auto-check conditions
  ui/
    HUD.ts                # In-game HUD: distance, coins, pause button, speed bar, tutorial overlay
    Screens.ts            # All menu screens: main menu, game over, shop, settings, level select, achievements
  themes/
    themes.ts             # 55 visual themes (colors, patterns, glow settings)
    ThemeManager.ts        # Auto-cycling themes every 150m with smooth 2s transitions
  audio/
    AudioManager.ts       # Web Audio API: procedural music (tempo-responsive), 5 SFX types
  platform/
    SDK.ts                # CrazyGames/Poki SDK abstraction (ads, happyTime, gameplay lifecycle)
  utils/
    Storage.ts            # localStorage persistence with in-memory cache, daily challenge seeding
    Math.ts               # Easing functions, math helpers
    ObjectPool.ts         # Generic object pool for GC optimization
  test/
    *.test.ts             # Unit tests (vitest)
    mockCanvas.ts         # Canvas 2D context mock for tests
```

## Architecture

### Game Modes
- **Classic**: 12 fixed levels with star ratings (1-3 stars based on distance)
- **Endless**: Infinite procedural corridor, speed ramps 200-400 px/s, high score tracking
- **Daily Challenge**: Date-seeded difficulty/speed, one attempt per day, separate leaderboard

### Dual Physics
The player switches between two physics modes via in-game portals:
- **Ship mode**: Gravity-based, hold to thrust up, release to fall (like Flappy Bird)
- **Wave mode**: Direct vertical control, hold to go up, release to go down (like Geometry Dash wave)

### Rendering Pipeline
1. Background (parallax gradient + pattern)
2. Corridor walls (with glow)
3. Obstacles (9 types with animations)
4. Coins
5. Player (body + trail)
6. Particles
7. HUD overlay

### Performance Optimizations
- Binary search for wall lookups in Corridor
- Cached return objects to avoid per-frame allocations
- Index ranges instead of array slices for visible elements
- Cached gradient objects (recreated only on color/size change)
- Inline loops replacing array allocations in collision checks
- Object pooling for particles

### Save System
All game state persisted to `localStorage` key `wave_runner_save`:
- High scores, total stats (distance, coins, deaths, games played)
- Unlocked skins/trails, selected cosmetics
- Level stars, achievement IDs
- Settings (music/sfx volume, particles, screen shake)
- Tutorial seen flag, daily challenge date/best

### Platform SDK
Auto-detects CrazyGames or Poki SDK. Features:
- Interstitial ads (every 3 deaths, paced)
- Rewarded ads (for bonus coins)
- `happyTime()` calls on achievements/high scores
- Gameplay start/stop lifecycle

## Key Conventions

- **No external runtime dependencies** - everything is vanilla TypeScript + Canvas 2D
- **Single-file modules** - each file exports related functions/classes, no barrel exports
- **Theme-driven rendering** - all colors come from the active `GameTheme` object
- **GC-conscious** - avoid allocations in hot paths (render/update loops)
- **All coordinates are world-space** - camera offset applied at render time
- **Obstacle hitboxes** are slightly smaller than visual size (0.75-0.85x) for fair gameplay

## Testing

```bash
npx vitest run              # Run all tests
npx vitest run src/test/player.test.ts  # Run specific test
```

Tests use a mock canvas context (`mockCanvas.ts`). Test files are in `src/test/`.

## Build & Deploy

```bash
npm run build    # Output to dist/
```

The build produces a single HTML + JS bundle with inlined assets. `base: './'` ensures relative paths for portability across hosting platforms.

## Content Counts

| Type | Count |
|------|-------|
| Skins | 20 |
| Trails | 15 |
| Themes | 55 |
| Levels | 12 |
| Achievements | 24 |
| Obstacle types | 9 |
| Particle styles | 12 |
