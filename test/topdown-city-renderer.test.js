const test = require('node:test');
const assert = require('node:assert/strict');
const { TopDownCityRenderer } = require('../src/pixel_engine/topdown-city-renderer.js');
const { TopDownCityController } = require('../src/pixel_engine/topdown-city-controller.js');
const { AssetRegistry } = require('../src/pixel_engine/asset-registry.js');

/** Records calls instead of painting, so drawing is assertable without canvas. */
function recordingCtx() {
  // fill/beginPath/ellipse are counted because the procedural ground decals draw
  // with paths rather than rects, so an uncounted no-op would make "did it draw
  // anything?" unanswerable.
  // moveTo/lineTo are recorded too: building shadows are swept polygons rather than
  // rects, so a context without them throws instead of silently drawing nothing.
  const calls = {
    fillRect: 0, drawImage: 0, arc: 0, fillText: 0, fill: 0, beginPath: 0, ellipse: 0,
    moveTo: 0, lineTo: 0
  };
  return {
    calls,
    canvas: { width: 960, height: 520 },
    fillStyle: '', strokeStyle: '', font: '', textAlign: 'left', lineWidth: 1,
    imageSmoothingEnabled: true,
    save() {}, restore() {}, translate() {}, beginPath() { calls.beginPath++; }, closePath() {},
    moveTo() { calls.moveTo++; }, lineTo() { calls.lineTo++; },
    fill() { calls.fill++; }, stroke() {}, clip() {},
    fillRect() { calls.fillRect++; },
    strokeRect() {},
    drawImage() { calls.drawImage++; },
    arc() { calls.arc++; },
    ellipse() { calls.ellipse++; },
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
  //
  // Flora is identified by the renderer calling drawTree, NOT by ctx.arc. It used to
  // be keyed to arc because canopies were drawn with paths; when they moved to
  // hard-edged spans this test failed, which is the good outcome — but the same
  // coupling would have let it pass on some other element's stray arc while flora
  // drew nothing at all.
  const order = [];
  const ctx = recordingCtx();
  ctx.fillRect = () => { order.push('rect'); };

  const r = new TopDownCityRenderer({});
  const realDrawTree = r.drawTree.bind(r);
  r.drawTree = (...args) => { order.push('tree'); return realDrawTree(...args); };
  r.render(ctx, controller());

  assert.equal(order[0], 'rect', 'ground fill must be the first draw of the frame');
  assert.ok(order.includes('tree'), 'flora must be drawn');
  assert.ok(order.indexOf('tree') > order.indexOf('rect'), 'flora must come after ground');
  assert.ok(order.lastIndexOf('rect') > order.indexOf('tree'),
    'canopies must actually paint pixels, not leave an unfilled path');
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

/** Registry stub that resolves exactly the sprite keys it is given. */
function registryWith(keys) {
  const set = new Set(keys);
  return { get: (key) => (set.has(key) ? { image: { key }, x: 0, y: 0, w: 32, h: 32 } : null) };
}

test('Renderer: ground decals are placed deterministically, so litter does not crawl', () => {
  // Placement is seeded from the district key rather than Math.random, because
  // re-rolling per frame would animate the decals and put them in different
  // spots on each player's screen in online mode.
  const keys = ['harlem_decal_drain', 'harlem_decal_manhole', 'harlem_decal_litter'];
  const a = new TopDownCityRenderer({ registry: registryWith(keys) });
  const b = new TopDownCityRenderer({ registry: registryWith(keys) });
  const { getDistrict } = require('../src/pixel_engine/topdown-city-data.js');
  const d = getDistrict('HARLEM');

  const planA = a.decalPlan('HARLEM', d);
  const planB = b.decalPlan('HARLEM', d);

  assert.ok(planA.length > 0, 'declared decals must actually get placed');
  assert.deepEqual(
    planA.map(s => `${s.kind}@${s.x},${s.y}`),
    planB.map(s => `${s.kind}@${s.x},${s.y}`),
    'two renderers must agree on placement'
  );

  // And stable across repeated frames on the same instance.
  assert.equal(a.decalPlan('HARLEM', d), planA, 'the plan must be cached, not recomputed');
});

test('Renderer: each district scatters decals differently', () => {
  const { getDistrict } = require('../src/pixel_engine/topdown-city-data.js');
  const r = new TopDownCityRenderer({
    registry: registryWith(['harlem_decal_drain', 'detroit_decal_drain'])
  });
  const h = r.decalPlan('HARLEM', getDistrict('HARLEM')).map(s => `${s.x},${s.y}`).join('|');
  const d = r.decalPlan('DETROIT', getDistrict('DETROIT')).map(s => `${s.x},${s.y}`).join('|');
  assert.notEqual(h, d, 'the seed must vary by district, or every block looks identical');
});

test('Renderer: every decal lands wholly inside a sidewalk band', () => {
  // A decal half on the road shows its baked-in pavement field against asphalt,
  // which reads as a misplaced tile. The slicer tones each decal to the
  // district's walk colour, so the pavement is the only surface it matches.
  const { districtKeys, getDistrict } = require('../src/pixel_engine/topdown-city-data.js');
  const allKeys = districtKeys().flatMap(k =>
    ['decal_drain', 'decal_manhole', 'decal_vent', 'decal_litter', 'decal_stain']
      .map(n => `${k.toLowerCase()}_${n}`));
  const r = new TopDownCityRenderer({ registry: registryWith(allKeys) });

  districtKeys().forEach(key => {
    const d = getDistrict(key);
    const plan = r.decalPlan(key, d);
    assert.ok(plan.length > 0, `${key} should place decals when all are declared`);
    plan.forEach(spot => {
      const inside = d.sidewalks.some(b =>
        spot.x >= b.x && spot.x + spot.size <= b.x + b.w &&
        spot.y >= b.y && spot.y + spot.size <= b.y + b.h);
      assert.ok(inside, `${key}: decal at ${spot.x},${spot.y} is not fully on a sidewalk`);
    });
  });
});

test('Renderer: a district with no declared decal art falls back to procedural decals', () => {
  const { getDistrict } = require('../src/pixel_engine/topdown-city-data.js');
  const r = new TopDownCityRenderer({ registry: registryWith([]) });
  const plan = r.decalPlan('NOLA', getDistrict('NOLA'));
  assert.ok(plan.length > 0, 'NOLA should still place decal slots with no art');

  const ctx = recordingCtx();
  r.render(ctx, new TopDownCityController({ districtKey: 'NOLA', attachInput: false }));
  assert.ok(ctx.calls.drawImage === 0, 'no declared sprites must mean no asset drawImage');
  assert.ok(ctx.calls.fill > 0 || ctx.calls.beginPath > 0, 'procedural decals must draw something');
});

test('Renderer: the decal plan does not depend on whether assets have loaded yet', () => {
  // Assets preload asynchronously and the map renders immediately, so the first
  // decalPlan call routinely runs before any sprite has decoded. An earlier
  // version built the plan from the registry and cached it, which kept decals
  // off the map permanently even though the sprites resolved moments later —
  // every test passed and the browser showed nothing. The plan is now purely
  // geometric, so the race cannot exist.
  const { getDistrict } = require('../src/pixel_engine/topdown-city-data.js');
  const d = getDistrict('HARLEM');

  let loaded = false;
  const r = new TopDownCityRenderer({
    registry: {
      get: (key) => (loaded && key === 'harlem_decal_drain'
        ? { image: { key }, x: 0, y: 0, w: 32, h: 32 } : null)
    }
  });

  const before = r.decalPlan('HARLEM', d);
  assert.ok(before.length > 0, 'placement must be planned before any art exists');

  loaded = true;
  const after = r.decalPlan('HARLEM', d);
  assert.deepEqual(
    after.map(s => `${s.kind}@${s.x},${s.y}`),
    before.map(s => `${s.kind}@${s.x},${s.y}`),
    'loading art must not move anything'
  );
});

test('Renderer: a district with no decal art draws them procedurally instead of leaving bare pavement', () => {
  // Only three of the eight districts have atlases. Before this, the other five
  // rendered with completely empty sidewalks next to neighbours full of detail,
  // which read as an unfinished district rather than a different one.
  const r = new TopDownCityRenderer({ registry: registryWith([]) });
  const ctx = recordingCtx();
  r.render(ctx, new TopDownCityController({ districtKey: 'CHICAGO', attachInput: false }));

  assert.equal(ctx.calls.drawImage, 0, 'no art means no drawImage');
  assert.ok(r.stats.proceduralDraws > 0, 'the district must still be drawn');

  // The procedural forms use ellipses (manhole, stain) and fills (grate, litter).
  const bare = new TopDownCityRenderer({ registry: registryWith([]) });
  const plan = bare.decalPlan('CHICAGO', require('../src/pixel_engine/topdown-city-data.js').getDistrict('CHICAGO'));
  assert.ok(plan.length > 0, 'an art-less district must still plan decal positions');
  assert.ok(plan.every(s => s.kind && s.size >= 14),
    'every planned slot needs a kind and a usable size');
});

test('Renderer: a district with art draws only its art, never mixed with drawn stand-ins', () => {
  // Harlem declares three of the five decal kinds. The planned slots for the
  // other two are skipped rather than drawn procedurally: a photographic drain
  // beside a hand-drawn one reads as a bug, not as variety.
  const { getDistrict } = require('../src/pixel_engine/topdown-city-data.js');
  const r = new TopDownCityRenderer({
    registry: registryWith(['harlem_decal_drain', 'harlem_decal_manhole', 'harlem_decal_litter'])
  });
  const ctx = recordingCtx();
  const before = { arc: ctx.calls.arc };
  r.render(ctx, new TopDownCityController({ districtKey: 'HARLEM', attachInput: false }));

  const plan = r.decalPlan('HARLEM', getDistrict('HARLEM'));
  const withArt = plan.filter(s => ['decal_drain', 'decal_manhole', 'decal_litter'].includes(s.kind));
  assert.ok(withArt.length > 0 && withArt.length < plan.length,
    'this test needs a district that has art for some kinds but not all');
  assert.equal(r.stats.assetDraws, withArt.length,
    'exactly the slots with art should draw, and nothing should stand in for the rest');
  void before;
});
