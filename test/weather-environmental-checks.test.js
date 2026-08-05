const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGameModule } = require('./helpers/load-app.js');

test('Weather Environmental Checks: RAIN modifies dice rolls', () => {
  const { Game } = loadGameModule();
  const game = new Game();
  game.weatherMode = 'RAIN';
  game.currentBlack = { hasDice: true, prompt: "Roll: {}", raw: "Roll: {}", effect: { label: "Dice Roll", fx: s => s } };

  // Run many rolls to verify rain roll modification
  for (let i = 0; i < 20; i++) {
    game.currentBlack.effectRolled = false;
    game.rollDice();
    const roll = game.currentBlack.rollResult;
    // Under rain, rolls should be 2 to 6 (a roll of 1 gets bumped to 2)
    assert.ok(roll >= 2 && roll <= 6);
  }
});

test('Weather Environmental Checks: POLICE_SIRENS doubles reputation changes', () => {
  const { Game, AllianceSystem } = loadGameModule();
  
  // Test gambling bets under POLICE_SIRENS
  const game = new Game();
  game.weatherMode = 'POLICE_SIRENS';
  game.addPlayer('Alice');
  const alice = game.players[0];
  alice.stats.streetCred = 2;

  game.currentBlack = { hasDice: true, prompt: "Roll: {}", raw: "Roll: {}", effect: { label: "Dice Roll", fx: s => s } };
  game.placeBet('Alice', 'high');
  game.rollDice();

  // Winning or losing bet should result in double reputation change (+2 or -2)
  const roll = game.currentBlack.rollResult;
  if (roll >= 4) {
    assert.equal(alice.stats.reputation, 2); // Doubled from +1
  } else {
    assert.equal(alice.stats.reputation, -2); // Doubled from -1
  }

  // Test Alliance payouts under POLICE_SIRENS
  const coopGame = new Game();
  coopGame.weatherMode = 'POLICE_SIRENS';
  coopGame.addPlayer('Alice');
  coopGame.addPlayer('Bob');
  
  AllianceSystem.proposeAlliance(coopGame, 'Alice', 'Bob');
  // Resolve round normally (co-op)
  const result = AllianceSystem.resolveRound(coopGame, coopGame.players[0]);
  // Reputation reward should be +2 instead of +1
  assert.equal(coopGame.players[0].stats.reputation, 2);
  assert.equal(coopGame.players[1].stats.reputation, 2);
});

test('Weather Environmental Checks: NEON_FLICKER changes betting cost and payouts', () => {
  const { Game } = loadGameModule();
  const game = new Game();
  game.weatherMode = 'NEON_FLICKER';
  game.addPlayer('Alice');
  const alice = game.players[0];
  alice.stats.streetCred = 5;

  game.currentBlack = { hasDice: true, prompt: "Roll: {}", raw: "Roll: {}", effect: { label: "Dice Roll", fx: s => s } };
  // Bet under NEON_FLICKER should cost 2 Street Cred
  const success = game.placeBet('Alice', 'high');
  assert.equal(success, true);
  assert.equal(alice.stats.streetCred, 3); // 5 - 2

  game.rollDice();
  const roll = game.currentBlack.rollResult;
  if (roll >= 4) {
    assert.equal(alice.stats.streetCred, 7); // 3 + 4 payout
  } else {
    assert.equal(alice.stats.streetCred, 3); // Loss
  }
});
