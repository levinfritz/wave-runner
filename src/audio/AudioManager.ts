import { loadSave } from '../utils/Storage';

export type SFXType =
  | 'death' | 'click' | 'highscore' | 'nearmiss' | 'coin'
  | 'portal_transition' | 'menu_navigate' | 'achievement_unlock'
  | 'purchase_success' | 'purchase_denied' | 'level_complete'
  | 'speed_milestone' | 'game_start_countdown';

export class AudioManager {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private warmthFilter: BiquadFilterNode | null = null;
  private initialized = false;

  // Layered music
  private musicPlaying = false;
  private menuMusicPlaying = false;
  private tempo = 1.0;
  private speedPct = 0; // 0-1, how fast relative to max
  private currentBeat = 0;
  private nextBeatTime = 0;
  private schedulerId: number | null = null;
  private readonly SCHEDULE_AHEAD = 0.1; // seconds
  private readonly SCHEDULER_INTERVAL = 25; // ms

  // Layer gains
  private bassGain: GainNode | null = null;
  private melodyGain: GainNode | null = null;
  private padGain: GainNode | null = null;
  private padOsc: OscillatorNode | null = null;
  private padEnv: GainNode | null = null;

  // Note patterns
  private readonly BASS_NOTES = [55, 55, 73.42, 55, 82.41, 55, 73.42, 65.41];
  private readonly MELODY_NOTES = [
    523.25, 0, 659.25, 0, 783.99, 659.25, 0, 523.25,
    587.33, 0, 783.99, 0, 880, 783.99, 0, 659.25,
  ];
  private readonly PAD_NOTES = [110, 110, 146.83, 146.83, 164.81, 164.81, 130.81, 130.81];

  // Noise buffer (cached)
  private noiseBuffer: AudioBuffer | null = null;

  init(): void {
    if (this.initialized) return;
    try {
      this.ctx = new AudioContext();

      // Master gains
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      // Warmth filter for music
      this.warmthFilter = this.ctx.createBiquadFilter();
      this.warmthFilter.type = 'lowpass';
      this.warmthFilter.frequency.value = 900;
      this.warmthFilter.Q.value = 0.7;
      this.warmthFilter.connect(this.musicGain);
      this.musicGain.connect(this.ctx.destination);
      this.sfxGain.connect(this.ctx.destination);

      // Layer gains → warmth filter → music gain → destination
      this.bassGain = this.ctx.createGain();
      this.melodyGain = this.ctx.createGain();
      this.padGain = this.ctx.createGain();
      this.bassGain.gain.value = 1.0;
      this.melodyGain.gain.value = 0;
      this.padGain.gain.value = 0.3;
      this.bassGain.connect(this.warmthFilter);
      this.melodyGain.connect(this.warmthFilter);
      this.padGain.connect(this.warmthFilter);

      // Pre-create noise buffer for hi-hats
      this.createNoiseBuffer();

      const save = loadSave();
      this.musicGain.gain.value = save.settings.musicVolume * 0.3;
      this.sfxGain.gain.value = save.settings.sfxVolume;
      this.initialized = true;
    } catch {
      // Web Audio not available
    }
  }

