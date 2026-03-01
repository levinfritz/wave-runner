import { loadSave } from '../utils/Storage';

type SFXType = 'death' | 'click' | 'highscore' | 'nearmiss' | 'coin';

export class AudioManager {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicOsc: OscillatorNode | null = null;
  private musicPlaying = false;
  private tempo = 1.0;
  private initialized = false;

  init(): void {
    if (this.initialized) return;
    try {
      this.ctx = new AudioContext();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain.connect(this.ctx.destination);
      this.sfxGain.connect(this.ctx.destination);

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

  startMusic(): void {
    if (!this.ctx || !this.musicGain || this.musicPlaying) return;
    this.musicPlaying = true;
    this.playMusicLoop();
  }

  stopMusic(): void {
    this.musicPlaying = false;
    if (this.musicOsc) {
      try { this.musicOsc.stop(); } catch { /* */ }
      this.musicOsc = null;
    }
  }

  setTempo(tempo: number): void {
    this.tempo = tempo;
  }

  private playMusicLoop(): void {
    if (!this.ctx || !this.musicGain || !this.musicPlaying) return;

    const now = this.ctx.currentTime;
    const bpm = 120 * this.tempo;
    const beatLength = 60 / bpm;

    // Simple procedural bass-synth loop
    const notes = [55, 55, 73.42, 55, 82.41, 55, 73.42, 65.41];
    const loopLength = notes.length * beatLength;

    for (let i = 0; i < notes.length; i++) {
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = notes[i];
      env.gain.setValueAtTime(0.15, now + i * beatLength);
      env.gain.exponentialRampToValueAtTime(0.01, now + (i + 0.8) * beatLength);
      osc.connect(env);
      env.connect(this.musicGain);
      osc.start(now + i * beatLength);
      osc.stop(now + (i + 0.9) * beatLength);
    }

    // Add hi-hat pattern
    for (let i = 0; i < notes.length * 2; i++) {
      this.playNoise(now + i * beatLength / 2, 0.05, 0.03);
    }

    // Schedule next loop
    setTimeout(() => this.playMusicLoop(), loopLength * 1000 * 0.9);
  }

  private playNoise(time: number, duration: number, volume: number): void {
    if (!this.ctx || !this.musicGain) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * volume;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(volume, time);
    env.gain.exponentialRampToValueAtTime(0.001, time + duration);
    source.connect(env);
    env.connect(this.musicGain);
    source.start(time);
    source.stop(time + duration);
  }

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
        break;
      case 'coin':
        this.playTone(988, 'sine', 0.15, now, 0.05);
        this.playTone(1319, 'sine', 0.15, now + 0.06, 0.08);
        break;
    }
  }

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

  setMusicVolume(v: number): void {
    if (this.musicGain) this.musicGain.gain.value = v * 0.3;
  }

  setSFXVolume(v: number): void {
    if (this.sfxGain) this.sfxGain.gain.value = v;
  }
}
