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
