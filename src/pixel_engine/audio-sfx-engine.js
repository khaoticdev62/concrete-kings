/**
 * Concrete Kings: The Block Chronicles
 * Web Audio API Chiptune SFX & Ambience Engine
 * Version: 1.0.0
 */

class ChiptuneAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterVolume = 0.3;

    // Ambient loop nodes
    this.rainNode = null;
    this.rainGain = null;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (this.rainGain) {
      this.rainGain.gain.value = muted ? 0 : 0.05 * this.masterVolume;
    }
  }

  setVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Sound: Card Flip / Select (80ms Square Wave Pitch Sweep)
   */
  playCardFlip() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);

    gain.gain.setValueAtTime(0.2 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  /**
   * Sound: Gold Shimmer Sweep (Arpeggiated 4-Note Chime C6-E6-G6-C7)
   */
  playGoldShimmer() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [1046.50, 1318.51, 1567.98, 2093.00]; // C6, E6, G6, C7
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const startTime = now + idx * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.25 * this.masterVolume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.12);
    });
  }

  /**
   * Sound: Dice Roll Clicks (Noise Bursts)
   */
  playDiceRoll() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    [0, 0.08, 0.16, 0.24].forEach(delay => {
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 800;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.15 * this.masterVolume, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.05);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start(now + delay);
    });
  }

  /**
   * Sound: Sodium Light Humming Buzz (60Hz Square Hum)
   */
  playSodiumHum() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, now);

    gain.gain.setValueAtTime(0.03 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  /**
   * Sound: Victory Fanfare (8-Bit Brass Chord)
   */
  playVictoryFanfare() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const chord = [523.25, 659.25, 783.99, 1046.50]; // C5 Major Chord
    const now = this.ctx.currentTime;

    chord.forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.15 * this.masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.6);
    });
  }

  /**
   * Procedural 8-Bit Chiptune Hip-Hop BGM Engine (90 BPM Boom-Bap Loop)
   */
  startBGM(theme = 'Harlem') {
    if (this.isMuted) return;
    this.init();
    this.stopBGM();

    this.isPlayingBGM = true;
    if (!this.ctx) return;
    const bpm = 90;
    const stepTime = 60 / bpm / 4; // 16th note duration (~166ms)

    // Bass line scale frequencies (C Minor / Hip-hop pentatonic)
    const bassNotes = [65.41, 73.42, 77.78, 87.31, 98.00]; // C2, D2, Eb2, F2, G2
    let step = 0;

    this.bgmInterval = setInterval(() => {
      if (!this.isPlayingBGM || !this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;

      // Kick drum on steps 0, 8, 10 (Boom-bap rhythm)
      if (step === 0 || step === 8 || step === 10) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.1);
        gain.gain.setValueAtTime(0.3 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      }

      // Snare / Noise snap on steps 4, 12
      if (step === 4 || step === 12) {
        const bufSize = this.ctx.sampleRate * 0.08;
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const out = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) out[i] = Math.random() * 2 - 1;
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.15 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        src.connect(gain);
        gain.connect(this.ctx.destination);
        src.start(now);
      }

      // Bass synth note on steps 0, 3, 6, 8, 11, 14
      if ([0, 3, 6, 8, 11, 14].includes(step)) {
        const freq = bassNotes[Math.floor((step % 5))];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.2 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.14);
      }

      step = (step + 1) % 16;
    }, stepTime * 1000);
  }

  stopBGM() {
    this.isPlayingBGM = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ChiptuneAudioEngine
  };
}

if (typeof window !== 'undefined') {
  window.ChiptuneAudioEngine = ChiptuneAudioEngine;
}
