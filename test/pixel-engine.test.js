const test = require('node:test');
const assert = require('node:assert/strict');
const {
  NATIVE_WIDTH,
  NATIVE_HEIGHT,
  MASTER_PALETTE,
  CITY_THEME_OVERRIDES,
  calculateIntegerScale,
  drawHighDetailCharacterSprite,
  paletteShift,
  snapToPixel,
  PALETTE_RAMPS
} = require('../src/pixel_engine/pixel-engine.js');

/**
 * The original 64, pinned here rather than imported.
 *
 * The palette was expanded to nine ramps of even perceptual step, and every one of
 * these had to survive at its original ramp position: district palettes, card
 * visuals and character origins all reference these hexes by value, and a dropped or
 * moved entry would silently change art across the whole game. Written out in full so
 * the guarantee cannot be weakened by editing a shared constant.
 */
const ORIGINAL_64 = [
  '#08080A', '#101116', '#181920', '#22252E', '#2D313D', '#393E4D', '#474D5E', '#565E70',
  '#666E82', '#788196', '#8B95AB', '#A0AAC2', '#B6C0D8', '#CBD5ED', '#E2E8F7', '#F4F7FF',
  '#2B0D0D', '#4D1414', '#7A1D1C', '#AA2724', '#D9382E', '#F25438', '#FF7A45', '#FFA059',
  '#FFC475', '#FFE299', '#6E3E14', '#9C5C1D', '#C9822B', '#F0AB43', '#FFCD68', '#FFF0AA',
  '#0A1526', '#11233F', '#1C375C', '#274F80', '#366BA6', '#488BD9', '#5EAAFF', '#85C4FF',
  '#0D2926', '#174540', '#246961', '#339488', '#47C2B3', '#6FE8D8', '#2A1138', '#521C6E',
  '#140A07', '#26120B', '#3B1C11', '#522717', '#6B341D', '#854224', '#A1522C', '#BE6436',
  '#D97843', '#EB8E52', '#F7A768', '#FFC085', '#FFD6A8', '#3D2218', '#5C3222', '#7D442C'
];

/** CIELAB, so "how different do these look" is a number rather than an opinion. */
function toLab(hex) {
  const n = parseInt(String(hex).slice(1), 16);
  const g = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const r = g(((n >> 16) & 255) / 255);
  const gr = g(((n >> 8) & 255) / 255);
  const b = g((n & 255) / 255);
  const t = (c) => (c > 0.008856 ? Math.cbrt(c) : 7.787 * c + 16 / 116);
  const X = t((r * 0.4124 + gr * 0.3576 + b * 0.1805) / 0.9505);
  const Y = t(r * 0.2126 + gr * 0.7152 + b * 0.0722);
  const Z = t((r * 0.0193 + gr * 0.1192 + b * 0.9505) / 1.089);
  return [116 * Y - 16, 500 * (X - Y), 200 * (Y - Z)];
}
function deltaE(a, b) {
  const A = toLab(a);
  const B = toLab(b);
  return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]);
}

