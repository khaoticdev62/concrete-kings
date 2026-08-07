const test = require('node:test');
const assert = require('node:assert/strict');
const { NarrativeStoryEngine } = require('../src/pixel_engine/story-engine.js');

test('Story Engine: history array records every resolved beat for the Review Log', () => {
  const engine = new NarrativeStoryEngine();
  engine.reset('BARBER');
  engine.applyWinnerCard("A stolen police scanner buzzing with codes");
  engine.applyWinnerCard("Your cousin's neighborhood security warning");

  assert.equal(engine.history.length, 2);
  assert.equal(engine.history[0].beat, 1);
  assert.equal(engine.history[0].card, "A stolen police scanner buzzing with codes");
  assert.equal(typeof engine.history[0].consequenceText, 'string');
  assert.equal(engine.history[1].beat, 2);
});
