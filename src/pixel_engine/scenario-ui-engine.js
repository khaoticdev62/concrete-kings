/**
 * Concrete Kings: The Block Chronicles
 * Scenario & Card Slot UI Engine (Spec v3.0)
 *
 * Manages 4-slot scenario construction (WHO, WHAT, HOW, TWIST),
 * card recommendation tags, contextual slot validation, and lock-in transitions.
 */

const SLOT_TYPES = {
  WHO: 'WHO',
  WHAT: 'WHAT',
  HOW: 'HOW',
  TWIST: 'TWIST'
};

const RECOMMENDATION_TAGS = {
  STRONG_MATCH: { label: 'STRONG MATCH', color: '#6fe8d8' },
  INTERESTING: { label: 'INTERESTING', color: '#ffcd68' },
  CHAOTIC: { label: 'CHAOTIC', color: '#ff7fbf' },
  HIGH_RISK: { label: 'HIGH RISK', color: '#f25438' },
  STORY: { label: 'STORY', color: '#a0aac2' }
};

class ScenarioUIEngine {
  constructor(options = {}) {
    this.title = options.title || 'UNNAMED SCENARIO';
    this.description = options.description || '';
    this.tags = options.tags || [];
    this.slots = {
      [SLOT_TYPES.WHO]: { id: SLOT_TYPES.WHO, prompt: 'WHO is involved?', card: null, allowedCategory: null },
      [SLOT_TYPES.WHAT]: { id: SLOT_TYPES.WHAT, prompt: 'WHAT is the goal?', card: null, allowedCategory: null },
      [SLOT_TYPES.HOW]: { id: SLOT_TYPES.HOW, prompt: 'HOW do you approach it?', card: null, allowedCategory: null },
      [SLOT_TYPES.TWIST]: { id: SLOT_TYPES.TWIST, prompt: 'What TWIST occurs?', card: null, allowedCategory: null }
    };
    this.isLocked = false;
  }

  setScenario(title, description, tags = []) {
    this.title = title;
    this.description = description;
    this.tags = tags;
    this.resetSlots();
  }

  resetSlots() {
    Object.keys(this.slots).forEach(key => {
      this.slots[key].card = null;
    });
    this.isLocked = false;
  }

  validateCardForSlot(slotId, card) {
    const slot = this.slots[slotId];
    if (!slot) return { valid: false, reason: 'Invalid slot' };
    if (!card) return { valid: false, reason: 'No card selected' };

    // Contextual validation rule: TWIST slot prefers chaotic/event cards
    if (slotId === SLOT_TYPES.TWIST && card.type === 'WHITE' && card.text && card.text.toLowerCase().includes('peaceful')) {
      return { valid: false, reason: 'TWIST slot requires a high-impact or unpredictable card.' };
    }

    return { valid: true };
  }

  getRecommendationForCard(card) {
    if (!card) return null;
    const text = (card.text || card.title || '').toLowerCase();
    if (text.includes('police') || text.includes('bribe') || text.includes('boss')) {
      return RECOMMENDATION_TAGS.HIGH_RISK;
    }
    if (text.includes('dice') || text.includes('wild') || text.includes('fire')) {
      return RECOMMENDATION_TAGS.CHAOTIC;
    }
    if (text.includes('mayor') || text.includes('secret') || text.includes('barber')) {
      return RECOMMENDATION_TAGS.STRONG_MATCH;
    }
    if (text.includes('cousin') || text.includes('party')) {
      return RECOMMENDATION_TAGS.INTERESTING;
    }
    return RECOMMENDATION_TAGS.STORY;
  }

  assignCardToSlot(slotId, card) {
    if (this.isLocked) return { success: false, reason: 'Scenario is locked.' };

    const val = this.validateCardForSlot(slotId, card);
    if (!val.valid) return { success: false, reason: val.reason };

    this.slots[slotId].card = card;
    return {
      success: true,
      recommendation: this.getRecommendationForCard(card),
      status: this.getCompletionStatus()
    };
  }

  getCompletionStatus() {
    const filled = Object.values(this.slots).filter(s => s.card !== null).length;
    const total = 4;
    return {
      filled,
      total,
      isComplete: filled === total,
      isLocked: this.isLocked,
      label: `${filled} / ${total} SLOTS COMPLETE`
    };
  }

  lockIn() {
    const status = this.getCompletionStatus();
    if (!status.isComplete) {
      return { success: false, reason: `Cannot lock in: ${status.label}` };
    }
    this.isLocked = true;
    return {
      success: true,
      scenarioPackage: {
        title: this.title,
        description: this.description,
        slots: { ...this.slots }
      }
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ScenarioUIEngine, SLOT_TYPES, RECOMMENDATION_TAGS };
}
if (typeof window !== 'undefined') {
  window.ScenarioUIEngine = ScenarioUIEngine;
  window.SLOT_TYPES = SLOT_TYPES;
  window.RECOMMENDATION_TAGS = RECOMMENDATION_TAGS;
}
