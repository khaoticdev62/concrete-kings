/**
 * Concrete Kings: The Block Chronicles
 * Single Player AI Campaign Engine (PRD v2.1)
 *
 * Implements autonomous AI party members (Marcus, Tasha, Rico, Ray) with real card hands,
 * personality archetypes, card evaluation scoring, and relationship tracking.
 */

const ARCHETYPES = {
  THE_STRAIGHT_MAN: {
    id: 'THE_STRAIGHT_MAN',
    name: 'Marcus',
    survivalPriority: 0.9,
    chaosPreference: 0.1,
    loyalty: 0.8,
    deception: 0.2
  },
  THE_SCHEMER: {
    id: 'THE_SCHEMER',
    name: 'Tasha',
    survivalPriority: 0.7,
    chaosPreference: 0.4,
    loyalty: 0.3,
    deception: 0.9
  },
  THE_CHAOS_AGENT: {
    id: 'THE_CHAOS_AGENT',
    name: 'Rico',
    survivalPriority: 0.2,
    chaosPreference: 1.0,
    loyalty: 0.5,
    deception: 0.5
  },
  THE_PRECISION_BARBER: {
    id: 'THE_PRECISION_BARBER',
    name: 'Ray',
    survivalPriority: 0.8,
    chaosPreference: 0.2,
    loyalty: 0.9,
    deception: 0.1
  }
};

class SinglePlayerAICampaign {
  constructor(options = {}) {
    this.storage = options.storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    this.party = options.party || [
      { id: 'MARCUS', archetype: ARCHETYPES.THE_STRAIGHT_MAN, trust: 78 },
      { id: 'TASHA', archetype: ARCHETYPES.THE_SCHEMER, trust: 49 },
      { id: 'RICO', archetype: ARCHETYPES.THE_CHAOS_AGENT, trust: 91 }
    ];
    this.loadRelationships();
  }

  loadRelationships() {
    if (!this.storage) return;
    try {
      const raw = this.storage.getItem('ck-ai-party-relationships');
      if (raw) {
        const saved = JSON.parse(raw);
        this.party.forEach(p => {
          if (saved[p.id]) p.trust = saved[p.id];
        });
      }
    } catch (e) {}
  }

  saveRelationships() {
    if (!this.storage) return;
    try {
      const saved = {};
      this.party.forEach(p => { saved[p.id] = p.trust; });
      this.storage.setItem('ck-ai-party-relationships', JSON.stringify(saved));
    } catch (e) {}
  }

  updateRelationship(characterId, delta) {
    const member = this.party.find(p => p.id === characterId);
    if (!member) return null;
    member.trust = Math.max(0, Math.min(100, member.trust + delta));
    this.saveRelationships();
    return member.trust;
  }

  evaluateCardScore(member, card, scenarioContext = {}) {
    if (!card) return 0;
    const arch = member.archetype;
    const text = (card.text || card.title || '').toLowerCase();

    let score = 50; // base score

    // Chaos evaluation
    const isChaotic = text.includes('wild') || text.includes('fire') || text.includes('pigeon') || text.includes('dice');
    if (isChaotic) {
      score += arch.chaosPreference * 40;
    } else {
      score += arch.survivalPriority * 20;
    }

    // Deception / loyalty evaluation
    const isBetrayal = text.includes('blame') || text.includes('steal') || text.includes('lie');
    if (isBetrayal) {
      score += arch.deception * 30 - arch.loyalty * 20;
    }

    // Trust modifier
    if (member.trust < 50 && isBetrayal) {
      score += 15; // More likely to play disruptive cards if trust is low
    }

    return score;
  }

  selectBestCardForAI(characterId, cardHand = [], scenarioContext = {}) {
    const member = this.party.find(p => p.id === characterId);
    if (!member || cardHand.length === 0) return null;

    let bestCard = cardHand[0];
    let highestScore = -Infinity;

    cardHand.forEach(card => {
      const score = this.evaluateCardScore(member, card, scenarioContext);
      if (score > highestScore) {
        highestScore = score;
        bestCard = card;
      }
    });

    return {
      characterId,
      member,
      chosenCard: bestCard,
      score: highestScore
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SinglePlayerAICampaign, ARCHETYPES };
}
if (typeof window !== 'undefined') {
  window.SinglePlayerAICampaign = SinglePlayerAICampaign;
  window.ARCHETYPES = ARCHETYPES;
}
