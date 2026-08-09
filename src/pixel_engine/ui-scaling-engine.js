/**
 * Concrete Kings: The Block Chronicles
 * UI Density & Scaling Profiles Engine (Spec v3.0)
 *
 * Implements HANDHELD (Steam Deck 1280x800), DESKTOP, and TV (couch viewing) UI profiles.
 */

const UI_PROFILES = {
  HANDHELD: { id: 'HANDHELD', label: 'Handheld (Steam Deck 1280x800)', scale: 1.1, minTouchPx: 44 },
  DESKTOP: { id: 'DESKTOP', label: 'Desktop Monitor', scale: 1.0, minTouchPx: 32 },
  TV: { id: 'TV', label: 'TV / Living Room', scale: 1.5, minTouchPx: 64 }
};

class UIScalingEngine {
  constructor(options = {}) {
    this.storage = options.storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    this.currentProfile = this.loadProfile(options.initialProfile);
  }

  loadProfile(overrideProfile) {
    if (overrideProfile && UI_PROFILES[overrideProfile]) return overrideProfile;
    if (this.storage) {
      const saved = this.storage.getItem('ck-ui-profile');
      if (saved && UI_PROFILES[saved]) return saved;
    }
    // Auto-detect Steam Deck aspect ratio / viewport if window is 1280x800
    if (typeof window !== 'undefined' && window.innerWidth <= 1280 && window.innerHeight <= 800) {
      return 'HANDHELD';
    }
    return 'DESKTOP';
  }

  setProfile(profileKey) {
    if (!UI_PROFILES[profileKey]) return null;
    this.currentProfile = profileKey;
    if (this.storage) {
      this.storage.setItem('ck-ui-profile', profileKey);
    }
    this.applyToDom();
    return UI_PROFILES[profileKey];
  }

  applyToDom() {
    if (typeof document === 'undefined' || !document.body) return;
    document.body.classList.remove('ui-profile-handheld', 'ui-profile-desktop', 'ui-profile-tv');
    document.body.classList.add(`ui-profile-${this.currentProfile.toLowerCase()}`);
  }

  getProfileConfig() {
    return UI_PROFILES[this.currentProfile];
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { UIScalingEngine, UI_PROFILES };
}
if (typeof window !== 'undefined') {
  window.UIScalingEngine = UIScalingEngine;
  window.UI_PROFILES = UI_PROFILES;
}
