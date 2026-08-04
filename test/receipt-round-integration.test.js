const test = require('node:test');
const assert = require('node:assert');
const { loadGameModule } = require('./helpers/load-app');

test('resolving a receipt frees a cap slot for a new receipt in the same round (resolveTrigger before awardWin)', () => {
  const { Game, ReceiptSystem, RECEIPT_POOL } = loadGameModule();
  const game = new Game();
  game.addPlayer('Judge');
  game.addPlayer('Owner');
  game.judgeIndex = 0;
  game.round = 2;
  const owner = game.players[1];
  owner.receipts.push({ id: 'r1', poolId: RECEIPT_POOL[0].id, earnText: 'x', resolutionPrompt: 'Owner ____', roundEarned: 1, status: 'active' });
  for (let i = 1; i < 5; i++) {
    owner.receipts.push({
      id: `seed-${i}`, poolId: RECEIPT_POOL[i].id,
      earnText: 'x', resolutionPrompt: 'x ____', roundEarned: 1, status: 'active'
    });
  }
  assert.equal(owner.receipts.filter(r => r.status === 'active').length, 5);
  game.currentBlack = {
    raw: 'Owner ____', prompt: 'Owner ____', hasDice: false, effect: null,
    receiptTrigger: { receiptId: 'r1', ownerName: 'Owner', resolutionPrompt: 'Owner ____' }
  };

  ReceiptSystem.resolveTrigger(game, owner);
  ReceiptSystem.awardWin(game, owner);

  const active = owner.receipts.filter(r => r.status === 'active');
  assert.equal(active.length, 5, 'the resolved slot should have been immediately refilled by the same-round awardWin');
  assert.equal(owner.stats.reputation, 3, 'baseline +1 from awardWin plus +2 from resolving');
});
