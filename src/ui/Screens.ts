import type { Game, GameState } from '../game/Game';
import type { GameTheme } from '../themes/themes';
import { SKINS, TRAILS, getRarity, RARITY_COLORS } from '../game/Skins';
import { LEVELS } from '../game/Levels';
import { ACHIEVEMENTS } from '../game/Achievements';
import { loadSave, getTodayString } from '../utils/Storage';
import { easeOutCubic } from '../utils/Math';

// Animation timers
let menuAnimTime = 0;
let deathAnimTime = 0;
let titlePulse = 0;
let shopScroll = 0;
let shopScrollMax = 0;
let shopTab: 'skins' | 'trails' = 'skins';

// Screen transition state
export type MenuScreen = 'main' | 'settings' | 'shop' | 'level_select' | 'achievements';
let currentMenuScreen: MenuScreen = 'main';
let transitionFrom: MenuScreen | null = null;
let transitionProgress = 0;
const TRANSITION_DURATION = 0.2;

// Button hover tracking
let hoverX = -1;
let hoverY = -1;

// Purchase confirmation dialog
let confirmDialog: { itemName: string; price: number; action: string } | null = null;

export function showConfirmDialog(itemName: string, price: number, action: string): void {
  confirmDialog = { itemName, price, action };
}

export function getConfirmDialog(): { itemName: string; price: number; action: string } | null {
  return confirmDialog;
}

export function closeConfirmDialog(): void {
  confirmDialog = null;
}

// Price shake animation (triggered when player can't afford item)
let priceShakeTimer = 0;
let priceShakeItemId = '';

export function triggerPriceShake(itemId: string): void {
  priceShakeTimer = 0.3;
  priceShakeItemId = itemId;
}

export function updateButtonHover(mx: number, my: number): void {
  hoverX = mx;
  hoverY = my;
}

export function getMenuScreen(): MenuScreen {
  return currentMenuScreen;
}

export function navigateTo(screen: MenuScreen): void {
  if (screen === currentMenuScreen) return;
  transitionFrom = currentMenuScreen;
  currentMenuScreen = screen;
  transitionProgress = 0;
  menuAnimTime = 0; // reset for staggered animations on new screen
}

// Button rectangles for click detection
export interface UIButton {
  x: number;
  y: number;
  w: number;
  h: number;
  action: string;
}

let buttons: UIButton[] = [];

export function getButtons(): UIButton[] {
  return buttons;
}

export function scrollShop(delta: number): void {
  shopScroll = Math.max(0, Math.min(shopScrollMax, shopScroll + delta));
}

export function resetShopScroll(): void {
  shopScroll = 0;
}

export function setShopTab(tab: 'skins' | 'trails'): void {
  shopTab = tab;
  shopScroll = 0;
}

export function getShopTab(): string {
  return shopTab;
}

export function updateScreens(dt: number, state: GameState): void {
  if (state === 'menu') {
    menuAnimTime += dt;
    titlePulse += dt;
    // Advance screen transition
    if (transitionFrom !== null) {
      transitionProgress += dt / TRANSITION_DURATION;
      if (transitionProgress >= 1) {
        transitionFrom = null;
        transitionProgress = 0;
      }
    }
    // Price shake countdown
    if (priceShakeTimer > 0) {
      priceShakeTimer -= dt;
      if (priceShakeTimer <= 0) priceShakeItemId = '';
    }
  } else if (state === 'dead') {
    deathAnimTime += dt;
  } else {
    deathAnimTime = 0;
  }
}

/** Render the current menu screen with optional transition */
export function renderMenuScreen(ctx: CanvasRenderingContext2D, w: number, h: number, theme: GameTheme, settings?: any): void {
  const isTransitioning = transitionFrom !== null;

  if (isTransitioning) {
    const t = easeOutCubic(Math.min(1, transitionProgress));

    // Render outgoing screen (fading out, sliding left)
    ctx.save();
    ctx.globalAlpha = 1 - t;
    ctx.translate(-w * t * 0.15, 0);
    renderScreen(ctx, w, h, theme, transitionFrom!, settings);
    ctx.restore();

    // Render incoming screen (fading in, sliding from right)
    ctx.save();
    ctx.globalAlpha = t;
    ctx.translate(w * (1 - t) * 0.15, 0);
    renderScreen(ctx, w, h, theme, currentMenuScreen, settings);
    ctx.restore();
  } else {
    renderScreen(ctx, w, h, theme, currentMenuScreen, settings);
  }

  // Confirmation dialog overlay (renders on top of everything)
  if (confirmDialog) {
    renderConfirmDialog(ctx, w, h, theme);
  }
}

function renderConfirmDialog(ctx: CanvasRenderingContext2D, w: number, h: number, theme: GameTheme): void {
  if (!confirmDialog) return;

  // Dim background
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, w, h);

  // Dialog box
  const dlgW = 260;
  const dlgH = 140;
  const dlgX = w / 2 - dlgW / 2;
  const dlgY = h / 2 - dlgH / 2;

  ctx.fillStyle = 'rgba(20,20,30,0.95)';
  ctx.strokeStyle = theme.ui.accentColor;
  ctx.lineWidth = 2;
  roundRect(ctx, dlgX, dlgY, dlgW, dlgH, 12);

  // Title
  ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = theme.ui.textColor;
  ctx.fillText(`Buy ${confirmDialog.itemName}?`, w / 2, dlgY + 30);

  // Price
  ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#ffcc00';
  const priceStr = `${confirmDialog.price}`;
  const priceTextW = ctx.measureText(priceStr).width;
  ctx.fillText(priceStr, w / 2 + 8, dlgY + 58);
  drawCoinIcon(ctx, w / 2 + 8 - priceTextW / 2 - 12, dlgY + 58, 10);

  // Buttons
  const cBtnW = 100;
  const cBtnH = 36;
  const gap = 16;

  // Confirm button
  const confirmX = w / 2 - cBtnW - gap / 2;
  const confirmY = dlgY + dlgH - cBtnH - 16;
  drawButton(ctx, confirmX, confirmY, cBtnW, cBtnH, 'Buy', theme, true);
  buttons.push({ x: confirmX, y: confirmY, w: cBtnW, h: cBtnH, action: `confirm_${confirmDialog.action}` });

  // Cancel button
  const cancelX = w / 2 + gap / 2;
  drawButton(ctx, cancelX, confirmY, cBtnW, cBtnH, 'Cancel', theme, false);
  buttons.push({ x: cancelX, y: confirmY, w: cBtnW, h: cBtnH, action: 'cancel_purchase' });
}

