import { describe, it, expect } from 'vitest';
import { createObstacle, getObstacleBounds, checkPortalCollision, updateObstacle } from '../game/Obstacle';

describe('Portal obstacles', () => {
  it('portal_wave should have zero collision bounds', () => {
    const portal = createObstacle('portal_wave', 100, 300);
    const bounds = getObstacleBounds(portal);
    expect(bounds.left).toBe(0);
    expect(bounds.right).toBe(0);
    expect(bounds.top).toBe(0);
    expect(bounds.bottom).toBe(0);
  });

  it('portal_ship should have zero collision bounds', () => {
    const portal = createObstacle('portal_ship', 100, 300);
    const bounds = getObstacleBounds(portal);
    expect(bounds.left).toBe(0);
    expect(bounds.right).toBe(0);
  });

  it('checkPortalCollision should detect player inside portal', () => {
    const portal = createObstacle('portal_wave', 100, 300);
    portal.height = 200; // spans from 200 to 400
    // Player at portal center
    expect(checkPortalCollision(portal, 100, 300)).toBe(true);
    // Player at edge of portal
    expect(checkPortalCollision(portal, 105, 300)).toBe(true);
    // Player far away
    expect(checkPortalCollision(portal, 200, 300)).toBe(false);
  });

  it('checkPortalCollision should return false for non-portal obstacles', () => {
    const sawblade = createObstacle('sawblade', 100, 300);
    expect(checkPortalCollision(sawblade, 100, 300)).toBe(false);
  });

  it('portal should use rotation as time counter for shimmer animation', () => {
    const portal = createObstacle('portal_wave', 100, 300);
    expect(portal.rotation).toBe(0);
    updateObstacle(portal, 0.016, 5.0);
    expect(portal.rotation).toBe(5.0); // should be set to time, not incremented
  });

  it('sawblade should still rotate normally', () => {
    const saw = createObstacle('sawblade', 100, 300);
    const initialRotation = saw.rotation;
    updateObstacle(saw, 0.016, 1.0);
    expect(saw.rotation).toBeGreaterThan(initialRotation);
  });
});

describe('Obstacle collision bounds', () => {
  it('sawblade should have forgiving bounds (0.8x)', () => {
    const saw = createObstacle('sawblade', 100, 100);
    const bounds = getObstacleBounds(saw);
    const expectedR = saw.width / 2 * 0.8;
    expect(bounds.left).toBeCloseTo(100 - expectedR);
    expect(bounds.right).toBeCloseTo(100 + expectedR);
  });

  it('open gate should have zero bounds', () => {
    const gate = createObstacle('gate', 100, 100);
    gate.gateOpen = true;
    const bounds = getObstacleBounds(gate);
    expect(bounds.left).toBe(0);
    expect(bounds.right).toBe(0);
  });

  it('closed gate should have non-zero bounds', () => {
    const gate = createObstacle('gate', 100, 100);
    gate.gateOpen = false;
    const bounds = getObstacleBounds(gate);
    expect(bounds.right - bounds.left).toBeGreaterThan(0);
  });
});
