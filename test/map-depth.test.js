const test = require('node:test');
const assert = require('node:assert/strict');
const {
  TopDownCityRenderer, STOREY_PX, SHADOW_PER_STOREY,
  MIN_FLOORS, MAX_FLOORS, MAX_FACE_FRACTION, PROP_HEIGHT
} = require('../src/pixel_engine/topdown-city-renderer.js');
const { TopDownCityController } = require('../src/pixel_engine/topdown-city-controller.js');
const { districtKeys, DISTRICTS } = require('../src/pixel_engine/topdown-city-data.js');

/**
 * The map is a top-down view, so it has exactly two ways to say "this is tall":
 * the visible wall height and the cast shadow length. Before this work every
 * building had a 6px face and a 3px shadow regardless of size, which states that
 * a five-storey tenement and a kerbside lamp are the same height — and the whole
 * map collapsed onto one plane. These tests lock the geometry that fixed it.
 */

function recordingCtx() {
  const calls = { fillRect: [], fill: 0, moveTo: [], lineTo: [], styles: [] };
  return {
    calls,
    canvas: { width: 960, height: 520 },
    _fillStyle: '',
    get fillStyle() { return this._fillStyle; },
    set fillStyle(v) { this._fillStyle = v; calls.styles.push(v); },
    strokeStyle: '', font: '', textAlign: 'left', lineWidth: 1,
    imageSmoothingEnabled: true, globalCompositeOperation: 'source-over',
    save() {}, restore() {}, translate() {}, clip() {},
    beginPath() {}, closePath() {}, stroke() {}, strokeRect() {},
    moveTo(x, y) { calls.moveTo.push([x, y]); },
    lineTo(x, y) { calls.lineTo.push([x, y]); },
    fill() { calls.fill++; },
    fillRect(x, y, w, h) { calls.fillRect.push([x, y, w, h, this._fillStyle]); },
    drawImage() {},
    arc() { throw new Error('ctx.arc anti-aliases; the map must use hard-edged spans'); },
    ellipse() { throw new Error('ctx.ellipse anti-aliases; the map must use hard-edged spans'); },
    fillText() {},
    measureText() { return { width: 20 }; },
    createLinearGradient() { return { addColorStop() {} }; }
  };
}

test('Map depth: storey count varies across a district, so the skyline is not one height', () => {
  const floors = new Set();
  DISTRICTS.HARLEM.parcels
    .filter(pc => pc.kind === 'building')
    .forEach(pc => floors.add(TopDownCityRenderer.floorsOf(pc)));

  assert.ok(floors.size >= 3,
    `a district needs a varied skyline, got only ${[...floors].join('/')} storeys`);
  floors.forEach(f => {
    assert.ok(f >= MIN_FLOORS && f <= MAX_FLOORS, `${f} storeys is outside the allowed band`);
  });
});

test('Map depth: storey count is deterministic and honours an authored override', () => {
  // The map is shared state in online mode. A building that picks its own height
  // per client is a visible desync, so nothing here may touch Math.random.
  const parcel = { x: 690, y: 90, w: 390, h: 190, kind: 'building' };
  const first = TopDownCityRenderer.floorsOf(parcel);
  for (let i = 0; i < 20; i++) {
    assert.equal(TopDownCityRenderer.floorsOf(parcel), first, 'must not vary between calls');
  }

  assert.equal(TopDownCityRenderer.floorsOf({ ...parcel, floors: 4 }), 4, 'author wins');
  assert.equal(TopDownCityRenderer.floorsOf({ ...parcel, floors: 99 }), MAX_FLOORS, 'clamped high');
  assert.equal(TopDownCityRenderer.floorsOf({ ...parcel, floors: 0 }), MIN_FLOORS, 'clamped low');
});

test('Map depth: the wall face never escapes the parcel, so collision stays honest', () => {
  // THE safety property of this whole change. Collision uses parcel.x/y/w/h, so a
  // face drawn past the footprint would render a wall over ground the player can
  // still walk on. The face is carved out of the parcel's own depth instead.
  districtKeys().forEach(key => {
    DISTRICTS[key].parcels.filter(pc => pc.kind === 'building').forEach(pc => {
      const faceH = TopDownCityRenderer.faceHeightOf(pc);
      assert.ok(faceH > 0, `${key} parcel at ${pc.x},${pc.y} must show some wall`);
      assert.ok(faceH <= Math.floor(pc.h * MAX_FACE_FRACTION),
        `${key} parcel at ${pc.x},${pc.y}: face ${faceH} exceeds its ${MAX_FACE_FRACTION} cap`);
      assert.ok(pc.h - faceH >= 6,
        `${key} parcel at ${pc.x},${pc.y}: only ${pc.h - faceH}px of roof left`);
    });
  });
});

test('Map depth: a taller building throws a longer shadow', () => {
  // The load-bearing cue. If these were equal the map would be flat again no
  // matter what else the renderer did.
  const low = { x: 100, y: 100, w: 200, h: 200, kind: 'building', floors: 2 };
  const high = { x: 100, y: 100, w: 200, h: 200, kind: 'building', floors: 6 };
  const lowOff = TopDownCityRenderer.shadowOffsetOf(low);
  const highOff = TopDownCityRenderer.shadowOffsetOf(high);

  assert.equal(lowOff, 2 * SHADOW_PER_STOREY);
  assert.equal(highOff, 6 * SHADOW_PER_STOREY);
  assert.ok(highOff > lowOff * 2, 'a six-storey shadow must dwarf a two-storey one');
  // And the throw must beat the wall height, or the shadow hides behind the building.
  assert.ok(SHADOW_PER_STOREY > STOREY_PX * 0.6, 'a low sun throws long shadows');
});

