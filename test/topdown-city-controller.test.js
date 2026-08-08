const test = require('node:test');
const assert = require('node:assert/strict');
const { TopDownCityController, PLAYER_BOX, POI_RADIUS } =
  require('../src/pixel_engine/topdown-city-controller.js');
const { DISTRICTS, WORLD, VIEWPORT } = require('../src/pixel_engine/topdown-city-data.js');

function makeController(districtKey) {
  return new TopDownCityController({ districtKey: districtKey || 'HARLEM', attachInput: false });
}

test('Controller: starts inside the world on a walkable tile', () => {
  const c = makeController();
  assert.ok(c.x >= 0 && c.x <= WORLD.width);
  assert.ok(c.y >= 0 && c.y <= WORLD.height);
  assert.equal(c.collidesAt(c.x, c.y), false, 'spawn point must be walkable');
});

test('Controller: every district spawns the player somewhere walkable', () => {
  // A district whose spawn lands inside a building would trap the player on
  // arrival, which is a data bug that only shows up on travel.
  Object.keys(DISTRICTS).forEach(key => {
    const c = makeController(key);
    assert.equal(c.collidesAt(c.x, c.y), false, `${key} spawn must be walkable`);
  });
});

test('Controller: a solid parcel blocks movement into it', () => {
  const c = makeController();
  const solid = DISTRICTS.HARLEM.parcels.find(p => p.solid);
  const cx = solid.x + solid.w / 2;
  const cy = solid.y + solid.h / 2;
  assert.equal(c.collidesAt(cx, cy), true, 'centre of a solid parcel must collide');
});

test('Controller: open road is walkable', () => {
  const c = makeController();
  const road = DISTRICTS.HARLEM.roads.find(r => r.dir === 'h');
  const cy = road.y + road.h / 2;
  assert.equal(c.collidesAt(40, cy), false, 'the avenue must be walkable');
});

test('Controller: blocked on one axis still slides on the other', () => {
  const c = makeController();
  const solid = DISTRICTS.HARLEM.parcels.find(p => p.solid);

  // Stand flush against the parcel's bottom edge — box top exactly on the wall —
  // then push up into it. Any gap here and the first step is legally free.
  c.x = solid.x + solid.w / 2;
  c.y = solid.y + solid.h + PLAYER_BOX.h / 2;
  const startY = c.y;
  const startX = c.x;

  c.keys = { w: true, d: true };  // up (blocked) + right (free)
  c.update();

  assert.equal(c.y, startY, 'vertical movement into the wall must be refused');
  assert.ok(c.x > startX, 'horizontal movement must still happen');
});

test('Controller: camera centres the player away from world edges', () => {
  const c = makeController();
  c.x = WORLD.width / 2;
  c.y = WORLD.height / 2;
  c.keys = {};
  c.update();

  assert.equal(c.camera.x, Math.round(WORLD.width / 2 - VIEWPORT.width / 2));
  assert.equal(c.camera.y, Math.round(WORLD.height / 2 - VIEWPORT.height / 2));
});

test('Controller: camera clamps at all four world edges', () => {
  const c = makeController();
  c.keys = {};

  c.x = 0; c.y = 0; c.update();
  assert.equal(c.camera.x, 0, 'must not scroll past the left edge');
  assert.equal(c.camera.y, 0, 'must not scroll past the top edge');

  c.x = WORLD.width; c.y = WORLD.height; c.update();
  assert.equal(c.camera.x, WORLD.width - VIEWPORT.width, 'must not scroll past the right edge');
  assert.equal(c.camera.y, WORLD.height - VIEWPORT.height, 'must not scroll past the bottom edge');
});

test('Controller: POI proximity fires inside the radius and not outside', () => {
  const c = makeController();
  const poi = DISTRICTS.HARLEM.pois[0];

  c.x = poi.x; c.y = poi.y; c.keys = {};
  c.update();
  assert.ok(c.activePoi, 'standing on a POI must activate it');
  assert.equal(c.activePoi.id, poi.id);

  c.x = poi.x + POI_RADIUS + 40; c.y = poi.y;
  c.update();
  assert.equal(c.activePoi, null, 'walking well clear of a POI must deactivate it');
});

test('Controller: setDistrict switches district and re-spawns walkable', () => {
  const c = makeController();
  assert.equal(c.setDistrict('MIAMI'), true);
  assert.equal(c.districtKey, 'MIAMI');
  assert.equal(c.collidesAt(c.x, c.y), false, 'new spawn must be walkable');
  assert.equal(c.activePoi, null, 'district switch clears the previous POI');
});

test('Controller: setDistrict rejects an unknown key and keeps the current district', () => {
  const c = makeController();
  assert.equal(c.setDistrict('ATLANTIS'), false);
  assert.equal(c.districtKey, 'HARLEM');
});

test('Controller: the player never leaves the world', () => {
  const c = makeController();
  c.x = 4; c.y = 4;
  c.keys = { a: true, w: true };
  for (let i = 0; i < 20; i++) c.update();
  assert.ok(c.x >= 0, 'cannot walk off the left edge');
  assert.ok(c.y >= 0, 'cannot walk off the top edge');
});

test('Controller: animation frame stays within the 4-frame budget', () => {
  const c = makeController();
  c.keys = { d: true };
  for (let i = 0; i < 100; i++) {
    c.update();
    assert.ok(c.animFrame >= 0 && c.animFrame <= 3, 'frame must stay in 0..3');
  }
});

test('Controller: walking the avenue never tunnels into a building', () => {
  // Guards against a collision box small enough to step through a wall at
  // speed. Walk the full width of the avenue and assert we stay legal.
  const c = makeController();
  const road = DISTRICTS.HARLEM.roads.find(r => r.dir === 'h');
  c.x = 20;
  c.y = road.y + road.h / 2;
  c.keys = { d: true };

  for (let i = 0; i < 700; i++) {
    c.update();
    assert.equal(c.collidesAt(c.x, c.y), false,
      `tunnelled into a solid parcel at ${Math.round(c.x)},${Math.round(c.y)}`);
  }
});
