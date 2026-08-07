const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGameModule } = require('./helpers/load-app.js');

test('NPC Scene: interaction availability is determined by player stats', () => {
  const { app, Game } = loadGameModule();
  app.game = new Game();
  app.game.addPlayer('Player');
  app.humanIndex = 0;
  
  const me = app.game.players[0];
  me.stats = { reputation: 1, streetCred: 5 };

  // Ray requires Reputation 2+ to unlock Quest interaction
  assert.equal(app.isNpcInteractionUnlocked('ray', 'Quest'), false, 'Quest should be locked for Rep < 2');
  
  me.stats.reputation = 3;
  assert.equal(app.isNpcInteractionUnlocked('ray', 'Quest'), true, 'Quest should be unlocked for Rep >= 2');
});

test('NPC Scene: state indicator colors and labels map to NPC mood', () => {
  const { app } = loadGameModule();
  
  const friendly = app.getNpcMoodUI('friendly');
  assert.equal(friendly.color, '#47e589');
  assert.equal(friendly.label, 'FRIENDLY');

  const hostile = app.getNpcMoodUI('hostile');
  assert.equal(hostile.color, '#f25438');
  assert.equal(hostile.label, 'HOSTILE');
});
