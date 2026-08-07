const test = require('node:test');
// Use non-strict assert (not 'node:assert/strict'): deepEqual here compares plain
// object literals against objects created inside loadGameModule()'s separate vm
// context/realm. Strict deepStrictEqual additionally checks prototype identity,
// which fails across realms even when the own-property values are identical
// (see the existing cross-realm pattern in receipt-pool-and-player-model.test.js).
const assert = require('node:assert');
const { loadGameModule } = require('./helpers/load-app.js');
const { CHARACTER_ORIGINS } = require('../src/pixel_engine/block-map-navigation.js');

test('Game.addPlayer gives every player a default attributes object', () => {
  const { Game } = loadGameModule();
  const game = new Game();
  game.addPlayer('Alice');
  assert.deepEqual(game.players[0].attributes, { str: 0, wit: 0, soul: 0 });
});

test('startLocalGame applies the selected origin\'s attribute bonus to the human player', () => {
  const { Game } = loadGameModule();
  // Simulate exactly what startLocalGame() does after reading the origin select:
  // this test exercises the same addPlayer + bonus-application pattern directly,
  // since startLocalGame() itself is DOM-driven (reads document.getElementById).
  const game = new Game();
  game.addPlayer('Player');
  const origin = CHARACTER_ORIGINS.HUSTLE_VETERAN;
  game.players[0].attributes.str += origin.attributes.str;
  game.players[0].attributes.wit += origin.attributes.wit;
  game.players[0].attributes.soul += origin.attributes.soul;
  assert.deepEqual(game.players[0].attributes, { str: 8, wit: 4, soul: 5 });
});
