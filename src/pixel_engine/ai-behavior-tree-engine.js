/**
 * Concrete Kings: The Block Chronicles
 * Advanced AI Behavior Tree & Playstyle Engine
 *
 * Implements dynamic hybrid card evaluation (personality category weights + relationship memory + heat risk tolerance)
 * and telegraphed dialogue voting for AI party members (Marcus, Tasha, Rico).
 */

const AI_ARCHETYPES = {
  MARCUS: {
    id: 'MARCUS',
    name: 'Marcus',
    role: 'The Tactician',
    preferredCategory: 'SOCIAL',
    maxHeatTolerance: 4,
    weightCategory: 0.45,
    weightTrust: 0.35,
    weightHeat: 0.20,
    dialogueTelegraph: {
      SAFE: 'Marcus: We need to play it safe and protect the crew.',
      CHAOS: 'Marcus: Are you out of your mind? That’s too dangerous.',
      VOTE: 'Marcus: I’m locking in the smartest play for Harlem.'
    }
  },
  TASHA: {
    id: 'TASHA',
    name: 'Tasha',
    role: 'The Schemer',
    preferredCategory: 'WIT',
    maxHeatTolerance: 7,
    weightCategory: 0.40,
    weightTrust: 0.30,
    weightHeat: 0.30,
    dialogueTelegraph: {
      SAFE: 'Tasha: Playing it safe won’t pay the rent.',
      CHAOS: 'Tasha: Bold move. Let’s see if you can pull it off.',
      VOTE: 'Tasha: I’m voting for maximum leverage.'
    }
  },
  RICO: {
    id: 'RICO',
    name: 'Rico',
    role: 'The Chaos Gambler',
    preferredCategory: 'CHAOS',
    maxHeatTolerance: 10,
    weightCategory: 0.50,
    weightTrust: 0.15,
    weightHeat: 0.35,
    dialogueTelegraph: {
      SAFE: 'Rico: Boring! Where’s the action?',
      CHAOS: 'Rico: Oh yeah! Now we’re talking!',
      VOTE: 'Rico: I’m voting for pure anarchy!'
    }
  }
};

class AiBehaviorTreeEngine {
  constructor() {
    this.archetypes = { ...AI_ARCHETYPES };
  }

  evaluateCardForAi(characterId, card, currentHeat = 0, allyTrust = 50) {
    const archetype = this.archetypes[characterId] || this.archetypes.MARCUS;
    let score = 50;

    // 1. Category Preference Score
    const cardCategory = (card.category || 'SOCIAL').toUpperCase();
    if (cardCategory === archetype.preferredCategory) {
      score += 30;
    } else if (cardCategory === 'CHAOS' && characterId === 'MARCUS') {
      score -= 25;
    } else if (cardCategory === 'CHAOS' && characterId === 'RICO') {
      score += 40;
    }

    // 2. Relationship Trust Bonus
    const trustFactor = (allyTrust - 50) * 0.4;
    score += trustFactor;

    // 3. Heat Risk Penalty
    if (currentHeat > archetype.maxHeatTolerance) {
      const heatOver = currentHeat - archetype.maxHeatTolerance;
      score -= heatOver * 15;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  selectBestCard(characterId, hand = [], currentHeat = 0, allyTrust = 50) {
    if (!hand || hand.length === 0) return null;

    let bestCard = hand[0];
    let bestScore = -1;

    hand.forEach(card => {
      const score = this.evaluateCardForAi(characterId, card, currentHeat, allyTrust);
      if (score > bestScore) {
        bestScore = score;
        bestCard = card;
      }
    });

    return { card: bestCard, score: bestScore };
  }

  getTelegraphedDialogue(characterId, selectedOptionType = 'SAFE') {
    const archetype = this.archetypes[characterId] || this.archetypes.MARCUS;
    const telegraphs = archetype.dialogueTelegraph || {};
    return telegraphs[selectedOptionType] || `${archetype.name}: Deciding next move...`;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AiBehaviorTreeEngine, AI_ARCHETYPES };
}
if (typeof window !== 'undefined') {
  window.AiBehaviorTreeEngine = AiBehaviorTreeEngine;
  window.AI_ARCHETYPES = AI_ARCHETYPES;
}
