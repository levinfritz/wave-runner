import { Game } from './game/Game';
import { renderHUD, showToast } from './ui/HUD';
import { SKINS, TRAILS } from './game/Skins';
import { LEVELS } from './game/Levels';
import { ACHIEVEMENTS } from './game/Achievements';
import {
  renderGameOverScreen,
  renderPauseScreen,
  renderMenuScreen,
  updateScreens,
  getButtons,
  scrollShop,
  resetShopScroll,
  setShopTab,
  navigateTo,
  getMenuScreen,
  updateButtonHover,
  showConfirmDialog,
  getConfirmDialog,
  closeConfirmDialog,
  triggerPriceShake,
} from './ui/Screens';
import { loadSave, updateSave, updateSettings } from './utils/Storage';
import { checkAchievements } from './game/Achievements';
import { getPlatform, initPlatform } from './platform/SDK';

// Boot
const canvas = document.getElementById('game') as HTMLCanvasElement;
const loading = document.getElementById('loading') as HTMLDivElement;
const game = new Game(canvas);

let lastTime = performance.now();

// Game loop
function loop(now: number): void {
  const rawDt = (now - lastTime) / 1000;
  lastTime = now;
  const dt = Math.min(rawDt, 0.05);

  game.update(dt);
  updateScreens(dt, game.state);

  // Render game world (always, as background for menus too)
  game.render();

  const theme = game.themeManager.blended;

  // Render UI layers
  if (game.state === 'playing') {
    renderHUD(game.ctx, game, theme, dt);
  } else if (game.state === 'menu') {
    renderMenuScreen(game.ctx, game.width, game.height, theme, loadSave().settings);
  } else if (game.state === 'dead') {
    renderHUD(game.ctx, game, theme, dt);
    renderGameOverScreen(game.ctx, game.width, game.height, game, theme);
  } else if (game.state === 'paused') {
    renderHUD(game.ctx, game, theme, dt);
    renderPauseScreen(game.ctx, game.width, game.height, theme);
  }

  requestAnimationFrame(loop);
}

// Click handling for UI buttons
function handleClick(clientX: number, clientY: number): void {
  const buttons = getButtons();

  for (const btn of buttons) {
    if (
      clientX >= btn.x &&
      clientX <= btn.x + btn.w &&
      clientY >= btn.y &&
      clientY <= btn.y + btn.h
    ) {
      game.audio.playSFX('click');
      handleAction(btn.action);
      return;
    }
  }

  // If playing and click is on pause area (top-left corner)
  if (game.state === 'playing' && clientX < 60 && clientY < 60) {
    game.pause();
  }
}

