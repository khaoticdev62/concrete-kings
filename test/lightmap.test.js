const test = require('node:test');
const assert = require('node:assert/strict');
const { TopDownLightmap, LIGHT_SPRITE_SIZE } = require('../src/pixel_engine/lightmap.js');
const { getDistrict, districtKeys, DISTRICTS } = require('../src/pixel_engine/topdown-city-data.js');

/** Minimal canvas stand-in. The repo has no node-canvas and must not gain one. */
function fakeCanvasFactory(log) {
  return () => ({
    width: 0,
    height: 0,
    getContext() {
      return {
        createRadialGradient(...args) {
          log.gradients.push(args);
          return { addColorStop(offset, colour) { log.stops.push([offset, colour]); } };
        },
        set fillStyle(v) { log.fillStyles.push(v); },
        get fillStyle() { return ''; },
        fillRect(...args) { log.fillRects.push(args); }
      };
    }
  });
}

function recordingCtx(width = 960, height = 520) {
  const calls = { drawImage: [], composite: [] };
  return {
    calls,
    canvas: { width, height },
    get globalCompositeOperation() { return this._c || 'source-over'; },
    set globalCompositeOperation(v) { this._c = v; calls.composite.push(v); },
    drawImage(...args) { calls.drawImage.push(args); }
  };
}

test('Lightmap: light positions come from the district lamps, so they cannot drift apart', () => {
  // The renderer draws furniture from the same `lamp` decor entries. Deriving
  // light positions from a separate table would let a lamp exist with no glow, or
  // a glow with no lamp, and nothing would catch it.
  const d = getDistrict('HARLEM');
  const lamps = d.decor.filter(i => i.type === 'lamp');
  const sources = TopDownLightmap.sources(d, d.palette);

  assert.ok(lamps.length > 0, 'Harlem must have lamps for this test to mean anything');
  assert.equal(sources.length, lamps.length);
  sources.forEach((s, i) => {
    assert.equal(s.x, Math.floor(lamps[i].x));
    assert.equal(s.y, Math.floor(lamps[i].y));
  });
});

test('Lightmap: every district lights up, and the count follows its lamp density', () => {
  // Lamp density is the per-district character lever set in topdown-city-data.js,
  // so lighting should vary between districts rather than being uniform.
  const counts = districtKeys().map(k => {
    const d = DISTRICTS[k];
    return TopDownLightmap.sources(d, d.palette).length;
  });
  assert.ok(counts.every(c => c > 0), 'no district may be completely unlit');
  assert.ok(new Set(counts).size > 1, 'lighting must differ between districts, not be uniform');
});

test('Lightmap: coordinates are integers, because fractional ones blur pixel art', () => {
  const d = getDistrict('CHICAGO');
  TopDownLightmap.sources(d, d.palette).forEach(s => {
    assert.equal(s.x, Math.floor(s.x));
    assert.equal(s.y, Math.floor(s.y));
  });
});

test('Lightmap: the glow uses the district accent, not a hardcoded colour', () => {
  const harlem = getDistrict('HARLEM');
  const miami = getDistrict('MIAMI');
  assert.equal(TopDownLightmap.sources(harlem, harlem.palette)[0].colour, harlem.palette.accent);
  assert.equal(TopDownLightmap.sources(miami, miami.palette)[0].colour, miami.palette.accent);
});

test('Lightmap: alpha is baked into the gradient, never applied via globalAlpha', () => {
  // A plan-wide constraint: globalAlpha during gameplay draws is banned, so the
  // transparency has to live in the rgba() stops.
  const log = { gradients: [], stops: [], fillStyles: [], fillRects: [] };
  const lm = new TopDownLightmap({ createCanvas: fakeCanvasFactory(log) });
  const sprite = lm.sprite('#FFCD68');

  assert.ok(sprite, 'a sprite must be produced when a canvas is available');
  assert.equal(log.gradients.length, 1, 'one radial gradient per colour');
  assert.ok(log.stops.length >= 3, 'the falloff needs at least three stops');
  log.stops.forEach(([, colour]) => {
    assert.match(colour, /^rgba\(\d+,\d+,\d+,[\d.]+\)$/, `stop must be rgba with baked alpha: ${colour}`);
  });
  assert.equal(log.stops[log.stops.length - 1][1], 'rgba(255,205,104,0)',
    'the outer stop must be fully transparent or the pool has a hard edge');
});

test('Lightmap: one sprite is built per colour and then reused', () => {
  // A radial gradient per lamp per frame is the expensive way to do this; there
  // can be a dozen lamps on screen at 60fps.
  const log = { gradients: [], stops: [], fillStyles: [], fillRects: [] };
  const lm = new TopDownLightmap({ createCanvas: fakeCanvasFactory(log) });
  lm.sprite('#FFCD68');
  lm.sprite('#FFCD68');
  lm.sprite('#FFCD68');
  assert.equal(log.gradients.length, 1, 'the sprite must be cached, not rebuilt');
});

