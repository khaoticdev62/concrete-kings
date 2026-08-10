const test = require('node:test');
const assert = require('node:assert/strict');
const { ControllerHapticsEngine, HAPTIC_PATTERNS, CONTROLLER_GLYPHS } = require('../src/pixel_engine/controller-haptics-engine.js');

function mockStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem(k) { return store.has(k) ? store.get(k) : null; },
    setItem(k, v) { store.set(k, String(v)); },
    removeItem(k) { store.delete(k); },
    clear() { store.clear(); }
  };
}

test('ControllerHapticsEngine: triggers vibration patterns on supported devices', () => {
  let lastPattern = null;
  const mockNavigator = {
    vibrate(pattern) { lastPattern = pattern; return true; }
  };

  const haptics = new ControllerHapticsEngine({ navigator: mockNavigator });
  assert.equal(haptics.isEnabled, true);

  const res = haptics.trigger('CARD_LOCKED');
  assert.equal(res, true);
  assert.deepEqual(lastPattern, HAPTIC_PATTERNS.CARD_LOCKED);
});

test('ControllerHapticsEngine: respects accessibility disable setting', () => {
  let vibrateCalled = false;
  const mockNavigator = {
    vibrate() { vibrateCalled = true; return true; }
  };
  const storage = mockStorage({ 'ck-access-haptics': 'false' });

  const haptics = new ControllerHapticsEngine({ storage, navigator: mockNavigator });
  assert.equal(haptics.isEnabled, false);

  const res = haptics.trigger('CARD_SELECTED');
  assert.equal(res, false);
  assert.equal(vibrateCalled, false);
});

test('ControllerHapticsEngine: returns correct button glyphs for active input device', () => {
  const haptics = new ControllerHapticsEngine({ deviceOverride: 'XBOX' });
  const glyphs = haptics.getGlyphs();

  assert.equal(glyphs.select, '(A)');
  assert.equal(glyphs.back, '(B)');

  haptics.setDeviceType('PLAYSTATION');
  assert.equal(haptics.getGlyphs().select, '(Cross)');
});
