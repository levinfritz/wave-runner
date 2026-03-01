import { Game } from './game/Game';
import { renderHUD } from './ui/HUD';
import { SKINS, TRAILS } from './game/Skins';
import { LEVELS } from './game/Levels';
import {
  renderMainMenu,
  renderGameOverScreen,
  renderPauseScreen,
  renderSettingsScreen,
  renderShopScreen,
  renderLevelSelectScreen,
  renderAchievementsScreen,
  updateScreens,
  getButtons,
  scrollShop,
  resetShopScroll,
  setShopTab,
} from './ui/Screens';
import { loadSave, updateSave, updateSettings } from './utils/Storage';
import { checkAchievements } from './game/Achievements';
import { platform } from './platform/SDK';

// Boot
const canvas = document.getElementById('game') as HTMLCanvasElement;
const loading = document.getElementById('loading') as HTMLDivElement;
const game = new Game(canvas);

let lastTime = performance.now();
type MenuScreen = 'main' | 'settings' | 'shop' | 'level_select' | 'achievements';
let menuScreen: MenuScreen = 'main';

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
    renderHUD(game.ctx, game, theme);
  } else if (game.state === 'menu') {
    switch (menuScreen) {
      case 'settings':
        renderSettingsScreen(game.ctx, game.width, game.height, theme, loadSave().settings);
        break;
      case 'shop':
        renderShopScreen(game.ctx, game.width, game.height, theme);
        break;
      case 'level_select':
        renderLevelSelectScreen(game.ctx, game.width, game.height, theme);
        break;
      case 'achievements':
        renderAchievementsScreen(game.ctx, game.width, game.height, theme);
        break;
      default:
        renderMainMenu(game.ctx, game.width, game.height, theme);
    }
  } else if (game.state === 'dead') {
    renderHUD(game.ctx, game, theme);
    renderGameOverScreen(game.ctx, game.width, game.height, game, theme);
  } else if (game.state === 'paused') {
    renderHUD(game.ctx, game, theme);
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
      // Buy it
      updateSave({
        coins: save.coins - skin.price,
        unlockedSkins: [...save.unlockedSkins, skinId],
        selectedSkin: skinId,
      });
      game.player.skinType = skinId;
      game.audio.playSFX('coin');
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
      updateSave({
        coins: save.coins - trail.price,
        unlockedTrails: [...save.unlockedTrails, trailId],
        selectedTrail: trailId,
      });
      game.player.trailType = trailId;
      game.audio.playSFX('coin');
    }
    return;
  }

  // Level start
  if (action.startsWith('level_')) {
    const levelIdx = parseInt(action.slice(6), 10);
    const level = LEVELS[levelIdx];
    if (!level) return;

    menuScreen = 'main';
    game.startClassicLevel(levelIdx);
    return;
  }

  switch (action) {
    case 'endless':
      menuScreen = 'main';
      game.startGame('endless');
      break;
    case 'daily':
      menuScreen = 'main';
      game.startDaily();
      break;
    case 'level_select':
      menuScreen = 'level_select';
      break;
    case 'shop':
      menuScreen = 'shop';
      resetShopScroll();
      break;
    case 'achievements':
      menuScreen = 'achievements';
      break;
    case 'settings':
      menuScreen = 'settings';
      break;
    case 'back':
      menuScreen = 'main';
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
        platform.showAd('midgame').then(() => doRetry()).catch(() => doRetry());
      } else {
        doRetry();
      }
      break;
    }
    case 'menu':
      game.state = 'menu';
      menuScreen = 'main';
      game.onStateChange?.('menu');
      game.audio.stopMusic();
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
  }
}

// Register click handlers
canvas.addEventListener('click', (e) => {
  if (game.state !== 'playing') {
    handleClick(e.clientX, e.clientY);
  }
});

canvas.addEventListener('touchend', (e) => {
  if (game.state !== 'playing') {
    const touch = e.changedTouches[0];
    if (touch) {
      // For shop screen, only treat as click if finger didn't move much (not a scroll)
      if (game.state === 'menu' && menuScreen === 'shop') {
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
    else if (menuScreen !== 'main') menuScreen = 'main';
  }
  if (e.code === 'Space' || e.key === 'Enter') {
    if (game.state === 'dead') {
      e.preventDefault();
      if (game.mode === 'classic' && game.classicLevelIndex >= 0) {
        game.startClassicLevel(game.classicLevelIndex);
      } else {
        game.startGame(game.mode);
      }
    } else if (game.state === 'menu' && menuScreen === 'main') {
      e.preventDefault();
      game.startGame('endless');
    }
  }
});

// Scroll handling for shop screen
canvas.addEventListener('wheel', (e) => {
  if (game.state === 'menu' && menuScreen === 'shop') {
    e.preventDefault();
    scrollShop(e.deltaY);
  }
}, { passive: false });

let touchStartY = 0;
let touchLastY = 0;
canvas.addEventListener('touchstart', (e) => {
  if (game.state === 'menu' && menuScreen === 'shop') {
    const touch = e.touches[0];
    if (touch) {
      touchStartY = touch.clientY;
      touchLastY = touch.clientY;
    }
  }
}, { passive: true });

canvas.addEventListener('touchmove', (e) => {
  if (game.state === 'menu' && menuScreen === 'shop') {
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
  if (state === 'playing') {
    platform.gameplayStart();
  } else {
    platform.gameplayStop();

    // On death/completion: check achievements and happyTime
    if (state === 'dead') {
      const newAch = checkAchievements();
      if (newAch.length > 0) {
        platform.happyTime();
      }
      if (game.isNewHighScore || game.classicComplete) {
        platform.happyTime();
      }
    }
  }
};

// Init platform SDK
platform.init();

// Start
loading.style.opacity = '0';
setTimeout(() => loading.remove(), 500);

game.corridor.generate(-200, 2000, 0);
game.player.reset(100, game.height / 2);
game.camera.x = 0;
game.camera.y = 0;

requestAnimationFrame(loop);
