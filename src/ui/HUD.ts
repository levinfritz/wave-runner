import type { Game } from '../game/Game';
import type { GameTheme } from '../themes/themes';

// ─── Floating Text System ──────────────────────────────

interface FloatingText {
  text: string;
  x: number;
  y: number;
  color: string;
  life: number;
  maxLife: number;
  tag?: string;
}

const floatingTexts: FloatingText[] = [];

export function addFloatingText(text: string, screenX: number, screenY: number, color: string, tag?: string): void {
  // If tagged, replace any existing text with same tag to prevent spam
  if (tag) {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      if (floatingTexts[i].tag === tag) {
        floatingTexts.splice(i, 1);
      }
    }
  }
  floatingTexts.push({ text, x: screenX, y: screenY, color, life: 0.8, maxLife: 0.8, tag });
}

// ─── Toast System ──────────────────────────────────────

interface Toast {
  title: string;
  subtitle: string;
  icon: string;
  timer: number;
}

const toastQueue: Toast[] = [];
let activeToast: Toast | null = null;
const TOAST_DURATION = 3;
const TOAST_SLIDE_TIME = 0.3;

export function showToast(title: string, subtitle = '', icon = ''): void {
  toastQueue.push({ title, subtitle, icon, timer: TOAST_DURATION });
}

// ─── Speed Lines State ─────────────────────────────────

let speedLinePhase = 0;

// ─── Render ────────────────────────────────────────────

