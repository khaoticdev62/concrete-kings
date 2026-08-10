/**
 * Concrete Kings: The Block Chronicles
 * Audio UX & Haptic Feedback Engine (Spec Sections 55 & 56)
 *
 * Synthesizes 16-bit retro procedural audio stingers (Card Focus, Select, Submit, Reveal, Win Vote,
 * Canon Stamp) via Web Audio API and triggers multi-pattern controller vibration haptics.
 */

const AUDIO_EVENTS = {
  FOCUS: { freq: 440, durationMs: 40, type: 'sine', gain: 0.1 },
  SELECT: { freq: 587, durationMs: 60, type: 'triangle', gain: 0.2 },
  SUBMIT: { freq: 880, durationMs: 120, type: 'square', gain: 0.25 },
  REVEAL: { freq: 659, durationMs: 150, type: 'sine', gain: 0.3 },
  WIN_VOTE: { freq: 1046, durationMs: 250, type: 'triangle', gain: 0.4 },
  SCENE_START: { freq: 523, durationMs: 300, type: 'sawtooth', gain: 0.3 },
  CANON_EVENT: { freq: 349, durationMs: 500, type: 'square', gain: 0.45 },
  RELATIONSHIP_CHANGE: { freq: 784, durationMs: 200, type: 'sine', gain: 0.25 }
};

const AUDIO_HAPTIC_PATTERNS = {
  CARD_SELECTED: [20],
  CARD_LOCKED: [50],
  REVEAL_PULSE: [15, 30, 15],
  MAJOR_CONSEQUENCE: [100, 50, 100],
  FAILURE_PULSE: [150],
  CANON_STAMP: [80, 40, 80, 40, 120]
};

class AudioHapticsEngine {
  constructor(options = {}) {
    this.masterVolume = options.masterVolume !== undefined ? options.masterVolume : 1.0;
    this.sfxVolume = options.sfxVolume !== undefined ? options.sfxVolume : 0.8;
    this.enableHaptics = options.enableHaptics !== undefined ? options.enableHaptics : true;
    this.audioCtx = null;
  }

  initAudioContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
  }

  triggerAudioFeedback(eventType) {
    const config = AUDIO_EVENTS[eventType];
    if (!config) return false;

    if (!this.audioCtx) this.initAudioContext();
    if (!this.audioCtx || this.audioCtx.state === 'suspended') {
      if (this.audioCtx && this.audioCtx.resume) this.audioCtx.resume();
    }

    if (!this.audioCtx) return false;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = config.type;
      osc.frequency.setValueAtTime(config.freq, this.audioCtx.currentTime);

      const finalGain = config.gain * this.sfxVolume * this.masterVolume;
      gain.gain.setValueAtTime(finalGain, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + config.durationMs / 1000);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + config.durationMs / 1000);
      return true;
    } catch (e) {
      return false;
    }
  }

  triggerHapticFeedback(eventType) {
    if (!this.enableHaptics) return false;

    const pattern = AUDIO_HAPTIC_PATTERNS[eventType];
    if (!pattern) return false;

    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(pattern);
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  setVolume(sfxVolume = 0.8, masterVolume = 1.0) {
    this.sfxVolume = sfxVolume;
    this.masterVolume = masterVolume;
  }

  toggleHaptics(enabled) {
    this.enableHaptics = !!enabled;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AudioHapticsEngine, AUDIO_EVENTS, AUDIO_HAPTIC_PATTERNS };
}
if (typeof window !== 'undefined') {
  window.AudioHapticsEngine = AudioHapticsEngine;
  window.AUDIO_EVENTS = AUDIO_EVENTS;
  window.AUDIO_HAPTIC_PATTERNS = AUDIO_HAPTIC_PATTERNS;
}
