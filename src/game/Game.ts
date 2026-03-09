import { Player } from './Player';
import { Corridor } from './Corridor';
import { Camera } from './Camera';
import { LevelGenerator } from './LevelGenerator';
import { ParticleSystem } from './ParticleSystem';
import { ThemeManager } from '../themes/ThemeManager';
import { AudioManager } from '../audio/AudioManager';
import { renderBackground } from './Background';
import { checkWallCollision, checkObstacleCollision, checkNearMiss } from './Collision';
import { updateObstacle, renderObstacle, checkPortalCollision } from './Obstacle';
import { updateCoin, renderCoin, checkCoinCollision } from './Coin';
import { LEVELS } from './Levels';
import { addFloatingText } from '../ui/HUD';
import { loadSave, updateSave, getTodayString, getDailySeed } from '../utils/Storage';

export type GameState = 'menu' | 'playing' | 'dead' | 'paused';
export type GameMode = 'endless' | 'classic';

const CONTROL_KEYS = new Set(['Space', 'ArrowUp', 'KeyW']);

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width = 0;
  height = 0;

  state: GameState = 'menu';
  mode: GameMode = 'endless';

  player: Player;
  corridor: Corridor;
  camera: Camera;
  levelGen: LevelGenerator;
  particles: ParticleSystem;
  themeManager: ThemeManager;
  audio: AudioManager;

  // Input - track pressed keys directly
  isHolding = false;
  private keysDown = new Set<string>();
  private mouseDown = false;
  private touchDown = false;

  // Game state
  distance = 0;
  scrollSpeed = 200;
  baseScrollSpeed = 200;
  maxScrollSpeed = 400;
  gameTime = 0;
  highScore = 0;
  isNewHighScore = false;
  coinsCollected = 0;
  classicLevelIndex = -1; // -1 = endless
  classicTargetDistance = 0;
  classicComplete = false;
  isDailyMode = false;
  deathCount = 0; // deaths this session (for ad pacing)
  showTutorial = false; // true only during the very first game
  private graceTimer = 0;
  private modeFlashTimer = 0;
  private modeFlashColor = '#ffffff';
  private scanlinePattern: CanvasPattern | null = null;

  // Death slow-motion
  private deathSlowMoTimer = 0;
  private readonly DEATH_SLOWMO_DURATION = 0.5;
  private readonly DEATH_TIME_SCALE = 0.3;

  // Countdown
  countdownTimer = 0;
  private countdownPhase = 0; // 3, 2, 1, 0 (go)

  // Near-miss combo system
  private nearMissCooldown = 0;
  nearMissCombo = 0;
  nearMissComboTimer = 0;
  bestCombo = 0;
  private readonly COMBO_WINDOW = 2.0;
  private readonly COMBO_MILESTONES = [5, 10, 20];
  private readonly COMBO_BONUS_COINS = [5, 15, 50];

  // Milestone celebrations
  private lastMilestone = 0;
  milestoneFlashTimer = 0;
  milestoneText = '';
  private readonly MILESTONES = [100, 250, 500, 1000, 2000, 5000];

  // Callbacks for UI
  onStateChange: ((state: GameState) => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.player = new Player();
    this.corridor = new Corridor(600);
    this.camera = new Camera(800, 600);
    this.levelGen = new LevelGenerator();
    this.particles = new ParticleSystem();
    this.themeManager = new ThemeManager();
    this.audio = new AudioManager();

    this.resize();
    this.setupInput();

    const save = loadSave();
    this.highScore = save.highScore;
    this.player.skinType = save.selectedSkin;
    this.player.trailType = save.selectedTrail;
  }

  resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.camera.resize(this.width, this.height);
  }

  private updateHolding(): void {
    // Combine all input sources — no array allocation
    let keyHeld = false;
    for (const k of this.keysDown) {
      if (CONTROL_KEYS.has(k)) { keyHeld = true; break; }
    }
    this.isHolding = keyHeld || this.mouseDown || this.touchDown;
  }

  private setupInput(): void {
    // Mouse
    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.mouseDown = true;
        this.updateHolding();
        this.audio.init();
        this.audio.resume();
      }
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.mouseDown = false;
        this.updateHolding();
      }
    });

    // Touch
    window.addEventListener('touchstart', (e) => {
      this.touchDown = true;
      this.updateHolding();
      this.audio.init();
      this.audio.resume();
      if (this.state === 'playing') {
        e.preventDefault();
      }
    }, { passive: false });
    window.addEventListener('touchend', (e) => {
      this.touchDown = false;
      this.updateHolding();
      if (this.state === 'playing') {
        e.preventDefault();
      }
    }, { passive: false });

    // Keyboard - track all keys
    window.addEventListener('keydown', (e) => {
      if (CONTROL_KEYS.has(e.code)) {
        e.preventDefault();
        this.keysDown.add(e.code);
        this.updateHolding();
        this.audio.init();
        this.audio.resume();
      }
    });
    window.addEventListener('keyup', (e) => {
      if (CONTROL_KEYS.has(e.code)) {
        e.preventDefault();
        this.keysDown.delete(e.code);
        this.updateHolding();
      }
    });

    // Resize
    window.addEventListener('resize', () => this.resize());
    document.addEventListener('fullscreenchange', () => this.resize());

    // Visibility - pause on tab switch
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === 'playing') {
        this.pause();
      }
    });

    // Orientation change - auto-pause
    window.addEventListener('orientationchange', () => {
      if (this.state === 'playing') {
        this.pause();
      }
    });
    if (screen.orientation) {
      screen.orientation.addEventListener('change', () => {
        if (this.state === 'playing') {
          this.pause();
        }
      });
    }
  }

  /** Haptic feedback (mobile only, fails silently on desktop) */
  private vibrate(pattern: number | number[]): void {
    try {
      navigator.vibrate?.(pattern);
    } catch {
      // Not supported — ignore
    }
  }

  startGame(mode: GameMode = 'endless'): void {
    this.mode = mode;
    this.state = 'playing';
    this.distance = 0;
    this.scrollSpeed = this.baseScrollSpeed;
    this.gameTime = 0;
    this.isNewHighScore = false;
    this.coinsCollected = 0;
    this.classicLevelIndex = -1;
    this.classicTargetDistance = 0;
    this.classicComplete = false;
    this.isDailyMode = false;
    this.graceTimer = 0.4;
    this.deathSlowMoTimer = 0;
    this.countdownTimer = 2.99; // 3-2-1 countdown (renders "3" at 2.99, "2" at 1.99, etc.)
    this.countdownPhase = 3;
    this.nearMissCooldown = 0;
    this.nearMissCombo = 0;
    this.nearMissComboTimer = 0;
    this.bestCombo = 0;
    this.lastMilestone = 0;
    this.milestoneFlashTimer = 0;

    // Track games played; show tutorial only on very first game ever
    const save = loadSave();
    this.showTutorial = !save.tutorialSeen;
    updateSave({ gamesPlayed: save.gamesPlayed + 1, tutorialSeen: true });

    // Reset systems
    this.corridor.reset(this.height);
    this.levelGen.reset();
    this.particles.clear();

    // Pre-generate corridor ahead
    this.corridor.generate(-200, 1500, 0);

    // Find safe spawn position: center of corridor at x=100
    const walls = this.corridor.getWallsAt(100);
    const spawnY = walls ? (walls.topY + walls.bottomY) / 2 : this.height / 2;
    this.player.reset(100, spawnY);

    // Generate obstacles (but not in the first 500px - safe zone)
    this.levelGen.generate(this.player.x, (x) => this.corridor.getWallsAt(x));

    // Camera snaps to player
    this.camera.x = this.player.x - this.width * 0.3;
    this.camera.y = this.player.y - this.height / 2;
    this.camera.targetX = this.camera.x;
    this.camera.targetY = this.camera.y;

    // Re-read input state (space may already be held)
    this.updateHolding();

    this.audio.init();
    this.audio.startMusic();

    this.onStateChange?.('playing');
  }

  startClassicLevel(levelIndex: number): void {
    const level = LEVELS[levelIndex];
    if (!level) return;

    this.startGame('classic');
    this.classicLevelIndex = levelIndex;
    this.classicTargetDistance = level.targetDistance;
    this.classicComplete = false;

    // Fixed speed (no acceleration in classic)
    this.baseScrollSpeed = level.speed;
    this.scrollSpeed = level.speed;
    this.maxScrollSpeed = level.speed;

    // Set difficulty and corridor width
    this.levelGen.setFixedDifficulty(level.difficulty);
    this.corridor.setBaseGap(level.corridorWidth);

    // Portal and mode control
    if (level.noPortals) this.levelGen.setNoPortals(true);
    if (level.startMode === 'wave') {
      this.player.physicsMode = 'wave';
      this.levelGen.setStartMode('wave');
    }

    // Regenerate corridor with correct difficulty + width
    this.corridor.reset(this.height);
    this.corridor.generate(-200, 1500, level.difficulty);

    // Reposition player in correctly-sized corridor
    const walls = this.corridor.getWallsAt(100);
    const spawnY = walls ? (walls.topY + walls.bottomY) / 2 : this.height / 2;
    this.player.reset(100, spawnY);

    // Regenerate obstacles for correct corridor geometry
    this.levelGen.reset();
    this.levelGen.setFixedDifficulty(level.difficulty);
    if (level.noPortals) this.levelGen.setNoPortals(true);
    if (level.startMode === 'wave') this.levelGen.setStartMode('wave');
    this.levelGen.generate(this.player.x, (x) => this.corridor.getWallsAt(x));

    // Snap camera
    this.camera.x = this.player.x - this.width * 0.3;
    this.camera.y = this.player.y - this.height / 2;
    this.camera.targetX = this.camera.x;
    this.camera.targetY = this.camera.y;
  }

  startDaily(): void {
    this.startGame('endless');
    this.isDailyMode = true;

    // Use daily seed for consistent difficulty ramp
    const seed = getDailySeed();
    this.baseScrollSpeed = 200 + (seed % 50);
    this.scrollSpeed = this.baseScrollSpeed;
    this.maxScrollSpeed = this.baseScrollSpeed + 200;
    this.levelGen.setFixedDifficulty(3 + (seed % 5));
  }

  pause(): void {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.audio.stopMusic();
      this.onStateChange?.('paused');
    }
  }

  resume(): void {
    if (this.state === 'paused') {
      this.state = 'playing';
      this.audio.startMusic();
      this.onStateChange?.('playing');
    }
  }

  update(dt: number): void {
    const settings = loadSave().settings;

    // Menu / pause background animation
    if (this.state === 'menu' || this.state === 'paused') {
      this.gameTime += dt;
      this.themeManager.update(dt, dt * 2);
      const theme = this.themeManager.blended;
      if (theme.particles.enabled && settings.particles) {
        this.particles.spawn(this.camera.renderX, this.camera.renderY, this.width, this.height, theme.particles.color, theme.particles.style, dt);
      }
      this.particles.update(dt);
      // Slowly scroll camera for menu background
      if (this.state === 'menu') {
        this.camera.x += 30 * dt;
        this.corridor.generate(this.camera.x - 200, this.camera.x + this.width + 500, 0);
        this.corridor.cleanup(this.camera.x - 400);
      }
      return;
    }

    if (this.state === 'playing') {
      // Death slow-motion: real-time countdown, slowed game time
      if (this.deathSlowMoTimer > 0) {
        this.deathSlowMoTimer -= dt;
        dt *= this.DEATH_TIME_SCALE;
        if (this.deathSlowMoTimer <= 0) {
          this.state = 'dead';
          this.audio.stopMusic();
          this.onStateChange?.('dead');
          return;
        }
      }

      // Countdown: render but don't move player
      if (this.countdownTimer > 0) {
        this.countdownTimer -= dt;
        const newPhase = Math.ceil(this.countdownTimer);
        if (newPhase < this.countdownPhase && newPhase >= 0) {
          this.countdownPhase = newPhase;
          this.audio.playSFX('game_start_countdown');
        }
        this.gameTime += dt;
        this.themeManager.update(dt, 0);
        return;
      }

      this.gameTime += dt;

      // Grace period countdown
      if (this.graceTimer > 0) {
        this.graceTimer -= dt;
      }

      // Mode flash countdown
      if (this.modeFlashTimer > 0) {
        this.modeFlashTimer -= dt;
      }

      // Increase speed very gradually — barely noticeable moment to moment
      this.scrollSpeed = Math.min(
        this.maxScrollSpeed,
        this.baseScrollSpeed + this.distance * 0.04
      );

      // Update music tempo
      const speedRange = this.maxScrollSpeed - this.baseScrollSpeed;
      const tempoScale = speedRange > 0 ? (this.scrollSpeed - this.baseScrollSpeed) / speedRange : 0;
      this.audio.setTempo(0.8 + tempoScale * 0.6);
      this.audio.setSpeedPct(tempoScale);

      // Update player
      this.player.update(dt, this.isHolding, this.scrollSpeed);

      // Thrust particles when holding
      if (this.isHolding && this.player.alive && settings.particles && this.deathSlowMoTimer <= 0) {
        const theme = this.themeManager.blended;
        this.particles.emitThrust(this.player.x - 12, this.player.y, theme.player.trailColor);
      }

      // Calculate distance in meters
      this.distance = Math.floor(this.player.x / 50);

      // Generate more corridor and obstacles
      const diff = this.levelGen.getDifficulty();
      this.corridor.generate(this.player.x - 200, this.player.x + this.width + 500, diff);
      this.levelGen.updateDifficulty(this.distance);
      this.levelGen.generate(this.player.x, (x) => this.corridor.getWallsAt(x));

      // Update obstacles
      for (const obs of this.levelGen.obstacles) {
        updateObstacle(obs, dt, this.gameTime);
      }

      // Update & collect coins
      for (const coin of this.levelGen.coins) {
        updateCoin(coin, dt);
        if (!coin.collected && checkCoinCollision(coin, this.player.x, this.player.y)) {
          coin.collected = true;
          this.coinsCollected++;
          this.audio.playSFX('coin');
          this.vibrate(15);
          this.particles.burst(coin.x, coin.y, '#ffcc00', 8);
          // Floating "+1" text at coin screen position
          const screenX = coin.x - this.camera.renderX;
          const screenY = coin.y - this.camera.renderY;
          addFloatingText('+1', screenX, screenY - 10, '#ffcc00');
        }
      }

      // Check portal collisions (mode switching)
      for (const obs of this.levelGen.obstacles) {
        if ((obs.type === 'portal_ship' || obs.type === 'portal_wave') && !obs.active) continue;
        if (checkPortalCollision(obs, this.player.x, this.player.y)) {
          const targetMode = obs.type === 'portal_wave' ? 'wave' : 'ship';
          if (this.player.physicsMode !== targetMode) {
            this.player.physicsMode = targetMode;
            this.player.vy = 0; // reset velocity on mode switch
            this.audio.playSFX('portal_transition');
            this.vibrate([20, 10, 20]);
            const flashColor = obs.type === 'portal_wave' ? '#aa44ff' : '#4488ff';
            this.particles.burst(this.player.x, this.player.y, flashColor, 16);
            this.modeFlashTimer = 0.3;
            this.modeFlashColor = flashColor;
            if (settings.screenShake) {
              this.camera.shake(5);
            }
          }
          obs.active = false; // prevent re-triggering
        }
      }

      // Classic mode completion check
      if (this.mode === 'classic' && this.classicLevelIndex >= 0 && this.distance >= this.classicTargetDistance && !this.classicComplete) {
        this.classicComplete = true;
        this.onClassicComplete();
        return;
      }

      // Check collisions (skip during grace period and death slowmo)
      if (this.graceTimer <= 0 && this.deathSlowMoTimer <= 0) {
        if (checkWallCollision(this.player, this.corridor, this.height) || checkObstacleCollision(this.player, this.levelGen.obstacles)) {
          this.onDeath();
        }
      }

      // Near-miss combo system
      if (this.nearMissComboTimer > 0) {
        this.nearMissComboTimer -= dt;
        if (this.nearMissComboTimer <= 0) {
          this.nearMissCombo = 0;
        }
      }
      if (this.nearMissCooldown > 0) {
        this.nearMissCooldown -= dt;
      } else if (this.graceTimer <= 0 && this.deathSlowMoTimer <= 0 && this.player.alive) {
        const nearMiss = checkNearMiss(this.player, this.corridor, this.levelGen.obstacles, this.height);
        if (nearMiss) {
          this.nearMissCombo++;
          this.nearMissComboTimer = this.COMBO_WINDOW;
          if (this.nearMissCombo > this.bestCombo) {
            this.bestCombo = this.nearMissCombo;
          }
          this.audio.playSFX('nearmiss');
          this.nearMissCooldown = 0.3;

          // Check combo milestones (5/10/20)
          let isMilestone = false;
          for (let i = this.COMBO_MILESTONES.length - 1; i >= 0; i--) {
            if (this.nearMissCombo === this.COMBO_MILESTONES[i]) {
              isMilestone = true;
              const bonus = this.COMBO_BONUS_COINS[i];
              this.coinsCollected += bonus;
              this.particles.burst(this.player.x, this.player.y, '#ffcc00', 24);
              this.audio.playSFX('speed_milestone');
              if (settings.screenShake) {
                this.camera.shake(10);
              }
              const screenX = this.player.x - this.camera.renderX;
              const screenY = this.player.y - this.camera.renderY;
              addFloatingText(`+${bonus} COMBO!`, screenX, screenY - 20, '#ffcc00', 'combo');
              break;
            }
          }

          if (!isMilestone) {
            this.particles.burst(nearMiss.x, nearMiss.y, '#ffffff', 6);
          }

          // Floating combo text at 2+
          if (this.nearMissCombo >= 2 && !isMilestone) {
            const screenX = this.player.x - this.camera.renderX;
            const screenY = this.player.y - this.camera.renderY;
            addFloatingText(`x${this.nearMissCombo} CLOSE!`, screenX, screenY - 20, '#ffffff', 'combo');
          }
        }
      }

      // Milestone celebrations
      for (const m of this.MILESTONES) {
        if (this.distance >= m && this.lastMilestone < m) {
          this.lastMilestone = m;
          this.milestoneText = `${m}m!`;
          this.milestoneFlashTimer = 1.5;
          this.audio.playSFX('speed_milestone');
          this.particles.burst(this.player.x, this.player.y, '#ffcc00', 20);
          if (settings.screenShake) {
            this.camera.shake(8);
          }
          break;
        }
      }
      if (this.milestoneFlashTimer > 0) this.milestoneFlashTimer -= dt;

      // Theme transitions
      const distDelta = this.scrollSpeed * dt / 50;
      this.themeManager.update(dt, distDelta);

      // Cleanup behind camera
      this.corridor.cleanup(this.player.x - this.width);
      this.levelGen.cleanup(this.player.x - this.width);
    }

    // Camera
    this.camera.follow(this.player.x, this.player.y);
    this.camera.update(dt);

    // Particles
    const theme = this.themeManager.blended;
    if (theme.particles.enabled && settings.particles) {
      this.particles.spawn(
        this.camera.renderX, this.camera.renderY,
        this.width, this.height,
        theme.particles.color, theme.particles.style,
        dt
      );
    }
    this.particles.update(dt);

    // Update dead player (death particles)
    if (this.state === 'dead') {
      this.player.update(dt, false, 0);
    }
  }

  private onDeath(): void {
    const theme = this.themeManager.blended;
    this.player.die(theme);
    this.audio.playSFX('death');
    this.vibrate([50, 30, 100]);
    this.deathCount++;

    // Start slow-motion (state transitions to 'dead' when timer expires)
    this.deathSlowMoTimer = this.DEATH_SLOWMO_DURATION;

    if (loadSave().settings.screenShake) {
      this.camera.shake(15);
    }

    // Check highscore
    if (this.distance > this.highScore) {
      this.highScore = this.distance;
      this.isNewHighScore = true;
      updateSave({ highScore: this.highScore });
      setTimeout(() => this.audio.playSFX('highscore'), 500);
    }

    // Update totals (onDeath is not hot path, loadSave OK here)
    const save = loadSave();
    const updates: Partial<typeof save> = {
      totalDistance: save.totalDistance + this.distance,
      coins: save.coins + this.coinsCollected,
      totalCoinsEarned: save.totalCoinsEarned + this.coinsCollected,
      totalDeaths: save.totalDeaths + 1,
      bestCombo: Math.max(save.bestCombo, this.bestCombo),
    };

    // Daily challenge best
    if (this.isDailyMode) {
      const today = getTodayString();
      if (save.dailyDate !== today) {
        updates.dailyDate = today;
        updates.dailyBest = this.distance;
      } else if (this.distance > save.dailyBest) {
        updates.dailyBest = this.distance;
      }
    }

    // Add to top runs leaderboard
    const modeLabel = this.isDailyMode ? 'daily' : this.mode;
    const topRuns = [...(save.topRuns || []), { distance: this.distance, date: getTodayString(), mode: modeLabel }];
    topRuns.sort((a, b) => b.distance - a.distance);
    updates.topRuns = topRuns.slice(0, 10);

    updateSave(updates);

    // Reset speeds to defaults
    this.baseScrollSpeed = 200;
    this.maxScrollSpeed = 400;

    this.onStateChange?.('dead');
  }

  private onClassicComplete(): void {
    this.state = 'dead'; // Reuse death screen to show results
    this.audio.stopMusic();
    this.audio.playSFX('level_complete');

    // Calculate stars based on coins collected
    const level = LEVELS[this.classicLevelIndex];
    let stars = 0;
    if (this.coinsCollected >= level.starThresholds[0]) stars = 1;
    if (this.coinsCollected >= level.starThresholds[1]) stars = 2;
    if (this.coinsCollected >= level.starThresholds[2]) stars = 3;

    // Save star rating (keep best)
    const save = loadSave();
    const prevStars = save.levelStars[level.id] || 0;
    if (stars > prevStars) {
      save.levelStars[level.id] = stars;
      updateSave({
        levelStars: save.levelStars,
        coins: save.coins + this.coinsCollected,
        totalDistance: save.totalDistance + this.distance,
      });
    } else {
      updateSave({
        coins: save.coins + this.coinsCollected,
        totalDistance: save.totalDistance + this.distance,
      });
    }

    this.isNewHighScore = true; // Reuse flag to show "LEVEL COMPLETE"
    this.onStateChange?.('dead');

    // Reset speeds and corridor width to defaults for next game
    this.baseScrollSpeed = 200;
    this.maxScrollSpeed = 400;
    this.corridor.setBaseGap(220);
  }

  render(): void {
    const ctx = this.ctx;
    const theme = this.themeManager.blended;
    const camX = this.camera.renderX;
    const camY = this.camera.renderY;

    // Clear
    ctx.clearRect(0, 0, this.width, this.height);

    // Background
    renderBackground(ctx, this.width, this.height, camX, theme, this.gameTime);

    // Particles (behind)
    this.particles.render(ctx, camX, camY);

    // Corridor
    const isWaveMode = this.state === 'playing' && this.player.physicsMode === 'wave';
    this.corridor.render(ctx, camX, camY, this.width, this.height, theme, isWaveMode);

    // Coins
    for (const coin of this.levelGen.coins) {
      if (!coin.collected && this.camera.isVisible(coin.x, coin.y, 50)) {
        renderCoin(ctx, coin, camX, camY, theme);
      }
    }

    // Obstacles
    for (const obs of this.levelGen.obstacles) {
      if (this.camera.isVisible(obs.x, obs.y, 100)) {
        renderObstacle(ctx, obs, camX, camY, theme);
      }
    }

    // Player
    this.player.render(ctx, camX, camY, theme);

    // Wave mode visual overlay — neon tint + pulsating vignette
    if (this.state === 'playing' && this.player.physicsMode === 'wave') {
      const pulse = Math.sin(this.gameTime * 4) * 0.03 + 0.07;

      // Purple/magenta screen tint
      ctx.globalAlpha = pulse;
      ctx.fillStyle = '#6600aa';
      ctx.fillRect(0, 0, this.width, this.height);

      // Pulsating edge vignette
      const vignetteGrad = ctx.createRadialGradient(
        this.width / 2, this.height / 2, Math.min(this.width, this.height) * 0.3,
        this.width / 2, this.height / 2, Math.max(this.width, this.height) * 0.7
      );
      vignetteGrad.addColorStop(0, 'rgba(0,0,0,0)');
      vignetteGrad.addColorStop(1, 'rgba(100,0,180,0.25)');
      ctx.globalAlpha = 0.5 + Math.sin(this.gameTime * 3) * 0.15;
      ctx.fillStyle = vignetteGrad;
      ctx.fillRect(0, 0, this.width, this.height);

      // Scanline effect (cached pattern — one draw call)
      if (!this.scanlinePattern) {
        const pCanvas = document.createElement('canvas');
        pCanvas.width = 1;
        pCanvas.height = 4;
        const pCtx = pCanvas.getContext('2d')!;
        pCtx.fillStyle = '#000000';
        pCtx.fillRect(0, 0, 1, 1);
        this.scanlinePattern = ctx.createPattern(pCanvas, 'repeat');
      }
      ctx.globalAlpha = 0.03;
      if (this.scanlinePattern) {
        ctx.fillStyle = this.scanlinePattern;
        ctx.fillRect(0, 0, this.width, this.height);
      }

      ctx.globalAlpha = 1;
    }

    // Portal mode transition flash
    if (this.modeFlashTimer > 0) {
      const flashAlpha = this.modeFlashTimer / 0.3;
      ctx.globalAlpha = flashAlpha * 0.4;
      ctx.fillStyle = this.modeFlashColor;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.globalAlpha = 1;
    }

    // Grace period indicator (flash player)
    if (this.state === 'playing' && this.graceTimer > 0) {
      const flash = Math.sin(this.graceTimer * 15) > 0;
      if (flash) {
        const sx = this.player.x - camX;
        const sy = this.player.y - camY;
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sx, sy, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // Countdown overlay
    if (this.state === 'playing' && this.countdownTimer > 0) {
      const phase = Math.ceil(this.countdownTimer);
      const frac = this.countdownTimer - Math.floor(this.countdownTimer);
      const scale = 1 + (1 - frac) * 0.5;
      const alpha = frac;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(this.width / 2, this.height * 0.35);
      ctx.scale(scale, scale);
      ctx.font = 'bold 72px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 20;
      ctx.fillText(phase > 0 ? String(phase) : 'GO!', 0, 0);
      ctx.restore();
    }

    // Milestone celebration text
    if (this.milestoneFlashTimer > 0) {
      const mAlpha = Math.min(1, this.milestoneFlashTimer * 2);
      const mScale = 1 + (1.5 - this.milestoneFlashTimer) * 0.2;

      ctx.save();
      ctx.globalAlpha = mAlpha;
      ctx.translate(this.width / 2, this.height * 0.28);
      ctx.scale(mScale, mScale);
      ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffcc00';
      ctx.shadowColor = '#ffcc00';
      ctx.shadowBlur = 15;
      ctx.fillText(this.milestoneText, 0, 0);
      ctx.restore();
    }
  }
}
