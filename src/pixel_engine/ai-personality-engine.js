/**
 * Concrete Kings: The Block Chronicles
 * AI Personality & Thinking Engine (Spec v3.0)
 *
 * Implements character-specific decision timing and real-time status cues
 * (Marcus: thoughtful, Tasha: quick, Rico: long pause + "Oh no!", Ray: sharp).
 */

const AI_PROFILES = {
  MARCUS: {
    id: 'MARCUS',
    name: 'Marcus',
    role: 'The Straight Man',
    delayMs: 1200,
    thinkingStyle: 'Thoughtful calculation',
    dialogue: null
  },
  TASHA: {
    id: 'TASHA',
    name: 'Tasha',
    role: 'The Schemer',
    delayMs: 400,
    thinkingStyle: 'Quick tactical play',
    dialogue: null
  },
  RICO: {
    id: 'RICO',
    name: 'Rico',
    role: 'The Chaos Agent',
    delayMs: 2000,
    thinkingStyle: 'Unpredictable panic',
    dialogue: 'Oh no...'
  },
  RAY: {
    id: 'RAY',
    name: 'Master Barber Ray',
    role: 'The Precision Barber',
    delayMs: 800,
    thinkingStyle: 'Deliberate cut',
    dialogue: null
  }
};

class AIPersonalityEngine {
  constructor(options = {}) {
    this.profiles = options.profiles || { ...AI_PROFILES };
    this.states = new Map();
    this.initStates();
  }

  initStates() {
    Object.keys(this.profiles).forEach(id => {
      this.states.set(id, {
        id,
        status: 'IDLE', // IDLE, THINKING, SUBMITTED
        chosenCard: null,
        dialogue: null
      });
    });
  }

  getCharacterState(id) {
    return this.states.get(id) || null;
  }

  simulateDecision(id, cardPool = []) {
    const profile = this.profiles[id];
    if (!profile) return Promise.reject(new Error(`Unknown AI profile: ${id}`));

    const state = this.states.get(id);
    state.status = 'THINKING';
    state.chosenCard = null;
    state.dialogue = null;

    return new Promise((resolve) => {
      setTimeout(() => {
        const randomIndex = cardPool.length > 0 ? Math.floor(Math.random() * cardPool.length) : 0;
        const chosenCard = cardPool[randomIndex] || { title: 'Default Card', text: 'Default card play' };

        state.status = 'SUBMITTED';
        state.chosenCard = chosenCard;
        state.dialogue = profile.dialogue;

        resolve({
          characterId: id,
          profile,
          chosenCard,
          dialogue: profile.dialogue,
          status: 'SUBMITTED'
        });
      }, profile.delayMs);
    });
  }

  simulatePartyDecisions(partyIds = ['MARCUS', 'TASHA', 'RICO'], cardPool = []) {
    this.initStates();
    const promises = partyIds.map(id => this.simulateDecision(id, cardPool));
    return Promise.all(promises);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AIPersonalityEngine, AI_PROFILES };
}
if (typeof window !== 'undefined') {
  window.AIPersonalityEngine = AIPersonalityEngine;
  window.AI_PROFILES = AI_PROFILES;
}
