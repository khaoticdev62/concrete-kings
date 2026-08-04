const test = require('node:test');
const assert = require('node:assert');
const { loadGameModule } = require('./helpers/load-app');

function makeWinner(Game) {
  const game = new Game();
  game.addPlayer('Winner');
  game.addPlayer('Other');
  game.round = 1;
  return { game, winner: game.players[0], other: game.players[1] };
}

test('awardWin gives the winner +1 reputation', () => {
  const { Game, ReceiptSystem } = loadGameModule();
  const { game, winner, other } = makeWinner(Game);
  ReceiptSystem.awardWin(game, winner);
  assert.equal(winner.stats.reputation, 1);
  assert.equal(other.stats.reputation, 0);
});

test('awardWin grants a new active receipt when under the cap', () => {
  const { Game, ReceiptSystem } = loadGameModule();
  const { game, winner } = makeWinner(Game);
  ReceiptSystem.awardWin(game, winner);
  assert.equal(winner.receipts.length, 1);
  assert.equal(winner.receipts[0].status, 'active');
  assert.equal(winner.receipts[0].roundEarned, 1);
  assert.ok(winner.receipts[0].id.length > 0);
});

test('awardWin skips a new receipt once the winner holds 5 active receipts', () => {
  const { Game, ReceiptSystem, RECEIPT_POOL } = loadGameModule();
  const { game, winner } = makeWinner(Game);
  for (let i = 0; i < 5; i++) {
    winner.receipts.push({
      id: `seed-${i}`, poolId: RECEIPT_POOL[i].id,
      earnText: 'x', resolutionPrompt: 'x ____', roundEarned: 0, status: 'active'
    });
  }
  ReceiptSystem.awardWin(game, winner);
  assert.equal(winner.receipts.length, 5, 'no new receipt should be pushed at the cap');
  assert.equal(winner.stats.reputation, 1, 'the baseline reputation reward still applies at the cap');
});

test('awardWin avoids duplicate poolIds while an unheld option exists', () => {
  const { Game, ReceiptSystem, RECEIPT_POOL } = loadGameModule();
  const { game, winner } = makeWinner(Game);
  const heldIds = RECEIPT_POOL.slice(0, 4).map(e => e.id);
  heldIds.forEach((poolId, i) => {
    winner.receipts.push({ id: `seed-${i}`, poolId, earnText: 'x', resolutionPrompt: 'x ____', roundEarned: 0, status: 'active' });
  });
  ReceiptSystem.awardWin(game, winner);
  const newest = winner.receipts[winner.receipts.length - 1];
  assert.equal(newest.poolId, RECEIPT_POOL[4].id);
});
