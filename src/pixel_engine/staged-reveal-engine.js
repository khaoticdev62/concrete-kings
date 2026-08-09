/**
 * Concrete Kings: The Block Chronicles
 * Staged Reveal & Reaction Camera Engine (Spec v3.0)
 *
 * Drives the multi-beat emotional reveal sequence (Title -> WHO -> WHAT -> HOW -> TWIST -> Combination -> Reaction -> Playback).
 */

const REVEAL_STAGES = [
  { id: 'TITLE', durationMs: 500, label: 'SCENARIO TITLE' },
  { id: 'WHO', durationMs: 500, label: 'WHO?' },
  { id: 'WHAT', durationMs: 500, label: 'WHAT?' },
  { id: 'HOW', durationMs: 700, label: 'HOW?' },
  { id: 'TWIST', durationMs: 800, label: 'TWIST?' },
  { id: 'COMBINATION', durationMs: 1200, label: 'FULL COMBINATION' },
  { id: 'REACTION', durationMs: 1000, label: 'CHARACTER REACTION' },
  { id: 'COMPLETE', durationMs: 0, label: 'SCENE START' }
];

class StagedRevealEngine {
  constructor(options = {}) {
    this.stages = REVEAL_STAGES;
    this.currentIndex = 0;
    this.speed = options.speed || 1.0;
    this.onStageChange = options.onStageChange || null;
    this.timer = null;
    this.isPlaying = false;
    this.scenarioPackage = null;
  }

  setSpeed(speedMultiplier = 1.0) {
    this.speed = Math.max(0.5, Math.min(4.0, speedMultiplier));
  }

  startReveal(scenarioPackage) {
    this.scenarioPackage = scenarioPackage;
    this.currentIndex = 0;
    this.isPlaying = true;
    this.advanceStage();
  }

  advanceStage() {
    if (!this.isPlaying) return;

    const currentStage = this.stages[this.currentIndex];
    if (typeof this.onStageChange === 'function') {
      this.onStageChange({
        stage: currentStage,
        index: this.currentIndex,
        total: this.stages.length,
        scenarioPackage: this.scenarioPackage
      });
    }

    if (currentStage.id === 'COMPLETE') {
      this.stop();
      return;
    }

    const duration = Math.round(currentStage.durationMs / this.speed);
    this.timer = setTimeout(() => {
      this.currentIndex += 1;
      if (this.currentIndex < this.stages.length) {
        this.advanceStage();
      }
    }, duration);
  }

  skip() {
    if (this.timer) clearTimeout(this.timer);
    this.currentIndex = this.stages.length - 1; // COMPLETE
    const currentStage = this.stages[this.currentIndex];
    if (typeof this.onStageChange === 'function') {
      this.onStageChange({
        stage: currentStage,
        index: this.currentIndex,
        total: this.stages.length,
        scenarioPackage: this.scenarioPackage
      });
    }
    this.stop();
  }

  stop() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.isPlaying = false;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StagedRevealEngine, REVEAL_STAGES };
}
if (typeof window !== 'undefined') {
  window.StagedRevealEngine = StagedRevealEngine;
  window.REVEAL_STAGES = REVEAL_STAGES;
}
