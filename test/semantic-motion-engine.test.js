const test = require('node:test');
const assert = require('node:assert/strict');
const { SemanticMotionEngine, REVEAL_STAGES } = require('../src/pixel_engine/semantic-motion-engine.js');

test('SemanticMotionEngine: advances through staggered reveal stages cleanly', () => {
  const engine = new SemanticMotionEngine();
  const init = engine.startRevealSequence({ WHO: 'Card 1', WHAT: 'Card 2' });
  assert.equal(init.stage, 'WHO');
  assert.equal(engine.isRevealing, true);

  // Update 300ms (still WHO stage)
  const res1 = engine.updateReveal(300);
  assert.equal(res1.currentStage, 'WHO');
  assert.equal(res1.isComplete, false);

  // Update 300ms more (total 600ms >= 500ms -> advances to WHAT stage)
  const res2 = engine.updateReveal(300);
  assert.equal(res2.currentStage, 'WHAT');
});

test('SemanticMotionEngine: supports fast-forward and instant skip', () => {
  const engine = new SemanticMotionEngine();
  engine.startRevealSequence();

  engine.setSpeed(2.0);
  assert.equal(engine.isFastForward, true);

  const skipRes = engine.skipRevealSequence();
  assert.equal(skipRes.isComplete, true);
  assert.equal(engine.isRevealing, false);
});

test('SemanticMotionEngine: calculates quadratic bezier trajectory for consequence particles', () => {
  const engine = new SemanticMotionEngine();
  const p = engine.spawnConsequenceArc('HEAT', { x: 400, y: 300 }, { x: 100, y: 50 }, 15);

  assert.equal(p.type, 'HEAT');
  assert.equal(engine.activeArcParticles.length, 1);

  const active = engine.updateArcParticles(400); // 50% progress
  assert.equal(active.length, 1);
  assert.equal(typeof active[0].currentPos.x, 'number');
  assert.equal(typeof active[0].currentPos.y, 'number');
});
