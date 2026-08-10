const test = require('node:test');
const assert = require('node:assert/strict');
const { GraffitiTagging } = require('../src/pixel_engine/mini-games/games/graffiti-tagging.js');
const { DJBattle } = require('../src/pixel_engine/mini-games/games/dj-battle.js');
const { PoliceInterrogation } = require('../src/pixel_engine/mini-games/games/police-interrogation.js');

test('GraffitiTagging: handles WILDSTYLE and BLOCKBUSTER choices', () => {
  const g = new GraffitiTagging();
  g.start();
  g.chooseStyle('WILDSTYLE');
  assert.equal(g.victory, true);
  assert.equal(g.resultNarrative.includes('Wildstyle burner finished'), true);
});

test('DJBattle: handles SCRATCH and TRANSFORM routines', () => {
  const g = new DJBattle();
  g.start();
  g.chooseMove('SCRATCH');
  assert.equal(g.victory, true);
  assert.equal(g.resultNarrative.includes('Beat juggle executed'), true);
});

test('PoliceInterrogation: handles ALIBI and RECEIPT tactics', () => {
  const g = new PoliceInterrogation();
  g.start();
  g.chooseTactic('RECEIPT');
  assert.equal(g.victory, true);
  assert.equal(g.resultNarrative.includes('Secret receipt exposed'), true);
});
