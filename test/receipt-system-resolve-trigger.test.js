const test = require('node:test');
const assert = require('node:assert');
const { loadGameModule } = require('./helpers/load-app');

function makeTriggeredGame(Game) {
  const game = new Game();
  game.addPlayer('Judge');
  game.addPlayer('Owner');
  game.addPlayer('Other');
  game.judgeIndex = 0;
  game.round = 2;
  const owner = game.players[1];
  owner.receipts.push({ id: 'r1', poolId: 'cousin-bail', earnText: 'x', resolutionPrompt: 'Owner ____', roundEarned: 1, status: 'active' });
  game.currentBlack = {
    raw: 'Owner ____', prompt: 'Owner ____', hasDice: false, effect: null,
    receiptTrigger: { receiptId: 'r1', ownerName: 'Owner', resolutionPrompt: 'Owner ____' }
  };
  return game;
}

test('resolveTrigger is a no-op when the round had no receipt trigger', () => {
  const { Game, ReceiptSystem } = loadGameModule();
  const game = new Game();
  game.addPlayer('Judge');
  game.addPlayer('Alice');
  game.judgeIndex = 0;
  game.currentBlack = { raw: 'x', prompt: 'x', hasDice: false, effect: null };
  const winner = game.players[1];
  ReceiptSystem.resolveTrigger(game, winner);
  assert.deepEqual(winner.stats, { streetCred: 0, community: 0, wisdom: 0, reputation: 0 });
});

test('resolveTrigger resolves the receipt and rewards owner + O.G. when the owner wins', () => {
  const { Game, ReceiptSystem } = loadGameModule();
  const game = makeTriggeredGame(Game);
  const owner = game.players[1];
  const judge = game.players[0];
  ReceiptSystem.resolveTrigger(game, owner);
  assert.equal(owner.receipts[0].status, 'resolved');
  assert.equal(owner.stats.reputation, 2);
  assert.equal(judge.stats.reputation, 1);
});

test('resolveTrigger fails the receipt and penalizes the owner when someone else wins', () => {
  const { Game, ReceiptSystem } = loadGameModule();
  const game = makeTriggeredGame(Game);
  const owner = game.players[1];
  const other = game.players[2];
  const judge = game.players[0];
  ReceiptSystem.resolveTrigger(game, other);
  assert.equal(owner.receipts[0].status, 'failed');
  assert.deepEqual(owner.stats, { streetCred: -1, community: -1, wisdom: -1, reputation: -1 });
  assert.equal(judge.stats.reputation, 0);
  assert.deepEqual(other.stats, { streetCred: 0, community: 0, wisdom: 0, reputation: 0 });
});