test('Pixel Engine: the palette is unique, uppercase hex, and every colour belongs to a ramp', () => {
  assert.equal(MASTER_PALETTE.length, 101, 'palette size is pinned; changing it is a deliberate act');
  assert.equal(new Set(MASTER_PALETTE).size, MASTER_PALETTE.length, 'no colour may appear twice');
  MASTER_PALETTE.forEach(c => {
    assert.match(c, /^#[0-9A-F]{6}$/, `${c} must be uppercase 6-digit hex — paletteShift matches on case`);
  });
  assert.equal(Object.keys(PALETTE_RAMPS).length, 9);
});

test('Pixel Engine: all 64 original colours survive the palette expansion', () => {
  const present = new Set(MASTER_PALETTE);
  const missing = ORIGINAL_64.filter(c => !present.has(c));
  assert.deepEqual(missing, [], `dropping an original colour silently changes existing art: ${missing}`);
});

test('Pixel Engine: no shading step is a hue jump — this is the gate the old palette failed', () => {
  // The defect that motivated the expansion. One step up from #7A1D1C brick used to
  // be #AA2724, a dE of 19.4, so paletteShift(+1) — which the renderer uses for
  // grain, highlights and dither partners — changed hue instead of shade. Roofs came
  // out as red confetti and parapets as signal-red borders.
  const MAX_STEP = 12;
  const offenders = [];
  Object.entries(PALETTE_RAMPS).forEach(([name, ramp]) => {
    for (let i = 1; i < ramp.length; i++) {
      const d = deltaE(ramp[i - 1], ramp[i]);
      if (d > MAX_STEP) offenders.push(`${name}[${i - 1}->${i}] ${ramp[i - 1]}->${ramp[i]} dE ${d.toFixed(1)}`);
    }
  });
  assert.deepEqual(offenders, [],
    `every adjacent pair must be within dE ${MAX_STEP} so +/-1 reads as a shade:\n${offenders.join('\n')}`);
});

test('Pixel Engine: every ramp is monotonically lighter, so -1 always darkens', () => {
  // paletteShift's whole contract. A ramp that dips would make a "shadow" lighter
  // than its base somewhere along it, and nothing else would report it.
  Object.entries(PALETTE_RAMPS).forEach(([name, ramp]) => {
    for (let i = 1; i < ramp.length; i++) {
      assert.ok(toLab(ramp[i])[0] > toLab(ramp[i - 1])[0],
        `${name}: ${ramp[i]} must be lighter than ${ramp[i - 1]}`);
    }
  });
});

test('Pixel Engine: ramps are deep enough that a 3-step shift does not clamp', () => {
  // The renderer shades walls at -2 and -3 off the roof colour. On the old palette
  // both clamped to the same #2B0D0D for brick, so a wall and its own shadow came
  // out identical and unlit windows vanished into the wall behind them.
  const MIN_DEPTH = 8;
  Object.entries(PALETTE_RAMPS).forEach(([name, ramp]) => {
    if (name === 'violet' || name === 'skinShade') return;   // accents, not surfaces
    assert.ok(ramp.length >= MIN_DEPTH,
      `${name} has ${ramp.length} steps; surfaces need ${MIN_DEPTH} for +/-3 shading to resolve`);
  });
  // And prove it on the colour that actually failed.
  assert.notEqual(paletteShift('#7A1D1C', -2), paletteShift('#7A1D1C', -3),
    'brick -2 and -3 must differ, or wall and wall-shadow are the same colour');
});

test('Pixel Engine: the exported palette JSON matches the ramps it was generated from', () => {
  // The palette lives in two places for good reasons — the engine shades with it at
  // runtime, the asset pipeline quantises generated art to it — but only one can be
  // the authority, and it is this module. They HAVE drifted: expanding the ramps left
  // the JSON on the old 64 colours, and the district-colour test then failed against a
  // stale file rather than against anything actually wrong.
  // Regenerate with: node scripts/generate-palette-json.js
  const fs = require('fs');
  const path = require('path');
  const json = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'assets', 'palettes', 'concrete_kings.json'), 'utf8'));

  assert.deepEqual(json.ramps, PALETTE_RAMPS,
    'assets/palettes/concrete_kings.json is stale — run scripts/generate-palette-json.js');
  assert.equal(json.color_count, MASTER_PALETTE.length);
  // The `groups` convenience view must cover the same gamut, or art quantised through
  // it lands outside the colours the engine can shade.
  const flatGroups = Object.values(json.groups).flat();
  assert.deepEqual([...flatGroups].sort(), [...MASTER_PALETTE].sort(),
    'groups must partition the ramps exactly');
});

