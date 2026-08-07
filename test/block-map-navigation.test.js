const test = require('node:test');
const assert = require('node:assert/strict');
const {
  CHARACTER_ORIGINS,
  BlockMapController
} = require('../src/pixel_engine/block-map-navigation.js');

test('Block Map Navigation: 8 Character Origins are defined', () => {
  const keys = Object.keys(CHARACTER_ORIGINS);
  assert.equal(keys.length, 8);
  assert.ok(CHARACTER_ORIGINS.BARBER);
  assert.ok(CHARACTER_ORIGINS.STREET_SCHOLAR);
  assert.ok(CHARACTER_ORIGINS.LOCAL_LEGEND);
  assert.ok(CHARACTER_ORIGINS.CORNER_MERCHANT);
  assert.ok(CHARACTER_ORIGINS.COMMUNITY_ORGANIZER);
  assert.ok(CHARACTER_ORIGINS.UNDERGROUND_DJ);
  assert.ok(CHARACTER_ORIGINS.BLOCK_ARCHITECT);
  assert.ok(CHARACTER_ORIGINS.HUSTLE_VETERAN);
});

test('Block Map Navigation: every origin has a flavor line and a starting stat bonus', () => {
  const expected = {
    BARBER: { streetCred: 0, reputation: 2 },
    STREET_SCHOLAR: { streetCred: 1, reputation: 0 },
    LOCAL_LEGEND: { streetCred: 0, reputation: 2 },
    CORNER_MERCHANT: { streetCred: 2, reputation: 0 },
    COMMUNITY_ORGANIZER: { streetCred: 0, reputation: 2 },
    UNDERGROUND_DJ: { streetCred: 1, reputation: 1 },
    BLOCK_ARCHITECT: { streetCred: 1, reputation: -1 },
    HUSTLE_VETERAN: { streetCred: 2, reputation: 1 }
  };
  for (const [key, bonus] of Object.entries(expected)) {
    const origin = CHARACTER_ORIGINS[key];
    assert.ok(origin, `expected origin ${key} to exist`);
    assert.equal(typeof origin.flavor, 'string');
    assert.ok(origin.flavor.length > 0, `expected ${key} to have non-empty flavor text`);
    assert.deepEqual(origin.startingStats, bonus, `expected ${key} startingStats to match design spec`);
  }
});

test('Block Map Navigation: every origin has STR/WIT/SOUL attributes', () => {
  const expectedAttributes = {
    BARBER: { str: 4, wit: 7, soul: 7 },
    STREET_SCHOLAR: { str: 3, wit: 8, soul: 4 },
    LOCAL_LEGEND: { str: 6, wit: 3, soul: 8 },
    CORNER_MERCHANT: { str: 4, wit: 7, soul: 5 },
    COMMUNITY_ORGANIZER: { str: 3, wit: 6, soul: 8 },
    UNDERGROUND_DJ: { str: 4, wit: 5, soul: 6 },
    BLOCK_ARCHITECT: { str: 7, wit: 6, soul: 3 },
    HUSTLE_VETERAN: { str: 8, wit: 4, soul: 5 }
  };
  for (const [key, attrs] of Object.entries(expectedAttributes)) {
    const origin = CHARACTER_ORIGINS[key];
    assert.ok(origin, `expected origin ${key} to exist`);
    assert.deepEqual(origin.attributes, attrs, `expected ${key} attributes to match design spec`);
  }
});

test('Block Map Navigation: BlockMapController adheres to 4-frame animation budget and canvas bounds', () => {
  const controller = new BlockMapController({ startX: 300, startY: 500 });
  assert.equal(controller.x, 300);
  assert.equal(controller.y, 500);
  assert.equal(controller.animFrame, 0);

  for (let i = 0; i < 40; i++) {
    controller.update();
  }

  assert.ok(controller.animFrame >= 0 && controller.animFrame <= 3, 'Frame budget stays within 0..3');
  assert.ok(controller.x >= 10 && controller.x <= 1130, 'Player stays inside horizontal canvas bounds');
  assert.ok(controller.y >= 150 && controller.y <= 540, 'Player stays inside sidewalk bounds');
});

test('Block Map Navigation: Proximity trigger accurately detects active stoop hotspot', () => {
  const controller = new BlockMapController({ startX: 300, startY: 500 });
  controller.update();
  assert.ok(controller.activeHotspot);
  assert.equal(controller.activeHotspot.id, 'BARBER_SHOP');
});
