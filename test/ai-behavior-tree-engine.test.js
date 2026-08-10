const test = require('node:test');
const assert = require('node:assert/strict');
const { AiBehaviorTreeEngine, AI_ARCHETYPES } = require('../src/pixel_engine/ai-behavior-tree-engine.js');

test('AiBehaviorTreeEngine: evaluates cards according to distinct AI archetypes', () => {
  const engine = new AiBehaviorTreeEngine();

  const socialCard = { id: 'c1', title: 'Street Meeting', category: 'SOCIAL' };
  const chaosCard = { id: 'c2', title: 'Blow Up Building', category: 'CHAOS' };

  // Marcus prefers Social over Chaos
  const marcusSocialScore = engine.evaluateCardForAi('MARCUS', socialCard, 0, 70);
  const marcusChaosScore = engine.evaluateCardForAi('MARCUS', chaosCard, 0, 70);
  assert.equal(marcusSocialScore > marcusChaosScore, true);

  // Rico prefers Chaos over Social
  const ricoSocialScore = engine.evaluateCardForAi('RICO', socialCard, 0, 70);
  const ricoChaosScore = engine.evaluateCardForAi('RICO', chaosCard, 0, 70);
  assert.equal(ricoChaosScore > ricoSocialScore, true);
});

test('AiBehaviorTreeEngine: selects best card from hand and telegraphs dialogue', () => {
  const engine = new AiBehaviorTreeEngine();
  const hand = [
    { id: 'c1', title: 'Talk to Barber', category: 'SOCIAL' },
    { id: 'c2', title: 'Start Street Riot', category: 'CHAOS' }
  ];

  const marcusChoice = engine.selectBestCard('MARCUS', hand, 2, 80);
  assert.equal(marcusChoice.card.id, 'c1');

  const ricoChoice = engine.selectBestCard('RICO', hand, 2, 80);
  assert.equal(ricoChoice.card.id, 'c2');

  const dialogue = engine.getTelegraphedDialogue('MARCUS', 'SAFE');
  assert.equal(dialogue.includes('Marcus'), true);
});
