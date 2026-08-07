const test = require('node:test');
const assert = require('node:assert/strict');
const { NarrativeStoryEngine } = require('../src/pixel_engine/story-engine.js');

test('Decision Panel: abilities are initialized on NarrativeStoryEngine', () => {
  const engine = new NarrativeStoryEngine();
  engine.reset('BARBER');
  
  assert.ok(Array.isArray(engine.abilities), 'should have abilities array');
  const redo = engine.abilities.find(a => a.id === 'redo');
  assert.ok(redo, 'should find redo ability');
  assert.equal(redo.cooldownBeats, 2);
  assert.equal(redo.currentCooldown, 0);
});

test('Decision Panel: using redo ability triggers cooldown and gets decremented', () => {
  const engine = new NarrativeStoryEngine();
  engine.reset('BARBER');
  
  const success = engine.markAbilityUsed();
  assert.equal(success, true, 'ability usage should succeed');
  
  const redo = engine.abilities.find(a => a.id === 'redo');
  assert.equal(redo.currentCooldown, 2, 'cooldown should set to cooldownBeats');
  assert.equal(engine.specialAbilityUsed, true, 'legacy property should report true');
  
  const failedUse = engine.markAbilityUsed();
  assert.equal(failedUse, false, 'cannot reuse ability on cooldown');

  // Incrementing beat 1 -> 2
  engine.applyWinnerCard("A ridiculous scent cracks a smile");
  assert.equal(redo.currentCooldown, 1, 'cooldown should decrement by 1');
  assert.equal(engine.specialAbilityUsed, true, 'legacy property still true');

  // Incrementing beat 2 -> 3
  engine.applyWinnerCard("Grandma's secret sweet potato pie recipe");
  assert.equal(redo.currentCooldown, 0, 'cooldown should decrement to 0');
  assert.equal(engine.specialAbilityUsed, false, 'legacy property now false');

  const reUseSuccess = engine.markAbilityUsed();
  assert.equal(reUseSuccess, true, 'can reuse ability now cooldown is 0');
});
