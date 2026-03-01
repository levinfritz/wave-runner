import { lerp } from '../utils/Math';

export class Camera {
  x = 0;
  y = 0;
  targetX = 0;
  targetY = 0;
  width: number;
  height: number;
  shakeIntensity = 0;
  private shakeDecay = 5;
  private shakeOffsetX = 0;
  private shakeOffsetY = 0;
  private smoothing = 0.1;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  follow(playerX: number, playerY: number): void {
    // Camera leads slightly ahead of player
    this.targetX = playerX - this.width * 0.3;
    this.targetY = playerY - this.height / 2;
  }

  update(dt: number): void {
    this.x = lerp(this.x, this.targetX, this.smoothing);
    this.y = lerp(this.y, this.targetY, this.smoothing * 0.3);

    // Screen shake
    if (this.shakeIntensity > 0.1) {
      this.shakeOffsetX = (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.shakeOffsetY = (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.shakeIntensity *= Math.exp(-this.shakeDecay * dt);
    } else {
      this.shakeIntensity = 0;
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }
  }

  shake(intensity: number): void {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }

  get renderX(): number {
    return this.x + this.shakeOffsetX;
  }

  get renderY(): number {
    return this.y + this.shakeOffsetY;
  }

  worldToScreen(wx: number, wy: number): [number, number] {
    return [wx - this.renderX, wy - this.renderY];
  }

  isVisible(wx: number, wy: number, margin: number = 100): boolean {
    const sx = wx - this.renderX;
    const sy = wy - this.renderY;
    return sx > -margin && sx < this.width + margin && sy > -margin && sy < this.height + margin;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }
}
