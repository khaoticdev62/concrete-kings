const test = require('node:test');
const assert = require('node:assert/strict');
const { PlayerCustomizationEngine, AVATARS, CARD_BACKS } = require('../src/pixel_engine/player-customization-engine.js');

function mockStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem(k) { return store.has(k) ? store.get(k) : null; },
    setItem(k, v) { store.set(k, String(v)); },
    removeItem(k) { store.delete(k); },
    clear() { store.clear(); }
  };
}

test('PlayerCustomizationEngine: sets and persists avatar, frame, card back, and title', () => {
  const storage = mockStorage();
  const custom = new PlayerCustomizationEngine({ storage });

  assert.equal(custom.profile.avatarId, 'BARBER_RAY');

  custom.setAvatar('PLUG_CHEN');
  custom.setFrame('GOLDEN_CHEVRON');
  custom.setCardBack('HARLEM_GOLD');
  custom.setTitle('O.G.');

  const details = custom.getProfileDetails();
  assert.equal(details.avatar.name, 'Chen');
  assert.equal(details.frame.name, 'Golden Chevron');
  assert.equal(details.cardBack.name, 'Harlem Gold');
  assert.equal(details.title, 'O.G.');

  // Reload from storage
  const loaded = new PlayerCustomizationEngine({ storage });
  assert.equal(loaded.profile.avatarId, 'PLUG_CHEN');
  assert.equal(loaded.profile.cardBackId, 'HARLEM_GOLD');
});
