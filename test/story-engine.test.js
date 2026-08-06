const test = require('node:test');
const assert = require('node:assert/strict');
const { NarrativeStoryEngine, NARRATIVE_BEATS, ENDINGS } = require('../src/pixel_engine/story-engine.js');

test('Story Engine: initializes with correct defaults', () => {
  const engine = new NarrativeStoryEngine();
  assert.equal(engine.beat, 1);
  assert.equal(engine.heat, 0);
  assert.equal(engine.trust, 0);
  assert.equal(engine.active, false);
});

test('Story Engine: reset activates engine and defaults stats', () => {
  const engine = new NarrativeStoryEngine();
  engine.heat = 5;
  engine.trust = 3;
  engine.beat = 3;
  
  engine.reset();
  assert.equal(engine.beat, 1);
  assert.equal(engine.heat, 0);
  assert.equal(engine.trust, 0);
  assert.equal(engine.active, true);
});

test('Story Engine: tags consequences drive branching variables', () => {
  const engine = new NarrativeStoryEngine();
  engine.reset();
  
  // Beat 1: Glock card (street tag) -> +1 Heat
  let result = engine.applyWinnerCard("A Glock 19 with the serial scratched off");
  assert.equal(engine.beat, 2);
  assert.equal(engine.heat, 1);
  assert.equal(engine.trust, 0);
  assert.equal(result.ended, false);
  
  // Beat 2: Grandma's recipe card (family tag) -> +1 Trust
  result = engine.applyWinnerCard("Grandma's secret sweet potato pie recipe");
  assert.equal(engine.beat, 3);
  assert.equal(engine.heat, 1);
  assert.equal(engine.trust, 1);
});

test('Story Engine: ending triggers based on threshold (The Trap Ending)', () => {
  const engine = new NarrativeStoryEngine();
  engine.reset();
  
  // Play 5 street cards to trigger The Trap ending
  engine.applyWinnerCard("A Glock 19 with the serial scratched off"); // Beat 1 (+1 Heat)
  engine.applyWinnerCard("A Glock 19 with the serial scratched off"); // Beat 2 (+1 Heat)
  engine.applyWinnerCard("A Glock 19 with the serial scratched off"); // Beat 3 (+2 Heat -> 4 Heat total)
  engine.applyWinnerCard("A Glock 19 with the serial scratched off"); // Beat 4 (+1 Heat -> 5 Heat total)
  const result = engine.applyWinnerCard("A Glock 19 with the serial scratched off"); // Beat 5 (+2 Heat -> 7 Heat total)
  
  assert.equal(result.ended, true);
  assert.equal(result.endingTitle, "THE TRAP");
  assert.ok(result.endingText.includes("cuffs click cold"));
  assert.equal(engine.active, false);
});

test('Story Engine: ending triggers based on threshold (The Exit Ending)', () => {
  const engine = new NarrativeStoryEngine();
  engine.reset();
  
  // Play 5 family/church cards to trigger The Exit ending
  engine.applyWinnerCard("Grandma's secret sweet potato pie recipe"); // Beat 1 (+1 Trust)
  engine.applyWinnerCard("Grandma's secret sweet potato pie recipe"); // Beat 2 (+1 Trust -> 2 Trust)
  engine.applyWinnerCard("Grandma's secret sweet potato pie recipe"); // Beat 3 (+1 Trust -> 3 Trust)
  engine.applyWinnerCard("Grandma's secret sweet potato pie recipe"); // Beat 4 (+2 Trust -> 5 Trust)
  const result = engine.applyWinnerCard("Grandma's secret sweet potato pie recipe"); // Beat 5 (+1 Trust -> 6 Trust)
  
  assert.equal(result.ended, true);
  assert.equal(result.endingTitle, "THE EXIT");
  assert.ok(result.endingText.includes("out clean"));
  assert.equal(engine.active, false);
});
