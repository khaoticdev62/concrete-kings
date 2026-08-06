const test = require('node:test');
const assert = require('node:assert/strict');
const {
  NATIVE_WIDTH,
  NATIVE_HEIGHT,
  MASTER_PALETTE_64,
  CITY_THEME_OVERRIDES,
  calculateIntegerScale,
  PixelCanvasEngine,
  drawHighDetailCharacterSprite,
  paletteShift,
  snapToPixel
} = require('../src/pixel_engine/pixel-engine.js');

test('Pixel Engine: Master Palette contains exactly 64 unique hex colors across 4 groups', () => {
  assert.equal(MASTER_PALETTE_64.blacks_grays.length, 16);
  assert.equal(MASTER_PALETTE_64.warm_tones.length, 16);
  assert.equal(MASTER_PALETTE_64.cool_tones.length, 16);
  assert.equal(MASTER_PALETTE_64.skin_tones.length, 16);

  const allColors = [
    ...MASTER_PALETTE_64.blacks_grays,
    ...MASTER_PALETTE_64.warm_tones,
    ...MASTER_PALETTE_64.cool_tones,
    ...MASTER_PALETTE_64.skin_tones
  ];

  assert.equal(allColors.length, 64);
  const uniqueColors = new Set(allColors);
  assert.equal(uniqueColors.size, 64, 'All 64 master palette colors must be unique');
});

test('Pixel Engine: calculateIntegerScale accurately calculates integer scale for 1080p', () => {
  const result = calculateIntegerScale(1920, 1080, NATIVE_WIDTH, NATIVE_HEIGHT);
  assert.equal(result.scale, 1);
  assert.equal(result.renderWidth, 1280);
  assert.equal(result.renderHeight, 720);
  assert.equal(result.marginX, 320);
  assert.equal(result.marginY, 180);
});

test('Pixel Engine: calculateIntegerScale calculates scale and pillarbox margins for ultra-wide / mobile display', () => {
  const result = calculateIntegerScale(2532, 1170, NATIVE_WIDTH, NATIVE_HEIGHT);
  assert.equal(result.scale, 1);
  assert.equal(result.renderWidth, 1280);
  assert.equal(result.renderHeight, 720);
  assert.equal(result.marginX, 626);
  assert.equal(result.marginY, 225);
});

test('Pixel Engine: City Theme Overrides are defined for all 8 cities', () => {
  const cities = ['Detroit', 'Chicago', 'Miami', 'Baltimore', 'Atlanta', 'Harlem', 'Oakland', 'NOLA'];
  cities.forEach(city => {
    assert.ok(CITY_THEME_OVERRIDES[city], `City theme override missing for ${city}`);
  });
});

test('Pixel Engine: drawHighDetailCharacterSprite executes correctly on mock canvas context', () => {
  const mockCtx = {
    fillStyle: '',
    fillRect() {},
    beginPath() {},
    ellipse() {},
    fill() {},
    font: '',
    textAlign: '',
    fillText() {}
  };

  const origin = {
    hairColor: '#140a07',
    skinColor: '#522717',
    outfitColor: '#393e4d',
    apronColor: '#f4f7ff',
    pantsColor: '#181920'
  };

  // Test small scale render
  assert.doesNotThrow(() => {
    drawHighDetailCharacterSprite(mockCtx, origin, 0, 0, 1, false, false, 'Player');
  });

  // Test large scale render
  assert.doesNotThrow(() => {
    drawHighDetailCharacterSprite(mockCtx, origin, 0, 0, 1, true, true, 'Boss');
  });
});

test('Pixel Engine: paletteShift shifts down within the same tone group for shadows', () => {
  assert.equal(paletteShift('#7A1D1C', -1), '#4D1414');
  assert.equal(paletteShift('#7a1d1c', 1), '#AA2724');
});

test('Pixel Engine: paletteShift clamps at group boundaries instead of wrapping or throwing', () => {
  assert.equal(paletteShift('#08080A', -5), '#08080A');
  assert.equal(paletteShift('#F4F7FF', 5), '#F4F7FF');
});

