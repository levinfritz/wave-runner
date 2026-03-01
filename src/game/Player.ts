import type { GameTheme } from '../themes/themes';

export interface TrailPoint {
  x: number;
  y: number;
  age: number;
}

export type PhysicsMode = 'ship' | 'wave';

export class Player {
  x = 0;
  y = 0;
  vy = 0;
  width = 24;
  height = 24;
  alive = true;
  trail: TrailPoint[] = [];
  private maxTrailLength = 50;
  private trailTimer = 0;
  private trailInterval = 0.016;

  // Physics
  physicsMode: PhysicsMode = 'ship';
  private gravity = 1200;
  private flapForce = -1200;
  private maxVelocity = 450;
  private wasHolding = false;

  // Visual
  rotation = 0;
  deathParticles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];

  // Skin & trail
  skinType: string = 'default';
  trailType: string = 'default';

  reset(startX: number, startY: number): void {
    this.x = startX;
    this.y = startY;
    this.vy = 0;
    this.alive = true;
    this.trail = [];
    this.rotation = 0;
    this.wasHolding = false;
    this.deathParticles = [];
    this.physicsMode = 'ship';
  }

  update(dt: number, isHolding: boolean, scrollSpeed: number): void {
    if (!this.alive) {
      let write = 0;
      for (let i = 0; i < this.deathParticles.length; i++) {
        const p = this.deathParticles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 300 * dt;
        p.life -= dt;
        if (p.life > 0) {
          this.deathParticles[write++] = p;
        }
      }
      this.deathParticles.length = write;
      return;
    }

    if (this.physicsMode === 'wave') {
      this.updateWave(dt, isHolding, scrollSpeed);
    } else {
      this.updateShip(dt, isHolding, scrollSpeed);
    }

    this.x += scrollSpeed * dt;

    // Trail
    this.trailTimer += dt;
    if (this.trailTimer >= this.trailInterval) {
      this.trailTimer = 0;
      this.trail.push({ x: this.x, y: this.y, age: 0 });
      if (this.trail.length > this.maxTrailLength) {
        this.trail.splice(0, this.trail.length - this.maxTrailLength);
      }
    }
    for (const point of this.trail) {
      point.age += dt;
    }
  }

  /** Ship mode: gravity + thrust + momentum (current behavior) */
  private updateShip(dt: number, isHolding: boolean, _scrollSpeed: number): void {
    // Cut velocity on direction change
    if (!isHolding && this.wasHolding && this.vy < 0) {
      this.vy *= 0.3;
    }
    if (isHolding && !this.wasHolding && this.vy > 0) {
      this.vy *= 0.3;
    }
    this.wasHolding = isHolding;

    if (isHolding) {
      this.vy += this.flapForce * dt;
    } else {
      this.vy += this.gravity * dt;
    }

    this.vy = Math.max(-this.maxVelocity, Math.min(this.maxVelocity, this.vy));
    this.y += this.vy * dt;

    // Smooth rotation based on velocity
    this.rotation = (this.vy / this.maxVelocity) * 0.6;
  }

  /** Wave mode: fixed 45° diagonal, zero momentum, instant direction change */
  private updateWave(dt: number, isHolding: boolean, scrollSpeed: number): void {
    this.wasHolding = isHolding;

    // Instant direction — vertical speed matches horizontal for 45° angle
    const waveSpeed = scrollSpeed * 0.85; // slightly less than 45° for playability
    this.vy = isHolding ? -waveSpeed : waveSpeed;

    this.y += this.vy * dt;

    // Sharp rotation snapping to ±45°
    const targetRotation = isHolding ? -0.75 : 0.75;
    this.rotation = targetRotation;
  }

  die(theme: GameTheme): void {
    if (!this.alive) return;
    this.alive = false;

    // Spawn death particles
    const colors = [theme.player.color, theme.player.trailColor, theme.obstacles.primaryColor];
    for (let i = 0; i < 24; i++) {
      const angle = (Math.PI * 2 * i) / 24 + Math.random() * 0.3;
      const speed = 100 + Math.random() * 200;
      this.deathParticles.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, theme: GameTheme): void {
    // Draw trail
    this.renderTrail(ctx, cameraX, cameraY, theme);

    // Draw death particles
    if (!this.alive) {
      for (const p of this.deathParticles) {
        const sx = p.x - cameraX;
        const sy = p.y - cameraY;
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(sx, sy, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      return;
    }

    const sx = this.x - cameraX;
    const sy = this.y - cameraY;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(this.rotation);
    ctx.scale(1.5, 1.5); // Bold scale — bigger player like Space Waves

    // Glow effect
    if (theme.player.trailGlow) {
      ctx.shadowColor = theme.player.trailColor;
      ctx.shadowBlur = 15;
    }

    // Draw player shape based on skin
    ctx.fillStyle = theme.player.color;
    ctx.beginPath();

    switch (this.skinType) {
      case 'arrow':
        ctx.moveTo(10, 0);
        ctx.lineTo(-8, -8);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-8, 8);
        ctx.closePath();
        break;
      case 'star':
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
          const r = i % 2 === 0 ? 10 : 5;
          const method = i === 0 ? 'moveTo' : 'lineTo';
          ctx[method](Math.cos(angle) * r, Math.sin(angle) * r);
          const innerAngle = angle + Math.PI / 5;
          ctx.lineTo(Math.cos(innerAngle) * 5, Math.sin(innerAngle) * 5);
        }
        ctx.closePath();
        break;
      case 'diamond':
        ctx.moveTo(10, 0);
        ctx.lineTo(0, -8);
        ctx.lineTo(-10, 0);
        ctx.lineTo(0, 8);
        ctx.closePath();
        break;
      case 'rocket':
        ctx.moveTo(12, 0);
        ctx.lineTo(4, -7);
        ctx.lineTo(-8, -5);
        ctx.lineTo(-6, 0);
        ctx.lineTo(-8, 5);
        ctx.lineTo(4, 7);
        ctx.closePath();
        break;
      case 'circle':
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        break;
      case 'triangle':
        ctx.moveTo(10, 0);
        ctx.lineTo(-6, -9);
        ctx.lineTo(-6, 9);
        ctx.closePath();
        break;
      case 'hexagon':
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI * 2) / 6;
          if (i === 0) ctx.moveTo(Math.cos(a) * 9, Math.sin(a) * 9);
          else ctx.lineTo(Math.cos(a) * 9, Math.sin(a) * 9);
        }
        ctx.closePath();
        break;
      case 'pentagon':
        for (let i = 0; i < 5; i++) {
          const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
          if (i === 0) ctx.moveTo(Math.cos(a) * 9, Math.sin(a) * 9);
          else ctx.lineTo(Math.cos(a) * 9, Math.sin(a) * 9);
        }
        ctx.closePath();
        break;
      case 'cross':
        ctx.moveTo(-3, -9); ctx.lineTo(3, -9); ctx.lineTo(3, -3);
        ctx.lineTo(9, -3); ctx.lineTo(9, 3); ctx.lineTo(3, 3);
        ctx.lineTo(3, 9); ctx.lineTo(-3, 9); ctx.lineTo(-3, 3);
        ctx.lineTo(-9, 3); ctx.lineTo(-9, -3); ctx.lineTo(-3, -3);
        ctx.closePath();
        break;
      case 'bolt':
        ctx.moveTo(2, -10); ctx.lineTo(-4, -1); ctx.lineTo(1, -1);
        ctx.lineTo(-2, 10); ctx.lineTo(4, 1); ctx.lineTo(-1, 1);
        ctx.closePath();
        break;
      case 'shield':
        ctx.moveTo(0, -10); ctx.lineTo(9, -5); ctx.lineTo(9, 2);
        ctx.quadraticCurveTo(9, 8, 0, 11);
        ctx.quadraticCurveTo(-9, 8, -9, 2);
        ctx.lineTo(-9, -5);
        ctx.closePath();
        break;
      case 'heart':
        ctx.moveTo(0, 10);
        ctx.bezierCurveTo(-10, 2, -10, -5, -5, -8);
        ctx.bezierCurveTo(-2, -10, 0, -7, 0, -5);
        ctx.bezierCurveTo(0, -7, 2, -10, 5, -8);
        ctx.bezierCurveTo(10, -5, 10, 2, 0, 10);
        ctx.closePath();
        break;
      case 'crown':
        ctx.moveTo(-9, 5); ctx.lineTo(-9, -2); ctx.lineTo(-5, 3);
        ctx.lineTo(0, -8); ctx.lineTo(5, 3); ctx.lineTo(9, -2);
        ctx.lineTo(9, 5);
        ctx.closePath();
        break;
      case 'blade':
        ctx.moveTo(12, 0); ctx.lineTo(3, -5); ctx.lineTo(-10, -2);
        ctx.lineTo(-12, 0); ctx.lineTo(-10, 2); ctx.lineTo(3, 5);
        ctx.closePath();
        break;
      case 'crescent':
        ctx.arc(0, 0, 9, 0.5, Math.PI * 2 - 0.5);
        ctx.arc(3, 0, 7, Math.PI * 2 - 0.7, 0.7, true);
        ctx.closePath();
        break;
      case 'ghost':
        ctx.moveTo(-7, 8); ctx.lineTo(-7, -2);
        ctx.quadraticCurveTo(-7, -9, 0, -9);
        ctx.quadraticCurveTo(7, -9, 7, -2);
        ctx.lineTo(7, 8); ctx.lineTo(4, 5); ctx.lineTo(1, 8);
        ctx.lineTo(-2, 5); ctx.lineTo(-5, 8);
        ctx.closePath();
        break;
      case 'flame':
        ctx.moveTo(0, -10);
        ctx.quadraticCurveTo(6, -6, 8, 0);
        ctx.quadraticCurveTo(9, 5, 5, 9);
        ctx.quadraticCurveTo(3, 6, 0, 9);
        ctx.quadraticCurveTo(-3, 6, -5, 9);
        ctx.quadraticCurveTo(-9, 5, -8, 0);
        ctx.quadraticCurveTo(-6, -6, 0, -10);
        ctx.closePath();
        break;
      case 'skull':
        ctx.arc(0, -2, 8, Math.PI, 0);
        ctx.lineTo(8, 2); ctx.quadraticCurveTo(8, 7, 4, 7);
        ctx.lineTo(4, 9); ctx.lineTo(1, 7); ctx.lineTo(-1, 9);
        ctx.lineTo(-4, 7); ctx.quadraticCurveTo(-8, 7, -8, 2);
        ctx.closePath();
        break;
      case 'eye':
        ctx.moveTo(10, 0);
        ctx.quadraticCurveTo(0, -10, -10, 0);
        ctx.quadraticCurveTo(0, 10, 10, 0);
        ctx.closePath();
        break;
      default: // droplet
        ctx.moveTo(10, 0);
        ctx.quadraticCurveTo(10, -8, 0, -8);
        ctx.quadraticCurveTo(-10, -8, -10, 0);
        ctx.quadraticCurveTo(-10, 8, 0, 8);
        ctx.quadraticCurveTo(10, 8, 10, 0);
        ctx.closePath();
    }

    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private renderTrail(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, theme: GameTheme): void {
    if (this.trail.length < 2) return;

    const glow = theme.player.trailGlow;

    switch (this.trailType) {
      case 'rainbow':
        this.renderRainbowTrail(ctx, cameraX, cameraY, glow);
        return;
      case 'fire':
        this.renderFireTrail(ctx, cameraX, cameraY, glow);
        return;
      case 'glitter':
        this.renderGlitterTrail(ctx, cameraX, cameraY, theme, glow);
        return;
      case 'double':
        this.renderDoubleTrail(ctx, cameraX, cameraY, theme, glow);
        return;
      case 'thick':
        this.renderDefaultTrail(ctx, cameraX, cameraY, theme, glow, 9);
        return;
      case 'dashed':
        this.renderDashedTrail(ctx, cameraX, cameraY, theme, glow);
        return;
      case 'dotted':
        this.renderDottedTrail(ctx, cameraX, cameraY, theme, glow);
        return;
      case 'zigzag':
        this.renderZigzagTrail(ctx, cameraX, cameraY, theme, glow);
        return;
      case 'neon':
        this.renderDefaultTrail(ctx, cameraX, cameraY, theme, true, 6);
        return;
      case 'ice':
        this.renderIceTrail(ctx, cameraX, cameraY, glow);
        return;
      case 'electric':
        this.renderElectricTrail(ctx, cameraX, cameraY, glow);
        return;
      case 'wave':
        this.renderWaveTrail(ctx, cameraX, cameraY, theme, glow);
        return;
      case 'fade':
        this.renderFadeTrail(ctx, cameraX, cameraY, theme, glow);
        return;
      case 'pulse':
        this.renderPulseTrail(ctx, cameraX, cameraY, theme, glow);
        return;
      default:
        this.renderDefaultTrail(ctx, cameraX, cameraY, theme, glow, 5);
        return;
    }
  }

  private renderDefaultTrail(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, theme: GameTheme, glow: boolean, width: number): void {
    if (glow) { ctx.shadowColor = theme.player.trailColor; ctx.shadowBlur = 10; }
    ctx.strokeStyle = theme.player.trailColor;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < this.trail.length; i++) {
      const p = this.trail[i];
      const sx = p.x - cameraX;
      const sy = p.y - cameraY;
      ctx.globalAlpha = (this.trail.length - i) / this.trail.length * 0.8;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  private renderRainbowTrail(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, glow: boolean): void {
    const colors = ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0088ff', '#8800ff'];
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    for (let i = 1; i < this.trail.length; i++) {
      const p0 = this.trail[i - 1];
      const p1 = this.trail[i];
      ctx.globalAlpha = (this.trail.length - i) / this.trail.length * 0.85;
      ctx.strokeStyle = colors[i % colors.length];
      if (glow) { ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 8; }
      ctx.beginPath();
      ctx.moveTo(p0.x - cameraX, p0.y - cameraY);
      ctx.lineTo(p1.x - cameraX, p1.y - cameraY);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  private renderFireTrail(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, glow: boolean): void {
    ctx.lineCap = 'round';
    for (let i = 1; i < this.trail.length; i++) {
      const p0 = this.trail[i - 1];
      const p1 = this.trail[i];
      const t = (this.trail.length - i) / this.trail.length;
      ctx.globalAlpha = t * 0.9;
      // Shift from yellow to red as trail ages
      const r = 255;
      const g = Math.floor(200 * t);
      ctx.strokeStyle = `rgb(${r},${g},0)`;
      ctx.lineWidth = 3 + t * 5;
      if (glow) { ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 12; }
      ctx.beginPath();
      ctx.moveTo(p0.x - cameraX, p0.y - cameraY);
      ctx.lineTo(p1.x - cameraX, p1.y - cameraY);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  private renderGlitterTrail(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, theme: GameTheme, glow: boolean): void {
    if (glow) { ctx.shadowColor = theme.player.trailColor; ctx.shadowBlur = 6; }
    for (let i = 0; i < this.trail.length; i += 2) {
      const p = this.trail[i];
      const t = (this.trail.length - i) / this.trail.length;
      ctx.globalAlpha = t * 0.8;
      ctx.fillStyle = theme.player.trailColor;
      const size = 2 + t * 4;
      ctx.fillRect(p.x - cameraX - size / 2, p.y - cameraY - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  private renderDoubleTrail(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, theme: GameTheme, glow: boolean): void {
    if (glow) { ctx.shadowColor = theme.player.trailColor; ctx.shadowBlur = 8; }
    ctx.strokeStyle = theme.player.trailColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (const offset of [-5, 5]) {
      ctx.beginPath();
      for (let i = 0; i < this.trail.length; i++) {
        const p = this.trail[i];
        ctx.globalAlpha = (this.trail.length - i) / this.trail.length * 0.7;
        const sx = p.x - cameraX;
        const sy = p.y - cameraY + offset;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  private renderDashedTrail(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, theme: GameTheme, glow: boolean): void {
    if (glow) { ctx.shadowColor = theme.player.trailColor; ctx.shadowBlur = 8; }
    ctx.strokeStyle = theme.player.trailColor;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.setLineDash([8, 5]);
    ctx.beginPath();
    for (let i = 0; i < this.trail.length; i++) {
      const p = this.trail[i];
      ctx.globalAlpha = (this.trail.length - i) / this.trail.length * 0.8;
      if (i === 0) ctx.moveTo(p.x - cameraX, p.y - cameraY);
      else ctx.lineTo(p.x - cameraX, p.y - cameraY);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  private renderDottedTrail(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, theme: GameTheme, glow: boolean): void {
    if (glow) { ctx.shadowColor = theme.player.trailColor; ctx.shadowBlur = 6; }
    ctx.fillStyle = theme.player.trailColor;
    for (let i = 0; i < this.trail.length; i += 3) {
      const p = this.trail[i];
      const t = (this.trail.length - i) / this.trail.length;
      ctx.globalAlpha = t * 0.8;
      ctx.beginPath();
      ctx.arc(p.x - cameraX, p.y - cameraY, 2 + t * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  private renderZigzagTrail(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, theme: GameTheme, glow: boolean): void {
    if (glow) { ctx.shadowColor = theme.player.trailColor; ctx.shadowBlur = 8; }
    ctx.strokeStyle = theme.player.trailColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < this.trail.length; i++) {
      const p = this.trail[i];
      const offset = (i % 2 === 0 ? 4 : -4);
      const sx = p.x - cameraX;
      const sy = p.y - cameraY + offset;
      ctx.globalAlpha = (this.trail.length - i) / this.trail.length * 0.8;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  private renderIceTrail(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, glow: boolean): void {
    if (glow) { ctx.shadowColor = '#88ccff'; ctx.shadowBlur = 10; }
    ctx.strokeStyle = '#88ccff';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < this.trail.length; i++) {
      const p = this.trail[i];
      ctx.globalAlpha = (this.trail.length - i) / this.trail.length * 0.7;
      if (i === 0) ctx.moveTo(p.x - cameraX, p.y - cameraY);
      else ctx.lineTo(p.x - cameraX, p.y - cameraY);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  private renderElectricTrail(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, glow: boolean): void {
    if (glow) { ctx.shadowColor = '#ffff44'; ctx.shadowBlur = 12; }
    ctx.strokeStyle = '#ffff44';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < this.trail.length; i++) {
      const p = this.trail[i];
      const jitter = (i % 3 === 0) ? (Math.random() - 0.5) * 8 : 0;
      ctx.globalAlpha = (this.trail.length - i) / this.trail.length * 0.85;
      if (i === 0) ctx.moveTo(p.x - cameraX, p.y - cameraY + jitter);
      else ctx.lineTo(p.x - cameraX, p.y - cameraY + jitter);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  private renderWaveTrail(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, theme: GameTheme, glow: boolean): void {
    if (glow) { ctx.shadowColor = theme.player.trailColor; ctx.shadowBlur = 8; }
    ctx.strokeStyle = theme.player.trailColor;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < this.trail.length; i++) {
      const p = this.trail[i];
      const wave = Math.sin(i * 0.3) * 5;
      ctx.globalAlpha = (this.trail.length - i) / this.trail.length * 0.8;
      if (i === 0) ctx.moveTo(p.x - cameraX, p.y - cameraY + wave);
      else ctx.lineTo(p.x - cameraX, p.y - cameraY + wave);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  private renderFadeTrail(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, theme: GameTheme, glow: boolean): void {
    if (glow) { ctx.shadowColor = theme.player.trailColor; ctx.shadowBlur = 6; }
    ctx.lineCap = 'round';
    for (let i = 1; i < this.trail.length; i++) {
      const p0 = this.trail[i - 1];
      const p1 = this.trail[i];
      const t = (this.trail.length - i) / this.trail.length;
      ctx.globalAlpha = t * t * 0.6; // quadratic fade
      ctx.strokeStyle = theme.player.trailColor;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(p0.x - cameraX, p0.y - cameraY);
      ctx.lineTo(p1.x - cameraX, p1.y - cameraY);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  private renderPulseTrail(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, theme: GameTheme, glow: boolean): void {
    if (glow) { ctx.shadowColor = theme.player.trailColor; ctx.shadowBlur = 8; }
    ctx.strokeStyle = theme.player.trailColor;
    ctx.lineCap = 'round';
    for (let i = 1; i < this.trail.length; i++) {
      const p0 = this.trail[i - 1];
      const p1 = this.trail[i];
      const t = (this.trail.length - i) / this.trail.length;
      const pulse = 2.5 + Math.sin(i * 0.5) * 3;
      ctx.globalAlpha = t * 0.8;
      ctx.lineWidth = pulse;
      ctx.beginPath();
      ctx.moveTo(p0.x - cameraX, p0.y - cameraY);
      ctx.lineTo(p1.x - cameraX, p1.y - cameraY);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  getBounds(): { left: number; top: number; right: number; bottom: number } {
    return {
      left: this.x - 10,
      top: this.y - 10,
      right: this.x + 10,
      bottom: this.y + 10,
    };
  }
}