function renderScreen(ctx: CanvasRenderingContext2D, w: number, h: number, theme: GameTheme, screen: MenuScreen, settings?: any): void {
  switch (screen) {
    case 'settings':
      renderSettingsScreen(ctx, w, h, theme, settings ?? loadSave().settings);
      break;
    case 'shop':
      renderShopScreen(ctx, w, h, theme);
      break;
    case 'level_select':
      renderLevelSelectScreen(ctx, w, h, theme);
      break;
    case 'achievements':
      renderAchievementsScreen(ctx, w, h, theme);
      break;
    default:
      renderMainMenu(ctx, w, h, theme);
  }
}

// ─── SHARED HELPERS ─────────────────────────────────────

function drawCoinIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  ctx.save();
  ctx.fillStyle = '#ffcc00';
  ctx.shadowColor = '#ffcc00';
  ctx.shadowBlur = 4;
  // Lightning bolt
  ctx.beginPath();
  ctx.moveTo(x + size * 0.15, y - size * 0.5);
  ctx.lineTo(x - size * 0.35, y + size * 0.1);
  ctx.lineTo(x + size * 0.0, y + size * 0.05);
  ctx.lineTo(x - size * 0.15, y + size * 0.5);
  ctx.lineTo(x + size * 0.35, y - size * 0.1);
  ctx.lineTo(x + size * 0.0, y - size * 0.05);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawCoinDisplay(ctx: CanvasRenderingContext2D, rightX: number, y: number, coins: number, _theme: GameTheme): void {
  ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffcc00';
  ctx.shadowColor = '#ffcc00';
  ctx.shadowBlur = 6;
  ctx.fillText(`${coins}`, rightX - 4, y);
  ctx.shadowBlur = 0;
  drawCoinIcon(ctx, rightX - ctx.measureText(`${coins}`).width - 14, y, 12);
}

// ─── MAIN MENU ───────────────────────────────────────────

export function renderMainMenu(ctx: CanvasRenderingContext2D, w: number, h: number, theme: GameTheme): void {
  buttons = [];

  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, w, h);

  const save = loadSave();

  // Top-right coin display
  drawCoinDisplay(ctx, w - 18, 28, save.coins, theme);

  // Title
  const titleY = h * 0.10;
  const scale = 1 + Math.sin(titlePulse * 2) * 0.03;

  ctx.save();
  ctx.translate(w / 2, titleY);
  ctx.scale(scale, scale);
  ctx.shadowColor = theme.ui.accentColor;
  ctx.shadowBlur = 20;
  ctx.fillStyle = theme.ui.textColor;
  ctx.font = 'bold 42px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('WAVE RUNNER', 0, 0);
  ctx.shadowBlur = 0;
  ctx.restore();

  // Subtitle
  ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = theme.ui.textColor + 'aa';
  ctx.fillText('SELECT A GAME MODE', w / 2, titleY + 36);

  // ─── Mode cards ───
  const cardGap = 10;
  const maxCardW = 170;
  const cardW = Math.min(maxCardW, (w - 40 - cardGap * 2) / 3);
  const cardH = Math.min(210, h * 0.44);
  const totalW = cardW * 3 + cardGap * 2;
  const startX = (w - totalW) / 2;
  const cardY = titleY + 60;

  const animDelay1 = Math.max(0, menuAnimTime - 0.0);
  const animDelay2 = Math.max(0, menuAnimTime - 0.08);
  const animDelay3 = Math.max(0, menuAnimTime - 0.16);
  const slide1 = easeOutCubic(Math.min(1, animDelay1 * 3));
  const slide2 = easeOutCubic(Math.min(1, animDelay2 * 3));
  const slide3 = easeOutCubic(Math.min(1, animDelay3 * 3));

  // Count completed classic levels
  let completedLevels = 0;
  for (const level of LEVELS) {
    if ((save.levelStars[level.id] || 0) > 0) completedLevels++;
  }

  // Classic card
  ctx.globalAlpha = slide1;
  drawModeCard(ctx, startX + (1 - slide1) * 30, cardY, cardW, cardH, {
    title: 'CLASSIC',
    desc: 'Beat all 12 levels',
    accent: '#ff8800',
    info: `${completedLevels}/${LEVELS.length} done`,
    buttonLabel: 'SELECT LEVEL',
    action: 'level_select',
    theme,
    iconType: 'classic',
  });
  ctx.globalAlpha = 1;

  // Endless card
  ctx.globalAlpha = slide2;
  drawModeCard(ctx, startX + cardW + cardGap + (1 - slide2) * 30, cardY, cardW, cardH, {
    title: 'ENDLESS',
    desc: 'How far can you go?',
    accent: '#00ccff',
    info: save.highScore > 0 ? `Best: ${save.highScore}m` : 'No record yet',
    buttonLabel: 'START',
    action: 'endless',
    theme,
    iconType: 'endless',
  });
  ctx.globalAlpha = 1;

  // Daily Challenge card
  const today = getTodayString();
  const dailyDone = save.dailyDate === today;
  ctx.globalAlpha = slide3;
  drawModeCard(ctx, startX + (cardW + cardGap) * 2 + (1 - slide3) * 30, cardY, cardW, cardH, {
    title: 'DAILY',
    desc: 'New challenge every day',
    accent: '#44cc44',
    info: dailyDone ? `Best: ${save.dailyBest}m` : 'Not played yet',
    buttonLabel: dailyDone ? 'COMPLETED' : 'PLAY',
    action: dailyDone ? '' : 'daily',
    theme,
    iconType: 'daily',
    disabled: dailyDone,
  });
  ctx.globalAlpha = 1;

  // ─── Bottom buttons ───
  const bottomY = cardY + cardH + 16;
  const bottomBtnW = Math.min(110, (w - 60) / 3);
  const bottomBtnH = 42;
  const bottomGap = 10;
  const totalBtnW = bottomBtnW * 3 + bottomGap * 2;
  const btnStartX = (w - totalBtnW) / 2;

  const animBottom = easeOutCubic(Math.min(1, Math.max(0, menuAnimTime - 0.2) * 3));
  ctx.globalAlpha = animBottom;

  drawButton(ctx, btnStartX, bottomY, bottomBtnW, bottomBtnH, 'SHOP', theme, false);
  buttons.push({ x: btnStartX, y: bottomY, w: bottomBtnW, h: bottomBtnH, action: 'shop' });

  drawButton(ctx, btnStartX + bottomBtnW + bottomGap, bottomY, bottomBtnW, bottomBtnH, 'AWARDS', theme, false);
  buttons.push({ x: btnStartX + bottomBtnW + bottomGap, y: bottomY, w: bottomBtnW, h: bottomBtnH, action: 'achievements' });

  drawButton(ctx, btnStartX + (bottomBtnW + bottomGap) * 2, bottomY, bottomBtnW, bottomBtnH, 'SETTINGS', theme, false);
  buttons.push({ x: btnStartX + (bottomBtnW + bottomGap) * 2, y: bottomY, w: bottomBtnW, h: bottomBtnH, action: 'settings' });

  ctx.globalAlpha = 1;

  // Hint at very bottom
  ctx.font = '12px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = theme.ui.textColor + '50';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Hold SPACE to fly up, release to fall', w / 2, h - 8);
}

