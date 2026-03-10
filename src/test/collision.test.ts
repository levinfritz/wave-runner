import { describe, it, expect } from 'vitest';
import { Player } from '../game/Player';
import { checkWallCollision, checkObstacleCollision, checkNearMiss } from '../game/Collision';
import { createObstacle } from '../game/Obstacle';
import type { Corridor } from '../game/Corridor';

// Minimal corridor stub with configurable wall positions
function makeCorridorStub(topY: number, bottomY: number): Corridor {
  return {
    getWallsAt: () => ({ topY, bottomY }),
  } as unknown as Corridor;
}

function makeCorridorNoWalls(): Corridor {
  return {
    getWallsAt: () => null,
  } as unknown as Corridor;
}

describe('checkWallCollision', () => {
  it('should return false when player is centered in corridor', () => {
    const p = new Player();
    p.reset(100, 300); // center
    const corridor = makeCorridorStub(100, 500); // wide gap
    expect(checkWallCollision(p, corridor, 600)).toBe(false);
  });

  it('should return true when player touches top wall', () => {
    const p = new Player();
    p.reset(100, 115); // player bounds.top = 115 - 10 = 105
    const corridor = makeCorridorStub(110, 500); // top wall at 110
    // bounds.top (105) <= walls.topY (110) → collision
    expect(checkWallCollision(p, corridor, 600)).toBe(true);
  });

  it('should return true when player touches bottom wall', () => {
    const p = new Player();
    p.reset(100, 490); // player bounds.bottom = 490 + 10 = 500
    const corridor = makeCorridorStub(100, 495); // bottom wall at 495
    // bounds.bottom (500) >= walls.bottomY (495) → collision
    expect(checkWallCollision(p, corridor, 600)).toBe(true);
  });

  it('should return true when player goes off screen top', () => {
    const p = new Player();
    p.reset(100, -25); // y = -25, below -20 threshold
    const corridor = makeCorridorNoWalls();
    expect(checkWallCollision(p, corridor, 600)).toBe(true);
  });

  it('should return true when player goes off screen bottom', () => {
    const p = new Player();
    p.reset(100, 625); // y = 625, above screenHeight + 20 = 620
    const corridor = makeCorridorNoWalls();
    expect(checkWallCollision(p, corridor, 600)).toBe(true);
  });

  it('should return false when no walls data exists', () => {
    const p = new Player();
    p.reset(100, 300);
    const corridor = makeCorridorNoWalls();
    expect(checkWallCollision(p, corridor, 600)).toBe(false);
  });

  it('should detect collision at player x offsets (-5, 0, +5)', () => {
    const p = new Player();
    p.reset(100, 200);
    // Corridor stub that only reports walls for certain offsets
    let queriedOffsets: number[] = [];
    const corridor = {
      getWallsAt: (x: number) => {
        queriedOffsets.push(x);
        return { topY: 50, bottomY: 500 };
      },
    } as unknown as Corridor;
    checkWallCollision(p, corridor, 600);
    // Should query at x-5=95, x=100, x+5=105
    expect(queriedOffsets).toEqual([95, 100, 105]);
  });
});

