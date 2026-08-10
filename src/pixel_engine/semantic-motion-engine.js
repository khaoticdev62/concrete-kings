/**
 * Concrete Kings: The Block Chronicles
 * Semantic Motion & Staggered Reveal Timing Engine (Spec Section 10, 20, 21, 40, 53, 54)
 *
 * Implements the 6-stage staggered reveal sequence state machine, fast-forward controls,
 * card motion vocabulary (Fly, Flip, Burst, Stamp), and consequence particle arc trajectories.
 */

const SEMANTIC_REVEAL_STAGES = {
  WHO: { id: 'WHO', label: 'WHO?', defaultDurationMs: 500 },
  WHAT: { id: 'WHAT', label: 'WHAT?', defaultDurationMs: 500 },
  HOW: { id: 'HOW', label: 'HOW?', defaultDurationMs: 700 },
  TWIST: { id: 'TWIST', label: 'TWIST?', defaultDurationMs: 800 },
  COMBINATION: { id: 'COMBINATION', label: 'FULL COMBINATION', defaultDurationMs: 1200 },
  REACTION: { id: 'REACTION', label: 'CREW REACTION', defaultDurationMs: 1000 }
};

class SemanticMotionEngine {
  constructor(options = {}) {
    this.speedMultiplier = options.speedMultiplier || 1.0;
    this.isFastForward = false;
    this.revealSequence = ['WHO', 'WHAT', 'HOW', 'TWIST', 'COMBINATION', 'REACTION'];
    this.currentStageIndex = 0;
    this.stageTimeMs = 0;
    this.isRevealing = false;
    this.activeArcParticles = [];
  }

  setSpeed(multiplier = 1.0) {
    this.speedMultiplier = multiplier;
    this.isFastForward = multiplier > 1.0;
  }

  startRevealSequence(cards = {}) {
    this.cards = cards;
    this.currentStageIndex = 0;
    this.stageTimeMs = 0;
    this.isRevealing = true;
    return {
      stage: this.revealSequence[0],
      stageData: SEMANTIC_REVEAL_STAGES[this.revealSequence[0]],
      cards: this.cards
    };
  }

  updateReveal(dtMs) {
    if (!this.isRevealing) return { isComplete: true, currentStage: null };

    const effectiveDt = dtMs * this.speedMultiplier;
    this.stageTimeMs += effectiveDt;

    const currentStageKey = this.revealSequence[this.currentStageIndex];
    const stageConfig = SEMANTIC_REVEAL_STAGES[currentStageKey];

    if (this.stageTimeMs >= stageConfig.defaultDurationMs) {
      this.currentStageIndex += 1;
      this.stageTimeMs = 0;

      if (this.currentStageIndex >= this.revealSequence.length) {
        this.isRevealing = false;
        return { isComplete: true, currentStage: 'COMPLETE' };
      }
    }

    const stageKey = this.revealSequence[this.currentStageIndex];
    return {
      isComplete: false,
      currentStage: stageKey,
      stageData: SEMANTIC_REVEAL_STAGES[stageKey],
      progress: Math.min(1.0, this.stageTimeMs / SEMANTIC_REVEAL_STAGES[stageKey].defaultDurationMs)
    };
  }

  skipRevealSequence() {
    this.isRevealing = false;
    this.currentStageIndex = this.revealSequence.length;
    return { isComplete: true, currentStage: 'COMPLETE' };
  }

  spawnConsequenceArc(type, startPos = { x: 480, y: 270 }, targetPos = { x: 100, y: 50 }, amount = 10) {
    const particle = {
      id: `arc_${Date.now()}_${Math.random()}`,
      type,
      startPos,
      targetPos,
      controlPos: {
        x: (startPos.x + targetPos.x) / 2 + (Math.random() * 80 - 40),
        y: Math.min(startPos.y, targetPos.y) - 60
      },
      amount,
      progress: 0,
      durationMs: 800 / this.speedMultiplier
    };
    this.activeArcParticles.push(particle);
    return particle;
  }

  updateArcParticles(dtMs) {
    const remaining = [];
    for (const p of this.activeArcParticles) {
      p.progress += dtMs / p.durationMs;
      if (p.progress < 1.0) {
        const t = p.progress;
        // Bezier curve calculation
        const x = (1 - t) * (1 - t) * p.startPos.x + 2 * (1 - t) * t * p.controlPos.x + t * t * p.targetPos.x;
        const y = (1 - t) * (1 - t) * p.startPos.y + 2 * (1 - t) * t * p.controlPos.y + t * t * p.targetPos.y;
        p.currentPos = { x, y };
        remaining.push(p);
      }
    }
    this.activeArcParticles = remaining;
    return this.activeArcParticles;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SemanticMotionEngine, SEMANTIC_REVEAL_STAGES };
}
if (typeof window !== 'undefined') {
  window.SemanticMotionEngine = SemanticMotionEngine;
  window.SEMANTIC_REVEAL_STAGES = SEMANTIC_REVEAL_STAGES;
}
