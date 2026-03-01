import type { GameTheme } from '../themes/themes';

export type ObstacleType = 'sawblade' | 'spike_top' | 'spike_bottom' | 'block' | 'gate' | 'portal_ship' | 'portal_wave' | 'laser' | 'pulse_orb';

export interface Obstacle {
  type: ObstacleType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  rotationSpeed: number;
  active: boolean;
  // For moving obstacles
  moveAmplitude: number;
  moveSpeed: number;
  movePhase: number;
  baseY: number;
  // For gates and lasers (toggle on/off)
  gateOpen: boolean;
  gateTimer: number;
  gateInterval: number;
}

export function createObstacle(type: ObstacleType, x: number, y: number): Obstacle {
  const base: Obstacle = {
    type,
    x,
    y,
    width: 30,
    height: 30,
    rotation: 0,
    rotationSpeed: 0,
    active: true,
    moveAmplitude: 0,
    moveSpeed: 0,
    movePhase: Math.random() * Math.PI * 2,
    baseY: y,
    gateOpen: false,
    gateTimer: 0,
    gateInterval: 2,
  };

  switch (type) {
    case 'sawblade':
      base.width = 52;
      base.height = 52;
      base.rotationSpeed = 4 + Math.random() * 3;
      break;
    case 'spike_top':
    case 'spike_bottom':
      base.width = 28;
      base.height = 32;
      break;
    case 'block':
      base.width = 42 + Math.random() * 28;
      base.height = 42 + Math.random() * 28;
      break;
    case 'gate':
      base.width = 14;
      base.height = 80;
      base.gateInterval = 1.5 + Math.random() * 1.5;
      break;
    case 'portal_ship':
    case 'portal_wave':
      base.width = 20;
      base.height = 200;
      break;
    case 'laser':
      base.width = 200; // beam length (spans corridor)
      base.height = 4;  // beam thickness
      base.gateInterval = 1.2 + Math.random() * 1.0;
      base.gateTimer = Math.random() * base.gateInterval; // random start phase
      base.gateOpen = false; // starts off (safe), toggles to on (lethal)
      break;
    case 'pulse_orb':
      base.width = 40;
      base.height = 40;
      base.rotationSpeed = 2;
      base.moveAmplitude = 15;
      base.moveSpeed = 1.5 + Math.random();
      break;
  }

  return base;
}

export function updateObstacle(obs: Obstacle, dt: number, time: number): void {
  // Portals use rotation as animation timer
  if (obs.type === 'portal_ship' || obs.type === 'portal_wave') {
    obs.rotation = time;
    return;
  }

  // Rotation
  obs.rotation += obs.rotationSpeed * dt;

  // Movement
  if (obs.moveAmplitude > 0) {
    obs.y = obs.baseY + Math.sin(time * obs.moveSpeed + obs.movePhase) * obs.moveAmplitude;
  }

  // Gate/laser toggle
  if (obs.type === 'gate' || obs.type === 'laser') {
    obs.gateTimer += dt;
    if (obs.gateTimer >= obs.gateInterval) {
      obs.gateTimer = 0;
      obs.gateOpen = !obs.gateOpen;
    }
  }
}

export function renderObstacle(ctx: CanvasRenderingContext2D, obs: Obstacle, cameraX: number, cameraY: number, theme: GameTheme): void {
  const sx = obs.x - cameraX;
  const sy = obs.y - cameraY;

  if (theme.obstacles.glowIntensity > 0) {
    ctx.shadowColor = theme.obstacles.primaryColor;
    ctx.shadowBlur = 8 * theme.obstacles.glowIntensity;
  }

  ctx.fillStyle = theme.obstacles.primaryColor;
  ctx.strokeStyle = theme.obstacles.secondaryColor;
  ctx.lineWidth = 4;

  switch (obs.type) {
    case 'sawblade':
      renderSawblade(ctx, sx, sy, obs);
      break;
    case 'spike_top':
      renderSpike(ctx, sx, sy, obs, false);
      break;
    case 'spike_bottom':
      renderSpike(ctx, sx, sy, obs, true);
      break;
    case 'block':
      renderBlock(ctx, sx, sy, obs);
      break;
    case 'gate':
      renderGate(ctx, sx, sy, obs, theme);
      break;
    case 'portal_ship':
    case 'portal_wave':
      renderPortal(ctx, sx, sy, obs, theme);
      break;
    case 'laser':
      renderLaser(ctx, sx, sy, obs, theme);
      break;
    case 'pulse_orb':
      renderPulseOrb(ctx, sx, sy, obs, theme);
      break;
  }

  ctx.shadowBlur = 0;
}

