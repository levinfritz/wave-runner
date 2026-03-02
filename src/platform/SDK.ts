/**
 * Platform SDK abstraction.
 * Lazy-initialized: call initPlatform() after page load, use getPlatform() everywhere.
 * Supports CrazyGames SDK v3 and Poki SDK.
 */

export interface PlatformSDK {
  init(): Promise<void>;
  gameplayStart(): void;
  gameplayStop(): void;
  happyTime(): void;
  showAd(type: 'midgame' | 'rewarded'): Promise<boolean>;
}

// ─── CrazyGames SDK v3 ─────────────────────────────────

class CrazyGamesSDK implements PlatformSDK {
  private sdk: any = null;

  async init(): Promise<void> {
    try {
      const cg = (window as any).CrazyGames;
      if (cg?.SDK) {
        this.sdk = cg.SDK;
        await this.sdk.init();
        console.log('[SDK] CrazyGames v3 initialized');
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
    this.sdk?.game?.happyTime();
  }

  async showAd(type: 'midgame' | 'rewarded'): Promise<boolean> {
    if (!this.sdk?.ad) return false;
    // Bracket ads with gameplay lifecycle
    this.gameplayStop();
    try {
      return await new Promise<boolean>((resolve) => {
        const callbacks = {
          adStarted: () => {},
          adFinished: () => resolve(true),
          adError: () => resolve(false),
        };
        this.sdk.ad.requestAd(type === 'rewarded' ? 'rewarded' : 'midgame', callbacks);
      });
    } catch {
      return false;
    } finally {
      this.gameplayStart();
    }
  }
}

// ─── Poki SDK ────────────────────────────────────────────

class PokiSDKImpl implements PlatformSDK {
  private sdk: any = null;

  async init(): Promise<void> {
    try {
      const poki = (window as any).PokiSDK;
      if (poki) {
        poki.gameLoadingStart?.();
        await poki.init();
        poki.gameLoadingFinished?.();
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
    // Bracket ads with gameplay lifecycle
    this.gameplayStop();
    try {
      if (type === 'rewarded') {
        await this.sdk.rewardedBreak();
      } else {
        await this.sdk.commercialBreak();
      }
      return true;
    } catch {
      return false;
    } finally {
      this.gameplayStart();
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

// ─── Lazy initialization ────────────────────────────────

let _platform: PlatformSDK | null = null;

export function getPlatform(): PlatformSDK {
  if (!_platform) _platform = new NoopSDK();
  return _platform;
}

export async function initPlatform(): Promise<PlatformSDK> {
  const cg = (window as any).CrazyGames;
  if (cg?.SDK) {
    _platform = new CrazyGamesSDK();
  } else if ((window as any).PokiSDK) {
    _platform = new PokiSDKImpl();
  } else {
    _platform = new NoopSDK();
  }
  await _platform.init();
  return _platform;
}
