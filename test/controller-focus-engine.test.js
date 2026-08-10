const test = require('node:test');
const assert = require('node:assert/strict');
const { ControllerFocusEngine, DEFAULT_CONTROLLER_MAP } = require('../src/pixel_engine/controller-focus-engine.js');

test('ControllerFocusEngine: registers nodes and navigates focus graph correctly', () => {
  const engine = new ControllerFocusEngine();

  engine.registerNode('card_1', { right: 'card_2', down: 'submit_btn' });
  engine.registerNode('card_2', { left: 'card_1', down: 'submit_btn' });
  engine.registerNode('submit_btn', { up: 'card_1' });

  assert.equal(engine.currentFocusId, 'card_1');

  const moveRight = engine.moveFocus('RIGHT');
  assert.equal(moveRight.currentId, 'card_2');

  const moveDown = engine.moveFocus('DOWN');
  assert.equal(moveDown.currentId, 'submit_btn');

  const moveUp = engine.moveFocus('UP');
  assert.equal(moveUp.currentId, 'card_1');
});

test('ControllerFocusEngine: allows remapping keybindings and provides accessibility ring styles', () => {
  const engine = new ControllerFocusEngine();

  const remapOk = engine.remapKey('SELECT', 'Space');
  assert.equal(remapOk, true);
  assert.equal(engine.keybindings.SELECT, 'Space');

  const style = engine.getFocusRingStyle();
  assert.equal(style.outline.includes('4px solid'), true);
});
