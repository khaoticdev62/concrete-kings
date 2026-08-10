/**
 * Concrete Kings: The Block Chronicles
 * Controller & Haptic Feedback Engine (Checklist Section 5.2 & Spec v3.0 #56)
 *
 * Provides vibration feedback for card selection, locking, reveals, and canon events,
 * plus controller glyph detection (Xbox, PlayStation, Steam Deck, Keyboard).
 */

const HAPTIC_PATTERNS = {
  CARD_SELECTED: [15],
  CARD_LOCKED: [30, 20, 30],
  REVEAL_BEAT: [20],
  MAJOR_CONSEQUENCE: [100, 50, 100],
  FAILURE: [150],
  CANON_EVENT: [40, 30, 40, 30, 80]
};

const CONTROLLER_GLYPHS = {
  KEYBOARD_MOUSE: {
    select: '[ENTER]',
    back: '[ESC]',
    inspect: '[X]',
    details: '[Y]',
    cyclePrev: '[Q]',
    cycleNext: '[E]'
  },
  XBOX: {
    select: '(A)',
    back: '(B)',
    inspect: '(X)',
    details: '(Y)',
    cyclePrev: '[LB]',
    cycleNext: '[RB]'
  },
  PLAYSTATION: {
    select: '(Cross)',
    back: '(Circle)',
    inspect: '(Square)',
    details: '(Triangle)',
    cyclePrev: '[L1]',
    cycleNext: '[R1]'
  },
  STEAM_DECK: {
    select: '(A)',
    back: '(B)',
    inspect: '(X)',
    details: '(Y)',
    cyclePrev: '[L1]',
    cycleNext: '[R1]'
  }
};

class ControllerHapticsEngine {
  constructor(options = {}) {
    this.storage = options.storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    this.navigator = options.navigator || (typeof navigator !== 'undefined' ? navigator : null);
    this.deviceType = this.detectDeviceType(options.deviceOverride);
    this.isEnabled = this.loadHapticPreference();
  }

  loadHapticPreference() {
    if (!this.storage) return true;
    try {
      const saved = this.storage.getItem('ck-access-haptics');
      return saved !== 'false';
    } catch (e) {
      return true;
    }
  }

  setHapticsEnabled(active) {
    this.isEnabled = active;
    if (this.storage) {
      try { this.storage.setItem('ck-access-haptics', active ? 'true' : 'false'); } catch(e){}
    }
  }

  detectDeviceType(override) {
    if (override && CONTROLLER_GLYPHS[override]) return override;
    if (typeof window !== 'undefined' && window.innerWidth <= 1280 && window.innerHeight <= 800) {
      return 'STEAM_DECK';
    }
    return 'KEYBOARD_MOUSE';
  }

  setDeviceType(type) {
    if (CONTROLLER_GLYPHS[type]) {
      this.deviceType = type;
    }
  }

  getGlyphs() {
    return CONTROLLER_GLYPHS[this.deviceType] || CONTROLLER_GLYPHS.KEYBOARD_MOUSE;
  }

  trigger(patternKey) {
    if (!this.isEnabled || !this.navigator || typeof this.navigator.vibrate !== 'function') {
      return false;
    }
    const pattern = HAPTIC_PATTERNS[patternKey];
    if (pattern) {
      this.navigator.vibrate(pattern);
      return true;
    }
    return false;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ControllerHapticsEngine, HAPTIC_PATTERNS, CONTROLLER_GLYPHS };
}
if (typeof window !== 'undefined') {
  window.ControllerHapticsEngine = ControllerHapticsEngine;
  window.HAPTIC_PATTERNS = HAPTIC_PATTERNS;
  window.CONTROLLER_GLYPHS = CONTROLLER_GLYPHS;
}