function handleAction(action: string): void {
  // Close confirm dialog on cancel
  if (action === 'cancel_purchase') {
    closeConfirmDialog();
    return;
  }

  // Confirmed purchase actions
  if (action.startsWith('confirm_skin_')) {
    closeConfirmDialog();
    const skinId = action.slice(13);
    const save = loadSave();
    const skin = SKINS.find(s => s.id === skinId);
    if (!skin || save.coins < skin.price) return;
    updateSave({
      coins: save.coins - skin.price,
      unlockedSkins: [...save.unlockedSkins, skinId],
      selectedSkin: skinId,
    });
    game.player.skinType = skinId;
    game.audio.playSFX('purchase_success');
    return;
  }

  if (action.startsWith('confirm_trail_')) {
    closeConfirmDialog();
    const trailId = action.slice(14);
    const save = loadSave();
    const trail = TRAILS.find(t => t.id === trailId);
    if (!trail || save.coins < trail.price) return;
    updateSave({
      coins: save.coins - trail.price,
      unlockedTrails: [...save.unlockedTrails, trailId],
      selectedTrail: trailId,
    });
    game.player.trailType = trailId;
    game.audio.playSFX('purchase_success');
    return;
  }

  // Skin purchase/select
  if (action.startsWith('skin_')) {
    const skinId = action.slice(5);
    const save = loadSave();
    const skin = SKINS.find(s => s.id === skinId);
    if (!skin) return;

    if (save.unlockedSkins.includes(skinId)) {
      // Select it
      updateSave({ selectedSkin: skinId });
      game.player.skinType = skinId;
    } else if (save.coins >= skin.price) {
      // Show confirmation dialog instead of buying directly
      showConfirmDialog(skin.name, skin.price, `skin_${skinId}`);
    } else {
      // Can't afford — shake the price
      triggerPriceShake(skinId);
      game.audio.playSFX('purchase_denied');
    }
    return;
  }

  // Trail purchase/select
  if (action.startsWith('trail_')) {
    const trailId = action.slice(6);
    const save = loadSave();
    const trail = TRAILS.find(t => t.id === trailId);
    if (!trail) return;

    if (save.unlockedTrails.includes(trailId)) {
      updateSave({ selectedTrail: trailId });
      game.player.trailType = trailId;
    } else if (save.coins >= trail.price) {
      showConfirmDialog(trail.name, trail.price, `trail_${trailId}`);
    } else {
      triggerPriceShake(trailId);
      game.audio.playSFX('purchase_denied');
    }
    return;
  }

  // Level start
  if (action.startsWith('level_')) {
    const levelIdx = parseInt(action.slice(6), 10);
    const level = LEVELS[levelIdx];
    if (!level) return;

    navigateTo('main');
    game.startClassicLevel(levelIdx);
    return;
  }

  switch (action) {
    case 'endless':
      navigateTo('main');
      game.startGame('endless');
      break;
    case 'daily':
      navigateTo('main');
      game.startDaily();
      break;
    case 'level_select':
      navigateTo('level_select');
      break;
    case 'shop':
      navigateTo('shop');
      resetShopScroll();
      break;
    case 'achievements':
      navigateTo('achievements');
      break;
    case 'settings':
      navigateTo('settings');
      break;
    case 'back':
      navigateTo('main');
      break;
    case 'retry': {
      // Show interstitial ad every 3 deaths
      const shouldShowAd = game.deathCount > 0 && game.deathCount % 3 === 0;
      const doRetry = () => {
        if (game.isDailyMode) {
          game.startDaily();
        } else if (game.mode === 'classic' && game.classicLevelIndex >= 0) {
          game.startClassicLevel(game.classicLevelIndex);
        } else {
          game.startGame(game.mode);
        }
      };
      if (shouldShowAd) {
        getPlatform().showAd('midgame').then(() => doRetry()).catch(() => doRetry());
      } else {
        doRetry();
      }
      break;
    }
    case 'menu':
      game.state = 'menu';
      navigateTo('main');
      game.onStateChange?.('menu');
      game.audio.stopMusic();
      game.audio.startMenuMusic();
      break;
    case 'resume':
      game.resume();
      break;
    case 'toggle_music': {
      const sm = loadSave().settings;
      const newMusicVol = sm.musicVolume > 0 ? 0 : 0.5;
      updateSettings({ musicVolume: newMusicVol });
      game.audio.setMusicVolume(newMusicVol);
      break;
    }
    case 'toggle_sfx': {
      const ss = loadSave().settings;
      const newSfxVol = ss.sfxVolume > 0 ? 0 : 0.7;
      updateSettings({ sfxVolume: newSfxVol });
      game.audio.setSFXVolume(newSfxVol);
      break;
    }
    case 'toggle_particles': {
      const sp = loadSave().settings;
      updateSettings({ particles: !sp.particles });
      break;
    }
    case 'toggle_shake': {
      const sk = loadSave().settings;
      updateSettings({ screenShake: !sk.screenShake });
      break;
    }
    case 'tab_skins':
      setShopTab('skins');
      break;
    case 'tab_trails':
      setShopTab('trails');
      break;
    case 'rewarded_ad':
      getPlatform().showAd('rewarded').then(() => {
        const save = loadSave();
        updateSave({ coins: save.coins + 50 });
        game.audio.playSFX('purchase_success');
      }).catch(() => {
        // Ad failed or was skipped — no reward
      });
      break;
  }
}

// Button hover tracking
canvas.addEventListener('mousemove', (e) => {
  updateButtonHover(e.clientX, e.clientY);
});

// Register click handlers (prevent double-fire on touch devices)
let lastInputWasTouch = false;

canvas.addEventListener('click', (e) => {
  if (lastInputWasTouch) {
    lastInputWasTouch = false;
    return; // Skip synthetic click after touch
  }
  if (game.state !== 'playing') {
    handleClick(e.clientX, e.clientY);
  }
});

