const test = require('node:test');
const assert = require('node:assert');
const { loadGameModule } = require('./helpers/load-app');

function withMockedRandom(value, fn) {
  const original = Math.random;
  Math.random = () => value;
  try { fn(); } finally { Math.random = original; }
}

test('nextBlack uses the receipt resolution prompt and skips the dice roll when a receipt triggers', () => {
  const { Game } = loadGameModule();
  const game = new Game();
  game.addPlayer('Judge');
  game.addPlayer('Alice');
  game.judgeIndex = 0;
  game.round = 1;
  game.players[1].receipts.push({ id: 'r1', poolId: 'cousin-bail', earnText: 'x', resolutionPrompt: 'Alice ____', roundEarned: 0, status: 'active' });
  withMockedRandom(0, () => {
    game.nextBlack();
  });
  assert.equal(game.currentBlack.prompt, 'Alice ____');
  assert.equal(game.currentBlack.raw, 'Alice ____');
  assert.equal(game.currentBlack.hasDice, false);
  assert.deepEqual(game.currentBlack.receiptTrigger, { receiptId: 'r1', ownerName: 'Alice', resolutionPrompt: 'Alice ____' });
});

test('nextBlack draws a normal black card when no receipt triggers', () => {
  const { Game, BLACK_CARDS } = loadGameModule();
  const game = new Game();
  game.addPlayer('Judge');
  game.addPlayer('Alice');
  game.judgeIndex = 0;
  game.round = 1;
  withMockedRandom(0.99, () => {
    game.nextBlack();
  });
  assert.equal(game.currentBlack.receiptTrigger, undefined);
  assert.ok(BLACK_CARDS.includes(game.currentBlack.raw));
});