test('Pixel Engine: paletteShift returns the input unchanged for colors outside the master palette', () => {
  assert.equal(paletteShift('#123456', 1), '#123456');
});

test('Pixel Engine: snapToPixel floors fractional coordinates toward negative infinity', () => {
  assert.equal(snapToPixel(3.9), 3);
  assert.equal(snapToPixel(-2.1), -3);
  assert.equal(snapToPixel(5), 5);
});

test('Pixel Engine: drawBackground caches static content and only redraws when invalidated', () => {
  const drawCalls = [];
  const fakeEngine = {
    needsBgRedraw: true,
    bgCtx: { clearRect() {} },
    bgLayer: 'BG_LAYER_TOKEN',
    virtualCtx: { drawImage(img) { drawCalls.push(img); } },
    nativeWidth: 1280,
    nativeHeight: 720
  };
  const drawFn = () => drawCalls.push('drawn');

  PixelCanvasEngine.prototype.drawBackground.call(fakeEngine, drawFn);
  assert.equal(fakeEngine.needsBgRedraw, false);
  assert.deepEqual(drawCalls, ['drawn', 'BG_LAYER_TOKEN']);

  PixelCanvasEngine.prototype.drawBackground.call(fakeEngine, drawFn);
  assert.deepEqual(drawCalls, ['drawn', 'BG_LAYER_TOKEN', 'BG_LAYER_TOKEN'], 'Second call must skip drawFn and reuse the cached layer');

  fakeEngine.needsBgRedraw = true;
  PixelCanvasEngine.prototype.drawBackground.call(fakeEngine, drawFn);
  assert.deepEqual(drawCalls, ['drawn', 'BG_LAYER_TOKEN', 'BG_LAYER_TOKEN', 'drawn', 'BG_LAYER_TOKEN'], 'invalidateBackground must force a redraw');
});

test('Pixel Engine: drawMidground redraws every call and applies an integer-snapped parallax offset', () => {
  const drawCalls = [];
  const fakeEngine = {
    mgCtx: { clearRect() {} },
    mgLayer: 'MG_LAYER_TOKEN',
    virtualCtx: {
      drawImage(img, x, y) { drawCalls.push([img, x, y]); }
    },
    nativeWidth: 1280,
    nativeHeight: 720
  };
  const drawFn = () => drawCalls.push('drawn');

  PixelCanvasEngine.prototype.drawMidground.call(fakeEngine, drawFn, 12.9);
  PixelCanvasEngine.prototype.drawMidground.call(fakeEngine, drawFn, 12.9);

  assert.equal(drawCalls.filter(c => c === 'drawn').length, 2, 'Midground has no cache — it redraws every call');
  assert.deepEqual(drawCalls[1], ['MG_LAYER_TOKEN', 12, 0], 'Offset must be floored to an integer');
});

test('Pixel Engine: invalidateBackground sets needsBgRedraw to true', () => {
  const fakeEngine = { needsBgRedraw: false };
  PixelCanvasEngine.prototype.invalidateBackground.call(fakeEngine);
  assert.equal(fakeEngine.needsBgRedraw, true);
});

test('Pixel Engine: setCityTheme invalidates the background cache only on an actual city change', () => {
  const fakeEngine = {
    activeCity: 'Harlem',
    needsBgRedraw: false,
    invalidateBackground() { this.needsBgRedraw = true; }
  };
  PixelCanvasEngine.prototype.setCityTheme.call(fakeEngine, 'Harlem');
  assert.equal(fakeEngine.needsBgRedraw, false, 'Setting the same city must not force a redraw');

  PixelCanvasEngine.prototype.setCityTheme.call(fakeEngine, 'Chicago');
  assert.equal(fakeEngine.activeCity, 'Chicago');
  assert.equal(fakeEngine.needsBgRedraw, true, 'Changing city must invalidate the cached background');
});
