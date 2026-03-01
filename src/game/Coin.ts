import type { GameTheme } from '../themes/themes';

export interface Coin {
  x: number;
  y: number;
  collected: boolean;
  animTimer: number;
}

export function createCoin(x: number, y: number): Coin {
  return { x, y, collected: false, animTimer: Math.random() * Math.PI * 2 };
}

export function updateCoin(coin: Coin, dt: number): void {
  coin.animTimer += dt * 3;
}

export function renderCoin(ctx: CanvasRenderingContext2D, coin: Coin, cameraX: number, cameraY: number, theme: GameTheme): void {
  if (coin.collected) return;
  const sx = coin.x - cameraX;
  const sy = coin.y - cameraY + Math.sin(coin.animTimer) * 4;

  // Glow
  ctx.shadowColor = '#ffcc00';
  ctx.shadowBlur = 10;

  // Coin body
  const scaleX = Math.abs(Math.cos(coin.animTimer * 0.8));
  ctx.fillStyle = '#ffcc00';
  ctx.beginPath();
  ctx.ellipse(sx, sy, 8 * Math.max(0.3, scaleX), 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Inner shine
  ctx.fillStyle = '#ffee66';
  ctx.beginPath();
  ctx.ellipse(sx, sy, 4 * Math.max(0.3, scaleX), 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
}

export function checkCoinCollision(coin: Coin, playerX: number, playerY: number): boolean {
  if (coin.collected) return false;
  const dx = coin.x - playerX;
  const dy = coin.y - playerY;
  return dx * dx + dy * dy < 20 * 20;
}
