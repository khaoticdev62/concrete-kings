/**
 * Concrete Kings: The Block Chronicles
 * Interactive Tutorial & Onboarding Engine (Checklist Section 9.1 & Spec #63-#70)
 *
 * Teaches player step-by-step through 5 mini-scenarios ("YOU'RE LATE" -> "SECOND CHANCE" -> "THE TWIST" -> "RPG CHECK" -> "AI DISAGREEMENT").
 */

const TUTORIAL_STEPS = [
  {
    id: 1,
    title: "YOU'RE LATE",
    prompt: "Your boss wants to know why you were late to the barber shop.",
    requiredSlots: ['WHY'],
    hint: "Pick a single card to explain why you are late, then lock in.",
    explanation: "Cards establish your story intent."
  },
  {
    id: 2,
    title: "SECOND CHANCE",
    prompt: "Now explain HOW you plan to make it up to him.",
    requiredSlots: ['WHY', 'HOW'],
    hint: "Select a WHY card and a HOW card to build a 2-card combination.",
    explanation: "Combining cards shapes the outcome."
  },
  {
    id: 3,
    title: "THE TWIST",
    prompt: "A sudden disruption occurs on 125th Street!",
    requiredSlots: ['WHY', 'HOW', 'TWIST'],
    hint: "Add a TWIST card to see how the block reacts.",
    explanation: "Twist cards introduce chaotic world events."
  },
  {
    id: 4,
    title: "RPG CHECK",
    prompt: "Your origin traits influence your execution success.",
    requiredSlots: ['WHO', 'WHAT', 'HOW', 'TWIST'],
    hint: "Match card categories with your character origin for extra trust.",
    explanation: "Stats and origins modify card success rates."
  },
  {
    id: 5,
    title: "AI DISAGREEMENT",
    prompt: "Marcus and Rico have their own opinions about this plan.",
    requiredSlots: ['WHO', 'WHAT', 'HOW', 'TWIST'],
    hint: "Watch how AI party members select their own cards.",
    explanation: "AI characters act autonomously based on their personalities."
  }
];

class TutorialOnboardingEngine {
  constructor(options = {}) {
    this.storage = options.storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    this.steps = TUTORIAL_STEPS;
    this.currentStepIndex = this.loadStepIndex();
    this.isCompleted = this.loadCompletionState();
  }

  loadStepIndex() {
    if (!this.storage) return 0;
    try {
      const saved = this.storage.getItem('ck-tutorial-step');
      const parsed = parseInt(saved, 10);
      return !isNaN(parsed) && parsed >= 0 && parsed < this.steps.length ? parsed : 0;
    } catch (e) {
      return 0;
    }
  }

  loadCompletionState() {
    if (!this.storage) return false;
    try {
      return this.storage.getItem('ck-tutorial-complete') === 'true';
    } catch (e) {
      return false;
    }
  }

  getCurrentStep() {
    if (this.isCompleted) return null;
    return this.steps[this.currentStepIndex] || null;
  }

  advanceStep() {
    if (this.isCompleted) return { completed: true };

    this.currentStepIndex += 1;
    if (this.currentStepIndex >= this.steps.length) {
      this.isCompleted = true;
      if (this.storage) {
        try {
          this.storage.setItem('ck-tutorial-complete', 'true');
          this.storage.setItem('ck-tutorial-step', String(this.steps.length));
        } catch(e){}
      }
      return { completed: true };
    }

    if (this.storage) {
      try { this.storage.setItem('ck-tutorial-step', String(this.currentStepIndex)); } catch(e){}
    }
    return { completed: false, nextStep: this.getCurrentStep() };
  }

  skipTutorial() {
    this.isCompleted = true;
    if (this.storage) {
      try {
        this.storage.setItem('ck-tutorial-complete', 'true');
        this.storage.setItem('ck-tutorial-step', String(this.steps.length));
      } catch(e){}
    }
    return { completed: true };
  }

  resetTutorial() {
    this.currentStepIndex = 0;
    this.isCompleted = false;
    if (this.storage) {
      try {
        this.storage.removeItem('ck-tutorial-complete');
        this.storage.setItem('ck-tutorial-step', '0');
      } catch(e){}
    }
    return this.getCurrentStep();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TutorialOnboardingEngine, TUTORIAL_STEPS };
}
if (typeof window !== 'undefined') {
  window.TutorialOnboardingEngine = TutorialOnboardingEngine;
  window.TUTORIAL_STEPS = TUTORIAL_STEPS;
}
