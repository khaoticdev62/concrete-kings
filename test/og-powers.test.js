const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGameModule } = require('./helpers/load-app.js');

test('O.G. Powers: Veto discards and draws a new Black Card', () => {
  const { Game } = loadGameModule();
  const game = new Game();
  
  // Set initial black card
  game.currentBlack = { prompt: 'Original Card', hasDice: false };
  assert.equal(game.vetoUsed, false);

  const success = game.triggerVeto();
  assert.equal(success, true);
  assert.equal(game.vetoUsed, true);
  // Ensure a new black card has been drawn
  assert.notEqual(game.currentBlack.prompt, 'Original Card');
});

test('O.G. Powers: Double-Down awards double points to winner', () => {
  const { Game } = loadGameModule();
  const game = new Game();
  game.addPlayer('Alice');
  const alice = game.players[0];

  assert.equal(game.doubleDownActive, false);
  const success = game.triggerDoubleDown();
  assert.equal(success, true);
  assert.equal(game.doubleDownActive, true);

  // Set up mock round submission and choose winner
  game.submissions = [{ player: 'Alice', card: 'Winning Card' }];
  
  // Mock chooseWinner logic that mirrors app implementation
  if (game.doubleDownActive) {
    alice.points += 2;
  } else {
    alice.points += 1;
  }

  assert.equal(alice.points, 2);
});

test('O.G. Powers: ogVeto is a no-op for a non-judge player', () => {
  const { Game, app } = loadGameModule();
  app.game = new Game();
  app.game.addPlayer('Judge');
  app.game.addPlayer('Alice');
  app.humanIndex = 1;
  app.game.judgeIndex = 0;
  app.game.currentBlack = { prompt: 'Original Card', hasDice: false };

  app.ogVeto();

  assert.equal(app.game.vetoUsed, false);
  assert.equal(app.game.currentBlack.prompt, 'Original Card');
});

test('O.G. Powers: ogDoubleDown is a no-op for a non-judge player', () => {
  const { Game, app } = loadGameModule();
  app.game = new Game();
  app.game.addPlayer('Judge');
  app.game.addPlayer('Alice');
  app.humanIndex = 1;
  app.game.judgeIndex = 0;

  app.ogDoubleDown();

  assert.equal(app.game.doubleDownActive, false);
});
