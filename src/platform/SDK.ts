/**
 * Platform SDK abstraction.
 * Detects CrazyGames or Poki SDK, falls back to no-op.
 */

export interface PlatformSDK {
  init(): Promise<void>;
  gameplayStart(): void;
  gameplayStop(): void;
  happyTime(): void;
  showAd(type: 'midgame' | 'rewarded'): Promise<boolean>;
}

// ─── CrazyGames SDK ─────────────────────────────────────

class CrazyGamesSDK implements PlatformSDK {
  private sdk: any = null;

  async init(): Promise<void> {
    try {
      // CrazyGames injects window.CrazyGames
      const cg = (window as any).CrazyGames;
      if (cg?.CrazySDK) {
        this.sdk = new cg.CrazySDK();
        await this.sdk.init();
        console.log('[SDK] CrazyGames initialized');
      }
    } catch (e) {
      console.warn('[SDK] CrazyGames init failed:', e);
    }
  }

  gameplayStart(): void {
    this.sdk?.game?.gameplayStart();
  }

  gameplayStop(): void {
    this.sdk?.game?.gameplayStop();
  }

  happyTime(): void {
    this.sdk?.game?.happytime();
  }

  async showAd(type: 'midgame' | 'rewarded'): Promise<boolean> {
    if (!this.sdk?.ad) return false;
    try {
      if (type === 'midgame') {
        await this.sdk.ad.requestAd('midgame');
      } else {
        await this.sdk.ad.requestAd('rewarded');
      }
      return true;
    } catch {
      return false;
    }
  }
}

// ─── Poki SDK ────────────────────────────────────────────

class PokiSDK implements PlatformSDK {
  private sdk: any = null;

  async init(): Promise<void> {
    try {
      const poki = (window as any).PokiSDK;
      if (poki) {
        await poki.init();
        this.sdk = poki;
        console.log('[SDK] Poki initialized');
      }
    } catch (e) {
      console.warn('[SDK] Poki init failed:', e);
    }
  }

  gameplayStart(): void {
    this.sdk?.gameplayStart();
  }

  gameplayStop(): void {
    this.sdk?.gameplayStop();
  }

  happyTime(): void {
    this.sdk?.happyTime?.(1.0);
  }

  async showAd(type: 'midgame' | 'rewarded'): Promise<boolean> {
    if (!this.sdk) return false;
    try {
      if (type === 'rewarded') {
        await this.sdk.rewardedBreak();
      } else {
        await this.sdk.commercialBreak();
      }
      return true;
    } catch {
      return false;
    }
  }
}

// ─── No-op fallback ─────────────────────────────────────

class NoopSDK implements PlatformSDK {
  async init(): Promise<void> {
    console.log('[SDK] No platform detected, running standalone');
  }
  gameplayStart(): void {}
  gameplayStop(): void {}
  happyTime(): void {}
  async showAd(): Promise<boolean> { return false; }
}

// ─── Auto-detect ─────────────────────────────────────────

function detectPlatform(): PlatformSDK {
  if ((window as any).CrazyGames) return new CrazyGamesSDK();
  if ((window as any).PokiSDK) return new PokiSDK();
  return new NoopSDK();
}

export const platform: PlatformSDK = detectPlatform();
