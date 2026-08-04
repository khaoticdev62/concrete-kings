const test = require('node:test');
const assert = require('node:assert');
const { loadGameModule } = require('./helpers/load-app');

test('RECEIPT_POOL has 5 seed entries with id/earnText/resolutionPrompt', () => {
  const { RECEIPT_POOL } = loadGameModule();
  assert.equal(RECEIPT_POOL.length, 5);
  for (const entry of RECEIPT_POOL) {
    assert.equal(typeof entry.id, 'string');
    assert.equal(typeof entry.earnText, 'string');
    assert.equal(typeof entry.resolutionPrompt, 'string');
    assert.ok(entry.resolutionPrompt.includes('____'), `resolutionPrompt for ${entry.id} should contain a blank`);
  }
  const ids = RECEIPT_POOL.map(e => e.id);
  assert.equal(new Set(ids).size, ids.length, 'RECEIPT_POOL ids must be unique');
});

test('Game.addPlayer initializes stats at zero and an empty receipts list', () => {
  const { Game } = loadGameModule();
  const game = new Game();
  game.addPlayer('Alice');
  assert.deepEqual(game.players[0].stats, { streetCred: 0, community: 0, wisdom: 0, reputation: 0 });
  assert.deepEqual(game.players[0].receipts, []);
});
