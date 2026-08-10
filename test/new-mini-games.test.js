const test = require('node:test');
const assert = require('node:assert/strict');
const { FreestyleCipher } = require('../src/pixel_engine/mini-games/games/freestyle-cipher.js');
const { DissTrackShowdown } = require('../src/pixel_engine/mini-games/games/diss-track-showdown.js');
const { PackageRun } = require('../src/pixel_engine/mini-games/games/package-run.js');

test('FreestyleCipher: advances 3 rounds and calculates crowd heat', () => {
  const cipher = new FreestyleCipher();
  cipher.start();
  assert.equal(cipher.round, 1);

  cipher.handleInput('confirm');
  cipher.handleInput('confirm');
  cipher.handleInput('confirm');

  assert.equal(cipher.isFinished, true);
  assert.equal(cipher.state, 'complete');
});

test('DissTrackShowdown: selects punchline and updates rep and heat', () => {
  const diss = new DissTrackShowdown();
  diss.start();
  diss.selectPunchline(0);

  assert.equal(diss.victory, true);
  assert.equal(diss.isFinished, true);
  assert.equal(diss.resultNarrative.includes('HAIRLINE MEME'), true);
});

test('PackageRun: navigates routes and delivers package on distance 100', () => {
  const pkg = new PackageRun();
  pkg.start();

  pkg.handleInput('right'); // +40
  pkg.handleInput('right'); // +40
  pkg.handleInput('left');  // +25 -> 105%

  assert.equal(pkg.victory, true);
  assert.equal(pkg.isFinished, true);
});
