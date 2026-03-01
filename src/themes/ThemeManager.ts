import { themes, type GameTheme } from './themes';
import { lerp } from '../utils/Math';

export class ThemeManager {
  current: GameTheme;
  next: GameTheme | null = null;
  private transitionProgress = 0;
  private transitioning = false;
  private transitionDuration = 2.0; // seconds
  private themeIndex = 0;
  private distanceSinceChange = 0;
  private changeInterval = 150; // meters between theme changes
  private shuffledOrder: number[] = [];

  // Blended values for rendering
  blended: GameTheme;

  constructor() {
    this.shuffleThemes();
    this.current = themes[this.shuffledOrder[0]];
    this.blended = { ...this.current };
  }

  private shuffleThemes(): void {
    this.shuffledOrder = themes.map((_, i) => i);
    for (let i = this.shuffledOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.shuffledOrder[i], this.shuffledOrder[j]] = [this.shuffledOrder[j], this.shuffledOrder[i]];
    }
  }

  update(dt: number, distanceDelta: number): void {
    this.distanceSinceChange += distanceDelta;

    if (!this.transitioning && this.distanceSinceChange >= this.changeInterval) {
      this.startTransition();
    }

    if (this.transitioning) {
      this.transitionProgress += dt / this.transitionDuration;
      if (this.transitionProgress >= 1) {
        this.transitionProgress = 0;
        this.transitioning = false;
        this.current = this.next!;
        this.next = null;
        this.blended = { ...this.current };
      } else {
        this.blendThemes();
      }
    }
  }

  private startTransition(): void {
    this.distanceSinceChange = 0;
    this.themeIndex = (this.themeIndex + 1) % this.shuffledOrder.length;
    if (this.themeIndex === 0) this.shuffleThemes();
    this.next = themes[this.shuffledOrder[this.themeIndex]];
    this.transitioning = true;
    this.transitionProgress = 0;
  }

  private blendThemes(): void {
    if (!this.next) return;
    const t = this.transitionProgress;
    const a = this.current;
    const b = this.next;

    this.blended = {
      name: t < 0.5 ? a.name : b.name,
      background: {
        gradient: a.background.gradient.map((c, i) =>
          lerpColor(c, b.background.gradient[i] || b.background.gradient[0], t)
        ),
        pattern: t < 0.5 ? a.background.pattern : b.background.pattern,
        patternColor: lerpColor(a.background.patternColor, b.background.patternColor, t),
        patternScale: lerp(a.background.patternScale, b.background.patternScale, t),
        parallaxLayers: t < 0.5 ? a.background.parallaxLayers : b.background.parallaxLayers,
      },
      corridor: {
        wallColor: lerpColor(a.corridor.wallColor, b.corridor.wallColor, t),
        wallThickness: lerp(a.corridor.wallThickness, b.corridor.wallThickness, t),
        fillColor: lerpColor(a.corridor.fillColor, b.corridor.fillColor, t),
        wallGlow: t < 0.5 ? a.corridor.wallGlow : b.corridor.wallGlow,
        glowColor: lerpColor(a.corridor.glowColor, b.corridor.glowColor, t),
      },
      obstacles: {
        primaryColor: lerpColor(a.obstacles.primaryColor, b.obstacles.primaryColor, t),
        secondaryColor: lerpColor(a.obstacles.secondaryColor, b.obstacles.secondaryColor, t),
        glowIntensity: lerp(a.obstacles.glowIntensity, b.obstacles.glowIntensity, t),
      },
      player: {
        color: lerpColor(a.player.color, b.player.color, t),
        trailColor: lerpColor(a.player.trailColor, b.player.trailColor, t),
        trailGlow: t < 0.5 ? a.player.trailGlow : b.player.trailGlow,
      },
      particles: {
        enabled: a.particles.enabled || b.particles.enabled,
        color: lerpColor(a.particles.color, b.particles.color, t),
        style: t < 0.5 ? a.particles.style : b.particles.style,
      },
      ui: {
        textColor: lerpColor(a.ui.textColor, b.ui.textColor, t),
        accentColor: lerpColor(a.ui.accentColor, b.ui.accentColor, t),
      },
    };
  }

  setThemeByName(name: string): void {
    const theme = themes.find(t => t.name === name);
    if (theme) {
      this.current = theme;
      this.blended = { ...theme };
    }
  }

  get isTransitioning(): boolean {
    return this.transitioning;
  }

  get progress(): number {
    return this.transitionProgress;
  }
}

// Color utility functions
function parseColor(hex: string): [number, number, number, number] {
  const clean = hex.replace('#', '');
  if (clean.length === 8) {
    return [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16),
      parseInt(clean.slice(6, 8), 16) / 255,
    ];
  }
  if (clean.length === 6) {
    return [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16),
      1,
    ];
  }
  return [0, 0, 0, 1];
}

function toHex(r: number, g: number, b: number, a: number = 1): string {
  const hr = Math.round(r).toString(16).padStart(2, '0');
  const hg = Math.round(g).toString(16).padStart(2, '0');
  const hb = Math.round(b).toString(16).padStart(2, '0');
  if (a < 1) {
    const ha = Math.round(a * 255).toString(16).padStart(2, '0');
    return `#${hr}${hg}${hb}${ha}`;
  }
  return `#${hr}${hg}${hb}`;
}

export function lerpColor(c1: string, c2: string, t: number): string {
  const [r1, g1, b1, a1] = parseColor(c1);
  const [r2, g2, b2, a2] = parseColor(c2);
  return toHex(
    lerp(r1, r2, t),
    lerp(g1, g2, t),
    lerp(b1, b2, t),
    lerp(a1, a2, t)
  );
}