  resume(): void {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // ─── Music Control ─────────────────────────────────────

  startMusic(): void {
    if (!this.ctx || !this.musicGain || this.musicPlaying) return;
    this.stopMenuMusic();
    this.musicPlaying = true;
    this.currentBeat = 0;
    this.nextBeatTime = this.ctx.currentTime + 0.05;
    this.startScheduler();
    this.startPad();
  }

  stopMusic(): void {
    this.musicPlaying = false;
    this.stopScheduler();
    this.stopPad();
  }

  startMenuMusic(): void {
    if (!this.ctx || !this.padGain || this.menuMusicPlaying || this.musicPlaying) return;
    this.menuMusicPlaying = true;
    this.startPad();
  }

  stopMenuMusic(): void {
    if (!this.menuMusicPlaying) return;
    this.menuMusicPlaying = false;
    this.stopPad();
  }

  setTempo(tempo: number): void {
    this.tempo = tempo;
  }

  setSpeedPct(pct: number): void {
    this.speedPct = Math.max(0, Math.min(1, pct));
    // Fade melody in above 50% speed
    if (this.melodyGain) {
      const melodyVol = this.speedPct > 0.5 ? (this.speedPct - 0.5) * 2 * 0.12 : 0;
      this.melodyGain.gain.value = melodyVol;
    }
    // Open filter more at higher speeds
    if (this.warmthFilter) {
      this.warmthFilter.frequency.value = 900 + this.speedPct * 2100; // 900-3000 Hz
    }
  }

  // ─── Scheduler (AudioContext-based timing) ─────────────

  private startScheduler(): void {
    this.stopScheduler();
    this.schedulerId = window.setInterval(() => this.schedule(), this.SCHEDULER_INTERVAL);
  }

  private stopScheduler(): void {
    if (this.schedulerId !== null) {
      clearInterval(this.schedulerId);
      this.schedulerId = null;
    }
  }

  private schedule(): void {
    if (!this.ctx || !this.musicPlaying) return;
    while (this.nextBeatTime < this.ctx.currentTime + this.SCHEDULE_AHEAD) {
      this.scheduleBeat(this.nextBeatTime);
      this.advanceBeat();
    }
  }

  private scheduleBeat(time: number): void {
    if (!this.ctx) return;
    const beatLength = 60 / (120 * this.tempo);
    const beatIdx = this.currentBeat % this.BASS_NOTES.length;

    // Bass layer
    if (this.bassGain) {
      const freq = this.BASS_NOTES[beatIdx];
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      env.gain.setValueAtTime(0.15, time);
      env.gain.exponentialRampToValueAtTime(0.01, time + beatLength * 0.8);
      osc.connect(env);
      env.connect(this.bassGain);
      osc.start(time);
      osc.stop(time + beatLength * 0.9);
    }

    // Melody layer (16-step pattern, plays on half-beats)
    if (this.melodyGain && this.melodyGain.gain.value > 0.01) {
      const melIdx = this.currentBeat % this.MELODY_NOTES.length;
      const melFreq = this.MELODY_NOTES[melIdx];
      if (melFreq > 0) {
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = melFreq;
        env.gain.setValueAtTime(0.08, time);
        env.gain.exponentialRampToValueAtTime(0.001, time + beatLength * 0.6);
        osc.connect(env);
        env.connect(this.melodyGain);
        osc.start(time);
        osc.stop(time + beatLength * 0.7);
      }
    }

    // Hi-hat on every other beat
    if (beatIdx % 2 === 0) {
      this.scheduleNoise(time, 0.05, 0.03);
    }
    // Extra hi-hat on off-beats
    this.scheduleNoise(time + beatLength * 0.5, 0.03, 0.015);
  }

  private advanceBeat(): void {
    const beatLength = 60 / (120 * this.tempo);
    this.nextBeatTime += beatLength;
    this.currentBeat++;
  }

  // ─── Pad (sustained ambient, for menu and gameplay) ───

  private startPad(): void {
    if (!this.ctx || !this.padGain || this.padOsc) return;
    const padFreq = this.PAD_NOTES[0];
    this.padOsc = this.ctx.createOscillator();
    this.padEnv = this.ctx.createGain();
    this.padOsc.type = 'triangle';
    this.padOsc.frequency.value = padFreq;
    this.padEnv.gain.setValueAtTime(0, this.ctx.currentTime);
    this.padEnv.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + 1.0);
    this.padOsc.connect(this.padEnv);
    this.padEnv.connect(this.padGain);
    this.padOsc.start();
  }

  private stopPad(): void {
    if (this.padOsc && this.padEnv && this.ctx) {
      const now = this.ctx.currentTime;
      this.padEnv.gain.cancelScheduledValues(now);
      this.padEnv.gain.setValueAtTime(this.padEnv.gain.value, now);
      this.padEnv.gain.linearRampToValueAtTime(0, now + 0.5);
      const osc = this.padOsc;
      setTimeout(() => { try { osc.stop(); } catch { /* */ } }, 600);
    }
    this.padOsc = null;
    this.padEnv = null;
  }

  // ─── Noise (cached buffer) ────────────────────────────

