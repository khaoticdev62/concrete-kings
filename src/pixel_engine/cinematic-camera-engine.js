/**
 * Concrete Kings: The Block Chronicles
 * Cinematic Camera & Scene Playback Controller Engine (Spec Sections 23-26)
 *
 * Controls framing transitions (Establishing, Dialogue, Reaction, Dynamic Action),
 * camera panning & smooth zoom interpolation, screen shake, and scene playback controls
 * (Auto, 2x Fast-Forward, Instant Skip, Cinematic No-UI Mode).
 */

const CAMERA_SHOT_TYPES = {
  ESTABLISHING: { type: 'ESTABLISHING', defaultZoom: 1.0, durationMs: 1500, shake: false },
  DIALOGUE: { type: 'DIALOGUE', defaultZoom: 1.4, durationMs: 1200, shake: false },
  REACTION: { type: 'REACTION', defaultZoom: 2.0, durationMs: 800, shake: false },
  DYNAMIC_ACTION: { type: 'DYNAMIC_ACTION', defaultZoom: 1.8, durationMs: 600, shake: true }
};

const PLAYBACK_MODES = {
  AUTO: 'AUTO',
  FAST_FORWARD_2X: 'FAST_FORWARD_2X',
  SKIP_INSTANT: 'SKIP_INSTANT',
  CINEMATIC_NO_UI: 'CINEMATIC_NO_UI'
};

class CinematicCameraEngine {
  constructor(options = {}) {
    this.playbackMode = PLAYBACK_MODES.AUTO;
    this.currentZoom = 1.0;
    this.targetZoom = 1.0;
    this.currentPan = { x: 0, y: 0 };
    this.targetPan = { x: 0, y: 0 };
    this.activeShot = CAMERA_SHOT_TYPES.ESTABLISHING;
    this.transitionTimeMs = 0;
    this.shakeIntensity = 0;
  }

  setPlaybackMode(mode) {
    if (PLAYBACK_MODES[mode]) {
      this.playbackMode = mode;
      return true;
    }
    return false;
  }

  cutToShot(shotType, targetPos = { x: 0, y: 0 }, customZoom = null) {
    const config = CAMERA_SHOT_TYPES[shotType] || CAMERA_SHOT_TYPES.ESTABLISHING;
    this.activeShot = config;
    this.targetZoom = customZoom || config.defaultZoom;
    this.targetPan = { ...targetPos };
    this.transitionTimeMs = 0;

    if (config.shake) {
      this.shakeIntensity = 12;
    }

    if (this.playbackMode === PLAYBACK_MODES.SKIP_INSTANT) {
      this.currentZoom = this.targetZoom;
      this.currentPan = { ...this.targetPan };
      this.shakeIntensity = 0;
    }

    return {
      shotType: config.type,
      targetZoom: this.targetZoom,
      targetPan: this.targetPan
    };
  }

  update(dtMs) {
    let effectiveDt = dtMs;
    if (this.playbackMode === PLAYBACK_MODES.FAST_FORWARD_2X) {
      effectiveDt *= 2.0;
    }

    this.transitionTimeMs += effectiveDt;
    const duration = this.activeShot.durationMs;
    const t = Math.min(1.0, this.transitionTimeMs / duration);

    // Smooth lerp zoom & pan
    this.currentZoom += (this.targetZoom - this.currentZoom) * Math.min(1.0, t * 0.2);
    this.currentPan.x += (this.targetPan.x - this.currentPan.x) * Math.min(1.0, t * 0.2);
    this.currentPan.y += (this.targetPan.y - this.currentPan.y) * Math.min(1.0, t * 0.2);

    let shakeOffset = { x: 0, y: 0 };
    if (this.shakeIntensity > 0) {
      shakeOffset.x = (Math.random() * 2 - 1) * this.shakeIntensity;
      shakeOffset.y = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - effectiveDt * 0.02);
    }

    return {
      zoom: this.currentZoom,
      panX: this.currentPan.x,
      panY: this.currentPan.y,
      shakeOffset,
      isTransitionComplete: t >= 1.0,
      playbackMode: this.playbackMode
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CinematicCameraEngine, CAMERA_SHOT_TYPES, PLAYBACK_MODES };
}
if (typeof window !== 'undefined') {
  window.CinematicCameraEngine = CinematicCameraEngine;
  window.CAMERA_SHOT_TYPES = CAMERA_SHOT_TYPES;
  window.PLAYBACK_MODES = PLAYBACK_MODES;
}