canvas.addEventListener('touchend', (e) => {
  lastInputWasTouch = true;
  if (game.state !== 'playing') {
    const touch = e.changedTouches[0];
    if (touch) {
      // For shop screen, only treat as click if finger didn't move much (not a scroll)
      if (game.state === 'menu' && getMenuScreen() === 'shop') {
        const dy = Math.abs(touch.clientY - touchStartY);
        if (dy > 10) return; // was a scroll gesture
      }
      handleClick(touch.clientX, touch.clientY);
    }
  }
}, { passive: true });

// Keyboard shortcuts
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (game.state === 'playing') game.pause();
    else if (game.state === 'paused') game.resume();
    else if (getMenuScreen() !== 'main') navigateTo('main');
  }
  if (e.code === 'Space' || e.key === 'Enter') {
    if (game.state === 'dead') {
      e.preventDefault();
      if (game.mode === 'classic' && game.classicLevelIndex >= 0) {
        game.startClassicLevel(game.classicLevelIndex);
      } else {
        game.startGame(game.mode);
      }
    } else if (game.state === 'menu' && getMenuScreen() === 'main') {
      e.preventDefault();
      game.startGame('endless');
    }
  }
});

// Scroll handling for shop screen
canvas.addEventListener('wheel', (e) => {
  if (game.state === 'menu' && getMenuScreen() === 'shop') {
    e.preventDefault();
    scrollShop(e.deltaY);
  }
}, { passive: false });

let touchStartY = 0;
let touchLastY = 0;
canvas.addEventListener('touchstart', (e) => {
  if (game.state === 'menu' && getMenuScreen() === 'shop') {
    const touch = e.touches[0];
    if (touch) {
      touchStartY = touch.clientY;
      touchLastY = touch.clientY;
    }
  }
}, { passive: true });

canvas.addEventListener('touchmove', (e) => {
  if (game.state === 'menu' && getMenuScreen() === 'shop') {
    const touch = e.touches[0];
    if (touch) {
      const dy = touchLastY - touch.clientY;
      touchLastY = touch.clientY;
      scrollShop(dy);
      e.preventDefault();
    }
  }
}, { passive: false });

// SDK lifecycle hooks
game.onStateChange = (state) => {
  const sdk = getPlatform();
  if (state === 'playing') {
    sdk.gameplayStart();
  } else {
    sdk.gameplayStop();

    // On death/completion: check achievements and happyTime
    if (state === 'dead') {
      const newAch = checkAchievements();
      if (newAch.length > 0) {
        sdk.happyTime();
        // Show toast for each newly unlocked achievement
        for (const achId of newAch) {
          const ach = ACHIEVEMENTS.find(a => a.id === achId);
          if (ach) {
            game.audio.playSFX('achievement_unlock');
            showToast(`${ach.icon} ${ach.name}`, ach.desc);
          }
        }
      }
      if (game.isNewHighScore || game.classicComplete) {
        sdk.happyTime();
      }
    }
  }
};

// Daily login bonus check
function checkDailyLoginBonus(): void {
  const save = loadSave();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  if (save.lastLoginDate === todayStr) return; // Already claimed today

  // Check streak
  let streak = 1;
  if (save.lastLoginDate) {
    const lastDate = new Date(save.lastLoginDate);
    const diff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 1) {
      streak = save.loginStreak + 1;
    }
    // If diff > 1, streak resets to 1
  }

  const bonus = Math.min(200, 50 + streak * 10);
  updateSave({
    lastLoginDate: todayStr,
    loginStreak: streak,
    coins: save.coins + bonus,
  });
  showToast(`Daily Bonus: +${bonus}`, `Login streak: ${streak} day${streak > 1 ? 's' : ''}`);
}

// Init platform SDK, then start game loop
initPlatform().then(() => {
  loading.style.opacity = '0';
  setTimeout(() => loading.remove(), 500);

  game.corridor.generate(-200, 2000, 0);
  game.player.reset(100, game.height / 2);
  game.camera.x = 0;
  game.camera.y = 0;

  // Start ambient menu music (will init audio on first user interaction)
  game.audio.init();
  game.audio.startMenuMusic();

  // Check daily login bonus
  checkDailyLoginBonus();

  requestAnimationFrame(loop);
});