  private createNoiseBuffer(): void {
    if (!this.ctx) return;
    const size = this.ctx.sampleRate * 0.1; // 100ms buffer
    this.noiseBuffer = this.ctx.createBuffer(1, size, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < size; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }

  private scheduleNoise(time: number, duration: number, volume: number): void {
    if (!this.ctx || !this.noiseBuffer || !this.bassGain) return;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(volume, time);
    env.gain.exponentialRampToValueAtTime(0.001, time + duration);
    source.connect(env);
    env.connect(this.bassGain);
    source.start(time);
    source.stop(time + duration);
  }

  // ─── SFX ──────────────────────────────────────────────

  playSFX(type: SFXType): void {
    if (!this.ctx || !this.sfxGain) return;
    this.resume();
    const now = this.ctx.currentTime;

    switch (type) {
      case 'death':
        this.playTone(200, 'sawtooth', 0.3, now, 0.1);
        this.playTone(100, 'sawtooth', 0.3, now + 0.05, 0.15);
        this.playTone(50, 'sawtooth', 0.2, now + 0.1, 0.2);
        break;
      case 'click':
        this.playTone(800, 'sine', 0.15, now, 0.05);
        break;
      case 'highscore':
        this.playTone(523, 'sine', 0.2, now, 0.1);
        this.playTone(659, 'sine', 0.2, now + 0.1, 0.1);
        this.playTone(784, 'sine', 0.2, now + 0.2, 0.15);
        this.playTone(1047, 'sine', 0.3, now + 0.35, 0.3);
        break;
      case 'nearmiss':
        this.playTone(1200, 'sine', 0.08, now, 0.05);
        this.playTone(1600, 'sine', 0.04, now + 0.02, 0.04);
        break;
      case 'coin':
        this.playTone(988, 'sine', 0.15, now, 0.05);
        this.playTone(1319, 'sine', 0.15, now + 0.06, 0.08);
        break;
      case 'portal_transition':
        this.playSweep(200, 800, 'sine', 0.2, now, 0.2);
        this.playTone(800, 'triangle', 0.1, now + 0.15, 0.15);
        break;
      case 'menu_navigate':
        this.playTone(600, 'sine', 0.1, now, 0.03);
        break;
      case 'achievement_unlock':
        this.playTone(523, 'triangle', 0.15, now, 0.1);
        this.playTone(659, 'triangle', 0.15, now + 0.1, 0.1);
        this.playTone(784, 'triangle', 0.15, now + 0.2, 0.1);
        this.playTone(1047, 'triangle', 0.25, now + 0.3, 0.3);
        break;
      case 'purchase_success':
        this.playTone(784, 'sine', 0.15, now, 0.08);
        this.playTone(988, 'sine', 0.15, now + 0.08, 0.08);
        this.playTone(1175, 'sine', 0.2, now + 0.16, 0.15);
        break;
      case 'purchase_denied':
        this.playTone(300, 'square', 0.12, now, 0.1);
        this.playTone(200, 'square', 0.12, now + 0.12, 0.15);
        break;
      case 'level_complete':
        this.playTone(523, 'sine', 0.15, now, 0.08);
        this.playTone(587, 'sine', 0.15, now + 0.08, 0.08);
        this.playTone(659, 'sine', 0.15, now + 0.16, 0.08);
        this.playTone(784, 'sine', 0.2, now + 0.24, 0.1);
        this.playTone(880, 'sine', 0.2, now + 0.34, 0.1);
        this.playTone(1047, 'sine', 0.3, now + 0.44, 0.3);
        break;
      case 'speed_milestone':
        this.playSweep(400, 1200, 'sine', 0.12, now, 0.15);
        this.playTone(1200, 'sine', 0.08, now + 0.12, 0.1);
        break;
      case 'game_start_countdown':
        this.playTone(1000, 'sine', 0.15, now, 0.04);
        break;
    }
  }

  // ─── Tone helpers ─────────────────────────────────────

  private playTone(freq: number, type: OscillatorType, volume: number, time: number, duration: number): void {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    env.gain.setValueAtTime(volume, time);
    env.gain.exponentialRampToValueAtTime(0.001, time + duration);
    osc.connect(env);
    env.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + duration + 0.01);
  }

  private playSweep(startFreq: number, endFreq: number, type: OscillatorType, volume: number, time: number, duration: number): void {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + duration);
    env.gain.setValueAtTime(volume, time);
    env.gain.exponentialRampToValueAtTime(0.001, time + duration);
    osc.connect(env);
    env.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + duration + 0.01);
  }

  // ─── Volume control ───────────────────────────────────

  setMusicVolume(v: number): void {
    if (this.musicGain) this.musicGain.gain.value = v * 0.3;
  }

  setSFXVolume(v: number): void {
    if (this.sfxGain) this.sfxGain.gain.value = v;
  }
}
