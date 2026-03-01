import type { GameTheme, PatternType } from '../themes/themes';

// Cache gradient to avoid recreating every frame
let cachedGrad: CanvasGradient | null = null;
let cachedGradKey = '';
let cachedGradH = 0;

export function renderBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cameraX: number,
  theme: GameTheme,
  time: number
): void {
  // Draw gradient — only recreate when colors or height change
  const colors = theme.background.gradient;
  const gradKey = colors.join(',');
  if (!cachedGrad || gradKey !== cachedGradKey || height !== cachedGradH) {
    cachedGrad = ctx.createLinearGradient(0, 0, 0, height);
    if (colors.length === 1) {
      cachedGrad.addColorStop(0, colors[0]);
      cachedGrad.addColorStop(1, colors[0]);
    } else {
      for (let i = 0; i < colors.length; i++) {
        cachedGrad.addColorStop(i / (colors.length - 1), colors[i]);
      }
    }
    cachedGradKey = gradKey;
    cachedGradH = height;
  }
  ctx.fillStyle = cachedGrad;
  ctx.fillRect(0, 0, width, height);

  // Draw pattern
  if (theme.background.pattern !== 'none') {
    drawPattern(ctx, width, height, cameraX, theme.background.pattern, theme.background.patternColor, theme.background.patternScale, time);
  }
}

function drawPattern(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cameraX: number,
  pattern: PatternType,
  color: string,
  scale: number,
  _time: number
): void {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1;

  const spacing = 40 * scale;
  const offsetX = -(cameraX * 0.3) % spacing;

  switch (pattern) {
    case 'grid':
      for (let x = offsetX; x < width; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      break;

    case 'diamonds':
      for (let x = offsetX - spacing; x < width + spacing; x += spacing) {
        for (let y = 0; y < height; y += spacing) {
          const ox = (Math.floor(y / spacing) % 2) * spacing / 2;
          ctx.beginPath();
          ctx.moveTo(x + ox, y - spacing * 0.3);
          ctx.lineTo(x + ox + spacing * 0.3, y);
          ctx.lineTo(x + ox, y + spacing * 0.3);
          ctx.lineTo(x + ox - spacing * 0.3, y);
          ctx.closePath();
          ctx.stroke();
        }
      }
      break;

    case 'dots':
      for (let x = offsetX; x < width; x += spacing) {
        for (let y = 0; y < height; y += spacing) {
          ctx.beginPath();
          ctx.arc(x, y, 2 * scale, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;

    case 'waves':
      for (let y = 0; y < height; y += spacing * 1.5) {
        ctx.beginPath();
        for (let x = 0; x < width; x += 2) {
          const wy = y + Math.sin((x + offsetX * 3) * 0.02) * spacing * 0.4;
          if (x === 0) ctx.moveTo(x, wy);
          else ctx.lineTo(x, wy);
        }
        ctx.stroke();
      }
      break;

    case 'hexagons': {
      const hexSize = spacing * 0.4;
      for (let x = offsetX - spacing; x < width + spacing; x += spacing * 1.5) {
        for (let y = 0; y < height; y += spacing * 0.866) {
          const ox = (Math.floor(y / (spacing * 0.866)) % 2) * spacing * 0.75;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const px = x + ox + Math.cos(angle) * hexSize;
            const py = y + Math.sin(angle) * hexSize;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
      break;
    }

    case 'circuits': {
      ctx.lineWidth = 1.5;
      const step = spacing * 1.2;
      for (let x = offsetX - step; x < width + step; x += step) {
        for (let y = 0; y < height; y += step) {
          // Horizontal segment
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + step * 0.4, y);
          ctx.stroke();
          // Vertical segment
          ctx.beginPath();
          ctx.moveTo(x + step * 0.4, y);
          ctx.lineTo(x + step * 0.4, y + step * 0.3);
          ctx.stroke();
          // Node
          ctx.beginPath();
          ctx.arc(x + step * 0.4, y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }

    case 'stars':
      for (let x = offsetX; x < width; x += spacing * 2) {
        for (let y = 0; y < height; y += spacing * 2) {
          const pseudoRand = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
          const frac = pseudoRand - Math.floor(pseudoRand);
          if (frac > 0.7) {
            const size = 1 + frac * 2;
            ctx.beginPath();
            ctx.arc(x + frac * spacing, y + (1 - frac) * spacing, size, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      break;

    case 'triangles':
      for (let x = offsetX - spacing; x < width + spacing; x += spacing) {
        for (let y = 0; y < height; y += spacing) {
          const ox = (Math.floor(y / spacing) % 2) * spacing / 2;
          ctx.beginPath();
          ctx.moveTo(x + ox, y - spacing * 0.25);
          ctx.lineTo(x + ox + spacing * 0.25, y + spacing * 0.25);
          ctx.lineTo(x + ox - spacing * 0.25, y + spacing * 0.25);
          ctx.closePath();
          ctx.stroke();
        }
      }
      break;

    case 'crosses':
      for (let x = offsetX; x < width; x += spacing) {
        for (let y = 0; y < height; y += spacing) {
          const s = spacing * 0.15;
          ctx.beginPath();
          ctx.moveTo(x - s, y);
          ctx.lineTo(x + s, y);
          ctx.moveTo(x, y - s);
          ctx.lineTo(x, y + s);
          ctx.stroke();
        }
      }
      break;

    case 'rings':
      for (let x = offsetX; x < width + spacing; x += spacing * 1.5) {
        for (let y = 0; y < height; y += spacing * 1.5) {
          ctx.beginPath();
          ctx.arc(x, y, spacing * 0.3, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      break;
  }
}
