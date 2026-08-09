const test = require('node:test');
const assert = require('node:assert/strict');

const { ScenarioUIEngine, SLOT_TYPES, RECOMMENDATION_TAGS } = require('../src/pixel_engine/scenario-ui-engine.js');
const { AIPersonalityEngine, AI_PROFILES } = require('../src/pixel_engine/ai-personality-engine.js');
const { StagedRevealEngine, REVEAL_STAGES } = require('../src/pixel_engine/staged-reveal-engine.js');
const { ChronicleCanonEngine } = require('../src/pixel_engine/chronicle-canon-engine.js');
const { ControllerFocusGraph } = require('../src/pixel_engine/controller-focus-graph.js');
const { UIScalingEngine, UI_PROFILES } = require('../src/pixel_engine/ui-scaling-engine.js');

function mockStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem(k) { return store.has(k) ? store.get(k) : null; },
    setItem(k, v) { store.set(k, String(v)); },
    removeItem(k) { store.delete(k); },
    clear() { store.clear(); }
  };
}

test('ScenarioUIEngine: manages 4 slots, card recommendations, and lock-in state', () => {
  const engine = new ScenarioUIEngine({ title: 'THE MAYOR PROBLEM' });

  assert.equal(engine.getCompletionStatus().filled, 0);
  assert.equal(engine.getCompletionStatus().isComplete, false);

  const card1 = { title: 'Master Barber Ray', text: 'barber chair' };
  const card2 = { title: 'Demand Money', text: 'give me cash' };
  const card3 = { title: 'Bribe Guard', text: 'bribe security' };
  const card4 = { title: 'Wild Chase', text: 'wild escape' };

  const res1 = engine.assignCardToSlot(SLOT_TYPES.WHO, card1);
  assert.equal(res1.success, true);
  assert.equal(res1.recommendation.label, RECOMMENDATION_TAGS.STRONG_MATCH.label);

  engine.assignCardToSlot(SLOT_TYPES.WHAT, card2);
  engine.assignCardToSlot(SLOT_TYPES.HOW, card3);
  engine.assignCardToSlot(SLOT_TYPES.TWIST, card4);

  assert.equal(engine.getCompletionStatus().isComplete, true);

  const lockRes = engine.lockIn();
  assert.equal(lockRes.success, true);
  assert.equal(engine.isLocked, true);
});

test('AIPersonalityEngine: simulates character-specific decision delays and status cues', async () => {
  const aiEngine = new AIPersonalityEngine();
  const cardPool = [{ title: 'Card A' }, { title: 'Card B' }];

  const stateBefore = aiEngine.getCharacterState('TASHA');
  assert.equal(stateBefore.status, 'IDLE');

  const promise = aiEngine.simulateDecision('TASHA', cardPool);
  assert.equal(aiEngine.getCharacterState('TASHA').status, 'THINKING');

  const result = await promise;
  assert.equal(result.status, 'SUBMITTED');
  assert.equal(result.characterId, 'TASHA');
});

test('StagedRevealEngine: advances through reveal beats and supports skip', () => {
  let lastStage = null;
  const reveal = new StagedRevealEngine({
    onStageChange: (info) => { lastStage = info.stage.id; }
  });

  reveal.startReveal({ title: 'TEST SCENARIO' });
  assert.equal(lastStage, 'TITLE');

  reveal.skip();
  assert.equal(lastStage, 'COMPLETE');
  assert.equal(reveal.isPlaying, false);
});

test('ChronicleCanonEngine: records canon events and chronicle timeline', () => {
  const storage = mockStorage();
  const chronicle = new ChronicleCanonEngine({ storage });

  const canon = chronicle.addCanonEvent("The Mayor's Betrayal", 'Mayor declared war on party', 3, 'HARLEM');
  assert.equal(canon.isCanon, true);
  assert.equal(chronicle.getCanonEvents().length, 1);

  const timeline = chronicle.getChronicleByDay();
  assert.ok(timeline[3]);
  assert.equal(timeline[3].length, 1);
});

test('ControllerFocusGraph: spatial navigation and focus memory stack', () => {
  const graph = new ControllerFocusGraph();

  const mockElem = (id) => ({ id, classList: { add: () => {}, remove: () => {} }, focus: () => {} });

  graph.registerNode('card1', mockElem('card1'), { right: 'card2' });
  graph.registerNode('card2', mockElem('card2'), { left: 'card1', down: 'submitBtn' });
  graph.registerNode('submitBtn', mockElem('submitBtn'), { up: 'card2' });

  assert.equal(graph.currentFocusId, 'card1');

  graph.move('right');
  assert.equal(graph.currentFocusId, 'card2');

  graph.pushFocusState(); // Save focus at card2
  graph.setFocus('submitBtn');
  assert.equal(graph.currentFocusId, 'submitBtn');

  graph.popFocusState(); // Restore focus
  assert.equal(graph.currentFocusId, 'card2');
});

test('UIScalingEngine: switches profiles and applies DOM classes', () => {
  const storage = mockStorage();
  const scaling = new UIScalingEngine({ storage, initialProfile: 'DESKTOP' });

  assert.equal(scaling.currentProfile, 'DESKTOP');
  assert.equal(scaling.getProfileConfig().scale, 1.0);

  scaling.setProfile('HANDHELD');
  assert.equal(scaling.currentProfile, 'HANDHELD');
  assert.equal(storage.getItem('ck-ui-profile'), 'HANDHELD');
});
