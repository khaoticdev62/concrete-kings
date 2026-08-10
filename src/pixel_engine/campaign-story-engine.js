/**
 * Concrete Kings: The Block Chronicles
 * 12-City Campaign Story Mode Engine (Spec v3.0)
 *
 * Controls campaign story progression across all 12 real-world urban cities
 * (Harlem, Baltimore, Chicago, Detroit, Miami, Atlanta, Oakland, New Orleans,
 * Philadelphia, St. Louis, Memphis, Los Angeles), district unlocks, boss fights, and story endings.
 */

const CAMPAIGN_CITIES = [
  { id: 'HARLEM', name: 'Harlem', title: 'Chapter 1: Harlem Rise', boss: 'Mayor Marquez', heatGate: 0 },
  { id: 'BALTIMORE', name: 'Baltimore', title: 'Chapter 2: Charm City Blockade', boss: 'Prophet Omar', heatGate: 2 },
  { id: 'CHICAGO', name: 'Chicago', title: 'Chapter 3: Windy City Syndicate', boss: 'Vance the Architect', heatGate: 4 },
  { id: 'DETROIT', name: 'Detroit', title: 'Chapter 4: Motor City Hustle', boss: 'Deacon Ray', heatGate: 5 },
  { id: 'MIAMI', name: 'Miami', title: 'Chapter 5: Magic City Vice', boss: 'Don Carlos', heatGate: 6 },
  { id: 'ATLANTA', name: 'Atlanta', title: 'Chapter 6: A-Town Empire', boss: 'Trap Lord Kane', heatGate: 7 },
  { id: 'OAKLAND', name: 'Oakland', title: 'Chapter 7: Bay Area Burner', boss: 'Mac Ghost', heatGate: 8 },
  { id: 'NEW_ORLEANS', name: 'New Orleans', title: 'Chapter 8: Crescent City Curse', boss: 'Baron Samedi', heatGate: 8 },
  { id: 'PHILADELPHIA', name: 'Philadelphia', title: 'Chapter 9: Philly Brotherhood', boss: 'Big Brother Pops', heatGate: 9 },
  { id: 'ST_LOUIS', name: 'St. Louis', title: 'Chapter 10: Gateway Grind', boss: 'Arch King Slim', heatGate: 9 },
  { id: 'MEMPHIS', name: 'Memphis', title: 'Chapter 11: Bluff City Beats', boss: 'DJ Memphis Soul', heatGate: 10 },
  { id: 'LOS_ANGELES', name: 'Los Angeles', title: 'Chapter 12: Sunset Boulevard Finale', boss: 'The Executive Producer', heatGate: 10 }
];

class CampaignStoryEngine {
  constructor(options = {}) {
    this.storage = options.storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    this.state = this.loadState();
  }

  loadState() {
    if (!this.storage) return this.getDefaultState();
    try {
      const raw = this.storage.getItem('ck-campaign-story');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return this.getDefaultState();
  }

  saveState() {
    if (!this.storage) return;
    try {
      this.storage.setItem('ck-campaign-story', JSON.stringify(this.state));
    } catch (e) {}
  }

  getDefaultState() {
    return {
      currentCityIndex: 0,
      unlockedCities: ['HARLEM'],
      defeatedBosses: [],
      campaignCompleted: false
    };
  }

  getCurrentCity() {
    return CAMPAIGN_CITIES[this.state.currentCityIndex] || CAMPAIGN_CITIES[0];
  }

  defeatCityBoss(cityId) {
    if (!this.state.defeatedBosses.includes(cityId)) {
      this.state.defeatedBosses.push(cityId);
    }

    const currentCity = this.getCurrentCity();
    if (currentCity.id === cityId && this.state.currentCityIndex < CAMPAIGN_CITIES.length - 1) {
      this.state.currentCityIndex += 1;
      const nextCity = this.getCurrentCity();
      if (!this.state.unlockedCities.includes(nextCity.id)) {
        this.state.unlockedCities.push(nextCity.id);
      }
    } else if (this.state.currentCityIndex === CAMPAIGN_CITIES.length - 1) {
      this.state.campaignCompleted = true;
    }

    this.saveState();
    return {
      success: true,
      nextCity: this.getCurrentCity(),
      campaignCompleted: this.state.campaignCompleted
    };
  }

  getCampaignProgress() {
    const total = CAMPAIGN_CITIES.length;
    const completed = this.state.defeatedBosses.length;
    return {
      completed,
      total,
      percentage: Math.round((completed / total) * 100),
      currentCity: this.getCurrentCity(),
      unlockedCities: [...this.state.unlockedCities]
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CampaignStoryEngine, CAMPAIGN_CITIES };
}
if (typeof window !== 'undefined') {
  window.CampaignStoryEngine = CampaignStoryEngine;
  window.CAMPAIGN_CITIES = CAMPAIGN_CITIES;
}
