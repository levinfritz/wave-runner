import type { Game } from '../game/Game';
import type { GameTheme } from '../themes/themes';

export function renderHUD(ctx: CanvasRenderingContext2D, game: Game, theme: GameTheme): void {
  if (game.state !== 'playing') return;

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
    ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Hold SPACE / Tap to fly up', game.width / 2, tutY + 18);
    ctx.font = '13px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#ffffffaa';
    ctx.fillText('Release to fall down', game.width / 2, tutY + 36);
    ctx.restore();
  }

  const w = game.width;
  const h = game.height;

  // Pause button - top left
  ctx.fillStyle = theme.ui.textColor + '80';
  ctx.fillRect(16, 16, 6, 18);
  ctx.fillRect(26, 16, 6, 18);

  // Distance counter - top center
  ctx.fillStyle = theme.ui.textColor;
  ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
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

  // Coins - top right
  ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
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
  ctx.font = '14px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = theme.ui.accentColor;
  ctx.fillText(`Best: ${game.highScore}m`, w - 20, 44);

  // Speed indicator - small bar bottom center
  const speedRange = game.maxScrollSpeed - game.baseScrollSpeed;
  const speedPct = speedRange > 0 ? (game.scrollSpeed - game.baseScrollSpeed) / speedRange : 0;
  const barW = 100;
  const barH = 3;
  const barX = w / 2 - barW / 2;
  const barY = h - 12;
  ctx.fillStyle = theme.ui.textColor + '40';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = theme.ui.accentColor;
  ctx.fillRect(barX, barY, barW * speedPct, barH);

  // Physics mode indicator - bottom left (above speed bar)
  const mode = game.player.physicsMode;
  const modeColor = mode === 'wave' ? '#aa44ff' : '#4488ff';
  ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
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

  // Theme name (subtle, during transitions)
  if (game.themeManager.isTransitioning) {
    const alpha = Math.sin(game.themeManager.progress * Math.PI);
    ctx.globalAlpha = alpha * 0.5;
    ctx.font = '14px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = theme.ui.textColor;
    ctx.fillText(theme.name, w / 2, 55);
    ctx.globalAlpha = 1;
  }
}
