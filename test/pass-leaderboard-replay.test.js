const test = require('node:test');
const assert = require('node:assert/strict');
const { BattlePassEngine } = require('../src/pixel_engine/battle-pass-engine.js');
const { LeaderboardEngine } = require('../src/pixel_engine/leaderboard-engine.js');
const { SpectatorReplayEngine } = require('../src/pixel_engine/spectator-replay-engine.js');

function mockStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem(k) { return store.has(k) ? store.get(k) : null; },
    setItem(k, v) { store.set(k, String(v)); },
    removeItem(k) { store.delete(k); },
    clear() { store.clear(); }
  };
}

test('BattlePassEngine: unlocks tiers and claims free & premium rewards', () => {
  const pass = new BattlePassEngine({ storage: mockStorage() });
  assert.equal(pass.currentTier, 1);

  const addRes = pass.addXp(1200);
  assert.equal(pass.currentTier, 3);
  assert.equal(addRes.unlockedTiers.length, 2);

  const claimFree = pass.claimReward(2, 'free');
  assert.equal(claimFree.success, true);
  assert.equal(claimFree.reward.type, 'DUST');

  pass.upgradeToPremium();
  const claimPrem = pass.claimReward(2, 'premium');
  assert.equal(claimPrem.success, true);
  assert.equal(claimPrem.reward.type, 'CARD_BACK');
});

test('LeaderboardEngine: ranks players globally and by district filter', () => {
  const lb = new LeaderboardEngine({ storage: mockStorage() });

  const globalRanks = lb.getRankings();
  assert.equal(globalRanks[0].tag, 'HarlemKing#1994');

  const harlemOnly = lb.getRankings('Harlem');
  assert.equal(harlemOnly.length >= 1, true);

  lb.submitScore('HarlemKing#1994', 'Harlem King', 500, 'Harlem');
  const rank = lb.getPlayerRank('HarlemKing#1994');
  assert.equal(rank.rank, 1);
});

test('SpectatorReplayEngine: records match turns and steps through replay history', () => {
  const replay = new SpectatorReplayEngine({ storage: mockStorage() });
  replay.createReplaySession('m1', ['P1', 'P2']);

  replay.recordTurn(1, 'P1', 'Play Card A', 'Success');
  replay.recordTurn(1, 'P2', 'Play Card B', 'Failure');

  assert.equal(replay.currentReplay.turns.length, 2);

  const step1 = replay.nextStep();
  assert.equal(step1.turn.playerTag, 'P1');

  const step2 = replay.nextStep();
  assert.equal(step2.turn.playerTag, 'P2');

  const step3 = replay.nextStep();
  assert.equal(step3.done, true);
});
