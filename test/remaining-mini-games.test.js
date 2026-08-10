const test = require('node:test');
const assert = require('node:assert/strict');
const { SampleClearance } = require('../src/pixel_engine/mini-games/games/sample-clearance.js');
const { StashHouse } = require('../src/pixel_engine/mini-games/games/stash-house.js');
const { StudioSession } = require('../src/pixel_engine/mini-games/games/studio-session.js');
const { BlockTerritory } = require('../src/pixel_engine/mini-games/games/block-territory.js');
const { FuneralEulogy } = require('../src/pixel_engine/mini-games/games/funeral-eulogy.js');

test('SampleClearance: processes CLEAR, ALTER, and RISK choices', () => {
  const g = new SampleClearance();
  g.start();
  g.chooseOption('CLEAR');
  assert.equal(g.victory, true);
  assert.equal(g.resultNarrative.includes('Sample cleared legally'), true);
});

test('StashHouse: processes RELOCATE vs BURN choices', () => {
  const g = new StashHouse();
  g.start();
  g.chooseOption('RELOCATE');
  assert.equal(g.victory, true);
  assert.equal(g.resultNarrative.includes('Stash moved across town'), true);
});

test('StudioSession: processes BASS, AUTOTUNE, and DISS choices', () => {
  const g = new StudioSession();
  g.start();
  g.chooseOption('AUTOTUNE');
  assert.equal(g.victory, true);
  assert.equal(g.resultNarrative.includes('Radio-ready melodic hit'), true);
});

test('BlockTerritory: secures territory nodes', () => {
  const g = new BlockTerritory();
  g.start();
  g.chooseNode('BOOTLEG');
  assert.equal(g.victory, true);
  assert.equal(g.resultNarrative.includes('Uncle Panther 4K'), true);
});

test('FuneralEulogy: delivers street vs church eulogy', () => {
  const g = new FuneralEulogy();
  g.start();
  g.chooseOption('CHURCH');
  assert.equal(g.victory, true);
  assert.equal(g.resultNarrative.includes('Solemn church eulogy'), true);
});
