const test = require('node:test');
const assert = require('node:assert/strict');
const { CampaignStoryEngine, CAMPAIGN_CITIES } = require('../src/pixel_engine/campaign-story-engine.js');

function mockStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem(k) { return store.has(k) ? store.get(k) : null; },
    setItem(k, v) { store.set(k, String(v)); },
    removeItem(k) { store.delete(k); },
    clear() { store.clear(); }
  };
}

test('CampaignStoryEngine: defines 12 campaign cities and starts in Harlem', () => {
  const campaign = new CampaignStoryEngine({ storage: mockStorage() });
  assert.equal(CAMPAIGN_CITIES.length, 12);
  assert.equal(campaign.getCurrentCity().id, 'HARLEM');
});

test('CampaignStoryEngine: progresses through city unlocks and boss defeats', () => {
  const campaign = new CampaignStoryEngine({ storage: mockStorage() });

  const res1 = campaign.defeatCityBoss('HARLEM');
  assert.equal(res1.nextCity.id, 'BALTIMORE');
  assert.equal(campaign.getCampaignProgress().completed, 1);

  // Defeat all remaining bosses to finish campaign
  CAMPAIGN_CITIES.slice(1).forEach(city => {
    campaign.defeatCityBoss(city.id);
  });

  const progress = campaign.getCampaignProgress();
  assert.equal(progress.completed, 12);
  assert.equal(progress.percentage, 100);
  assert.equal(progress.unlockedCities.length, 12);
});
