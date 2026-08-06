const test = require('node:test');
const assert = require('node:assert/strict');
const {
  NATIVE_WIDTH,
  NATIVE_HEIGHT,
  MASTER_PALETTE_64,
  CITY_THEME_OVERRIDES,
  calculateIntegerScale,
  drawHighDetailCharacterSprite
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
