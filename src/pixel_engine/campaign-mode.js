/**
 * Concrete Kings: The Block Chronicles
 * Single-Player & Co-Op Story Campaign Mode Engine
 * Version: 1.0.0
 */

const CAMPAIGN_ACTS = [
  {
    act: 1,
    city: 'Harlem',
    title: 'Act I: Heritage & Brownstones',
    bossOG: 'O.G. Big Dave (Master Barber)',
    description: 'Establish your reputation on 125th Street. Protect the local barbershop from buyout offers.',
    pointsToWin: 5,
    targetReputation: 10,
    unlockedOrigin: 'BARBER',
    rewardReceipt: 'R006: Barbershop Lease Guarantee'
  },
  {
    act: 2,
    city: 'Detroit',
    title: 'Act II: Motor City Hustle',
    bossOG: 'Boss Marcus (Warehouse Legend)',
    description: 'Navigate the industrial rust belt. Build an underground DJ booth inside the abandoned factory.',
    pointsToWin: 6,
    targetReputation: 20,
    unlockedOrigin: 'UNDERGROUND_DJ',
    rewardReceipt: 'R007: Factory Sound License'
  },
  {
    act: 3,
    city: 'Chicago',
    title: 'Act III: Wind-Swept Greystones',
    bossOG: 'Mama Gloria (Community Pillar)',
    description: 'Unite the south side 2-flats against gentrification developers.',
    pointsToWin: 7,
    targetReputation: 35,
    unlockedOrigin: 'COMMUNITY_ORGANIZER',
    rewardReceipt: 'R008: 2-Flat Housing Trust'
  },
  {
    act: 4,
    city: 'Miami',
    title: 'Act IV: Pastel Neon Nights',
    bossOG: 'El Rey Tico (Corner Merchant)',
    description: 'Run the open-air bodega terrace under the neon palm trees.',
    pointsToWin: 7,
    targetReputation: 50,
    unlockedOrigin: 'CORNER_MERCHANT',
    rewardReceipt: 'R009: Bodega Supply Permit'
  },
  {
    act: 5,
    city: 'Baltimore',
    title: 'Act V: Formstone & Marble Steps',
    bossOG: 'Mr. Freddie (Street Scholar)',
    description: 'Defend the rowhouse marble steps during the summer cookout summit.',
    pointsToWin: 8,
    targetReputation: 70,
    unlockedOrigin: 'STREET_SCHOLAR',
    rewardReceipt: 'R010: Marble Step Preservation Order'
  },
  {
    act: 6,
    city: 'Atlanta',
    title: 'Act VI: Red Clay Roots',
    bossOG: 'King Trey (Block Architect)',
    description: 'Build a community recording studio on the red clay hills.',
    pointsToWin: 8,
    targetReputation: 90,
    unlockedOrigin: 'BLOCK_ARCHITECT',
    rewardReceipt: 'R011: Studio Deed'
  },
  {
    act: 7,
    city: 'Oakland',
    title: 'Act VII: Bay Breeze & Gold Sun',
    bossOG: 'Lady Vern (Local Legend)',
    description: 'Host the ultimate Bay block party under the BART station pillars.',
    pointsToWin: 9,
    targetReputation: 115,
    unlockedOrigin: 'LOCAL_LEGEND',
    rewardReceipt: 'R012: Bay Block Party Permit'
  },
  {
    act: 8,
    city: 'NOLA',
    title: 'Act VIII: French Quarter Iron',
    bossOG: 'Grandmaster Chef Pierre',
    description: 'Crown yourself the supreme Concrete King at the Grand Cookout Championship.',
    pointsToWin: 10,
    targetReputation: 150,
    unlockedOrigin: 'HUSTLE_VETERAN',
    rewardReceipt: 'R013: Concrete Kings Crown'
  }
];

class CampaignModeEngine {
  constructor() {
    this.currentActIndex = 0;
    this.playerReputation = 0;
    this.unlockedActs = [1];
    this.completedActs = [];
  }

  getCurrentAct() {
    return CAMPAIGN_ACTS[this.currentActIndex] || CAMPAIGN_ACTS[0];
  }

  selectAct(actNumber) {
    if (this.unlockedActs.includes(actNumber)) {
      this.currentActIndex = actNumber - 1;
      return true;
    }
    return false;
  }

  completeCurrentAct() {
    const act = this.getCurrentAct();
    if (!this.completedActs.includes(act.act)) {
      this.completedActs.push(act.act);
      this.playerReputation += 15;
    }
    const nextActNum = act.act + 1;
    if (nextActNum <= CAMPAIGN_ACTS.length && !this.unlockedActs.includes(nextActNum)) {
      this.unlockedActs.push(nextActNum);
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CAMPAIGN_ACTS,
    CampaignModeEngine
  };
}

if (typeof window !== 'undefined') {
  window.CAMPAIGN_ACTS = CAMPAIGN_ACTS;
  window.CampaignModeEngine = CampaignModeEngine;
}
