const test = require('node:test');
const assert = require('node:assert/strict');
const { NarrativeStoryEngine, NARRATIVE_BEATS, ENDINGS, ORIGIN_TAG_AFFINITY } = require('../src/pixel_engine/story-engine.js');

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

test('Story Engine: exposes an origin-to-tag affinity table for all 8 origins', () => {
  assert.deepEqual(ORIGIN_TAG_AFFINITY, {
    BARBER: 'family',
    STREET_SCHOLAR: 'church',
    LOCAL_LEGEND: 'street',
    CORNER_MERCHANT: 'food',
    COMMUNITY_ORGANIZER: 'family',
    UNDERGROUND_DJ: 'humor',
    BLOCK_ARCHITECT: 'church',
    HUSTLE_VETERAN: 'street',
  });
});

test('Story Engine: reset() with no origin keeps existing zero-arg behavior', () => {
  const engine = new NarrativeStoryEngine();
  engine.reset();
  assert.equal(engine.origin, null);
});

test('Story Engine: origin bonus reduces heat and boosts trust when winning tag matches affinity', () => {
  const engine = new NarrativeStoryEngine();
  engine.reset('LOCAL_LEGEND'); // ORIGIN_TAG_AFFINITY.LOCAL_LEGEND === 'street'
  // Beat 1 street card base consequence: heat +1, trust +0
  const result = engine.applyWinnerCard("A Glock 19 with the serial scratched off");
  assert.equal(engine.heat, 0, 'bonus should reduce the +1 base heat down to 0');
  assert.equal(engine.trust, 1, 'bonus should add +1 on top of the +0 base trust');
  assert.equal(result.ended, false);
});

test('Story Engine: origin bonus does not apply when winning tag does not match affinity', () => {
  const engine = new NarrativeStoryEngine();
  engine.reset('BARBER'); // ORIGIN_TAG_AFFINITY.BARBER === 'family'
  // Beat 1 street card base consequence: heat +1, trust +0 (BARBER favors family, not street)
  const result = engine.applyWinnerCard("A Glock 19 with the serial scratched off");
  assert.equal(engine.heat, 1, 'no bonus: heat should equal the base +1');
  assert.equal(engine.trust, 0, 'no bonus: trust should equal the base +0');
  assert.equal(result.ended, false);
});

test('Story Engine: markAbilityUsed succeeds once then reports already used', () => {
  const engine = new NarrativeStoryEngine();
  engine.reset();
  assert.equal(engine.specialAbilityUsed, false);
  assert.equal(engine.markAbilityUsed(), true);
  assert.equal(engine.specialAbilityUsed, true);
  assert.equal(engine.markAbilityUsed(), false, 'second call must fail, ability already used');
  assert.equal(engine.specialAbilityUsed, true, 'state must stay used after the failed second call');
});

test('Story Engine: winning a secret-flagged card records it without duplicates', () => {
  const engine = new NarrativeStoryEngine();
  engine.reset();
  engine.applyWinnerCard("A stolen police scanner buzzing with codes");
  assert.deepEqual(engine.secrets, ["A stolen police scanner buzzing with codes"]);
  engine.applyWinnerCard("A stolen police scanner buzzing with codes");
  assert.deepEqual(engine.secrets, ["A stolen police scanner buzzing with codes"], 'duplicate secret must not be recorded twice');
});

test('Story Engine: 2+ secrets unlock The Insider ending even with high heat', () => {
  const engine = new NarrativeStoryEngine();
  engine.reset();

  // Beats 1-2: earn two distinct secrets
  engine.applyWinnerCard("A stolen police scanner buzzing with codes"); // street secret
  engine.applyWinnerCard("Your cousin's neighborhood security warning"); // family secret

  // Beats 3-5: pile on heat via street cards, which alone would trigger The Trap ending
  engine.applyWinnerCard("A Glock 19 with the serial scratched off");
  engine.applyWinnerCard("A Glock 19 with the serial scratched off");
  const result = engine.applyWinnerCard("A Glock 19 with the serial scratched off");

  assert.equal(engine.secrets.length, 2);
  assert.equal(result.ended, true);
  assert.equal(result.endingTitle, "THE INSIDER");
  assert.ok(result.endingText.includes("secrets"));
});
