/**
 * SoundEngine: Zero-dependency Web Audio procedural sound synthesizer.
 * Generates arcade-quality retro/fantasy sound effects, magical chimes, and fanfares.
 */
export class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  constructor() {}

  public init(): void {
    if (this.ctx) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  public resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.3, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public get muted(): boolean {
    return this.isMuted;
  }

  public playSwordSwing(speed: number = 1.0): void {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320 * speed, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.12);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.frequency.exponentialRampToValueAtTime(250, t + 0.12);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  public playHit(isFatal: boolean = false): void {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isFatal ? 120 : 180, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.15);

    gain.gain.setValueAtTime(isFatal ? 0.45 : 0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  public playEnemyDamage(): void {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;
    
    // Snappy noise-like crunch + pitched impact
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, t);
    filter.frequency.exponentialRampToValueAtTime(300, t + 0.12);
    filter.Q.setValueAtTime(3, t);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  public playEnemyDeath(): void {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;
    
    // Deep crunch + screech defeat pop
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + 0.28);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(t);
    osc.stop(t + 0.28);
  }

  public playBowRelease(): void {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(480, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.08);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  public playArrowHit(): void {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.09);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  public playPogoBounce(): void {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;
    
    // Bright metallic spring chime
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(520, t);
    osc1.frequency.exponentialRampToValueAtTime(1040, t + 0.16);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(780, t);
    osc2.frequency.exponentialRampToValueAtTime(1560, t + 0.16);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain!);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.16);
    osc2.stop(t + 0.16);
  }

  public playParrySuccess(): void {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(2400, t + 0.2);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  public playShieldBoomerang(): void {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.linearRampToValueAtTime(700, t + 0.15);
    osc.frequency.linearRampToValueAtTime(350, t + 0.3);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  public playFireball(): void {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.22);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, t);
    filter.frequency.linearRampToValueAtTime(1200, t + 0.1);
    filter.frequency.exponentialRampToValueAtTime(100, t + 0.22);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  public playWaterSlide(): void {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.linearRampToValueAtTime(900, t + 0.1);
    osc.frequency.linearRampToValueAtTime(400, t + 0.25);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  public playSwordThrow(): void {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.2);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  public playArrowShot(): void {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.1);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  public playCoinCollect(chainIndex: number = 0): void {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;
    const baseFreq = 880; // A5
    const freqs = [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 1.75, baseFreq * 2.0];
    const targetFreq = freqs[chainIndex % freqs.length];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(targetFreq, t);
    osc.frequency.exponentialRampToValueAtTime(targetFreq * 1.5, t + 0.15);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  public playGateUnlock(): void {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
    notes.forEach((freq, i) => {
      const t = this.ctx!.currentTime + i * 0.1;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(t);
      osc.stop(t + 0.4);
    });
  }

  public playVendingMachine(): void {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;

    // 1. Coin clink
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1800, t);
    osc1.frequency.exponentialRampToValueAtTime(2400, t + 0.08);
    gain1.gain.setValueAtTime(0.4, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc1.connect(gain1);
    gain1.connect(this.masterGain!);
    osc1.start(t);
    osc1.stop(t + 0.08);

    // 2. Heavy gear clunk
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(120, t + 0.15);
    osc2.frequency.exponentialRampToValueAtTime(40, t + 0.35);
    gain2.gain.setValueAtTime(0.35, t + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc2.connect(gain2);
    gain2.connect(this.masterGain!);
    osc2.start(t + 0.15);
    osc2.stop(t + 0.35);
  }

  public playSandwichFanfare(): void {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    // Radiant triumphal fanfare
    const chords = [
      { f: 587.33, d: 0.14 }, // D5
      { f: 739.99, d: 0.14 }, // F#5
      { f: 880.00, d: 0.14 }, // A5
      { f: 1174.66, d: 0.5 }  // D6
    ];
    let offset = 0;
    chords.forEach(c => {
      const t = this.ctx!.currentTime + offset;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(c.f, t);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + c.d);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(t);
      osc.stop(t + c.d);
      offset += 0.12;
    });
  }

  public playRevive(): void {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.25);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(t);
    osc.stop(t + 0.28);
  }
}
