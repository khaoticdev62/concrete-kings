const test = require('node:test');
const assert = require('node:assert');
const { loadGameModule } = require('./helpers/load-app');

function withMockedRandom(value, fn) {
  const original = Math.random;
  Math.random = () => value;
  try { fn(); } finally { Math.random = original; }
}

function makeGameWithJudge(Game) {
  const game = new Game();
  game.addPlayer('Judge');
  game.addPlayer('Alice');
  game.addPlayer('Bob');
  game.judgeIndex = 0; // Judge is the O.G. this round
  game.round = 1;
  return game;
}

test('maybeTriggerReceipt returns null when no player has an active receipt', () => {
  const { Game, ReceiptSystem } = loadGameModule();
  const game = makeGameWithJudge(Game);
  withMockedRandom(0, () => {
    assert.equal(ReceiptSystem.maybeTriggerReceipt(game), null);
  });
});

test('maybeTriggerReceipt ignores an active receipt owned by the current O.G.', () => {
  const { Game, ReceiptSystem } = loadGameModule();
  const game = makeGameWithJudge(Game);
  const judge = game.players[0];
  judge.receipts.push({ id: 'r1', poolId: 'cousin-bail', earnText: 'x', resolutionPrompt: 'x ____', roundEarned: 0, status: 'active' });
  withMockedRandom(0, () => {
    assert.equal(ReceiptSystem.maybeTriggerReceipt(game), null);
  });
});

test('maybeTriggerReceipt returns a trigger for an eligible receipt on a hit', () => {
  const { Game, ReceiptSystem } = loadGameModule();
  const game = makeGameWithJudge(Game);
  const alice = game.players[1];
  alice.receipts.push({ id: 'r1', poolId: 'cousin-bail', earnText: 'x', resolutionPrompt: 'Alice ____', roundEarned: 0, status: 'active' });
  withMockedRandom(0, () => {
    const trigger = ReceiptSystem.maybeTriggerReceipt(game);
    assert.deepEqual(trigger, { receiptId: 'r1', ownerName: 'Alice', resolutionPrompt: 'Alice ____' });
  });
});

test('maybeTriggerReceipt returns null on a miss even with an eligible receipt', () => {
  const { Game, ReceiptSystem } = loadGameModule();
  const game = makeGameWithJudge(Game);
  const alice = game.players[1];
  alice.receipts.push({ id: 'r1', poolId: 'cousin-bail', earnText: 'x', resolutionPrompt: 'Alice ____', roundEarned: 0, status: 'active' });
  withMockedRandom(0.99, () => {
    assert.equal(ReceiptSystem.maybeTriggerReceipt(game), null);
  });
});

test('maybeTriggerReceipt ignores resolved and failed receipts', () => {
  const { Game, ReceiptSystem } = loadGameModule();
  const game = makeGameWithJudge(Game);
  const alice = game.players[1];
  alice.receipts.push({ id: 'r1', poolId: 'cousin-bail', earnText: 'x', resolutionPrompt: 'x ____', roundEarned: 0, status: 'resolved' });
  alice.receipts.push({ id: 'r2', poolId: 'auntie-joke', earnText: 'x', resolutionPrompt: 'x ____', roundEarned: 0, status: 'failed' });
  withMockedRandom(0, () => {
    assert.equal(ReceiptSystem.maybeTriggerReceipt(game), null);
  });
});
