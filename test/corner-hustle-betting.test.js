const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGameModule } = require('./helpers/load-app.js');

test('Corner Hustle Betting: placeBet deducts 1 street cred and records prediction', () => {
  const { Game } = loadGameModule();
  const game = new Game();
  game.addPlayer('Alice');
  const alice = game.players[0];
  alice.stats.streetCred = 2;
  game.currentBlack = { hasDice: true, prompt: "Roll: {}", raw: "Roll: {}", effect: { label: "Dice Roll", fx: s => s } };

  const success = game.placeBet('Alice', 'high');
  assert.equal(success, true);
  assert.equal(alice.stats.streetCred, 1);
  assert.equal(game.bets['Alice'], 'high');
});

test('Corner Hustle Betting: placeBet fails if player lacks street cred', () => {
  const { Game } = loadGameModule();
  const game = new Game();
  game.addPlayer('Alice');
  const alice = game.players[0];
  alice.stats.streetCred = 0;
  game.currentBlack = { hasDice: true, prompt: "Roll: {}", raw: "Roll: {}", effect: { label: "Dice Roll", fx: s => s } };

  const success = game.placeBet('Alice', 'high');
  assert.equal(success, false);
  assert.equal(game.bets['Alice'], undefined);
});

test('Corner Hustle Betting: rollDice resolves bets and updates stats', () => {
  const { Game } = loadGameModule();
  const game = new Game();
  game.addPlayer('Alice');
  game.addPlayer('Bob');
  
  const alice = game.players[0];
  const bob = game.players[1];
  
  alice.stats.streetCred = 1;
  bob.stats.streetCred = 1;

  // Set active black card with dice first
  game.currentBlack = { hasDice: true, prompt: "Roll: {}", raw: "Roll: {}", effect: { label: "Dice Roll", fx: s => s } };

  // Make Alice bet high, Bob bet low
  game.placeBet('Alice', 'high');
  game.placeBet('Bob', 'low');

  // Set active black card with dice
  game.currentBlack = { hasDice: true, prompt: "Roll: {}", raw: "Roll: {}", effect: { label: "Dice Roll", fx: s => s } };

  // Trigger rollDice
  game.rollDice();

  // Validate one won and one lost
  const roll = game.currentBlack.rollResult;
  assert.ok(roll >= 1 && roll <= 6);

  if (roll >= 4) {
    // Alice won, Bob lost
    assert.equal(alice.stats.streetCred, 2); // 0 + 2
    assert.equal(alice.stats.reputation, 1);
    assert.equal(bob.stats.streetCred, 0); // 0 + 0
    assert.equal(bob.stats.reputation, -1);
  } else {
    // Bob won, Alice lost
    assert.equal(bob.stats.streetCred, 2);
    assert.equal(bob.stats.reputation, 1);
    assert.equal(alice.stats.streetCred, 0);
    assert.equal(alice.stats.reputation, -1);
  }
});
