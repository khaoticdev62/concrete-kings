const test = require('node:test');
const assert = require('node:assert/strict');
const { TopDownCityRenderer } = require('../src/pixel_engine/topdown-city-renderer.js');
const { TopDownCityController } = require('../src/pixel_engine/topdown-city-controller.js');
const { AssetRegistry } = require('../src/pixel_engine/asset-registry.js');

/** Records calls instead of painting, so drawing is assertable without canvas. */
function recordingCtx() {
  const calls = { fillRect: 0, drawImage: 0, arc: 0, fillText: 0 };
  return {
    calls,
    canvas: { width: 960, height: 520 },
    fillStyle: '', strokeStyle: '', font: '', textAlign: 'left', lineWidth: 1,
    imageSmoothingEnabled: true,
    save() {}, restore() {}, translate() {}, beginPath() {}, closePath() {},
    fill() {}, stroke() {}, clip() {},
    fillRect() { calls.fillRect++; },
    strokeRect() {},
    drawImage() { calls.drawImage++; },
    arc() { calls.arc++; },
    ellipse() {},
    fillText() { calls.fillText++; },
    measureText() { return { width: 20 }; },
    createLinearGradient() { return { addColorStop() {} }; }
  };
}

function controller() {
  return new TopDownCityController({ districtKey: 'HARLEM', attachInput: false });
}

test('Renderer: draws a frame with no registry at all, fully procedurally', () => {
  const r = new TopDownCityRenderer({});
  const ctx = recordingCtx();
  r.render(ctx, controller());

  assert.ok(ctx.calls.fillRect > 50, 'a dense city should issue many fills');
  assert.equal(ctx.calls.drawImage, 0, 'no assets means no drawImage');
  assert.equal(r.stats.assetDraws, 0);
  assert.ok(r.stats.proceduralDraws > 0);
});

test('Renderer: an empty registry still yields procedural output', () => {
  const registry = new AssetRegistry({ loadImage: async () => null });
  registry.loadManifest({ version: 1, tileSize: 16, sources: {}, sprites: {} });

  const r = new TopDownCityRenderer({ registry });
  const ctx = recordingCtx();
  r.render(ctx, controller());

  assert.equal(ctx.calls.drawImage, 0);
  assert.ok(ctx.calls.fillRect > 50);
});

test('Renderer: a manifest whose source file is missing degrades to procedural', async () => {
  const registry = new AssetRegistry({ loadImage: async () => null });
  registry.loadManifest({
    version: 1, tileSize: 16,
    sources: { harlem_tiles: 'assets/sprite_packs/gone.png' },
    sprites: { 'harlem.building_roofA': { source: 'harlem_tiles', x: 0, y: 0, w: 32, h: 32 } }
  });
  await registry.preload();

  const r = new TopDownCityRenderer({ registry });
  const ctx = recordingCtx();
  r.render(ctx, controller());

  assert.equal(ctx.calls.drawImage, 0, 'a broken source must never reach drawImage');
  assert.ok(ctx.calls.fillRect > 50, 'and the city must still be drawn');
});

test('Renderer: uses an asset when one is registered for that element', async () => {
  const registry = new AssetRegistry({ loadImage: async () => ({ fake: true }) });
  registry.loadManifest({
    version: 1, tileSize: 16,
    sources: { harlem_tiles: 'assets/sprite_packs/city_harlem_tiles.png' },
    sprites: { 'harlem.building_roofA': { source: 'harlem_tiles', x: 0, y: 0, w: 32, h: 32 } }
  });
  await registry.preload();

  const r = new TopDownCityRenderer({ registry });
  const ctx = recordingCtx();
  r.render(ctx, controller());

  assert.ok(ctx.calls.drawImage > 0, 'registered roof asset must be drawn');
  assert.ok(r.stats.assetDraws > 0);
});

test('Renderer: spriteKey lowercases the district and joins with a dot', () => {
  const r = new TopDownCityRenderer({});
  assert.equal(r.spriteKey('HARLEM', 'building_roofA'), 'harlem.building_roofA');
  assert.equal(r.spriteKey('NOLA', 'road_h'), 'nola.road_h');
});

test('Renderer: draws in the prompt pack layer order — ground before flora', () => {
  // Pack section 6.3: ground/roads 0, props/furniture 1, flora/weather 2,
  // building decals 3, roof details 4. Flora drawn under a roof looks wrong,
  // and the player must never be occluded.
  const order = [];
  const ctx = recordingCtx();
  ctx.fillRect = () => { order.push('rect'); };
  ctx.arc = () => { order.push('arc'); };

  const r = new TopDownCityRenderer({});
  r.render(ctx, controller());

  assert.equal(order[0], 'rect', 'ground fill must be the first draw of the frame');
  assert.ok(order.includes('arc'), 'flora (circles) must be drawn');
  assert.ok(order.lastIndexOf('arc') > order.indexOf('rect'), 'flora must come after ground');
});

test('Renderer: stats reset between frames', () => {
  const r = new TopDownCityRenderer({});
  const ctx = recordingCtx();
  r.render(ctx, controller());
  const first = r.stats.proceduralDraws;
  r.render(ctx, controller());
  assert.equal(r.stats.proceduralDraws, first, 'per-frame stats must not accumulate');
});

test('Renderer: labels the active POI when one is in range', () => {
  const c = controller();
  const poi = c.district.pois[0];
  c.x = poi.x; c.y = poi.y;
  c.update();

  const r = new TopDownCityRenderer({});
  const ctx = recordingCtx();
  r.render(ctx, c);

  assert.ok(ctx.calls.fillText > 0, 'POI names must be drawn on the map, not in a legend');
});

test('Renderer: renders every district without throwing', () => {
  // Guards against a district referencing a palette key the renderer expects,
  // which would only surface when the player travels there.
  const { districtKeys } = require('../src/pixel_engine/topdown-city-data.js');
  const r = new TopDownCityRenderer({});
  districtKeys().forEach(key => {
    const c = new TopDownCityController({ districtKey: key, attachInput: false });
    const ctx = recordingCtx();
    assert.doesNotThrow(() => r.render(ctx, c), `${key} must render`);
    assert.ok(ctx.calls.fillRect > 50, `${key} must draw a populated city`);
  });
});
