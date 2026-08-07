const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getStreetlampPositions,
  getNeonSignPositions,
  renderLightmap,
  applyLightmap
} = require('../src/pixel_engine/lightmap.js');

const CITIES = ['Detroit', 'Chicago', 'Miami', 'Baltimore', 'Atlanta', 'Harlem', 'Oakland', 'NOLA'];

function makeMockCtx() {
  const calls = { fillRect: [], gradients: [] };
  return {
    calls,
    fillStyle: '',
    fillRect(x, y, w, h) { calls.fillRect.push([x, y, w, h]); },
    createRadialGradient() {
      const stops = [];
      calls.gradients.push(stops);
      return { addColorStop(offset, color) { stops.push([offset, color]); } };
    }
  };
}

test('Lightmap: getStreetlampPositions returns numeric coordinates for all 8 cities', () => {
  CITIES.forEach(city => {
    const lamps = getStreetlampPositions(city);
    assert.ok(Array.isArray(lamps) && lamps.length > 0, `${city} must have at least one streetlamp`);
    lamps.forEach(lamp => {
      assert.equal(typeof lamp.x, 'number');
      assert.equal(typeof lamp.y, 'number');
    });
  });
});

test('Lightmap: getNeonSignPositions returns an rgba color for all 8 cities', () => {
  CITIES.forEach(city => {
    const signs = getNeonSignPositions(city);
    assert.ok(Array.isArray(signs) && signs.length > 0, `${city} must have at least one neon sign`);
    signs.forEach(sign => assert.ok(sign.color.startsWith('rgba('), `${city} sign color must be an rgba() string`));
  });
});

test('Lightmap: unknown city falls back to Harlem defaults instead of throwing', () => {
  assert.deepEqual(getStreetlampPositions('Gotham'), getStreetlampPositions('Harlem'));
  assert.deepEqual(getNeonSignPositions('Gotham'), getNeonSignPositions('Harlem'));
});

test('Lightmap: renderLightmap draws one ambient rect plus one gradient pool per lamp and per sign', () => {
  const ctx = makeMockCtx();
  renderLightmap(ctx, 1280, 720, 'Harlem', 3);
  const lampCount = getStreetlampPositions('Harlem').length;
  const signCount = getNeonSignPositions('Harlem').length;
  assert.equal(ctx.calls.fillRect.length, 1 + lampCount + signCount, 'ambient + one rect per gradient pool, no heat haze below heat 7');
  assert.equal(ctx.calls.gradients.length, lampCount + signCount);
});

test('Lightmap: heat >= 7 adds exactly one heat-haze overlay rect', () => {
  const belowThreshold = makeMockCtx();
  renderLightmap(belowThreshold, 1280, 720, 'Harlem', 6);
  const atThreshold = makeMockCtx();
  renderLightmap(atThreshold, 1280, 720, 'Harlem', 7);
  assert.equal(atThreshold.calls.fillRect.length, belowThreshold.calls.fillRect.length + 1);
});

test('Lightmap: applyLightmap multiply-composites then restores source-over so later draws are unaffected', () => {
  const opStates = [];
  const nativeCtx = {
    get globalCompositeOperation() { return this._op; },
    set globalCompositeOperation(v) { this._op = v; opStates.push(v); },
    drawImage(img) { opStates.push(['drawImage', img]); }
  };
  applyLightmap(nativeCtx, 'LIGHTMAP_CANVAS_TOKEN');
  assert.deepEqual(opStates, ['multiply', ['drawImage', 'LIGHTMAP_CANVAS_TOKEN'], 'source-over']);
});
