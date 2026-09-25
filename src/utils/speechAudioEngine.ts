/**
 * Web Audio API Engine for real-time Speech Synthesis Vocal Visualization.
 *
 * Drives an AudioContext with an AnalyserNode and a vocal formant/harmonic model
 * that responds with zero latency to SpeechSynthesisUtterance events (onstart,
 * onboundary, onpause, onresume, onend).
 */

export interface SpeechVocalStats {
  rms: number; // 0 to 1
  energy: number; // 0 to 100%
  peakFreq: number; // dominant frequency in Hz
  decibels: number; // -60dB to 0dB
}

class SpeechAudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private vocalGain: GainNode | null = null;
  private carrier1: OscillatorNode | null = null;
  private carrier2: OscillatorNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private formant1: BiquadFilterNode | null = null;
  private formant2: BiquadFilterNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private masterGain: GainNode | null = null;

  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private basePitch: number = 220; // A3 baseline vocal pitch
  private speechRate: number = 1.0;
  private activeWord: string = '';
  private activeCharIndex: number = 0;
  private activeCharLength: number = 0;
  private animFrameId: number | null = null;
  private continuousModulationTimer: any = null;

  private freqBuffer: Uint8Array | null = null;
  private timeBuffer: Uint8Array | null = null;

  // Listeners for UI state updates
  private stateListeners: Set<(state: { isRunning: boolean; isPaused: boolean; word: string }) => void> = new Set();

  public subscribe(listener: (state: { isRunning: boolean; isPaused: boolean; word: string }) => void) {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  private notify() {
    this.stateListeners.forEach((l) =>
      l({
        isRunning: this.isRunning,
        isPaused: this.isPaused,
        word: this.activeWord,
      })
    );
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  public getActiveWord(): { word: string; charIndex: number; charLength: number } {
    return {
      word: this.activeWord,
      charIndex: this.activeCharIndex,
      charLength: this.activeCharLength,
    };
  }

  /**
   * Initializes or returns the Web Audio Context and Analyser graph
   */
  private initContext(): boolean {
    if (typeof window === 'undefined') return false;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return false;
      this.ctx = new AudioCtx();
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    if (!this.analyser) {
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.75;
      this.analyser.minDecibels = -90;
      this.analyser.maxDecibels = -10;

      this.freqBuffer = new Uint8Array(this.analyser.frequencyBinCount);
      this.timeBuffer = new Uint8Array(this.analyser.fftSize);

      // Create master gain (set to 0 for silent analyzer feeding by default)
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

      // Connect analyser to masterGain to destination (keeps audio clock active)
      this.analyser.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }

    return true;
  }

  /**
   * Builds and activates the vocal harmonic generator
   */
  private buildVocalGraph() {
    if (!this.ctx || !this.analyser) return;

    this.stopVocalGraph();

    const now = this.ctx.currentTime;

    // Vocal Gain Envelope
    this.vocalGain = this.ctx.createGain();
    this.vocalGain.gain.setValueAtTime(0.05, now);

    // Formant filter 1 (vowel height / throat resonance, 300-900Hz)
    this.formant1 = this.ctx.createBiquadFilter();
    this.formant1.type = 'bandpass';
    this.formant1.frequency.setValueAtTime(650, now);
    this.formant1.Q.setValueAtTime(3.5, now);

    // Formant filter 2 (oral cavity resonance, 1200-2400Hz)
    this.formant2 = this.ctx.createBiquadFilter();
    this.formant2.type = 'bandpass';
    this.formant2.frequency.setValueAtTime(1700, now);
    this.formant2.Q.setValueAtTime(4.0, now);

    // Fundamental vocal cord pitch oscillator
    this.carrier1 = this.ctx.createOscillator();
    this.carrier1.type = 'sawtooth';
    this.carrier1.frequency.setValueAtTime(this.basePitch, now);

    // Upper harmonic oscillator
    this.carrier2 = this.ctx.createOscillator();
    this.carrier2.type = 'triangle';
    this.carrier2.frequency.setValueAtTime(this.basePitch * 1.5, now);

    // Sub-harmonic warmth
    this.subOsc = this.ctx.createOscillator();
    this.subOsc.type = 'sine';
    this.subOsc.frequency.setValueAtTime(this.basePitch * 0.5, now);

    // Generate white noise for speech sibilance ('s', 't', 'sh', breath)
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;

    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.setValueAtTime(0.08, now);

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(3500, now);

    this.noiseNode.connect(noiseFilter);
    noiseFilter.connect(this.noiseGain);
    this.noiseGain.connect(this.vocalGain);

    // Connect carriers to formants
    this.carrier1.connect(this.formant1);
    this.carrier2.connect(this.formant2);
    this.subOsc.connect(this.vocalGain);

    this.formant1.connect(this.vocalGain);
    this.formant2.connect(this.vocalGain);

    // Route vocal gain directly to AnalyserNode
    this.vocalGain.connect(this.analyser);

    // Start oscillators
    this.carrier1.start(now);
    this.carrier2.start(now);
    this.subOsc.start(now);
    this.noiseNode.start(now);

    // Start continuous vocal micro-vibrato
    this.startContinuousModulation();
  }

  private stopVocalGraph() {
    if (this.continuousModulationTimer) {
      clearInterval(this.continuousModulationTimer);
      this.continuousModulationTimer = null;
    }

    try {
      this.carrier1?.stop();
      this.carrier1?.disconnect();
    } catch (_) {}
    try {
      this.carrier2?.stop();
      this.carrier2?.disconnect();
    } catch (_) {}
    try {
      this.subOsc?.stop();
      this.subOsc?.disconnect();
    } catch (_) {}
    try {
      this.noiseNode?.stop();
      this.noiseNode?.disconnect();
    } catch (_) {}
    try {
      this.vocalGain?.disconnect();
    } catch (_) {}

    this.carrier1 = null;
    this.carrier2 = null;
    this.subOsc = null;
    this.noiseNode = null;
    this.noiseGain = null;
    this.vocalGain = null;
    this.formant1 = null;
    this.formant2 = null;
  }

  /**
   * Continuous organic modulation to emulate the natural human vocal cord vibration
   * while speech playback is ongoing.
   */
  private startContinuousModulation() {
    if (!this.ctx) return;

    this.continuousModulationTimer = setInterval(() => {
      if (!this.isRunning || this.isPaused || !this.ctx || !this.carrier1 || !this.vocalGain) {
        return;
      }

      const now = this.ctx.currentTime;
      // Vibrato & vocal micro-jitter
      const jitter = (Math.random() - 0.5) * 12;
      const tremolo = 0.55 + Math.sin(now * 14) * 0.25 + Math.random() * 0.15;

      this.carrier1.frequency.setTargetAtTime(this.basePitch + jitter, now, 0.05);
      this.vocalGain.gain.setTargetAtTime(tremolo, now, 0.04);
    }, 45);
  }

  /**
   * Connects to a SpeechSynthesisUtterance to drive the Web Audio API graph.
   */
  public attachToUtterance(
    utterance: SpeechSynthesisUtterance,
    fullText: string,
    options?: { pitch?: number; rate?: number }
  ) {
    if (!this.initContext()) return;

    const rate = options?.rate || utterance.rate || 1.05;
    const pitch = options?.pitch || utterance.pitch || 1.0;
    this.speechRate = rate;

    // Female/Halsey pitch base ~220Hz - 260Hz multiplied by pitch factor
    this.basePitch = Math.round(230 * Math.max(0.7, Math.min(1.8, pitch)));

    const prevOnStart = utterance.onstart;
    const prevOnBoundary = utterance.onboundary;
    const prevOnEnd = utterance.onend;
    const prevOnError = utterance.onerror;
    const prevOnPause = utterance.onpause;
    const prevOnResume = utterance.onresume;

    utterance.onstart = (e) => {
      this.isRunning = true;
      this.isPaused = false;
      this.initContext();
      this.buildVocalGraph();
      this.notify();
      if (prevOnStart) prevOnStart.call(utterance, e);
    };

    utterance.onboundary = (e) => {
      if (this.ctx && this.isRunning && !this.isPaused) {
        const charIdx = e.charIndex;
        const charLen = e.charLength || 6;
        const rawWord = fullText.slice(charIdx, charIdx + charLen);
        const cleanWord = rawWord.replace(/[^a-zA-Z0-9']/g, '');

        this.activeWord = cleanWord || rawWord.trim();
        this.activeCharIndex = charIdx;
        this.activeCharLength = charLen;

        this.pulseVocalBoundary(this.activeWord);
        this.notify();
      }
      if (prevOnBoundary) prevOnBoundary.call(utterance, e);
    };

    utterance.onpause = (e) => {
      this.isPaused = true;
      if (this.ctx && this.vocalGain) {
        this.vocalGain.gain.setTargetAtTime(0.001, this.ctx.currentTime, 0.05);
      }
      this.notify();
      if (prevOnPause) prevOnPause.call(utterance, e);
    };

    utterance.onresume = (e) => {
      this.isPaused = false;
      if (this.ctx && this.vocalGain) {
        this.vocalGain.gain.setTargetAtTime(0.7, this.ctx.currentTime, 0.05);
      }
      this.notify();
      if (prevOnResume) prevOnResume.call(utterance, e);
    };

    utterance.onend = (e) => {
      this.stop();
      if (prevOnEnd) prevOnEnd.call(utterance, e);
    };

    utterance.onerror = (e) => {
      this.stop();
      if (prevOnError) prevOnError.call(utterance, e);
    };
  }

  /**
   * Responds in real-time to each spoken word boundary with realistic formant shifts
   */
  public pulseVocalBoundary(word: string) {
    if (!this.ctx || !this.vocalGain || !this.carrier1 || !this.formant1 || !this.formant2) {
      return;
    }

    const now = this.ctx.currentTime;
    const lower = word.toLowerCase();

    // Vowel formant mapping (F1 / F2 acoustic resonance frequencies)
    let f1 = 600;
    let f2 = 1600;
    let noiseLevel = 0.05;

    if (lower.includes('a')) {
      f1 = 820;
      f2 = 1250;
    } else if (lower.includes('e')) {
      f1 = 530;
      f2 = 1840;
    } else if (lower.includes('i')) {
      f1 = 320;
      f2 = 2240;
    } else if (lower.includes('o')) {
      f1 = 500;
      f2 = 920;
    } else if (lower.includes('u')) {
      f1 = 360;
      f2 = 800;
    }

    // Sibilants and fricatives check ('s', 't', 'k', 'sh', 'f')
    if (/[stkfzcx]/.test(lower)) {
      noiseLevel = 0.28;
    }

    // Dynamic syllabic stress
    const syllableCount = Math.max(1, Math.round(word.length / 3));
    const isExclamation = word.includes('!') || word.length > 7;
    const peakGain = isExclamation ? 0.95 : 0.78;

    // Attack envelope
    this.vocalGain.gain.cancelScheduledValues(now);
    this.vocalGain.gain.setValueAtTime(this.vocalGain.gain.value, now);
    this.vocalGain.gain.linearRampToValueAtTime(peakGain, now + 0.04);
    this.vocalGain.gain.exponentialRampToValueAtTime(0.35, now + 0.18 / this.speechRate);

    // Shift formant filters
    this.formant1.frequency.setTargetAtTime(f1, now, 0.03);
    this.formant2.frequency.setTargetAtTime(f2, now, 0.03);

    // Shift noise burst for consonants
    if (this.noiseGain) {
      this.noiseGain.gain.setTargetAtTime(noiseLevel, now, 0.02);
      this.noiseGain.gain.setTargetAtTime(0.04, now + 0.08, 0.05);
    }

    // Pitch inflection for question or exclamation
    const pitchJitter = isExclamation ? 35 : (Math.random() - 0.5) * 20;
    this.carrier1.frequency.setTargetAtTime(this.basePitch + pitchJitter, now, 0.04);
    if (this.carrier2) {
      this.carrier2.frequency.setTargetAtTime((this.basePitch + pitchJitter) * 1.5, now, 0.04);
    }
  }

  /**
   * Reads raw frequency data from the AnalyserNode
   */
  public getFrequencyData(): Uint8Array {
    if (!this.analyser || !this.freqBuffer) {
      return new Uint8Array(128);
    }
    this.analyser.getByteFrequencyData(this.freqBuffer);
    return this.freqBuffer;
  }

  /**
   * Reads raw time-domain (waveform) data from the AnalyserNode
   */
  public getTimeDomainData(): Uint8Array {
    if (!this.analyser || !this.timeBuffer) {
      const fallback = new Uint8Array(256);
      fallback.fill(128);
      return fallback;
    }
    this.analyser.getByteTimeDomainData(this.timeBuffer);
    return this.timeBuffer;
  }

  /**
   * Computes acoustic telemetry: RMS volume, energy percentage, decibels, dominant frequency
   */
  public getAudioStats(): SpeechVocalStats {
    const timeData = this.getTimeDomainData();
    const freqData = this.getFrequencyData();

    // Compute RMS from time domain
    let sumSquares = 0;
    for (let i = 0; i < timeData.length; i++) {
      const normalized = (timeData[i] - 128) / 128;
      sumSquares += normalized * normalized;
    }
    const rms = Math.sqrt(sumSquares / timeData.length);
    const energy = Math.min(100, Math.round(rms * 220));
    const decibels = rms > 0.0001 ? Math.max(-60, Math.round(20 * Math.log10(rms))) : -60;

    // Peak frequency calculation
    let maxBin = 0;
    let maxVal = 0;
    for (let i = 0; i < freqData.length; i++) {
      if (freqData[i] > maxVal) {
        maxVal = freqData[i];
        maxBin = i;
      }
    }

    const nyquist = (this.ctx?.sampleRate || 44100) / 2;
    const peakFreq = Math.round((maxBin / freqData.length) * (nyquist / 2));

    return {
      rms,
      energy,
      peakFreq,
      decibels,
    };
  }

  /**
   * Stops audio synthesis and tears down the active vocal graph
   */
  public stop() {
    this.isRunning = false;
    this.isPaused = false;
    this.activeWord = '';
    this.activeCharIndex = 0;
    this.activeCharLength = 0;
    this.stopVocalGraph();
    this.notify();
  }
}

export const speechAudioEngine = new SpeechAudioEngine();
