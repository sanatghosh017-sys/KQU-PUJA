/**
 * Web Audio API synthesizer for authentic Bengali Dhak (drum) & Kanshi (brass gong/bell)
 * Plays realistic festive rhythmic patterns for Durga Puja without needing external audio files.
 */
class DhakAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private timerId: number | null = null;
  private tempo = 125; // BPM
  private currentStep = 0;
  private rhythmPattern: 'classic' | 'dhunuchi' | 'sandhi' = 'classic';
  private listeners: ((playing: boolean) => void)[] = [];

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Synthesize low bass "Dha" of the Dhak
  private playDha(time: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Pitch drop creates the deep drum resonance
    osc.frequency.setValueAtTime(160, time);
    osc.frequency.exponentialRampToValueAtTime(55, time + 0.22);

    gain.gain.setValueAtTime(0.9, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + 0.38);
  }

  // Synthesize sharp slap "Khi / Ta" of the Dhak rim
  private playTa(time: number, isHigh = false) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isHigh ? 420 : 310, time);
    osc.frequency.exponentialRampToValueAtTime(isHigh ? 220 : 160, time + 0.08);

    gain.gain.setValueAtTime(0.65, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + 0.14);
  }

  // Synthesize brass Kanshi / Bell strike
  private playKanshi(time: number) {
    if (!this.ctx) return;
    // Multi-frequency metallic timbre
    const freqs = [1050, 1540, 2180];
    freqs.forEach((f) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, time);
      gain.gain.setValueAtTime(0.18, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(time);
      osc.stop(time + 0.48);
    });
  }

  // Play a single sacred temple bell chime for flower offering
  public playTempleBell() {
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const bellFrequencies = [523.25, 1046.5, 1567.98, 2093.0];
    bellFrequencies.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      const amp = 0.25 / (idx + 1);
      gain.gain.setValueAtTime(amp, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 2.0);
    });
  }

  // Schedule a beat step in the loop
  private scheduleStep() {
    if (!this.ctx || !this.isPlaying) return;
    const stepDuration = 60 / this.tempo / 4; // 16th note
    const now = this.ctx.currentTime;
    const s = this.currentStep % 16;

    if (this.rhythmPattern === 'classic') {
      // Classic Dha-Khi-Ta-Khi-Ta pattern
      if (s === 0 || s === 6 || s === 8) {
        this.playDha(now);
      }
      if (s === 2 || s === 4 || s === 10 || s === 12 || s === 14) {
        this.playTa(now, s % 4 === 2);
      }
      if (s % 4 === 0) {
        this.playKanshi(now);
      }
    } else if (this.rhythmPattern === 'dhunuchi') {
      // Fast, intoxicating Dhunuchi Dance beat
      if (s === 0 || s === 3 || s === 6 || s === 10 || s === 12) {
        this.playDha(now);
      }
      if (s === 1 || s === 2 || s === 4 || s === 5 || s === 7 || s === 9 || s === 11 || s === 14) {
        this.playTa(now, true);
      }
      if (s % 2 === 0) {
        this.playKanshi(now);
      }
    } else if (this.rhythmPattern === 'sandhi') {
      // Reverent Sandhi Puja 108 bells & steady deep beats
      if (s === 0 || s === 8) {
        this.playDha(now);
      }
      if (s === 4 || s === 12) {
        this.playTa(now, false);
      }
      if (s === 0 || s === 4 || s === 8 || s === 12) {
        this.playKanshi(now);
      }
    }

    this.currentStep = (this.currentStep + 1) % 16;
    this.timerId = window.setTimeout(() => {
      this.scheduleStep();
    }, stepDuration * 1000);
  }

  public start() {
    this.initContext();
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.currentStep = 0;
    this.scheduleStep();
    this.notify();
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.notify();
  }

  public toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  public setPattern(pattern: 'classic' | 'dhunuchi' | 'sandhi') {
    this.rhythmPattern = pattern;
    if (pattern === 'dhunuchi') {
      this.tempo = 150;
    } else if (pattern === 'sandhi') {
      this.tempo = 105;
    } else {
      this.tempo = 125;
    }
  }

  public getPattern() {
    return this.rhythmPattern;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public subscribe(cb: (playing: boolean) => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.isPlaying));
  }
}

export const dhakEngine = new DhakAudioEngine();