test('Pixel Engine: the palette has a green ramp, because parks are not teal', () => {
  // Vegetation had to borrow the teal ramp, which is why every park read as a slab
  // of verdigris. The rule "do not invent greens" existed only because none existed.
  assert.ok(PALETTE_RAMPS.green.length >= 8, 'foliage needs a real ramp, not two tones');
  PALETTE_RAMPS.green.forEach(c => {
    const n = parseInt(c.slice(1), 16);
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    assert.ok(g > r && g > b, `${c} must actually be green — g must dominate`);
    // Desaturated: this is a night palette. A vivid green would break the mood and
    // fight the sodium lighting.
    assert.ok(g - Math.min(r, b) < 90, `${c} is too saturated for a night palette`);
  });
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
  // These moved with the palette expansion, and the move is the point: one step off
  // brick used to be #4D1414 / #AA2724, jumps of dE 19 that read as a change of hue.
  // The neighbours are now the inserted midpoints, dE ~9 either side.
  assert.equal(paletteShift('#7A1D1C', -1), '#631918');
  assert.equal(paletteShift('#7a1d1c', 1), '#922220', 'lookup must be case-insensitive');
  // The old neighbours are still reachable, two steps out, so any art that relied on
  // that exact pair can still express it.
  assert.equal(paletteShift('#7A1D1C', -2), '#4D1414');
  assert.equal(paletteShift('#7A1D1C', 2), '#AA2724');
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

test('Pixel Engine: the ramps and the flat palette are the same set of colours', () => {
  // MASTER_PALETTE is derived from PALETTE_RAMPS, so this guards the direction that
  // can still drift: a colour used by art but present in neither.
  const flat = Object.values(PALETTE_RAMPS).flat();
  assert.deepEqual([...flat].sort(), [...MASTER_PALETTE].sort());
  assert.equal(new Set(flat).size, flat.length, 'no colour may appear in two ramps');
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

test('Pixel Engine: character shading shifts the palette index, never layers flat black', () => {
  // The palette is locked to exactly 64 colours, so a shadow cannot be a black
  // overlay on the base tone — it has to be a darker entry from the same ramp.
  // This previously used rgba(20,10,7,0.25) for melanin shading and
  // rgba(8,8,10,0.2) for pants wrinkles, which muddies a tone instead of shading
  // it and drifts off-palette.
  const fillStyles = [];
  const mockCtx = {
    fillRect() {}, beginPath() {}, ellipse() {}, fill() {},
    font: '', textAlign: '', fillText() {}
  };
  Object.defineProperty(mockCtx, 'fillStyle', {
    get() { return fillStyles[fillStyles.length - 1]; },
    set(v) { fillStyles.push(v); }
  });

  const origin = {
    hairColor: '#140A07', skinColor: '#522717', outfitColor: '#393E4D',
    apronColor: '#F4F7FF', pantsColor: '#181920'
  };
  drawHighDetailCharacterSprite(mockCtx, origin, 0, 0, 1, true, true, 'Boss');

  ['rgba(20, 10, 7, 0.25)', 'rgba(8, 8, 10, 0.2)'].forEach(style => {
    assert.ok(!fillStyles.includes(style),
      `shading must not use the flat overlay ${style} — shift the palette index instead`);
  });
  assert.ok(fillStyles.includes(paletteShift(origin.skinColor, -2)),
    'melanin shading must be the palette-shifted skin tone');
  assert.ok(fillStyles.includes(paletteShift(origin.pantsColor, -1)),
    'pants wrinkles must be the palette-shifted trouser tone');

  // The invariant that actually matters: every hex fill must be a palette entry.
  // This caught the floating name tag drawing in #ffffff, an off-palette colour.
  const palette = new Set(MASTER_PALETTE);
  const offPalette = fillStyles
    .filter(s => typeof s === 'string' && s.startsWith('#'))
    .filter(s => !palette.has(s.toUpperCase()));
  assert.deepEqual(offPalette, [], `hex fills outside the master palette: ${offPalette.join(', ')}`);
});