interface ModeCardOpts {
  title: string;
  desc: string;
  accent: string;
  info: string;
  buttonLabel: string;
  action: string;
  theme: GameTheme;
  iconType: 'classic' | 'endless' | 'daily';
  disabled?: boolean;
}

function drawModeCard(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  opts: ModeCardOpts,
): void {
  const { title, desc, accent, info, buttonLabel, action, theme, iconType, disabled } = opts;

  // Card background
  ctx.fillStyle = theme.ui.textColor + '0a';
  ctx.strokeStyle = disabled ? theme.ui.textColor + '20' : accent + '50';
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, w, h, 10);

  // Accent top bar
  ctx.fillStyle = disabled ? theme.ui.textColor + '15' : accent + '30';
  ctx.beginPath();
  ctx.moveTo(x + 10, y);
  ctx.lineTo(x + w - 10, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + 10);
  ctx.lineTo(x + w, y + 4);
  ctx.lineTo(x, y + 4);
  ctx.lineTo(x, y + 10);
  ctx.quadraticCurveTo(x, y, x + 10, y);
  ctx.fill();

  const cx = x + w / 2;

  // Icon
  const iconY = y + h * 0.22;
  ctx.fillStyle = disabled ? theme.ui.textColor + '30' : accent;
  ctx.strokeStyle = disabled ? theme.ui.textColor + '20' : accent;
  ctx.lineWidth = 2.5;
  drawModeIcon(ctx, cx, iconY, iconType, disabled);

  // Title
  ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = disabled ? theme.ui.textColor + '40' : theme.ui.textColor;
  ctx.fillText(title, cx, y + h * 0.42);

  // Description
  ctx.font = '11px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = disabled ? theme.ui.textColor + '25' : theme.ui.textColor + '70';
  ctx.fillText(desc, cx, y + h * 0.54);

  // Info line
  if (info) {
    ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = disabled ? theme.ui.textColor + '20' : accent + 'cc';
    ctx.fillText(info, cx, y + h * 0.66);
  }

  // Button
  const btnW = Math.min(w - 20, 130);
  const btnH = 32;
  const btnX = cx - btnW / 2;
  const btnY = y + h - btnH - 14;

  if (disabled) {
    ctx.fillStyle = theme.ui.textColor + '08';
    ctx.strokeStyle = theme.ui.textColor + '15';
  } else {
    ctx.fillStyle = accent + '25';
    ctx.strokeStyle = accent + '80';
  }
  ctx.lineWidth = 1.5;
  roundRect(ctx, btnX, btnY, btnW, btnH, 6);

  ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = disabled ? theme.ui.textColor + '30' : theme.ui.textColor;
  ctx.fillText(buttonLabel, cx, btnY + btnH / 2);

  if (!disabled && action) {
    buttons.push({ x: btnX, y: btnY, w: btnW, h: btnH, action });
  }
}

function drawModeIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, type: string, disabled?: boolean): void {
  ctx.save();
  if (!disabled) {
    ctx.shadowColor = ctx.fillStyle as string;
    ctx.shadowBlur = 8;
  }

  switch (type) {
    case 'classic':
      // Grid/levels icon - 4 small squares
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
          ctx.fillRect(cx - 10 + c * 12, cy - 10 + r * 12, 9, 9);
        }
      }
      break;

    case 'endless':
      // Infinity symbol
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.bezierCurveTo(cx - 6, cy - 10, cx - 18, cy - 10, cx - 18, cy);
      ctx.bezierCurveTo(cx - 18, cy + 10, cx - 6, cy + 10, cx, cy);
      ctx.bezierCurveTo(cx + 6, cy - 10, cx + 18, cy - 10, cx + 18, cy);
      ctx.bezierCurveTo(cx + 18, cy + 10, cx + 6, cy + 10, cx, cy);
      ctx.stroke();
      break;

    case 'daily':
      // Calendar icon
      ctx.strokeStyle = ctx.fillStyle as string;
      ctx.lineWidth = 2;
      roundRect(ctx, cx - 10, cy - 8, 20, 18, 3);
      // Top clips
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy - 10); ctx.lineTo(cx - 5, cy - 6);
      ctx.moveTo(cx + 5, cy - 10); ctx.lineTo(cx + 5, cy - 6);
      ctx.stroke();
      // Day dot
      ctx.beginPath();
      ctx.arc(cx, cy + 2, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
  }

  ctx.restore();
}

// ─── GAME OVER ───────────────────────────────────────────

