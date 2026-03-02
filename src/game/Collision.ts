import type { Player } from './Player';
import type { Corridor } from './Corridor';
import type { Obstacle } from './Obstacle';
import { getObstacleBounds } from './Obstacle';

export function checkWallCollision(player: Player, corridor: Corridor, screenHeight: number): boolean {
  // Die if player goes off screen
  if (player.y < -20 || player.y > screenHeight + 20) {
    return true;
  }

  const bounds = player.getBounds();

  // Check at multiple x positions along the player for robust detection
  // Inlined to avoid array allocation every frame
  const px = player.x;
  for (let offset = -5; offset <= 5; offset += 5) {
    const walls = corridor.getWallsAt(px + offset);
    if (!walls) continue;
    if (bounds.top <= walls.topY || bounds.bottom >= walls.bottomY) {
      return true;
    }
  }

  return false;
}

export function checkObstacleCollision(player: Player, obstacles: Obstacle[]): Obstacle | null {
  const playerBounds = player.getBounds();

  for (const obs of obstacles) {
    if (!obs.active) continue;
    const obsBounds = getObstacleBounds(obs);

    if (
      playerBounds.left < obsBounds.right &&
      playerBounds.right > obsBounds.left &&
      playerBounds.top < obsBounds.bottom &&
      playerBounds.bottom > obsBounds.top
    ) {
      return obs;
    }
  }

  return null;
}

// ─── Near-miss detection ────────────────────────────────

const NEAR_MISS_WALL_MARGIN = 15;
const NEAR_MISS_OBS_MARGIN = 20;

/** Cached return object — no allocation on hit */
const nearMissResult = { type: 'wall' as 'wall' | 'obstacle', x: 0, y: 0 };

export function checkNearMiss(
  player: Player,
  corridor: Corridor,
  obstacles: Obstacle[],
  _screenHeight: number
): { type: 'wall' | 'obstacle'; x: number; y: number } | null {
  const bounds = player.getBounds();

  // Wall near-miss
  for (let offset = -5; offset <= 5; offset += 5) {
    const walls = corridor.getWallsAt(player.x + offset);
    if (!walls) continue;
    const topDist = bounds.top - walls.topY;
    const bottomDist = walls.bottomY - bounds.bottom;
    if ((topDist > 0 && topDist < NEAR_MISS_WALL_MARGIN) ||
        (bottomDist > 0 && bottomDist < NEAR_MISS_WALL_MARGIN)) {
      nearMissResult.type = 'wall';
      nearMissResult.x = player.x;
      nearMissResult.y = player.y;
      return nearMissResult;
    }
  }

  // Obstacle near-miss
  const playerBounds = bounds;
  for (const obs of obstacles) {
    if (!obs.active) continue;
    const ob = getObstacleBounds(obs);
    if (ob.right - ob.left <= 0) continue; // skip portals / open gates

    // Check if player is within expanded bounds but NOT colliding
    if (
      playerBounds.left < ob.right + NEAR_MISS_OBS_MARGIN &&
      playerBounds.right > ob.left - NEAR_MISS_OBS_MARGIN &&
      playerBounds.top < ob.bottom + NEAR_MISS_OBS_MARGIN &&
      playerBounds.bottom > ob.top - NEAR_MISS_OBS_MARGIN
    ) {
      // Not actually colliding
      if (!(playerBounds.left < ob.right && playerBounds.right > ob.left &&
            playerBounds.top < ob.bottom && playerBounds.bottom > ob.top)) {
        nearMissResult.type = 'obstacle';
        nearMissResult.x = obs.x;
        nearMissResult.y = obs.y;
        return nearMissResult;
      }
    }
  }

  return null;
}
