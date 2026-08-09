/**
 * Concrete Kings: Animation System
 *
 * Lightweight state-driven 2D animation helper for canvas rendering.
 * Keeps the 4-frame discipline explicit while supporting named clips,
 * playback rates, and one-shot vs loop semantics.
 */

const DEFAULT_FRAME_DURATION = 120; // ms per frame
const DEFAULT_LOOP = true;

class SpriteAnimation {
  constructor({ name, frames = [], frameDuration = DEFAULT_FRAME_DURATION, loop = DEFAULT_LOOP } = {}) {
    this.name = name;
    this.frames = frames.slice();
    this.frameDuration = frameDuration;
    this.loop = loop;
    this.reset();
  }

  reset() {
    this.frameAge = 0;
    this.frameIndex = 0;
    this.finished = false;
  }

  update(dt) {
    if (this.finished) return;
    this.frameAge += dt;
    this.frameIndex = Math.floor(this.frameAge / this.frameDuration);
    if (this.frameIndex >= this.frames.length) {
      if (this.loop) {
        this.frameAge = this.frameAge % (this.frames.length * this.frameDuration);
        this.frameIndex = Math.floor(this.frameAge / this.frameDuration);
      } else {
        this.frameIndex = this.frames.length - 1;
        this.finished = true;
      }
    }
  }

  currentFrame() {
    if (!this.frames.length) return 0;
    return this.frames[this.frameIndex];
  }
}

class Animator {
  constructor() {
    this.animations = new Map();
    this.current = null;
    this.currentName = null;
  }

  add(name, def) {
    this.animations.set(name, new SpriteAnimation({ name, ...def }));
  }

  play(name, restartIfSame = true) {
    const anim = this.animations.get(name);
    if (!anim) return;
    if (this.currentName !== name || restartIfSame) {
      if (this.currentName !== name) this.currentName = name;
      this.current = anim;
      this.current.reset();
    }
  }

  stop() {
    this.current = null;
    this.currentName = null;
  }

  update(dt) {
    if (!this.current) return 0;
    this.current.update(dt);
    return this.current.currentFrame();
  }

  currentFrame() {
    if (!this.current) return 0;
    return this.current.currentFrame();
  }

  finished() {
    return !!(this.current && this.current.finished);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Animator, SpriteAnimation, DEFAULT_FRAME_DURATION };
}
if (typeof window !== 'undefined') {
  window.Animator = Animator;
  window.SpriteAnimation = SpriteAnimation;
  window.DEFAULT_FRAME_DURATION = DEFAULT_FRAME_DURATION;
}
