import { SimplexNoise1D, clamp } from '../utils/Math';
import type { GameTheme } from '../themes/themes';

export interface CorridorPoint {
  x: number;
  topY: number;
  bottomY: number;
}

export class Corridor {
  points: CorridorPoint[] = [];
  private noise1: SimplexNoise1D;
  private noise2: SimplexNoise1D;
  private segmentWidth = 8;
  private baseGap = 220;
  private minGap = 80;
  private centerY: number;
  private generatedUpTo = 0;
  private canvasHeight: number;
  // Reusable return object for getWallsAt — avoids allocation per call
  private _wallsResult = { topY: 0, bottomY: 0 };

  constructor(canvasHeight: number) {
    this.canvasHeight = canvasHeight;
    this.centerY = canvasHeight / 2;
    this.noise1 = new SimplexNoise1D(Date.now());
    this.noise2 = new SimplexNoise1D(Date.now() + 12345);
  }

  reset(canvasHeight: number): void {
    this.canvasHeight = canvasHeight;
    this.centerY = canvasHeight / 2;
    this.points = [];
    this.generatedUpTo = 0;
    this.noise1 = new SimplexNoise1D(Date.now());
    this.noise2 = new SimplexNoise1D(Date.now() + 12345);
  }

  setBaseGap(gap: number): void {
    this.baseGap = gap;
  }

  generate(fromX: number, toX: number, difficulty: number): void {
    const startX = Math.max(fromX, this.generatedUpTo);
    if (startX >= toX) return;

    for (let x = startX; x <= toX; x += this.segmentWidth) {
      // Safe zone: first 400 pixels are wide and centered
      const safeBlend = clamp(x / 400, 0, 1);

      const normalizedX = x * 0.003;

      // Use noise for organic wall shapes - fade in from 0
      const topOffset = this.noise1.fbm(normalizedX, 3, 2.0, 0.5) * 100 * safeBlend;
      const bottomOffset = this.noise2.fbm(normalizedX + 100, 3, 2.0, 0.5) * 100 * safeBlend;

      // Gap narrows with difficulty
      const gap = Math.max(this.minGap, this.baseGap - difficulty * 2);

      // Corridor center oscillates - fade in from centered
      const centerOffset = this.noise1.fbm(normalizedX * 0.5, 2) * 120 * safeBlend;
      const center = this.centerY + centerOffset;

      let topY = center - gap / 2 + topOffset;
      let bottomY = center + gap / 2 + bottomOffset;

      // Ensure minimum gap
      const actualGap = bottomY - topY;
      if (actualGap < this.minGap) {
        const mid = (topY + bottomY) / 2;
        topY = mid - this.minGap / 2;
        bottomY = mid + this.minGap / 2;
      }

      // Clamp walls to stay on screen with some margin
      topY = clamp(topY, 20, this.canvasHeight - this.minGap - 20);
      bottomY = clamp(bottomY, topY + this.minGap, this.canvasHeight - 20);

      this.points.push({ x, topY, bottomY });
    }

    this.generatedUpTo = toX + this.segmentWidth;
  }

  cleanup(behindX: number): void {
    const cutoff = behindX - 200;
    let cutIndex = 0;
    while (cutIndex < this.points.length && this.points[cutIndex].x < cutoff) {
      cutIndex++;
    }
    if (cutIndex > 0) {
      this.points.splice(0, cutIndex);
    }
  }

  getWallsAt(x: number): { topY: number; bottomY: number } | null {
    // Find the two points bracketing x — binary search for large point arrays
    const pts = this.points;
    const len = pts.length;
    if (len < 2) return null;

    // Quick bounds check
    if (x < pts[0].x || x >= pts[len - 1].x) return null;

    // Binary search for the segment containing x
    let lo = 0;
    let hi = len - 2;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (pts[mid].x > x) hi = mid - 1;
      else if (pts[mid + 1].x <= x) lo = mid + 1;
      else {
        const p1 = pts[mid];
        const p2 = pts[mid + 1];
        const t = (x - p1.x) / (p2.x - p1.x);
        // Reuse cached object to avoid allocation
        this._wallsResult.topY = p1.topY + (p2.topY - p1.topY) * t;
        this._wallsResult.bottomY = p1.bottomY + (p2.bottomY - p1.bottomY) * t;
        return this._wallsResult;
      }
    }
    return null;
  }

  render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, _canvasWidth: number, canvasHeight: number, theme: GameTheme, waveMode = false): void {
    if (this.points.length < 2) return;

    // Find visible range indices — no array allocation
    const leftEdge = cameraX - 50;
    const rightEdge = cameraX + _canvasWidth + 50;
    let startIdx = -1;
    let endIdx = -1;
    for (let i = 0; i < this.points.length; i++) {
      const px = this.points[i].x;
      if (px >= leftEdge && startIdx === -1) startIdx = i;
      if (px <= rightEdge) endIdx = i;
    }
    if (startIdx === -1 || endIdx === -1 || endIdx - startIdx < 1) return;

    // Draw solid fill above top wall (deadly zone)
    ctx.fillStyle = theme.corridor.fillColor;
    ctx.beginPath();
    ctx.moveTo(this.points[startIdx].x - cameraX, -10);
    for (let i = startIdx; i <= endIdx; i++) {
      const p = this.points[i];
      ctx.lineTo(p.x - cameraX, p.topY - cameraY);
    }
    ctx.lineTo(this.points[endIdx].x - cameraX, -10);
    ctx.closePath();
    ctx.fill();
    ctx.fill();

    // Draw solid fill below bottom wall (deadly zone)
    ctx.beginPath();
    ctx.moveTo(this.points[startIdx].x - cameraX, canvasHeight + 10);
    for (let i = startIdx; i <= endIdx; i++) {
      const p = this.points[i];
      ctx.lineTo(p.x - cameraX, p.bottomY - cameraY);
    }
    ctx.lineTo(this.points[endIdx].x - cameraX, canvasHeight + 10);
    ctx.closePath();
    ctx.fill();
    ctx.fill();

    // Draw wall lines with glow
    if (theme.corridor.wallGlow || waveMode) {
      ctx.shadowColor = waveMode ? '#aa44ff' : theme.corridor.glowColor;
      ctx.shadowBlur = waveMode ? 18 : 12;
    }

    ctx.strokeStyle = waveMode ? '#cc66ff' : theme.corridor.wallColor;
    ctx.lineWidth = waveMode ? theme.corridor.wallThickness + 1 : theme.corridor.wallThickness;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Top wall
    ctx.beginPath();
    for (let i = startIdx; i <= endIdx; i++) {
      const p = this.points[i];
      const sx = p.x - cameraX;
      const sy = p.topY - cameraY;
      if (i === startIdx) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();

    // Bottom wall
    ctx.beginPath();
    for (let i = startIdx; i <= endIdx; i++) {
      const p = this.points[i];
      const sx = p.x - cameraX;
      const sy = p.bottomY - cameraY;
      if (i === startIdx) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();

    ctx.shadowBlur = 0;
  }
}
