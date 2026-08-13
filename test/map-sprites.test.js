const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const {
  DM_LOCATION_ASSETS, DM_ASSET_BASE, DM_MAP_SPRITE_DIR,
  DM_TERRAIN_ASSET, DM_CHARACTER_ASSET, DM_POLICE_ASSET,
  DMAssetManager, dmFitSprite
} = require('../src/pixel_engine/dynamic-map-assets.js');

const ROOT = path.join(__dirname, '..');

/** Every sprite path the manifest can hand a renderer. */
function allPaths() {
  const out = [DM_TERRAIN_ASSET, DM_CHARACTER_ASSET, DM_POLICE_ASSET];
  for (const list of Object.values(DM_LOCATION_ASSETS)) {
    if (!list) continue;               // TRANSITION is null on purpose
    out.push(...list);
  }
  return [...new Set(out)];
}

/** width/height straight out of the PNG IHDR, so nothing is taken on trust. */
function pngSize(abs) {
  const b = fs.readFileSync(abs);
  assert.equal(b.readUInt32BE(0), 0x89504e47, `${abs} is not a PNG (check for a JPEG with a .png name)`);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

test('map sprites: every declared path exists on disk', () => {
  for (const p of allPaths()) {
    const abs = path.join(ROOT, DM_ASSET_BASE, p);
    assert.ok(fs.existsSync(abs), `${p} is declared but missing — run scripts/process-map-sprites.sh`);
  }
});

test('map sprites: nothing points outside the tracked assets/map/web/ directory', () => {
  // The regression this exists for: assets/ holds ~511k PNGs of which git tracks
  // ~123, so the Modern Exteriors library is an untracked local vendor drop. An
  // earlier manifest referenced it directly and the map resolved on one machine
  // and 404'd on a fresh clone. Derived sprites are tracked; sources are not.
  for (const p of allPaths()) {
    assert.ok(
      p.startsWith(DM_MAP_SPRITE_DIR),
      `${p} points outside ${DM_MAP_SPRITE_DIR}. Map art must be derived by ` +
      `scripts/process-map-sprites.sh into the tracked directory, never referenced ` +
      `straight out of the untracked vendor drop.`
    );
  }
});

test('map sprites: are real PNGs sized for the renderer, not oversized sheets', () => {
  // The world renderer draws locations at 22/40/64px by zoom, so 64 on the long
  // edge is 1:1 at the largest draw and nothing upscales. A sprite far over that
  // is a sheet that slipped through unsliced, which is the original defect: the
  // terrain "tile" was a 2832x4944 atlas.
  for (const p of allPaths()) {
    const { w, h } = pngSize(path.join(ROOT, DM_ASSET_BASE, p));
    assert.ok(Math.max(w, h) <= 64, `${p} is ${w}x${h}; long edge must be <= 64`);
    assert.ok(w > 0 && h > 0, `${p} has a zero dimension`);
  }
});

test('map sprites: the ground tile is exactly 48x48 so it tiles seamlessly', () => {
  // _drawTerrain lays this down with drawImage(tile, x, y, tile.width,
  // tile.height). Any resize here reintroduces resampling and visible seams.
  const { w, h } = pngSize(path.join(ROOT, DM_ASSET_BASE, DM_TERRAIN_ASSET));
  assert.equal(`${w}x${h}`, '48x48');
});

test('map sprites: stay inside the file-size budget', () => {
  for (const p of allPaths()) {
    const bytes = fs.statSync(path.join(ROOT, DM_ASSET_BASE, p)).size;
    assert.ok(bytes < 20 * 1024, `${p} is ${Math.round(bytes / 1024)}KB; budget is 20KB`);
  }
});

test('map sprites: TRANSITION is mapped to no art and keeps its glyph', () => {
  // Rail Yards has no honest art in the library — the only transit pieces are a
  // bare subway stairwell and an interior train-door animation. Deliberately
  // null so it does not inherit _default and render as a market storefront.
  assert.ok('TRANSITION' in DM_LOCATION_ASSETS, 'TRANSITION must be present, not merely absent');
  assert.equal(new DMAssetManager().getLocationAsset('TRANSITION'), null);
});

test('map sprites: an unknown location type still falls back to _default', () => {
  const mgr = new DMAssetManager();
  assert.equal(mgr.getLocationAsset('NO_SUCH_TYPE'), DM_LOCATION_ASSETS._default[0]);
});

test('map sprites: types with generated art are not duplicated in this manifest', () => {
  // These resolve through MapAssetRegistry (assets/generated/) and never reach
  // DMAssetManager. Mapping them here would be dead weight that only fires when
  // something else is already broken.
  for (const type of ['HOME', 'RESTAURANT', 'STORE', 'PARK', 'APARTMENT', 'ALLEY', 'CLUB']) {
    assert.ok(!(type in DM_LOCATION_ASSETS), `${type} has generated art; drop it from DM_LOCATION_ASSETS`);
  }
});

test('dmFitSprite: preserves aspect ratio and sits the sprite on the box floor', () => {
  // A 40x64 storefront in a 64 box keeps its 5:8 ratio, centres horizontally and
  // bottom-aligns. The old drawImage(img, x, y, size, size) returned 64x64.
  const f = dmFitSprite({ width: 40, height: 64 }, 64);
  assert.deepEqual({ ...f }, { dw: 40, dh: 64, ox: 12, oy: 0 });

  // A wide sprite is limited by width and floats down to the floor.
  const wide = dmFitSprite({ width: 64, height: 55 }, 64);
  assert.deepEqual({ ...wide }, { dw: 64, dh: 55, ox: 0, oy: 9 });

  // Downscale: a 48x96 character in a 22px box.
  const small = dmFitSprite({ width: 48, height: 96 }, 22);
  assert.equal(small.dh, 22);
  assert.equal(small.dw, 11);
});

test('dmFitSprite: a zero-sized or absent image degrades to the box', () => {
  assert.deepEqual({ ...dmFitSprite(null, 40) }, { dw: 40, dh: 40, ox: 0, oy: 0 });
  assert.deepEqual({ ...dmFitSprite({ width: 0, height: 0 }, 40) }, { dw: 40, dh: 40, ox: 0, oy: 0 });
});
