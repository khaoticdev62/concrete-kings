const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGameModule } = require('./helpers/load-app.js');

test('Alliance System: proposeAlliance creates active alliance in game state', () => {
  const { Game, AllianceSystem } = loadGameModule();
  const game = new Game();
  game.addPlayer('Alice');
  game.addPlayer('Bob');
  game.addPlayer('Charlie');

  const alliance = AllianceSystem.proposeAlliance(game, 'Alice', 'Bob');
  assert.equal(alliance.proposer, 'Alice');
  assert.equal(alliance.target, 'Bob');
  assert.equal(alliance.status, 'active');
  assert.equal(game.currentAlliance.status, 'active');
});

test('Alliance System: resolveRound awards co-op payouts when an alliance member wins normally', () => {
  const { Game, AllianceSystem } = loadGameModule();
  const game = new Game();
  game.addPlayer('Alice');
  game.addPlayer('Bob');
  game.addPlayer('Charlie');

  AllianceSystem.proposeAlliance(game, 'Alice', 'Bob');
  game.submissions = [
    { player: 'Alice', card: 'Solid community BBQ platter' }
  ];

  const alice = game.players[0];
  const res = AllianceSystem.resolveRound(game, alice);

  assert.equal(res.status, 'coop_success');
  assert.equal(alice.stats.streetCred, 1);
  assert.equal(game.players[1].stats.streetCred, 1); // Bob gets +1
  assert.equal(game.currentAlliance, null); // Cleared after round
});

test('Alliance System: resolveRound triggers betrayal when winner plays a Snake Card', () => {
  const { Game, AllianceSystem } = loadGameModule();
  const game = new Game();
  game.addPlayer('Alice');
  game.addPlayer('Bob');
  game.addPlayer('Charlie');

  AllianceSystem.proposeAlliance(game, 'Alice', 'Bob');
  game.submissions = [
    { player: 'Alice', card: 'Calling police on your own partner like a snake' }
  ];

  const alice = game.players[0];
  const res = AllianceSystem.resolveRound(game, alice);

  assert.equal(res.status, 'betrayed');
  assert.equal(res.snakePlayer, 'Alice');
  assert.equal(res.victimPlayer, 'Bob');
  assert.equal(alice.stats.reputation, 2);
  assert.equal(game.players[1].stats.reputation, -2); // Bob penalized
});
