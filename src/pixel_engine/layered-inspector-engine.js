/**
 * Concrete Kings: The Block Chronicles
 * Layered Character & Quest Thread Inspector Engine (Spec Sections 45-47)
 *
 * Implements the 5-Level Deep Information Inspector for characters (Level 1: Summary,
 * Level 2: Stats, Level 3: Traits, Level 4: History, Level 5: Detailed Mechanics) and
 * active narrative quest thread tracking.
 */

class LayeredInspectorEngine {
  constructor(options = {}) {
    this.activeInspectorLayer = 1;
    this.inspectingEntity = null;
    this.activeQuestThreads = [
      { id: 'MAYORS_REVENGE', title: "THE MAYOR'S REVENGE", danger: 'HIGH', status: 'Active', description: 'The Mayor knows you were involved.' },
      { id: 'GOLDEN_BRIEFCASE', title: 'THE GOLDEN BRIEFCASE', danger: 'UNKNOWN', status: 'Investigating', description: 'Hidden contents from 125th Street.' },
      { id: 'MARCUS_SECRET', title: "MARCUS' SECRET", danger: 'PERSONAL', status: 'Dormant', description: 'Marcus holds an unspoken loyalty.' },
      { id: 'POLICE_INVESTIGATION', title: 'POLICE INVESTIGATION', danger: 'ESCALATING', status: 'Heat level 4', description: 'Precinct 28 actively gathering evidence.' }
    ];
  }

  inspectCharacter(characterData) {
    this.inspectingEntity = characterData;
    this.activeInspectorLayer = 1;
    return this.getLayerData(1);
  }

  setLayer(layerLevel) {
    if (layerLevel >= 1 && layerLevel <= 5) {
      this.activeInspectorLayer = layerLevel;
      return this.getLayerData(layerLevel);
    }
    return null;
  }

  getLayerData(layerLevel = this.activeInspectorLayer) {
    if (!this.inspectingEntity) return null;

    const char = this.inspectingEntity;
    switch (layerLevel) {
      case 1:
        return {
          level: 1,
          name: char.name || 'Unknown',
          title: char.title || 'Street Veteran',
          hp: char.hp || 100,
          reputation: char.reputation || 50,
          status: char.status || 'Active on the block'
        };
      case 2:
        return {
          level: 2,
          stats: char.stats || { wit: 10, str: 10, soul: 10, heat: 0 }
        };
      case 3:
        return {
          level: 3,
          traits: char.traits || ['Harlem Native', 'Corner Hustler', 'Unshaken']
        };
      case 4:
        return {
          level: 4,
          history: char.history || ['Met Marcus on Day 1', 'Outsmarted the Mayor on Day 4']
        };
      case 5:
        return {
          level: 5,
          mechanics: char.mechanics || { tagAffinity: 'family', passiveBonus: '+1 Wit in Harlem', deckCount: 40 }
        };
      default:
        return null;
    }
  }

  getQuestThreads() {
    return this.activeQuestThreads;
  }

  getQuestThreadDetails(threadId) {
    const found = this.activeQuestThreads.find(t => t.id === threadId);
    if (!found) return null;
    return {
      ...found,
      whatWeKnow: 'Key witnesses established on 125th Street.',
      whatWeDid: 'Completed 2 scenario beats in Harlem.',
      whatMightHappen: 'Rival faction escalation or police raid.',
      whoIsInvolved: ['Marcus', 'Mayor Marquez', 'Precinct 28']
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LayeredInspectorEngine };
}
if (typeof window !== 'undefined') {
  window.LayeredInspectorEngine = LayeredInspectorEngine;
}