test('Lightmap: overlapping pools brighten rather than stack flatly', () => {
  const d = getDistrict('CHICAGO');
  const log = { gradients: [], stops: [], fillStyles: [], fillRects: [] };
  const lm = new TopDownLightmap({ createCanvas: fakeCanvasFactory(log) });
  const ctx = recordingCtx();

  lm.render(ctx, d, d.palette, { x: 0, y: 0 }, { width: 960, height: 520 });
  assert.ok(ctx.calls.composite.includes('lighten'),
    "pools must composite with 'lighten' or a row of lamps reads as a row of decals");
  assert.equal(ctx.calls.composite[ctx.calls.composite.length - 1], 'source-over',
    'the composite mode must be restored, or everything drawn afterwards is affected');
});

test('Lightmap: off-camera lights are culled', () => {
  const d = getDistrict('CHICAGO');
  const log = { gradients: [], stops: [], fillStyles: [], fillRects: [] };
  const lm = new TopDownLightmap({ createCanvas: fakeCanvasFactory(log) });

  const all = TopDownLightmap.sources(d, d.palette).length;
  // Camera y=400 puts the y=586 and y=742 lamp rows in shot; the origin would see
  // none of them, since every district's lamps sit on the avenue sidewalks.
  const drawn = lm.render(recordingCtx(), d, d.palette, { x: 0, y: 400 }, { width: 960, height: 520 });
  assert.ok(drawn > 0, 'lamps on the avenue must be visible from y=400');
  assert.ok(drawn < all, `culling must drop off-screen lights (drew ${drawn} of ${all})`);

  // And a camera looking at empty world space must draw none at all.
  const offscreen = lm.render(recordingCtx(), d, d.palette, { x: 0, y: 1200 }, { width: 960, height: 100 });
  assert.equal(offscreen, 0, 'a view with no lamps in it must draw nothing');
});

test('Lightmap: draws at integer destination coordinates', () => {
  const d = getDistrict('HARLEM');
  const log = { gradients: [], stops: [], fillStyles: [], fillRects: [] };
  const lm = new TopDownLightmap({ createCanvas: fakeCanvasFactory(log) });
  const ctx = recordingCtx();
  lm.render(ctx, d, d.palette, { x: 0, y: 400 }, { width: 960, height: 520 });

  assert.ok(ctx.calls.drawImage.length > 0);
  ctx.calls.drawImage.forEach(args => {
    const [, , , sw, sh, dx, dy, dw, dh] = args;
    assert.equal(sw, LIGHT_SPRITE_SIZE);
    assert.equal(sh, LIGHT_SPRITE_SIZE);
    [dx, dy, dw, dh].forEach(v => assert.equal(v, Math.floor(v), 'destination must be integral'));
  });
});

test('Lightmap: without any canvas support it draws nothing instead of throwing', () => {
  // This is the Node case, and the reason the renderer can construct a lightmap
  // unconditionally.
  const lm = new TopDownLightmap({ createCanvas: null });
  const d = getDistrict('HARLEM');
  const ctx = recordingCtx();
  assert.doesNotThrow(() => lm.render(ctx, d, d.palette, { x: 0, y: 0 }, { width: 960, height: 520 }));
  assert.equal(ctx.calls.drawImage.length, 0);
});

test('Lightmap: a district with no lamps is handled without a wasted composite switch', () => {
  const bare = { decor: [], palette: { accent: '#FFCD68' } };
  const lm = new TopDownLightmap({ createCanvas: null });
  const ctx = recordingCtx();
  assert.equal(lm.render(ctx, bare, bare.palette, { x: 0, y: 0 }, { width: 960, height: 520 }), 0);
  assert.equal(ctx.calls.composite.length, 0, 'nothing to light means the mode is never touched');
  assert.deepEqual(TopDownLightmap.sources(null, null), []);
});

test('Lightmap: the renderer still draws a full frame when lighting is disabled', () => {
  // The lightmap is optional. Passing lightmap: null must not change anything
  // else about the frame.
  const { TopDownCityRenderer } = require('../src/pixel_engine/topdown-city-renderer.js');
  const { TopDownCityController } = require('../src/pixel_engine/topdown-city-controller.js');
  const r = new TopDownCityRenderer({ lightmap: null });
  const ctx = {
    canvas: { width: 960, height: 520 }, fillStyle: '', strokeStyle: '', font: '', textAlign: 'left',
    lineWidth: 1, imageSmoothingEnabled: true, globalAlpha: 1, globalCompositeOperation: 'source-over',
    save() {}, restore() {}, translate() {}, beginPath() {}, closePath() {}, fill() {}, stroke() {},
    moveTo() {}, lineTo() {},
    clip() {}, fillRect() {}, strokeRect() {}, drawImage() {}, arc() {}, ellipse() {}, fillText() {},
    measureText() { return { width: 20 }; }, createLinearGradient() { return { addColorStop() {} }; }
  };
  const c = new TopDownCityController({ districtKey: 'HARLEM', attachInput: false });
  assert.doesNotThrow(() => r.render(ctx, c));
  assert.ok(r.stats.proceduralDraws > 0);
});
