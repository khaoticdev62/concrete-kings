const test = require('node:test');
const assert = require('node:assert/strict');
const { CampaignModeEngine, CAMPAIGN_ACTS } = require('../src/pixel_engine/campaign-mode.js');

test('Campaign Mode: 8 Regional City Acts are defined with boss O.G. profiles', () => {
  assert.equal(CAMPAIGN_ACTS.length, 8, 'Must have 8 campaign acts');
  const act1 = CAMPAIGN_ACTS[0];
  assert.equal(act1.city, 'Harlem');
  assert.ok(act1.bossOG.includes('Master Barber'));
});

test('Campaign Mode: Engine unlocks acts sequentially and tracks reputation', () => {
  const engine = new CampaignModeEngine();
  assert.equal(engine.getCurrentAct().act, 1);
  assert.deepEqual(engine.unlockedActs, [1]);

  engine.completeCurrentAct();
  assert.equal(engine.playerReputation, 15);
  assert.deepEqual(engine.unlockedActs, [1, 2]);

  assert.equal(engine.selectAct(2), true);
  assert.equal(engine.getCurrentAct().act, 2);
});
