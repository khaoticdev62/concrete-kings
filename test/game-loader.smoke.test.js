const test = require('node:test');
const assert = require('node:assert');
const { loadGameModule } = require('./helpers/load-app');

test('Deck.draw cycles through every item before reshuffling', () => {
  const { Deck } = loadGameModule();
  const deck = new Deck([1, 2, 3]);
  const drawn = [deck.draw(), deck.draw(), deck.draw()];
  assert.deepEqual(drawn.slice().sort(), [1, 2, 3]);
});

test('Game.addPlayer adds a player with an empty hand and zero points', () => {
  const { Game } = loadGameModule();
  const game = new Game();
  game.addPlayer('Alice');
  assert.equal(game.players.length, 1);
  assert.equal(game.players[0].name, 'Alice');
  assert.deepEqual(game.players[0].hand, []);
  assert.equal(game.players[0].points, 0);
});
