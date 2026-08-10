const test = require('node:test');
const assert = require('node:assert/strict');
const { CustomScenarioEditorEngine } = require('../src/pixel_engine/custom-scenario-editor.js');

function mockStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem(k) { return store.has(k) ? store.get(k) : null; },
    setItem(k, v) { store.set(k, String(v)); },
    removeItem(k) { store.delete(k); },
    clear() { store.clear(); }
  };
}

test('CustomScenarioEditorEngine: creates scenario templates and encodes SCN_ codes', () => {
  const engine = new CustomScenarioEditorEngine({ storage: mockStorage() });
  const scenario = engine.createScenarioTemplate({ title: 'HARLEM NIGHTS' });

  assert.equal(scenario.title, 'HARLEM NIGHTS');
  assert.equal(scenario.objectives.WHO, 'Who leads the heist?');

  const code = engine.exportScenarioCode(scenario);
  assert.equal(typeof code, 'string');
  assert.equal(code.startsWith('SCN_'), true);

  const imported = engine.importScenarioCode(code);
  assert.equal(imported.success, true);
  assert.equal(imported.scenario.title, 'HARLEM NIGHTS');
});

test('CustomScenarioEditorEngine: manages local library saving and deletion', () => {
  const engine = new CustomScenarioEditorEngine({ storage: mockStorage() });
  const scenario = engine.createScenarioTemplate({ id: 'scn_123', title: 'BLOCKADE' });

  engine.saveCustomScenario(scenario);
  assert.equal(engine.getCustomScenarios().length, 1);
  assert.equal(engine.getCustomScenarios()[0].title, 'BLOCKADE');

  engine.deleteCustomScenario('scn_123');
  assert.equal(engine.getCustomScenarios().length, 0);
});