test('Map depth: a building shadow is ONE filled path, not stacked translucent rects', () => {
  // p.shadow is translucent. Sweeping the footprint as a series of offset rects
  // would double up wherever they overlapped and leave the building sitting in a
  // black smear, so the swept region has to be a single convex hexagon.
  const r = new TopDownCityRenderer({});
  const ctx = recordingCtx();
  const parcel = { x: 100, y: 100, w: 200, h: 150, kind: 'building', floors: 5 };
  const palette = { shadow: 'rgba(0,0,0,0.45)' };

  r.parcelShadow(ctx, parcel, palette);

  assert.equal(ctx.calls.fill, 1, 'exactly one fill per building shadow');
  assert.equal(ctx.calls.fillRect.length, 0, 'no rects — a swept rect stack stacks alpha');
  assert.equal(ctx.calls.moveTo.length + ctx.calls.lineTo.length, 6,
    'the swept hull of two rects is a hexagon: 1 moveTo + 5 lineTo');

  // The far corner must sit exactly one shadow-offset south-east of the footprint.
  const off = TopDownCityRenderer.shadowOffsetOf(parcel);
  const far = ctx.calls.lineTo.find(([x, y]) => x === parcel.x + parcel.w + off
    && y === parcel.y + parcel.h + off);
  assert.ok(far, `shadow must reach ${parcel.x + parcel.w + off},${parcel.y + parcel.h + off}`);
});

test('Map depth: open parcels cast no shadow, because they are flat ground', () => {
  const r = new TopDownCityRenderer({});
  ['lot', 'park', 'court'].forEach(kind => {
    const ctx = recordingCtx();
    r.parcelShadow(ctx, { x: 0, y: 0, w: 100, h: 100, kind }, { shadow: 'rgba(0,0,0,0.45)' });
    assert.equal(ctx.calls.fill, 0, `a ${kind} is ground level and must not cast`);
  });
});

test('Map depth: every shadow in the frame is hard-edged, never an anti-aliased path', () => {
  // ctx.arc and ctx.ellipse anti-alias, and imageSmoothingEnabled cannot stop them
  // — it only governs image scaling. A soft-edged shape in a scene built entirely
  // from fillRect is instantly obvious: the trees used to render as smooth teal
  // amoebas beside the hard-pixel buildings. recordingCtx throws on both.
  const r = new TopDownCityRenderer({});
  districtKeys().forEach(key => {
    const c = new TopDownCityController({ districtKey: key, attachInput: false });
    assert.doesNotThrow(() => r.render(recordingCtx(), c),
      `${key} must draw without any anti-aliased path shape`);
  });
});

test('Map depth: props of different heights get visibly different shadow lengths', () => {
  // A lamp post is nearly three times the height of a parked car. Sharing one
  // offset across both is what the map did, and it flattened the street.
  assert.ok(PROP_HEIGHT.street_lamp > PROP_HEIGHT.car * 2,
    'a lamp post must stand far taller than a car');

  const r = new TopDownCityRenderer({});
  const palette = { shadow: 'rgba(0,0,0,0.45)' };
  const widthOf = (height) => {
    const ctx = recordingCtx();
    r.castShadow(ctx, 100, 100, 4, 3, height, palette, 0.4);
    const xs = ctx.calls.fillRect.map(([x, , w]) => [x, x + w]);
    return Math.max(...xs.map(v => v[1])) - Math.min(...xs.map(v => v[0]));
  };

  assert.ok(widthOf(PROP_HEIGHT.street_lamp) > widthOf(PROP_HEIGHT.car) + 6,
    'the lamp shadow must be clearly longer than the car shadow, not marginally');
  assert.equal(widthOf(0) > 0, true, 'a zero-height prop still gets a contact shadow');
});

test('Map depth: ground grit is laid before the roads, so it cannot pepper the pavement', () => {
  // The ground texture pass covers the whole world. Run after the roads and
  // sidewalks were filled — which is where it lived — it scattered near-black
  // ground flecks over both, and on the light pavement those read as holes punched
  // in the concrete.
  const r = new TopDownCityRenderer({});
  const order = [];
  const ctx = recordingCtx();

  const realGround = r.textureGround.bind(r);
  r.textureGround = (...args) => { order.push('groundTexture'); return realGround(...args); };
  const realSurfaces = r.textureSurfaces.bind(r);
  r.textureSurfaces = (...args) => { order.push('surfaceTexture'); return realSurfaces(...args); };

  const c = new TopDownCityController({ districtKey: 'HARLEM', attachInput: false });
  r.drawSurface(ctx, 'HARLEM', c.district, c.district.palette);

  assert.deepEqual(order, ['groundTexture', 'surfaceTexture'],
    'ground grit must go down first, then the road and pavement textures over it');
});

test('Map depth: the rendered frame still separates road from pavement by value alone', () => {
  // RETRO_PIXEL_TOPDOWN_MAP_PROMPT_PACK.md 2.1: walk vs no-walk must be legible
  // from luminance. Texture and shadows must not close that gap.
  const lum = (hex) => {
    const n = parseInt(String(hex).replace('#', ''), 16);
    return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
  };
  districtKeys().forEach(key => {
    const p = DISTRICTS[key].palette;
    assert.ok(lum(p.walk) > lum(p.asphalt) + 10,
      `${key}: pavement (${Math.round(lum(p.walk))}) must read clearly lighter than road ` +
      `(${Math.round(lum(p.asphalt))})`);
  });
});
