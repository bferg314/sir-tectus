/**
 * SoundEngine: Zero-dependency Web Audio procedural sound synthesizer.
 * Generates arcade-quality retro/fantasy sound effects, magical chimes, and fanfares.
 */
export class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicInterval: any = null;
  private currentMusicTheme: string = 'none';
  private musicStep: number = 0;

  constructor() {}

  public init(): void {
    if (this.ctx) return;
    try {
      if (typeof window === 'undefined') return;
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass || typeof AudioCtxClass !== 'function') return;
      this.ctx = new AudioCtxClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);
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

  // --- Procedural Chiptune Music Synthesizer ---

  public playMusic(theme: 'title' | 'easy' | 'medium' | 'hard' | 'boss'): void {
    if (this.currentMusicTheme === theme && this.musicInterval) return;
    this.stopMusic();
    this.currentMusicTheme = theme;
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    this.resume();

    this.musicStep = 0;
    const stepTimeMs = theme === 'boss' ? 105 : (theme === 'hard' ? 115 : (theme === 'medium' ? 125 : 135));

    this.musicInterval = setInterval(() => {
      if (!this.ctx || this.isMuted) return;
      this.tickMusic(theme);
      this.musicStep = (this.musicStep + 1) % 32;
    }, stepTimeMs);
  }

  public stopMusic(): void {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.currentMusicTheme = 'none';
  }

  private tickMusic(theme: string): void {
    if (!this.ctx || !this.musicGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const s = this.musicStep;

    // 1. Percussion
    if (s % 4 === 0) {
      // Kick / bass drum pulse
      const kOsc = this.ctx.createOscillator();
      const kGain = this.ctx.createGain();
      kOsc.type = 'triangle';
      kOsc.frequency.setValueAtTime(theme === 'boss' ? 110 : 85, t);
      kOsc.frequency.exponentialRampToValueAtTime(28, t + 0.07);
      kGain.gain.setValueAtTime(theme === 'boss' ? 0.28 : 0.18, t);
      kGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
      kOsc.connect(kGain);
      kGain.connect(this.musicGain);
      kOsc.start(t);
      kOsc.stop(t + 0.07);
    }

    if (s % 8 === 4) {
      // Snare tap
      const sOsc = this.ctx.createOscillator();
      const sGain = this.ctx.createGain();
      sOsc.type = 'square';
      sOsc.frequency.setValueAtTime(240, t);
      sOsc.frequency.exponentialRampToValueAtTime(60, t + 0.05);
      sGain.gain.setValueAtTime(0.12, t);
      sGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      sOsc.connect(sGain);
      sGain.connect(this.musicGain);
      sOsc.start(t);
      sOsc.stop(t + 0.05);
    }

    // 2. Harmonic Bass Line (Plays every 2 steps)
    if (s % 2 === 0) {
      let bassFreq = 0;
      const bar = Math.floor(s / 8);

      if (theme === 'title') {
        const bassNotes = [146.83, 110.00, 123.47, 98.00]; // D3, A2, B2, G2
        bassFreq = bassNotes[bar % 4];
      } else if (theme === 'easy') {
        const bassNotes = [130.81, 98.00, 110.00, 87.31];  // C3, G2, A2, F2
        bassFreq = bassNotes[bar % 4];
      } else if (theme === 'medium') {
        const bassNotes = [110.00, 87.31, 98.00, 82.41];   // A2, F2, G2, E2
        bassFreq = bassNotes[bar % 4];
      } else if (theme === 'hard') {
        const bassNotes = [73.42, 58.27, 65.41, 55.00];    // D2, Bb1, C2, A1
        bassFreq = bassNotes[bar % 4];
      } else if (theme === 'boss') {
        const bassNotes = [82.41, 87.31, 98.00, 61.74];    // E2, F2, G2, B1
        bassFreq = bassNotes[bar % 4];
      }

      if (bassFreq > 0) {
        const bOsc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bOsc.type = 'triangle';
        bOsc.frequency.setValueAtTime(bassFreq, t);
        bGain.gain.setValueAtTime(0.22, t);
        bGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        bOsc.connect(bGain);
        bGain.connect(this.musicGain);
        bOsc.start(t);
        bOsc.stop(t + 0.22);
      }
    }

    // 3. Melodic Chiptune Lead Arpeggios (Plays on active 16th steps)
    let leadFreq = 0;
    if (theme === 'title') {
      const melody = [293.66, 369.99, 440.00, 587.33, 440.00, 369.99, 293.66, 369.99,
                      392.00, 440.00, 587.33, 554.37, 440.00, 392.00, 440.00, 293.66];
      leadFreq = melody[s % melody.length];
    } else if (theme === 'easy') {
      const melody = [329.63, 392.00, 523.25, 659.25, 587.33, 493.88, 523.25, 440.00,
                      392.00, 440.00, 523.25, 440.00, 392.00, 329.63, 293.66, 329.63];
      leadFreq = melody[s % melody.length];
    } else if (theme === 'medium') {
      const melody = [440.00, 523.25, 659.25, 587.33, 523.25, 493.88, 440.00, 392.00,
                      349.23, 440.00, 523.25, 440.00, 392.00, 440.00, 493.88, 440.00];
      leadFreq = melody[s % melody.length];
    } else if (theme === 'hard') {
      const melody = [293.66, 349.23, 440.00, 415.30, 440.00, 587.33, 523.25, 440.00,
                      466.16, 440.00, 349.23, 293.66, 329.63, 349.23, 440.00, 293.66];
      leadFreq = melody[s % melody.length];
    } else if (theme === 'boss') {
      const melody = [329.63, 392.00, 493.88, 659.25, 622.25, 493.88, 523.25, 440.00,
                      349.23, 440.00, 523.25, 659.25, 587.33, 493.88, 523.25, 329.63];
      leadFreq = melody[s % melody.length];
    }

    if (leadFreq > 0) {
      const lOsc = this.ctx.createOscillator();
      const lGain = this.ctx.createGain();
      lOsc.type = theme === 'boss' || theme === 'hard' ? 'sawtooth' : 'sine';
      lOsc.frequency.setValueAtTime(leadFreq, t);
      lGain.gain.setValueAtTime(0.12, t);
      lGain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
      lOsc.connect(lGain);
      lGain.connect(this.musicGain);
      lOsc.start(t);
      lOsc.stop(t + 0.11);
    }
  }

  public playFinisherHit(): void {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;
    // Heavy sub-bass crunch
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(140, t);
    osc1.frequency.exponentialRampToValueAtTime(35, t + 0.25);
    gain1.gain.setValueAtTime(0.45, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc1.connect(gain1);
    gain1.connect(this.masterGain!);
    osc1.start(t);
    osc1.stop(t + 0.25);

    // Resonant metallic chime ring
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, t);
    osc2.frequency.exponentialRampToValueAtTime(440, t + 0.35);
    gain2.gain.setValueAtTime(0.25, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc2.connect(gain2);
    gain2.connect(this.masterGain!);
    osc2.start(t);
    osc2.stop(t + 0.35);
  }

  public playMegaPogo(): void {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;
    [440, 554, 659, 880].forEach((freq, idx) => {
      const st = t + idx * 0.05;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, st);
      gain.gain.setValueAtTime(0.3, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.18);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(st);
      osc.stop(st + 0.18);
    });
  }

  public playBossSlam(): void {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + 0.45);
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(t);
    osc.stop(t + 0.45);
  }

  public playPerfectClear(): void {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((f, idx) => {
      const st = t + idx * 0.08;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, st);
      gain.gain.setValueAtTime(0.35, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.35);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(st);
      osc.stop(st + 0.35);
    });
  }
}