export function renderHUD(ctx: CanvasRenderingContext2D, game: Game, theme: GameTheme, dt: number): void {
  if (game.state !== 'playing') return;

  // Update floating texts
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    ft.life -= dt;
    ft.y -= 40 * dt; // drift upward
    if (ft.life <= 0) {
      floatingTexts.splice(i, 1);
    }
  }

  // Update toast queue
  if (activeToast) {
    activeToast.timer -= dt;
    if (activeToast.timer <= 0) {
      activeToast = null;
    }
  }
  if (!activeToast && toastQueue.length > 0) {
    activeToast = toastQueue.shift()!;
  }

  // Tutorial hints — only during the very first game
  if (game.showTutorial && game.distance < 30) {
    ctx.save();
    const alpha = Math.max(0, 1 - game.distance / 25);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    const tutW = 260;
    const tutH = 50;
    const tutX = game.width / 2 - tutW / 2;
    const tutY = game.height / 2 + 60;
    ctx.beginPath();
    ctx.moveTo(tutX + 8, tutY);
    ctx.lineTo(tutX + tutW - 8, tutY);
    ctx.quadraticCurveTo(tutX + tutW, tutY, tutX + tutW, tutY + 8);
    ctx.lineTo(tutX + tutW, tutY + tutH - 8);
    ctx.quadraticCurveTo(tutX + tutW, tutY + tutH, tutX + tutW - 8, tutY + tutH);
    ctx.lineTo(tutX + 8, tutY + tutH);
    ctx.quadraticCurveTo(tutX, tutY + tutH, tutX, tutY + tutH - 8);
    ctx.lineTo(tutX, tutY + 8);
    ctx.quadraticCurveTo(tutX, tutY, tutX + 8, tutY);
    ctx.closePath();
    ctx.fill();
    ctx.font = 'bold 16px "Outfit", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Hold SPACE / Tap to fly up', game.width / 2, tutY + 18);
    ctx.font = '13px "Outfit", Arial, sans-serif';
    ctx.fillStyle = '#ffffffaa';
    ctx.fillText('Release to fall down', game.width / 2, tutY + 36);
    ctx.restore();
  }

  const w = game.width;
  const h = game.height;

  // Pause button - top left (circle backdrop for mobile tap target)
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.arc(25, 25, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = theme.ui.textColor + 'cc';
  ctx.fillRect(18, 16, 5, 18);
  ctx.fillRect(27, 16, 5, 18);

  // Distance counter - top center
  ctx.fillStyle = theme.ui.textColor;
  ctx.font = 'bold 28px "Outfit", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  ctx.shadowColor = theme.ui.accentColor;
  ctx.shadowBlur = 8;
  if (game.mode === 'classic' && game.classicTargetDistance > 0) {
    ctx.fillText(`${game.distance}m / ${game.classicTargetDistance}m`, w / 2, 20);
  } else {
    ctx.fillText(`${game.distance}m`, w / 2, 20);
  }
  ctx.shadowBlur = 0;

  // Classic mode progress bar
  if (game.mode === 'classic' && game.classicTargetDistance > 0) {
    const barW = 200;
    const barH = 4;
    const barX = w / 2 - barW / 2;
    const barY = 54;
    const progress = Math.min(1, game.distance / game.classicTargetDistance);

    ctx.fillStyle = theme.ui.textColor + '25';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = theme.ui.accentColor;
    ctx.fillRect(barX, barY, barW * progress, barH);

    // Bar end markers
    ctx.fillStyle = theme.ui.textColor + '40';
    ctx.fillRect(barX, barY - 1, 1, barH + 2);
    ctx.fillRect(barX + barW, barY - 1, 1, barH + 2);
  }

  // Coins - top right
  ctx.font = 'bold 18px "Outfit", Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffcc00';
  ctx.shadowColor = '#ffcc00';
  ctx.shadowBlur = 6;
  ctx.fillText(`${game.coinsCollected}`, w - 22, 22);
  ctx.shadowBlur = 0;
  // Coin icon
  ctx.beginPath();
  ctx.arc(w - 42, 30, 6, 0, Math.PI * 2);
  ctx.fill();

  // Highscore - below coins
  ctx.font = '14px "Outfit", Arial, sans-serif';
  ctx.fillStyle = theme.ui.accentColor;
  ctx.textAlign = 'right';
  ctx.fillText(`Best: ${game.highScore}m`, w - 20, 44);

  // Speed lines at screen edges (replacing small speed bar)
  const speedRange = game.maxScrollSpeed - game.baseScrollSpeed;
  const speedPct = speedRange > 0 ? (game.scrollSpeed - game.baseScrollSpeed) / speedRange : 0;

  if (speedPct > 0.3) {
    speedLinePhase += dt * (2 + speedPct * 6);
    const intensity = (speedPct - 0.3) / 0.7; // 0→1 as speedPct goes 0.3→1.0
    const lineCount = Math.floor(3 + intensity * 6);
    const lineAlpha = 0.1 + intensity * 0.2;

    ctx.save();
    ctx.strokeStyle = theme.ui.accentColor;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = lineAlpha;

    for (let i = 0; i < lineCount; i++) {
      const t = ((speedLinePhase + i * 1.7) % 3) / 3; // 0→1 cycling
      const lineLen = 20 + intensity * 40;

      // Left edge lines
      const ly = t * h;
      ctx.beginPath();
      ctx.moveTo(0, ly);
      ctx.lineTo(lineLen, ly);
      ctx.stroke();

      // Right edge lines
      const ry = ((t + 0.5) % 1) * h;
      ctx.beginPath();
      ctx.moveTo(w, ry);
      ctx.lineTo(w - lineLen, ry);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Physics mode indicator - bottom left
  const mode = game.player.physicsMode;
  const modeColor = mode === 'wave' ? '#aa44ff' : '#4488ff';
  ctx.font = 'bold 12px "Outfit", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = modeColor;
  ctx.shadowColor = modeColor;
  ctx.shadowBlur = 6;
  ctx.fillText(mode === 'wave' ? 'WAVE' : 'SHIP', 16, h - 42);
  ctx.shadowBlur = 0;

  // Mode icon - below label
  ctx.strokeStyle = modeColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (mode === 'wave') {
    ctx.moveTo(16, h - 28);
    ctx.lineTo(22, h - 36);
    ctx.lineTo(28, h - 28);
    ctx.lineTo(34, h - 36);
  } else {
    ctx.moveTo(16, h - 28);
    ctx.quadraticCurveTo(25, h - 40, 34, h - 28);
  }
  ctx.stroke();

  // Near-miss combo counter — bottom center
  if (game.nearMissCombo >= 2 && game.nearMissComboTimer > 0) {
    const comboAlpha = game.nearMissComboTimer < 0.5 ? game.nearMissComboTimer / 0.5 : 1;
    const pulse = 1 + Math.sin(game.gameTime * 8) * 0.08;
    // Color escalation: white → cyan → gold
    const combo = game.nearMissCombo;
    const comboColor = combo >= 15 ? '#ffcc00' : combo >= 8 ? '#ff8844' : combo >= 4 ? '#00ccff' : '#ffffff';
    // Size scales with combo (22px → 30px)
    const fontSize = Math.min(30, 22 + combo * 0.8);
    const comboText = `x${combo} CLOSE!`;
    ctx.save();
    ctx.globalAlpha = comboAlpha;
    ctx.translate(w / 2, h - 50);
    ctx.scale(pulse, pulse);
    // Background pill
    ctx.font = `bold ${fontSize}px "Outfit", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const pillW = ctx.measureText(comboText).width + 24;
    const pillH = fontSize + 12;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    const pr = pillH / 2;
    ctx.arc(-pillW / 2 + pr, 0, pr, Math.PI * 0.5, Math.PI * 1.5);
    ctx.arc(pillW / 2 - pr, 0, pr, Math.PI * 1.5, Math.PI * 0.5);
    ctx.closePath();
    ctx.fill();
    // Text
    ctx.fillStyle = comboColor;
    ctx.shadowColor = comboColor;
    ctx.shadowBlur = 12;
    ctx.fillText(comboText, 0, 0);
    ctx.restore();
  }

  // Theme name (subtle, during transitions)
  if (game.themeManager.isTransitioning) {
    const alpha = Math.sin(game.themeManager.progress * Math.PI);
    ctx.globalAlpha = alpha * 0.5;
    ctx.font = '14px "Outfit", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = theme.ui.textColor;
    ctx.fillText(theme.name, w / 2, 55 + (game.mode === 'classic' ? 12 : 0));
    ctx.globalAlpha = 1;
  }

  // Render floating texts
  for (const ft of floatingTexts) {
    const alpha = ft.life / ft.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 16px "Outfit", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = ft.color;
    ctx.shadowColor = ft.color;
    ctx.shadowBlur = 6;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  }

  // Render toast notification
  if (activeToast) {
    const t = activeToast.timer;
    const total = TOAST_DURATION;
    // Slide in during first TOAST_SLIDE_TIME, slide out during last TOAST_SLIDE_TIME
    let slideY = 0;
    if (t > total - TOAST_SLIDE_TIME) {
      // Sliding in
      const progress = (total - t) / TOAST_SLIDE_TIME;
      slideY = -60 * (1 - progress);
    } else if (t < TOAST_SLIDE_TIME) {
      // Sliding out
      const progress = t / TOAST_SLIDE_TIME;
      slideY = -60 * (1 - progress);
    }

    const hasIcon = activeToast.icon.length > 0;
    const toastW = 280;
    const toastH = activeToast.subtitle ? 52 : 36;
    const toastX = w / 2 - toastW / 2;
    const toastY = 8 + slideY;
    const contentOffsetX = hasIcon ? 14 : 0;

    ctx.save();
    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(toastX + 6, toastY);
    ctx.lineTo(toastX + toastW - 6, toastY);
    ctx.quadraticCurveTo(toastX + toastW, toastY, toastX + toastW, toastY + 6);
    ctx.lineTo(toastX + toastW, toastY + toastH - 6);
    ctx.quadraticCurveTo(toastX + toastW, toastY + toastH, toastX + toastW - 6, toastY + toastH);
    ctx.lineTo(toastX + 6, toastY + toastH);
    ctx.quadraticCurveTo(toastX, toastY + toastH, toastX, toastY + toastH - 6);
    ctx.lineTo(toastX, toastY + 6);
    ctx.quadraticCurveTo(toastX, toastY, toastX + 6, toastY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Icon (large, left side)
    if (hasIcon) {
      ctx.font = '22px "Outfit", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffcc00';
      ctx.fillText(activeToast.icon, toastX + 24, toastY + toastH / 2);
    }

    // Title
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 14px "Outfit", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ffcc00';
    ctx.shadowBlur = 4;
    ctx.fillText(activeToast.title, w / 2 + contentOffsetX, toastY + (activeToast.subtitle ? 16 : toastH / 2));
    ctx.shadowBlur = 0;

    // Subtitle
    if (activeToast.subtitle) {
      ctx.fillStyle = '#ffffffcc';
      ctx.font = '12px "Outfit", Arial, sans-serif';
      ctx.fillText(activeToast.subtitle, w / 2 + contentOffsetX, toastY + 36);
    }
    ctx.restore();
  }
}