function renderSawblade(ctx: CanvasRenderingContext2D, sx: number, sy: number, obs: Obstacle): void {
  const radius = obs.width / 2;
  const teeth = 8;

  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(obs.rotation);

  ctx.beginPath();
  for (let i = 0; i < teeth * 2; i++) {
    const angle = (Math.PI * 2 * i) / (teeth * 2);
    const r = i % 2 === 0 ? radius : radius * 0.65;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Center circle
  ctx.fillStyle = ctx.strokeStyle;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function renderSpike(ctx: CanvasRenderingContext2D, sx: number, sy: number, obs: Obstacle, fromBottom: boolean): void {
  const w = obs.width;
  const h = obs.height;

  ctx.beginPath();
  if (fromBottom) {
    ctx.moveTo(sx - w / 2, sy + h / 2);
    ctx.lineTo(sx, sy - h / 2);
    ctx.lineTo(sx + w / 2, sy + h / 2);
  } else {
    ctx.moveTo(sx - w / 2, sy - h / 2);
    ctx.lineTo(sx, sy + h / 2);
    ctx.lineTo(sx + w / 2, sy - h / 2);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function renderBlock(ctx: CanvasRenderingContext2D, sx: number, sy: number, obs: Obstacle): void {
  ctx.fillRect(sx - obs.width / 2, sy - obs.height / 2, obs.width, obs.height);
  ctx.strokeRect(sx - obs.width / 2, sy - obs.height / 2, obs.width, obs.height);
}

function renderGate(ctx: CanvasRenderingContext2D, sx: number, sy: number, obs: Obstacle, theme: GameTheme): void {
  if (obs.gateOpen) {
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = theme.obstacles.secondaryColor;
    ctx.fillRect(sx - obs.width / 2, sy - obs.height / 2, obs.width, obs.height);
    ctx.globalAlpha = 1;
  } else {
    ctx.fillRect(sx - obs.width / 2, sy - obs.height / 2, obs.width, obs.height);
    ctx.strokeRect(sx - obs.width / 2, sy - obs.height / 2, obs.width, obs.height);
  }
}

function renderLaser(ctx: CanvasRenderingContext2D, sx: number, sy: number, obs: Obstacle, _theme: GameTheme): void {
  const hw = obs.width / 2;
  // Laser charging/firing animation
  const chargeProgress = obs.gateTimer / obs.gateInterval;

  if (obs.gateOpen) {
    // ACTIVE — bright lethal beam
    const pulse = 0.8 + Math.sin(obs.gateTimer * 20) * 0.2;
    ctx.shadowColor = '#ff2200';
    ctx.shadowBlur = 20 * pulse;

    // Core beam
    ctx.strokeStyle = '#ff4422';
    ctx.lineWidth = 4;
    ctx.globalAlpha = pulse;
    ctx.beginPath();
    ctx.moveTo(sx - hw, sy);
    ctx.lineTo(sx + hw, sy);
    ctx.stroke();

    // Inner bright core
    ctx.strokeStyle = '#ffaa66';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx - hw, sy);
    ctx.lineTo(sx + hw, sy);
    ctx.stroke();

    // Glow halo
    ctx.strokeStyle = '#ff220044';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(sx - hw, sy);
    ctx.lineTo(sx + hw, sy);
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  } else {
    // CHARGING — dim warning line with emitters
    ctx.globalAlpha = 0.25 + chargeProgress * 0.3;
    ctx.strokeStyle = '#ff4422';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 8]);
    ctx.beginPath();
    ctx.moveTo(sx - hw, sy);
    ctx.lineTo(sx + hw, sy);
    ctx.stroke();
    ctx.setLineDash([]);

    // Emitter dots at ends
    const emitterGlow = chargeProgress;
    ctx.fillStyle = '#ff4422';
    ctx.globalAlpha = 0.4 + emitterGlow * 0.6;
    ctx.beginPath();
    ctx.arc(sx - hw, sy, 3 + emitterGlow * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx + hw, sy, 3 + emitterGlow * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
  }
}

function renderPulseOrb(ctx: CanvasRenderingContext2D, sx: number, sy: number, obs: Obstacle, _theme: GameTheme): void {
  const r = obs.width / 2;
  const pulse = Math.sin(obs.rotation * 3) * 0.2 + 0.8;
  const orbColor = '#ff66aa';

  // Outer glow ring
  ctx.shadowColor = orbColor;
  ctx.shadowBlur = 15 * pulse;
  ctx.strokeStyle = orbColor;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.4 * pulse;
  ctx.beginPath();
  ctx.arc(sx, sy, r + 4 + Math.sin(obs.rotation * 2) * 3, 0, Math.PI * 2);
  ctx.stroke();

  // Main orb
  ctx.globalAlpha = 0.7 * pulse;
  ctx.fillStyle = orbColor;
  ctx.beginPath();
  ctx.arc(sx, sy, r * pulse, 0, Math.PI * 2);
  ctx.fill();

  // Inner bright core
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = '#ffaacc';
  ctx.beginPath();
  ctx.arc(sx, sy, r * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Orbiting sparkle
  const sparkAngle = obs.rotation * 2;
  const sparkR = r + 2;
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.6 + Math.sin(obs.rotation * 5) * 0.4;
  ctx.beginPath();
  ctx.arc(
    sx + Math.cos(sparkAngle) * sparkR,
    sy + Math.sin(sparkAngle) * sparkR,
    2, 0, Math.PI * 2
  );
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function renderPortal(ctx: CanvasRenderingContext2D, sx: number, sy: number, obs: Obstacle, _theme: GameTheme): void {
  const isWavePortal = obs.type === 'portal_wave';
  const color = isWavePortal ? '#aa44ff' : '#4488ff';
  const h = obs.height;

  // Shimmering vertical beam
  const shimmer = Math.sin(obs.rotation * 3) * 0.15 + 0.85;

  ctx.globalAlpha = 0.15 * shimmer;
  ctx.fillStyle = color;
  ctx.fillRect(sx - 12, sy - h / 2, 24, h);

  ctx.globalAlpha = 0.6 * shimmer;
  ctx.fillStyle = color;
  ctx.fillRect(sx - 3, sy - h / 2, 6, h);

  // Center ring
  ctx.globalAlpha = 0.9 * shimmer;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.shadowColor = color;
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(sx, sy, 14, 0, Math.PI * 2);
  ctx.stroke();

  // Inner icon: wave = zigzag, ship = curved line
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (isWavePortal) {
    ctx.moveTo(sx - 7, sy + 4);
    ctx.lineTo(sx - 2, sy - 4);
    ctx.lineTo(sx + 2, sy + 4);
    ctx.lineTo(sx + 7, sy - 4);
  } else {
    ctx.moveTo(sx - 7, sy + 3);
    ctx.quadraticCurveTo(sx, sy - 6, sx + 7, sy + 3);
  }
  ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

export function getObstacleBounds(obs: Obstacle): { left: number; top: number; right: number; bottom: number } {
  // Portals are non-lethal
  if (obs.type === 'portal_ship' || obs.type === 'portal_wave') {
    return { left: 0, top: 0, right: 0, bottom: 0 };
  }
  if (obs.type === 'sawblade') {
    const r = obs.width / 2 * 0.8;
    return { left: obs.x - r, top: obs.y - r, right: obs.x + r, bottom: obs.y + r };
  }
  if (obs.type === 'gate' && obs.gateOpen) {
    return { left: 0, top: 0, right: 0, bottom: 0 };
  }
  // Laser — only lethal when active (gateOpen = true)
  if (obs.type === 'laser') {
    if (!obs.gateOpen) return { left: 0, top: 0, right: 0, bottom: 0 };
    const hw = obs.width / 2;
    return { left: obs.x - hw, top: obs.y - 3, right: obs.x + hw, bottom: obs.y + 3 };
  }
  // Pulse orb — round hitbox
  if (obs.type === 'pulse_orb') {
    const r = obs.width / 2 * 0.75;
    return { left: obs.x - r, top: obs.y - r, right: obs.x + r, bottom: obs.y + r };
  }
  const hw = obs.width / 2 * 0.85;
  const hh = obs.height / 2 * 0.85;
  return { left: obs.x - hw, top: obs.y - hh, right: obs.x + hw, bottom: obs.y + hh };
}

/** Check if player overlaps a portal (separate from lethal collision) */
export function checkPortalCollision(obs: Obstacle, px: number, py: number): boolean {
  if (obs.type !== 'portal_ship' && obs.type !== 'portal_wave') return false;
  const hw = obs.width / 2 + 5;
  const hh = obs.height / 2;
  return px >= obs.x - hw && px <= obs.x + hw && py >= obs.y - hh && py <= obs.y + hh;
}