export function renderGameOverScreen(ctx: CanvasRenderingContext2D, w: number, h: number, game: Game, theme: GameTheme): void {
  buttons = [];

  const progress = Math.min(1, deathAnimTime * 2);
  const alpha = easeOutCubic(progress);

  ctx.fillStyle = `rgba(0,0,0,${alpha * 0.6})`;
  ctx.fillRect(0, 0, w, h);

  ctx.globalAlpha = alpha;

  const centerY = h * 0.25;
  ctx.shadowColor = theme.ui.accentColor;
  ctx.shadowBlur = 15;
  ctx.fillStyle = theme.ui.textColor;
  ctx.font = 'bold 40px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const isClassicComplete = game.classicComplete;
  ctx.fillText(isClassicComplete ? 'LEVEL COMPLETE!' : 'GAME OVER', w / 2, centerY);
  ctx.shadowBlur = 0;

  // Distance (count-up animation over 1s)
  const countUpT = Math.min(1, deathAnimTime / 1.0);
  const countUpEase = easeOutCubic(countUpT);
  const displayDist = Math.floor(game.distance * countUpEase);
  ctx.font = 'bold 56px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = theme.ui.accentColor;
  ctx.fillText(`${displayDist}m`, w / 2, centerY + 65);

  // Coins collected this run (count-up slightly delayed)
  const coinCountT = Math.min(1, Math.max(0, (deathAnimTime - 0.3)) / 0.7);
  const displayCoins = Math.floor(game.coinsCollected * easeOutCubic(coinCountT));
  ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#ffcc00';
  const coinText = `+${displayCoins}`;
  const coinTextW = ctx.measureText(coinText).width;
  ctx.fillText(coinText, w / 2 + 10, centerY + 105);
  drawCoinIcon(ctx, w / 2 + 10 - coinTextW / 2 - 14, centerY + 105, 11);

  // New highscore / level stars
  if (isClassicComplete && game.classicLevelIndex >= 0) {
    const level = LEVELS[game.classicLevelIndex];
    const save = loadSave();
    const stars = save.levelStars[level.id] || 0;
    ctx.font = '28px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    for (let s = 0; s < 3; s++) {
      ctx.fillStyle = s < stars ? '#ffcc00' : theme.ui.textColor + '30';
      ctx.fillText(s < stars ? '\u2605' : '\u2606', w / 2 - 30 + s * 30, centerY + 138);
    }
  } else if (game.isNewHighScore) {
    const pulse = 1 + Math.sin(deathAnimTime * 4) * 0.1;
    ctx.save();
    ctx.translate(w / 2, centerY + 135);
    ctx.scale(pulse, pulse);
    ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#ffcc00';
    ctx.shadowColor = '#ffcc00';
    ctx.shadowBlur = 10;
    ctx.fillText('NEW HIGH SCORE!', 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();
  } else {
    ctx.font = '16px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = theme.ui.textColor + 'aa';
    ctx.fillText(`Best: ${game.highScore}m`, w / 2, centerY + 135);
  }

  // Buttons
  if (deathAnimTime > 0.5) {
    const btnW = 200;
    const btnH = 48;
    const btnX = w / 2 - btnW / 2;
    const btnY = h * 0.6;

    drawButton(ctx, btnX, btnY, btnW, btnH, 'Retry', theme, true);
    buttons.push({ x: btnX, y: btnY, w: btnW, h: btnH, action: 'retry' });

    drawButton(ctx, btnX, btnY + 58, btnW, btnH, 'Main Menu', theme, false);
    buttons.push({ x: btnX, y: btnY + 58, w: btnW, h: btnH, action: 'menu' });

    // Rewarded ad button
    drawButton(ctx, btnX, btnY + 116, btnW, btnH, '+50 Watch Ad', theme, false);
    buttons.push({ x: btnX, y: btnY + 116, w: btnW, h: btnH, action: 'rewarded_ad' });

    // Top runs leaderboard (compact, below buttons)
    const save = loadSave();
    const topRuns = save.topRuns || [];
    if (topRuns.length > 0) {
      const lbY = btnY + 180;
      ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = theme.ui.textColor + '80';
      ctx.fillText('TOP RUNS', w / 2, lbY);

      ctx.font = '11px "Segoe UI", Arial, sans-serif';
      const showCount = Math.min(5, topRuns.length);
      for (let i = 0; i < showCount; i++) {
        const run = topRuns[i];
        const runY = lbY + 16 + i * 15;
        const isCurrent = run.distance === game.distance && deathAnimTime < 3;
        ctx.fillStyle = isCurrent ? '#ffcc00' : theme.ui.textColor + '60';
        ctx.textAlign = 'left';
        ctx.fillText(`${i + 1}.`, w / 2 - 60, runY);
        ctx.textAlign = 'center';
        ctx.fillText(`${run.distance}m`, w / 2, runY);
        ctx.textAlign = 'right';
        ctx.fillStyle = theme.ui.textColor + '40';
        ctx.fillText(run.mode, w / 2 + 60, runY);
      }
    }
  }

  ctx.globalAlpha = 1;
}

// ─── PAUSE ───────────────────────────────────────────────

export function renderPauseScreen(ctx: CanvasRenderingContext2D, w: number, h: number, theme: GameTheme): void {
  buttons = [];

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = theme.ui.textColor;
  ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PAUSED', w / 2, h * 0.35);

  const btnW = 200;
  const btnH = 48;
  const btnX = w / 2 - btnW / 2;

  drawButton(ctx, btnX, h * 0.48, btnW, btnH, 'Resume', theme, true);
  buttons.push({ x: btnX, y: h * 0.48, w: btnW, h: btnH, action: 'resume' });

  drawButton(ctx, btnX, h * 0.48 + 58, btnW, btnH, 'Main Menu', theme, false);
  buttons.push({ x: btnX, y: h * 0.48 + 58, w: btnW, h: btnH, action: 'menu' });
}

// ─── SETTINGS ────────────────────────────────────────────

export function renderSettingsScreen(ctx: CanvasRenderingContext2D, w: number, h: number, theme: GameTheme, settings: { musicVolume: number; sfxVolume: number; particles: boolean; screenShake: boolean }): void {
  buttons = [];

  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = theme.ui.textColor;
  ctx.font = 'bold 30px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SETTINGS', w / 2, h * 0.18);

  const startY = h * 0.26;
  const gap = 50;
  ctx.font = '18px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'left';

  const toggleX = w / 2 + 60;
  let row = 0;

  // Music
  ctx.fillStyle = theme.ui.textColor;
  ctx.fillText('Music', w / 2 - 100, startY + row * gap + 8);
  drawToggle(ctx, toggleX, startY + row * gap - 5, settings.musicVolume > 0, theme);
  buttons.push({ x: toggleX, y: startY + row * gap - 5, w: 50, h: 26, action: 'toggle_music' });
  row++;

  // SFX
  ctx.fillStyle = theme.ui.textColor;
  ctx.fillText('Sound FX', w / 2 - 100, startY + row * gap + 8);
  drawToggle(ctx, toggleX, startY + row * gap - 5, settings.sfxVolume > 0, theme);
  buttons.push({ x: toggleX, y: startY + row * gap - 5, w: 50, h: 26, action: 'toggle_sfx' });
  row++;

  // Particles
  ctx.fillStyle = theme.ui.textColor;
  ctx.fillText('Particles', w / 2 - 100, startY + row * gap + 8);
  drawToggle(ctx, toggleX, startY + row * gap - 5, settings.particles, theme);
  buttons.push({ x: toggleX, y: startY + row * gap - 5, w: 50, h: 26, action: 'toggle_particles' });
  row++;

  // Screen Shake
  ctx.fillStyle = theme.ui.textColor;
  ctx.fillText('Screen Shake', w / 2 - 100, startY + row * gap + 8);
  drawToggle(ctx, toggleX, startY + row * gap - 5, settings.screenShake, theme);
  buttons.push({ x: toggleX, y: startY + row * gap - 5, w: 50, h: 26, action: 'toggle_shake' });

  const btnW = 160;
  const btnH = 44;
  drawButton(ctx, w / 2 - btnW / 2, h * 0.78, btnW, btnH, 'Back', theme, false);
  buttons.push({ x: w / 2 - btnW / 2, y: h * 0.78, w: btnW, h: btnH, action: 'back' });
}

// ─── SKIN SHOP ───────────────────────────────────────────

