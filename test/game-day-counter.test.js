const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGameModule } = require('./helpers/load-app.js');

test('Game: day starts at 1 and increments every 3rd round', () => {
  const { Game } = loadGameModule();
  const game = new Game();
  assert.equal(game.day, 1);

  game.advanceJudge(); // round 1
  assert.equal(game.day, 1);
  game.advanceJudge(); // round 2
  assert.equal(game.day, 1);
  game.advanceJudge(); // round 3
  assert.equal(game.day, 2);
  game.advanceJudge(); // round 4
  assert.equal(game.day, 2);
  game.advanceJudge(); // round 5
  assert.equal(game.day, 2);
  game.advanceJudge(); // round 6
  assert.equal(game.day, 3);
});
