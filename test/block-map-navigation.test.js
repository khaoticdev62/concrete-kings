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

test('Block Map Navigation: BlockMapController adheres to 4-frame animation budget and canvas bounds', () => {
  const controller = new BlockMapController({ startX: 100, startY: 124 });
  assert.equal(controller.x, 100);
  assert.equal(controller.y, 124);
  assert.equal(controller.animFrame, 0);

  for (let i = 0; i < 40; i++) {
    controller.update();
  }

  assert.ok(controller.animFrame >= 0 && controller.animFrame <= 3, 'Frame budget stays within 0..3');
  assert.ok(controller.x >= 10 && controller.x <= 280, 'Player stays inside horizontal canvas bounds');
  assert.ok(controller.y >= 118 && controller.y <= 142, 'Player stays inside sidewalk bounds');
});

test('Block Map Navigation: Proximity trigger accurately detects active stoop hotspot', () => {
  const controller = new BlockMapController({ startX: 80, startY: 124 });
  controller.update();
  assert.ok(controller.activeHotspot);
  assert.equal(controller.activeHotspot.id, 'BARBER_SHOP');
});