export function renderShopScreen(ctx: CanvasRenderingContext2D, w: number, h: number, theme: GameTheme): void {
  buttons = [];

  ctx.fillStyle = 'rgba(0,0,0,0.80)';
  ctx.fillRect(0, 0, w, h);

  const save = loadSave();

  // ─── Fixed header ───
  const headerH = 90;

  // Back arrow button (top-left)
  const backBtnSize = 36;
  const backX = 14;
  const backY = 14;
  ctx.fillStyle = theme.ui.textColor + '15';
  ctx.strokeStyle = theme.ui.textColor + '40';
  ctx.lineWidth = 1.5;
  roundRect(ctx, backX, backY, backBtnSize, backBtnSize, 8);
  // Arrow icon
  ctx.strokeStyle = theme.ui.textColor;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(backX + 22, backY + 11);
  ctx.lineTo(backX + 13, backY + 18);
  ctx.lineTo(backX + 22, backY + 25);
  ctx.stroke();
  buttons.push({ x: backX, y: backY, w: backBtnSize, h: backBtnSize, action: 'back' });

  // Title
  ctx.fillStyle = theme.ui.textColor;
  ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('SHOP', backX + backBtnSize + 12, backY + backBtnSize / 2);

  // Coin display (top-right)
  drawCoinDisplay(ctx, w - 18, backY + backBtnSize / 2, save.coins, theme);

  // ─── Tabs ───
  const tabY = 58;
  const tabH = 30;
  const tabW = 90;
  const tabGap = 6;
  const tabStartX = w / 2 - (tabW * 2 + tabGap) / 2;

  // Skins tab
  const skinTabActive = shopTab === 'skins';
  ctx.fillStyle = skinTabActive ? theme.ui.accentColor + '35' : theme.ui.textColor + '0a';
  ctx.strokeStyle = skinTabActive ? theme.ui.accentColor : theme.ui.textColor + '25';
  ctx.lineWidth = skinTabActive ? 2 : 1;
  roundRect(ctx, tabStartX, tabY, tabW, tabH, 6);
  ctx.font = `bold 13px "Segoe UI", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = skinTabActive ? theme.ui.accentColor : theme.ui.textColor + '80';
  ctx.fillText('SKINS', tabStartX + tabW / 2, tabY + tabH / 2);
  buttons.push({ x: tabStartX, y: tabY, w: tabW, h: tabH, action: 'tab_skins' });

  // Trails tab
  const trailTabActive = shopTab === 'trails';
  ctx.fillStyle = trailTabActive ? theme.ui.accentColor + '35' : theme.ui.textColor + '0a';
  ctx.strokeStyle = trailTabActive ? theme.ui.accentColor : theme.ui.textColor + '25';
  ctx.lineWidth = trailTabActive ? 2 : 1;
  roundRect(ctx, tabStartX + tabW + tabGap, tabY, tabW, tabH, 6);
  ctx.font = `bold 13px "Segoe UI", Arial, sans-serif`;
  ctx.fillStyle = trailTabActive ? theme.ui.accentColor : theme.ui.textColor + '80';
  ctx.fillText('TRAILS', tabStartX + tabW + tabGap + tabW / 2, tabY + tabH / 2);
  buttons.push({ x: tabStartX + tabW + tabGap, y: tabY, w: tabW, h: tabH, action: 'tab_trails' });

  // ─── Scrollable content area ───
  const scrollAreaTop = headerH;
  const scrollAreaBottom = h;
  const visibleH = scrollAreaBottom - scrollAreaTop;

  const items = shopTab === 'skins' ? SKINS : TRAILS;
  const cols = Math.min(4, Math.max(2, Math.floor((w - 30) / 90)));
  const cellW = Math.min(90, (w - 30) / cols);
  const cellH = 110;
  const rows = Math.ceil(items.length / cols);
  const contentH = rows * cellH + 20;
  shopScrollMax = Math.max(0, contentH - visibleH);
  shopScroll = Math.min(shopScroll, shopScrollMax);

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, scrollAreaTop, w, visibleH);
  ctx.clip();

  const scrollY = -shopScroll;

  const gridW = cols * cellW;
  const gridX = (w - gridW) / 2;
  const gridY = scrollAreaTop + 10 + scrollY;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = gridX + col * cellW + cellW / 2;
    const cy = gridY + row * cellH + cellH / 2;

    // Skip if off-screen
    if (cy + cellH / 2 < scrollAreaTop || cy - cellH / 2 > scrollAreaBottom) continue;

    const isOwned = shopTab === 'skins'
      ? save.unlockedSkins.includes(item.id)
      : save.unlockedTrails.includes(item.id);
    const isSelected = shopTab === 'skins'
      ? save.selectedSkin === item.id
      : save.selectedTrail === item.id;

    // Rarity
    const rarity = getRarity(item.price);
    const rarityColor = RARITY_COLORS[rarity];

    // Card background with rarity-colored border
    if (isSelected) {
      ctx.fillStyle = theme.ui.accentColor + '30';
      ctx.strokeStyle = theme.ui.accentColor;
      ctx.lineWidth = 2;
    } else {
      ctx.fillStyle = theme.ui.textColor + '0a';
      ctx.strokeStyle = rarityColor + '60';
      ctx.lineWidth = 1.5;
    }
    const cardW = cellW - 8;
    const cardH = cellH - 8;
    roundRect(ctx, cx - cardW / 2, cy - cardH / 2, cardW, cardH, 8);

    // Animated preview (gentle rotation for skins, movement for trails)
    const previewY = cy - 14;
    ctx.save();
    ctx.translate(cx, previewY);
    if (shopTab === 'skins') {
      const rot = Math.sin(menuAnimTime * 2 + i * 0.5) * 0.15;
      ctx.rotate(rot);
    }
    ctx.fillStyle = isSelected ? theme.ui.accentColor : theme.ui.textColor;
    if (shopTab === 'skins') {
      drawShapePreview(ctx, 0, 0, (item as typeof SKINS[0]).shape);
    } else {
      drawTrailPreview(ctx, 0, 0, (item as typeof TRAILS[0]).style, theme);
    }
    ctx.restore();

    // Name
    ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = theme.ui.textColor;
    ctx.fillText(item.name, cx, cy + 14);

    // Rarity label
    ctx.font = '9px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = rarityColor;
    ctx.fillText(rarity.toUpperCase(), cx, cy + 25);

    // Price / status
    const statusY = cy + 36;
    if (isSelected) {
      ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = theme.ui.accentColor;
      ctx.fillText('EQUIPPED', cx, statusY);
    } else if (isOwned) {
      ctx.font = '11px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = theme.ui.textColor + '60';
      ctx.fillText('OWNED', cx, statusY);
    } else if (item.price === 0) {
      ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#44cc88';
      ctx.fillText('FREE', cx, statusY);
    } else {
      // Price with coin icon (+ shake animation if can't afford)
      const isShaking = priceShakeItemId === item.id && priceShakeTimer > 0;
      const shakeOffsetX = isShaking ? Math.sin(priceShakeTimer * 40) * 4 : 0;
      const cantAfford = save.coins < item.price;

      ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = cantAfford ? '#ff6644' : '#ffcc00';
      const priceStr = `${item.price}`;
      const priceW = ctx.measureText(priceStr).width;
      const priceX = cx + 5 + shakeOffsetX;
      ctx.textAlign = 'center';
      ctx.fillText(priceStr, priceX, statusY);
      drawCoinIcon(ctx, priceX - priceW / 2 - 8, statusY, 8);
    }

    buttons.push({
      x: cx - cardW / 2,
      y: cy - cardH / 2,
      w: cardW,
      h: cardH,
      action: shopTab === 'skins' ? `skin_${item.id}` : `trail_${item.id}`,
    });
  }

  ctx.restore(); // end clip

  // Scroll indicators (fade edges)
  if (shopScroll > 0) {
    const fadeGrad = ctx.createLinearGradient(0, scrollAreaTop, 0, scrollAreaTop + 25);
    fadeGrad.addColorStop(0, 'rgba(0,0,0,0.7)');
    fadeGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = fadeGrad;
    ctx.fillRect(0, scrollAreaTop, w, 25);
  }
  if (shopScroll < shopScrollMax) {
    const fadeGrad = ctx.createLinearGradient(0, scrollAreaBottom - 25, 0, scrollAreaBottom);
    fadeGrad.addColorStop(0, 'rgba(0,0,0,0)');
    fadeGrad.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = fadeGrad;
    ctx.fillRect(0, scrollAreaBottom - 25, w, 25);
  }
}

// ─── LEVEL SELECT ────────────────────────────────────────

export function renderLevelSelectScreen(ctx: CanvasRenderingContext2D, w: number, h: number, theme: GameTheme): void {
  buttons = [];

  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, w, h);

  const save = loadSave();

  ctx.fillStyle = theme.ui.textColor;
  ctx.font = 'bold 30px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SELECT LEVEL', w / 2, h * 0.08);

  const cols = Math.min(4, Math.floor((w - 40) / 105));
  const cellW = 100;
  const cellH = 105;
  const gridW = cols * cellW;
  const gridX = w / 2 - gridW / 2;
  const gridY = h * 0.15;

  for (let i = 0; i < LEVELS.length; i++) {
    const level = LEVELS[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = gridX + col * cellW + cellW / 2;
    const cy = gridY + row * cellH + cellH / 2;

    const stars = save.levelStars[level.id] || 0;
    const unlocked = i === 0 || (save.levelStars[LEVELS[i - 1].id] || 0) > 0;

    const cw = 90;
    const ch = 95;

    // Cell
    ctx.fillStyle = unlocked ? theme.ui.textColor + '15' : theme.ui.textColor + '08';
    ctx.strokeStyle = unlocked ? theme.ui.accentColor + '60' : theme.ui.textColor + '20';
    ctx.lineWidth = 1;
    roundRect(ctx, cx - cw / 2, cy - ch / 2, cw, ch, 8);

    if (unlocked) {
      // Level number
      ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = theme.ui.textColor;
      ctx.fillText(`${i + 1}`, cx, cy - 20);

      // Level name
      ctx.font = '10px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = theme.ui.textColor + '90';
      ctx.fillText(level.name, cx, cy - 6);

      // Target distance
      ctx.font = '9px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = theme.ui.accentColor + 'aa';
      ctx.fillText(`${level.targetDistance}m`, cx, cy + 8);

      // Stars
      ctx.font = '14px "Segoe UI", Arial, sans-serif';
      for (let s = 0; s < 3; s++) {
        ctx.fillStyle = s < stars ? '#ffcc00' : theme.ui.textColor + '30';
        ctx.fillText(s < stars ? '\u2605' : '\u2606', cx - 14 + s * 14, cy + 26);
      }

      buttons.push({ x: cx - cw / 2, y: cy - ch / 2, w: cw, h: ch, action: `level_${i}` });
    } else {
      // Locked
      ctx.font = '20px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = theme.ui.textColor + '30';
      ctx.fillText('\u{1F512}', cx, cy - 5);
      ctx.font = '10px "Segoe UI", Arial, sans-serif';
      ctx.fillText(level.name, cx, cy + 14);
    }
  }

  // Back button
  const btnW = 160;
  const btnH = 44;
  drawButton(ctx, w / 2 - btnW / 2, h - 70, btnW, btnH, 'Back', theme, false);
  buttons.push({ x: w / 2 - btnW / 2, y: h - 70, w: btnW, h: btnH, action: 'back' });
}

// ─── ACHIEVEMENTS ────────────────────────────────────────

export function renderAchievementsScreen(ctx: CanvasRenderingContext2D, w: number, h: number, theme: GameTheme): void {
  buttons = [];

  ctx.fillStyle = 'rgba(0,0,0,0.80)';
  ctx.fillRect(0, 0, w, h);

  const save = loadSave();

  // Header with back button
  const backBtnSize = 36;
  const backX = 14;
  const backY = 14;
  ctx.fillStyle = theme.ui.textColor + '15';
  ctx.strokeStyle = theme.ui.textColor + '40';
  ctx.lineWidth = 1.5;
  roundRect(ctx, backX, backY, backBtnSize, backBtnSize, 8);
  ctx.strokeStyle = theme.ui.textColor;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(backX + 22, backY + 11);
  ctx.lineTo(backX + 13, backY + 18);
  ctx.lineTo(backX + 22, backY + 25);
  ctx.stroke();
  buttons.push({ x: backX, y: backY, w: backBtnSize, h: backBtnSize, action: 'back' });

  ctx.fillStyle = theme.ui.textColor;
  ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('ACHIEVEMENTS', backX + backBtnSize + 12, backY + backBtnSize / 2);

  // Progress count
  const unlocked = save.achievements.length;
  const total = ACHIEVEMENTS.length;
  ctx.font = '14px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillStyle = theme.ui.accentColor;
  ctx.fillText(`${unlocked}/${total}`, w - 18, backY + backBtnSize / 2);

  // Achievement grid
  const scrollAreaTop = 64;
  const cols = Math.min(2, Math.max(1, Math.floor((w - 20) / 200)));
  const cellW = Math.min(220, (w - 30) / cols);
  const cellH = 60;
  const gridW = cols * cellW;
  const gridX = (w - gridW) / 2;
  let gridY = scrollAreaTop + 10;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, scrollAreaTop, w, h - scrollAreaTop);
  ctx.clip();

  for (let i = 0; i < ACHIEVEMENTS.length; i++) {
    const ach = ACHIEVEMENTS[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = gridX + col * cellW + cellW / 2;
    const cy = gridY + row * cellH + cellH / 2;

    if (cy + cellH / 2 > h) break; // offscreen

    const isUnlocked = save.achievements.includes(ach.id);

    // Card
    ctx.fillStyle = isUnlocked ? theme.ui.accentColor + '15' : theme.ui.textColor + '06';
    ctx.strokeStyle = isUnlocked ? theme.ui.accentColor + '50' : theme.ui.textColor + '15';
    ctx.lineWidth = 1;
    roundRect(ctx, cx - cellW / 2 + 4, cy - cellH / 2 + 2, cellW - 8, cellH - 4, 6);

    // Icon
    ctx.font = '20px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isUnlocked ? theme.ui.accentColor : theme.ui.textColor + '30';
    ctx.fillText(ach.icon, cx - cellW / 2 + 26, cy);

    // Name & desc
    ctx.textAlign = 'left';
    ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = isUnlocked ? theme.ui.textColor : theme.ui.textColor + '40';
    ctx.fillText(ach.name, cx - cellW / 2 + 46, cy - 8);

    ctx.font = '11px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = isUnlocked ? theme.ui.textColor + '80' : theme.ui.textColor + '25';
    ctx.fillText(ach.desc, cx - cellW / 2 + 46, cy + 10);
  }

  ctx.restore();
}

// ─── DRAWING HELPERS ─────────────────────────────────────

function drawButton(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, label: string, theme: GameTheme, primary: boolean): void {
  const isHovered = hoverX >= x && hoverX <= x + w && hoverY >= y && hoverY <= y + h;

  if (isHovered) {
    ctx.save();
    const cx = x + w / 2, cy = y + h / 2;
    ctx.translate(cx, cy);
    ctx.scale(1.04, 1.04);
    ctx.translate(-cx, -cy);
  }

  ctx.fillStyle = primary
    ? theme.ui.accentColor + (isHovered ? '60' : '40')
    : theme.ui.textColor + (isHovered ? '25' : '15');
  ctx.strokeStyle = primary ? theme.ui.accentColor : theme.ui.textColor + '60';
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 8);

  ctx.fillStyle = theme.ui.textColor;
  ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2);

  if (isHovered) ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawToggle(ctx: CanvasRenderingContext2D, x: number, y: number, on: boolean, theme: GameTheme): void {
  const w = 50;
  const h = 26;
  const r = h / 2;

  ctx.fillStyle = on ? theme.ui.accentColor + '80' : theme.ui.textColor + '30';
  ctx.beginPath();
  ctx.arc(x + r, y + r, r, Math.PI * 0.5, Math.PI * 1.5);
  ctx.arc(x + w - r, y + r, r, Math.PI * 1.5, Math.PI * 0.5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = on ? theme.ui.accentColor : theme.ui.textColor + '80';
  ctx.beginPath();
  ctx.arc(on ? x + w - r : x + r, y + r, r - 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawShapePreview(ctx: CanvasRenderingContext2D, cx: number, cy: number, shape: string): void {
  ctx.beginPath();
  switch (shape) {
    case 'arrow':
      ctx.moveTo(cx + 10, cy); ctx.lineTo(cx - 8, cy - 8); ctx.lineTo(cx - 4, cy); ctx.lineTo(cx - 8, cy + 8);
      break;
    case 'star':
      for (let i = 0; i < 10; i++) {
        const a = (i * Math.PI * 2) / 10 - Math.PI / 2;
        const r = i % 2 === 0 ? 10 : 5;
        if (i === 0) ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        else ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }
      break;
    case 'diamond':
      ctx.moveTo(cx + 10, cy); ctx.lineTo(cx, cy - 8); ctx.lineTo(cx - 10, cy); ctx.lineTo(cx, cy + 8);
      break;
    case 'rocket':
      ctx.moveTo(cx + 12, cy); ctx.lineTo(cx + 4, cy - 7); ctx.lineTo(cx - 8, cy - 5);
      ctx.lineTo(cx - 6, cy); ctx.lineTo(cx - 8, cy + 5); ctx.lineTo(cx + 4, cy + 7);
      break;
    case 'circle':
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      break;
    case 'triangle':
      ctx.moveTo(cx + 10, cy); ctx.lineTo(cx - 6, cy - 9); ctx.lineTo(cx - 6, cy + 9);
      break;
    case 'hexagon':
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI * 2) / 6;
        if (i === 0) ctx.moveTo(cx + Math.cos(a) * 9, cy + Math.sin(a) * 9);
        else ctx.lineTo(cx + Math.cos(a) * 9, cy + Math.sin(a) * 9);
      }
      break;
    case 'pentagon':
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
        if (i === 0) ctx.moveTo(cx + Math.cos(a) * 9, cy + Math.sin(a) * 9);
        else ctx.lineTo(cx + Math.cos(a) * 9, cy + Math.sin(a) * 9);
      }
      break;
    case 'cross':
      ctx.moveTo(cx - 3, cy - 9); ctx.lineTo(cx + 3, cy - 9);
      ctx.lineTo(cx + 3, cy - 3); ctx.lineTo(cx + 9, cy - 3);
      ctx.lineTo(cx + 9, cy + 3); ctx.lineTo(cx + 3, cy + 3);
      ctx.lineTo(cx + 3, cy + 9); ctx.lineTo(cx - 3, cy + 9);
      ctx.lineTo(cx - 3, cy + 3); ctx.lineTo(cx - 9, cy + 3);
      ctx.lineTo(cx - 9, cy - 3); ctx.lineTo(cx - 3, cy - 3);
      break;
    case 'bolt':
      ctx.moveTo(cx + 2, cy - 10); ctx.lineTo(cx - 6, cy + 1);
      ctx.lineTo(cx - 1, cy + 1); ctx.lineTo(cx - 3, cy + 10);
      ctx.lineTo(cx + 6, cy - 1); ctx.lineTo(cx + 1, cy - 1);
      break;
    case 'shield':
      ctx.moveTo(cx, cy - 10); ctx.lineTo(cx + 9, cy - 5);
      ctx.lineTo(cx + 7, cy + 4); ctx.lineTo(cx, cy + 10);
      ctx.lineTo(cx - 7, cy + 4); ctx.lineTo(cx - 9, cy - 5);
      break;
    case 'heart':
      ctx.moveTo(cx, cy + 8);
      ctx.bezierCurveTo(cx - 12, cy, cx - 12, cy - 10, cx, cy - 6);
      ctx.bezierCurveTo(cx + 12, cy - 10, cx + 12, cy, cx, cy + 8);
      break;
    case 'crown':
      ctx.moveTo(cx - 9, cy + 6); ctx.lineTo(cx - 9, cy - 4);
      ctx.lineTo(cx - 5, cy); ctx.lineTo(cx, cy - 8);
      ctx.lineTo(cx + 5, cy); ctx.lineTo(cx + 9, cy - 4);
      ctx.lineTo(cx + 9, cy + 6);
      break;
    case 'blade':
      ctx.moveTo(cx + 10, cy); ctx.lineTo(cx, cy - 4);
      ctx.lineTo(cx - 10, cy - 2); ctx.lineTo(cx - 6, cy);
      ctx.lineTo(cx - 10, cy + 2); ctx.lineTo(cx, cy + 4);
      break;
    case 'crescent':
      ctx.arc(cx, cy, 9, 0, Math.PI * 2);
      ctx.moveTo(cx + 4 + 7, cy);
      ctx.arc(cx + 4, cy, 7, 0, Math.PI * 2, true);
      break;
    case 'ghost':
      ctx.moveTo(cx - 7, cy + 8); ctx.lineTo(cx - 7, cy - 2);
      ctx.quadraticCurveTo(cx - 7, cy - 10, cx, cy - 10);
      ctx.quadraticCurveTo(cx + 7, cy - 10, cx + 7, cy - 2);
      ctx.lineTo(cx + 7, cy + 8);
      ctx.lineTo(cx + 4, cy + 5); ctx.lineTo(cx + 1, cy + 8);
      ctx.lineTo(cx - 2, cy + 5); ctx.lineTo(cx - 5, cy + 8);
      break;
    case 'flame':
      ctx.moveTo(cx, cy - 10);
      ctx.quadraticCurveTo(cx + 8, cy - 4, cx + 6, cy + 4);
      ctx.quadraticCurveTo(cx + 3, cy + 10, cx, cy + 7);
      ctx.quadraticCurveTo(cx - 3, cy + 10, cx - 6, cy + 4);
      ctx.quadraticCurveTo(cx - 8, cy - 4, cx, cy - 10);
      break;
    case 'skull':
      ctx.arc(cx, cy - 2, 8, Math.PI, 0);
      ctx.lineTo(cx + 8, cy + 4);
      ctx.lineTo(cx + 4, cy + 4); ctx.lineTo(cx + 3, cy + 8);
      ctx.lineTo(cx + 1, cy + 4); ctx.lineTo(cx - 1, cy + 4);
      ctx.lineTo(cx - 3, cy + 8); ctx.lineTo(cx - 4, cy + 4);
      ctx.lineTo(cx - 8, cy + 4);
      ctx.closePath();
      ctx.fill();
      // Eyes
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.beginPath();
      ctx.arc(cx - 3, cy - 3, 2, 0, Math.PI * 2);
      ctx.arc(cx + 3, cy - 3, 2, 0, Math.PI * 2);
      ctx.fill();
      return; // early return - already filled
    case 'eye':
      ctx.moveTo(cx - 10, cy);
      ctx.quadraticCurveTo(cx, cy - 10, cx + 10, cy);
      ctx.quadraticCurveTo(cx, cy + 10, cx - 10, cy);
      ctx.closePath();
      ctx.fill();
      // Pupil
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
      return; // early return - already filled
    default: // droplet
      ctx.moveTo(cx + 10, cy);
      ctx.quadraticCurveTo(cx + 10, cy - 8, cx, cy - 8);
      ctx.quadraticCurveTo(cx - 10, cy - 8, cx - 10, cy);
      ctx.quadraticCurveTo(cx - 10, cy + 8, cx, cy + 8);
      ctx.quadraticCurveTo(cx + 10, cy + 8, cx + 10, cy);
  }
  ctx.closePath();
  ctx.fill();
}

function drawTrailPreview(ctx: CanvasRenderingContext2D, cx: number, cy: number, style: string, theme: GameTheme): void {
  ctx.strokeStyle = theme.ui.accentColor;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  switch (style) {
    case 'rainbow': {
      const colors = ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0088ff', '#8800ff'];
      for (let i = 0; i < colors.length; i++) {
        ctx.strokeStyle = colors[i];
        ctx.beginPath();
        ctx.moveTo(cx - 20 + i * 7, cy + Math.sin(i) * 3);
        ctx.lineTo(cx - 13 + i * 7, cy + Math.sin(i + 1) * 3);
        ctx.stroke();
      }
      return;
    }
    case 'fire':
      ctx.strokeStyle = '#ff4400';
      ctx.lineWidth = 4;
      break;
    case 'glitter':
      ctx.strokeStyle = theme.ui.accentColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([2, 3]);
      break;
    case 'thick':
      ctx.lineWidth = 5;
      break;
    case 'dashed':
      ctx.setLineDash([6, 4]);
      break;
    case 'double':
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 20, cy - 3);
      ctx.lineTo(cx + 20, cy - 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 20, cy + 3);
      ctx.lineTo(cx + 20, cy + 3);
      ctx.stroke();
      ctx.setLineDash([]);
      return;
    case 'dotted':
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.arc(cx - 18 + i * 5.5, cy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    case 'zigzag':
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 20, cy);
      for (let i = 0; i < 8; i++) {
        ctx.lineTo(cx - 15 + i * 5, (i % 2 === 0) ? cy - 4 : cy + 4);
      }
      ctx.stroke();
      return;
    case 'neon':
      ctx.shadowColor = theme.ui.accentColor;
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2;
      break;
    case 'ice': {
      ctx.strokeStyle = '#88ddff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 20, cy);
      ctx.lineTo(cx + 20, cy);
      ctx.stroke();
      // Ice crystals
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const ix = cx - 12 + i * 12;
        ctx.beginPath();
        ctx.moveTo(ix, cy - 4); ctx.lineTo(ix, cy + 4);
        ctx.moveTo(ix - 3, cy - 2); ctx.lineTo(ix + 3, cy + 2);
        ctx.stroke();
      }
      return;
    }
    case 'electric': {
      ctx.strokeStyle = '#44ccff';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#44ccff';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(cx - 20, cy);
      ctx.lineTo(cx - 12, cy - 5); ctx.lineTo(cx - 8, cy + 3);
      ctx.lineTo(cx - 2, cy - 4); ctx.lineTo(cx + 4, cy + 5);
      ctx.lineTo(cx + 10, cy - 3); ctx.lineTo(cx + 20, cy);
      ctx.stroke();
      ctx.shadowBlur = 0;
      return;
    }
    case 'wave':
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 20, cy);
      for (let i = 0; i <= 40; i++) {
        ctx.lineTo(cx - 20 + i, cy + Math.sin(i * 0.4) * 4);
      }
      ctx.stroke();
      return;
    case 'fade': {
      for (let i = 0; i < 8; i++) {
        ctx.globalAlpha = (i + 1) / 8;
        ctx.beginPath();
        ctx.moveTo(cx - 20 + i * 5, cy);
        ctx.lineTo(cx - 15 + i * 5, cy);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      return;
    }
    case 'pulse': {
      for (let i = 0; i < 5; i++) {
        const px = cx - 16 + i * 8;
        const r = 2 + (i % 2) * 2;
        ctx.beginPath();
        ctx.arc(px, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      return;
    }
    default:
      break;
  }

  ctx.beginPath();
  ctx.moveTo(cx - 20, cy);
  ctx.quadraticCurveTo(cx - 5, cy - 6, cx + 5, cy);
  ctx.quadraticCurveTo(cx + 15, cy + 6, cx + 20, cy);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.shadowBlur = 0;
}