describe('checkObstacleCollision', () => {
  it('should return null when no obstacles exist', () => {
    const p = new Player();
    p.reset(100, 300);
    expect(checkObstacleCollision(p, [])).toBeNull();
  });

  it('should detect collision with sawblade', () => {
    const p = new Player();
    p.reset(100, 300);
    const obs = createObstacle('sawblade', 105, 300); // very close
    const result = checkObstacleCollision(p, [obs]);
    expect(result).toBe(obs);
  });

  it('should not collide when player is far from obstacle', () => {
    const p = new Player();
    p.reset(100, 300);
    const obs = createObstacle('sawblade', 500, 300); // far away
    expect(checkObstacleCollision(p, [obs])).toBeNull();
  });

  it('should skip inactive obstacles', () => {
    const p = new Player();
    p.reset(100, 300);
    const obs = createObstacle('sawblade', 105, 300);
    obs.active = false;
    expect(checkObstacleCollision(p, [obs])).toBeNull();
  });

  it('should not collide with portals (zero bounds)', () => {
    const p = new Player();
    p.reset(100, 300);
    const obs = createObstacle('portal_wave', 100, 300);
    expect(checkObstacleCollision(p, [obs])).toBeNull();
  });

  it('should not collide with open gate', () => {
    const p = new Player();
    p.reset(100, 300);
    const obs = createObstacle('gate', 100, 300);
    obs.gateOpen = true;
    expect(checkObstacleCollision(p, [obs])).toBeNull();
  });

  it('should collide with closed gate', () => {
    const p = new Player();
    p.reset(100, 300);
    const obs = createObstacle('gate', 105, 300);
    obs.gateOpen = false;
    const result = checkObstacleCollision(p, [obs]);
    expect(result).toBe(obs);
  });

  it('should not collide with inactive laser', () => {
    const p = new Player();
    p.reset(100, 300);
    const obs = createObstacle('laser', 100, 300);
    obs.gateOpen = false; // laser off
    expect(checkObstacleCollision(p, [obs])).toBeNull();
  });

  it('should collide with active laser', () => {
    const p = new Player();
    p.reset(100, 300);
    const obs = createObstacle('laser', 100, 300);
    obs.gateOpen = true; // laser on
    const result = checkObstacleCollision(p, [obs]);
    expect(result).toBe(obs);
  });
});

describe('checkNearMiss', () => {
  it('should return null when player is far from walls', () => {
    const p = new Player();
    p.reset(100, 300);
    const corridor = makeCorridorStub(100, 500);
    expect(checkNearMiss(p, corridor, [], 600)).toBeNull();
  });

  it('should detect wall near-miss at top', () => {
    const p = new Player();
    p.reset(100, 300);
    // Player bounds.top = 290. Wall topY = 280. Distance = 290-280 = 10 < 15 margin
    const corridor = makeCorridorStub(280, 500);
    const result = checkNearMiss(p, corridor, [], 600);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('wall');
  });

  it('should detect wall near-miss at bottom', () => {
    const p = new Player();
    p.reset(100, 300);
    // Player bounds.bottom = 310. Wall bottomY = 320. Distance = 320-310 = 10 < 15 margin
    const corridor = makeCorridorStub(100, 320);
    const result = checkNearMiss(p, corridor, [], 600);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('wall');
  });

  it('should not trigger near-miss when actually colliding', () => {
    const p = new Player();
    p.reset(100, 300);
    // Player bounds.top = 290, wall topY = 295 → collision (bounds.top <= topY)
    // This would be a collision, not a near-miss. Near-miss requires distance > 0
    const corridor = makeCorridorStub(295, 500);
    // topDist = 290 - 295 = -5, which is <= 0, so not a near-miss
    expect(checkNearMiss(p, corridor, [], 600)).toBeNull();
  });

  it('should detect obstacle near-miss', () => {
    const p = new Player();
    p.reset(100, 300);
    // Sawblade with radius ~20.8 (52/2*0.8). At x=135, y=300:
    // obs bounds right = 135+20.8=155.8, player bounds left = 90
    // obs bounds left = 135-20.8=114.2, player bounds right = 110
    // Player right (110) < obs left (114.2) → no collision
    // But 110 > 114.2 - 20 = 94.2 → within near-miss margin
    const obs = createObstacle('sawblade', 135, 300);
    const result = checkNearMiss(p, makeCorridorStub(50, 550), [obs], 600);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('obstacle');
  });

  it('should skip portals and open gates for near-miss', () => {
    const p = new Player();
    p.reset(100, 300);
    const portal = createObstacle('portal_wave', 105, 300);
    const gate = createObstacle('gate', 105, 300);
    gate.gateOpen = true;
    expect(checkNearMiss(p, makeCorridorStub(50, 550), [portal, gate], 600)).toBeNull();
  });
});
