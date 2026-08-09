const test = require('node:test');
const assert = require('node:assert/strict');
const {
  NATIVE_WIDTH,
  NATIVE_HEIGHT,
  MASTER_PALETTE_64,
  CITY_THEME_OVERRIDES,
  calculateIntegerScale,
  drawHighDetailCharacterSprite,
  paletteShift,
  snapToPixel,
  PALETTE_RAMPS
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

test('Pixel Engine: paletteShift shifts down its ramp for shadows and up for highlights', () => {
  assert.equal(paletteShift('#7A1D1C', -1), '#4D1414');
  assert.equal(paletteShift('#7a1d1c', 1), '#AA2724', 'lookup must be case-insensitive');
});

test('Pixel Engine: paletteShift clamps at ramp ends instead of wrapping or throwing', () => {
  assert.equal(paletteShift('#08080A', -5), '#08080A');
  assert.equal(paletteShift('#F4F7FF', 5), '#F4F7FF');
});

test('Pixel Engine: paletteShift never crosses a ramp boundary into another hue', () => {
  // The obvious implementation shifts within the four palette GROUPS, but
  // warm_tones holds reds 0-9 then browns 10-15, and cool_tones holds blues,
  // then teals, then violets. A group-wide shift turns #FFE299 (pale cream) into
  // #6E3E14 (dark brown) — a hue change presented as a shade change.
  assert.equal(paletteShift('#FFE299', 1), '#FFE299', 'end of the red/cream ramp must clamp');
  assert.equal(paletteShift('#6E3E14', -1), '#6E3E14', 'start of the brown ramp must clamp');
  assert.equal(paletteShift('#85C4FF', 1), '#85C4FF', 'end of the blue ramp must clamp');
  assert.equal(paletteShift('#0D2926', -1), '#0D2926', 'start of the teal ramp must clamp');
});

test('Pixel Engine: the derived ramps cover all 64 palette colours exactly once', () => {
  // The ramps are derived from luminance drops rather than hand-listed, so this
  // guards against a future palette edit silently orphaning a colour.
  const flat = PALETTE_RAMPS.flat();
  assert.equal(flat.length, 64, 'every palette colour must belong to a ramp');
  assert.equal(new Set(flat).size, 64, 'no colour may appear in two ramps');
  const palette = Object.values(MASTER_PALETTE_64).flat();
  assert.deepEqual([...flat].sort(), [...palette].sort());
});

test('Pixel Engine: paletteShift returns non-palette colours unchanged', () => {
  // Callers shade unconditionally, so an unknown colour must pass through rather
  // than throw or return undefined.
  assert.equal(paletteShift('#123456', 1), '#123456');
  assert.equal(paletteShift('rgba(0,0,0,0.5)', -1), 'rgba(0,0,0,0.5)');
});

test('Pixel Engine: snapToPixel floors toward negative infinity', () => {
  assert.equal(snapToPixel(3.9), 3);
  assert.equal(snapToPixel(-2.1), -3, 'truncation would give -2 and drift the sprite right');
  assert.equal(snapToPixel(5), 5);
});
