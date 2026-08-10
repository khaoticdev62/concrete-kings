const test = require('node:test');
const assert = require('node:assert/strict');
const { SinglePlayerAICampaign, ARCHETYPES } = require('../src/pixel_engine/single-player-ai-campaign.js');

function mockStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem(k) { return store.has(k) ? store.get(k) : null; },
    setItem(k, v) { store.set(k, String(v)); },
    removeItem(k) { store.delete(k); },
    clear() { store.clear(); }
  };
}

test('SinglePlayerAICampaign: calculates card scores based on archetype personality', () => {
  const storage = mockStorage();
  const campaign = new SinglePlayerAICampaign({ storage });

  const safeCard = { title: 'Talk to Guard', text: 'peaceful social approach' };
  const chaosCard = { title: 'Wild Pigeon Standoff', text: 'wild chaotic disturbance' };
  const hand = [safeCard, chaosCard];

  // Rico (Chaos Agent) should pick the wild chaos card
  const ricoChoice = campaign.selectBestCardForAI('RICO', hand);
  assert.equal(ricoChoice.chosenCard.title, 'Wild Pigeon Standoff');

  // Marcus (Straight Man) should pick the safe card
  const marcusChoice = campaign.selectBestCardForAI('MARCUS', hand);
  assert.equal(marcusChoice.chosenCard.title, 'Talk to Guard');
});

test('SinglePlayerAICampaign: updates and persists AI party trust relationships', () => {
  const storage = mockStorage();
  const campaign = new SinglePlayerAICampaign({ storage });

  assert.equal(campaign.party[0].trust, 78);

  campaign.updateRelationship('MARCUS', 10);
  assert.equal(campaign.party[0].trust, 88);
  assert.equal(storage.getItem('ck-ai-party-relationships'), JSON.stringify({ MARCUS: 88, TASHA: 49, RICO: 91 }));

  const newCampaign = new SinglePlayerAICampaign({ storage });
  assert.equal(newCampaign.party[0].trust, 88);
});
