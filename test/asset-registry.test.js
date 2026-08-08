const test = require('node:test');
const assert = require('node:assert/strict');
const { AssetRegistry } = require('../src/pixel_engine/asset-registry.js');

const MANIFEST = {
  version: 1,
  tileSize: 16,
  sources: {
    harlem_tiles: 'assets/sprite_packs/city_harlem_tiles.png',
    missing_pack: 'assets/sprite_packs/does_not_exist.png'
  },
  sprites: {
    'harlem.road_h':         { source: 'harlem_tiles', x: 0,  y: 0, w: 16, h: 16 },
    'harlem.building_roofA': { source: 'harlem_tiles', x: 32, y: 0, w: 32, h: 32 },
    'harlem.ghost':          { source: 'missing_pack', x: 0,  y: 0, w: 16, h: 16 }
  }
};

function fakeLoader() {
  return async (path) => (path.includes('does_not_exist') ? null : { fakeImage: path });
}

test('AssetRegistry: resolves a known key to a slice descriptor after preload', async () => {
  const r = new AssetRegistry({ loadImage: fakeLoader() });
  assert.equal(r.loadManifest(MANIFEST), true);
  await r.preload();

  const slice = r.get('harlem.building_roofA');
  assert.ok(slice, 'known key must resolve');
  assert.equal(slice.x, 32);
  assert.equal(slice.y, 0);
  assert.equal(slice.w, 32);
  assert.equal(slice.h, 32);
  assert.equal(slice.image.fakeImage, 'assets/sprite_packs/city_harlem_tiles.png');
  assert.equal(r.tileSize, 16, 'pack mandates 16x16 native tiles');
});

test('AssetRegistry: unknown key returns null', async () => {
  const r = new AssetRegistry({ loadImage: fakeLoader() });
  r.loadManifest(MANIFEST);
  await r.preload();
  assert.equal(r.get('harlem.nope'), null);
});

test('AssetRegistry: a key on a missing source returns null without throwing', async () => {
  const r = new AssetRegistry({ loadImage: fakeLoader() });
  r.loadManifest(MANIFEST);
  await r.preload();

  assert.equal(r.get('harlem.ghost'), null, 'missing source must not resolve');
  assert.ok(r.diagnostics.some(d => d.includes('missing_pack')), 'failure must be recorded for diagnostics');
});

test('AssetRegistry: keys return null before preload runs', () => {
  const r = new AssetRegistry({ loadImage: fakeLoader() });
  r.loadManifest(MANIFEST);
  assert.equal(r.get('harlem.building_roofA'), null, 'no image yet, so no slice');
});

test('AssetRegistry: a malformed manifest yields an empty registry rather than throwing', () => {
  const r = new AssetRegistry({ loadImage: fakeLoader() });
  assert.equal(r.loadManifest(null), false);
  assert.equal(r.loadManifest({ version: 1 }), false, 'no sources/sprites is malformed');
  assert.equal(r.loadManifest({ sources: 'nope', sprites: {} }), false);
  assert.equal(r.get('harlem.road_h'), null);
});

test('AssetRegistry: a sprite naming an undeclared source is rejected at manifest load', () => {
  const r = new AssetRegistry({ loadImage: fakeLoader() });
  r.loadManifest({
    version: 1, tileSize: 16,
    sources: { a: 'assets/a.png' },
    sprites: { 'x.y': { source: 'nonexistent', x: 0, y: 0, w: 16, h: 16 } }
  });
  assert.equal(r.get('x.y'), null);
  assert.ok(r.diagnostics.some(d => d.includes('nonexistent')));
});
