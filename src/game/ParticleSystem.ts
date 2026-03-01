import type { ParticleStyle } from '../themes/themes';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  style: ParticleStyle;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private spawnTimer = 0;
  private maxParticles = 100;

  update(dt: number): void {
    let i = 0;
    while (i < this.particles.length) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      // Style-specific behavior
      switch (p.style) {
        case 'bubbles':
          p.vy -= 30 * dt;
          p.vx += Math.sin(p.life * 5) * 10 * dt;
          break;
        case 'snow':
          p.vx += Math.sin(p.life * 3) * 20 * dt;
          break;
        case 'fire':
          p.vy -= 80 * dt;
          p.vx += (Math.random() - 0.5) * 40 * dt;
          break;
        case 'petals':
          p.vx += Math.sin(p.life * 2) * 15 * dt;
          p.vy += Math.cos(p.life * 1.5) * 5 * dt;
          break;
        case 'fireflies':
          p.vx += Math.sin(p.life * 4 + p.x * 0.01) * 30 * dt;
          p.vy += Math.cos(p.life * 3 + p.y * 0.01) * 30 * dt;
          break;
      }

      if (p.life <= 0) {
        // Swap with last and pop — O(1) instead of O(n)
        this.particles[i] = this.particles[this.particles.length - 1];
        this.particles.pop();
      } else {
        i++;
      }
    }
  }

  spawn(
    cameraX: number,
    cameraY: number,
    canvasWidth: number,
    canvasHeight: number,
    color: string,
    style: ParticleStyle,
    dt: number
  ): void {
    this.spawnTimer += dt;
    const rate = style === 'rain' ? 0.01 : 0.05;

    while (this.spawnTimer >= rate && this.particles.length < this.maxParticles) {
      this.spawnTimer -= rate;
      const p = this.createParticle(cameraX, cameraY, canvasWidth, canvasHeight, color, style);
      this.particles.push(p);
    }
  }

  private createParticle(
    cameraX: number,
    cameraY: number,
    canvasWidth: number,
    canvasHeight: number,
    color: string,
    style: ParticleStyle
  ): Particle {
    const base: Particle = {
      x: cameraX + Math.random() * canvasWidth,
      y: cameraY + Math.random() * canvasHeight,
      vx: 0,
      vy: 0,
      life: 2 + Math.random() * 2,
      maxLife: 4,
      size: 2 + Math.random() * 3,
      color,
      style,
    };

    switch (style) {
      case 'sparks':
        base.vx = -50 + Math.random() * 30;
        base.vy = (Math.random() - 0.5) * 60;
        base.size = 1 + Math.random() * 2;
        base.life = 0.5 + Math.random() * 1;
        break;
      case 'bubbles':
        base.vy = -20 - Math.random() * 30;
        base.size = 3 + Math.random() * 5;
        break;
      case 'snow':
        base.y = cameraY - 10;
        base.vy = 30 + Math.random() * 40;
        base.vx = -10 + Math.random() * 20;
        base.size = 2 + Math.random() * 3;
        base.life = 5 + Math.random() * 3;
        break;
      case 'fire':
        base.y = cameraY + canvasHeight;
        base.vy = -60 - Math.random() * 80;
        base.vx = (Math.random() - 0.5) * 30;
        base.size = 3 + Math.random() * 4;
        base.life = 1 + Math.random() * 1;
        break;
      case 'stars':
        base.size = 1 + Math.random() * 2;
        base.life = 1 + Math.random() * 2;
        break;
      case 'pixels':
        base.vx = (Math.random() - 0.5) * 20;
        base.vy = (Math.random() - 0.5) * 20;
        base.size = 3;
        break;
      case 'rain':
        base.y = cameraY - 10;
        base.vy = 300 + Math.random() * 200;
        base.vx = -30;
        base.size = 1;
        base.life = 2;
        break;
      case 'petals':
        base.y = cameraY - 10;
        base.vy = 20 + Math.random() * 30;
        base.vx = -20 + Math.random() * 10;
        base.size = 3 + Math.random() * 3;
        base.life = 4 + Math.random() * 3;
        break;
      case 'ash':
        base.y = cameraY - 10;
        base.vy = 15 + Math.random() * 25;
        base.vx = -10 + Math.random() * 20;
        base.size = 2 + Math.random() * 2;
        base.life = 3 + Math.random() * 2;
        break;
      case 'fireflies':
        base.life = 2 + Math.random() * 3;
        base.size = 2 + Math.random() * 2;
        break;
      case 'glitter':
        base.vx = (Math.random() - 0.5) * 40;
        base.vy = (Math.random() - 0.5) * 40;
        base.size = 1 + Math.random() * 2;
        base.life = 0.5 + Math.random() * 1;
        break;
      case 'dust':
        base.vx = -20 + Math.random() * 10;
        base.vy = (Math.random() - 0.5) * 10;
        base.size = 1 + Math.random() * 2;
        base.life = 2 + Math.random() * 3;
        break;
    }

    base.maxLife = base.life;
    return base;
  }

  render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    for (const p of this.particles) {
      const sx = p.x - cameraX;
      const sy = p.y - cameraY;
      const alpha = Math.min(1, p.life / (p.maxLife * 0.3));

      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      switch (p.style) {
        case 'pixels':
          ctx.fillRect(sx - p.size / 2, sy - p.size / 2, p.size, p.size);
          break;
        case 'rain':
          ctx.fillRect(sx, sy, 1, 8);
          break;
        case 'stars':
        case 'glitter':
        case 'fireflies':
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          break;
        default:
          ctx.beginPath();
          ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;
      }
    }
    ctx.globalAlpha = 1;
  }

  /** Burst particles at a world position (e.g., coin pickup) */
  burst(worldX: number, worldY: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 60 + Math.random() * 80;
      this.particles.push({
        x: worldX,
        y: worldY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.3 + Math.random() * 0.3,
        maxLife: 0.6,
        size: 2 + Math.random() * 2,
        color,
        style: 'sparks',
      });
    }
  }

  clear(): void {
    this.particles = [];
  }
}
