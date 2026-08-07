/**
 * Concrete Kings: The Block Chronicles
 * Mini-Game High-Precision Delta Loop
 */

class MiniGameLoop {
  constructor() {
    this.active = false;
    this.paused = false;
    this.lastTime = 0;
    this.maxStep = 100; // Cap physics step in ms to prevent huge time jumps (spiral of death)
    this.frameId = null;
    
    this.updateCallback = null;
    this.renderCallback = null;
  }

  start(updateCallback, renderCallback) {
    this.active = true;
    this.paused = false;
    this.lastTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.updateCallback = updateCallback;
    this.renderCallback = renderCallback;
    
    const loop = (timestamp) => {
      if (!this.active) return;
      
      if (typeof requestAnimationFrame !== 'undefined') {
        this.frameId = requestAnimationFrame(loop);
      } else {
        this.timerId = setTimeout(() => {
          if (this.active) loop(typeof performance !== 'undefined' ? performance.now() : Date.now());
        }, 16);
      }
      
      if (this.paused) {
        this.lastTime = timestamp;
        return;
      }
      
      let dt = timestamp - this.lastTime;
      this.lastTime = timestamp;
      
      // Clamp deltaTime to avoid physics breakdowns
      if (dt > this.maxStep) {
        dt = this.maxStep;
      }
      
      if (this.updateCallback) {
        this.updateCallback(dt);
      }
      if (this.renderCallback) {
        this.renderCallback();
      }
    };
    
    if (typeof requestAnimationFrame !== 'undefined') {
      this.frameId = requestAnimationFrame(loop);
    } else {
      this.timerId = setTimeout(() => {
        if (this.active) loop(typeof performance !== 'undefined' ? performance.now() : Date.now());
      }, 16);
    }
  }

  stop() {
    this.active = false;
    if (typeof window !== 'undefined' && this.frameId) {
      cancelAnimationFrame(this.frameId);
    }
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.frameId = null;
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
    this.lastTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MiniGameLoop
  };
}

if (typeof window !== 'undefined') {
  window.MiniGameLoop = MiniGameLoop;
}
