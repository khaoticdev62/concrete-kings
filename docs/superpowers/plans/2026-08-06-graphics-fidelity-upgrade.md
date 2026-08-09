# Graphics Fidelity Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Raise the visual fidelity of the live-rendered game (parallax depth, lighting, palette-correct shading, card art, particle polish) inside the existing Canvas2D pipeline, without changing game design, story, UI flow, or the strict 4-frame animation budget.

**Architecture:** Extend the existing `PixelCanvasEngine` (src/pixel_engine/pixel-engine.js) with cached offscreen bg/mg/fg layers and a new pre-rendered lightmap module, then refactor `drawProceduralBackground` in `index.html` into a layered parallax draw. Shading moves from flat black/white alpha overlays to palette-index shifts. Card text wrapping is memoized. Weather/particle effects (already implemented in `weather-effects-system.js`) get their neon-flicker curve corrected to match spec. No new rendering architecture, no build step, no new dependencies — this is a fidelity pass on code that already runs in production.

**Tech Stack:** Plain CommonJS JS (dual `window.X` / `module.exports` per file), HTML5 Canvas2D, Node's built-in `node --test` runner, zero external rendering/test dependencies (repo has no jsdom/canvas package and none should be added).

## STATUS — 2026-08-09: COMPLETE, WITH THREE TASKS RETIRED AS STALE

Do not execute this plan as written. It was authored against a codebase that has
since changed underneath it, and a pre-flight pass found three of its seven tasks
aimed at code that no longer runs.

| Task | Outcome |
|---|---|
| 1 — palette-shift / pixel-snap helpers | **Done.** `paletteShift` deviates from the plan: shifting within the four palette *groups* crosses ramp boundaries (warm_tones is reds then browns; cool_tones is blues, teals, violets), so `#FFE299 + 1` became dark brown. Ramps are derived from luminance drops instead. |
| 2 — offscreen parallax layer caching | **Retired.** `PixelCanvasEngine` is never instantiated; `this.pixelEngine` was read in three places and every guard was permanently false. Those calls are deleted. |
| 3 — lightmap | **Done, retargeted.** Now `src/pixel_engine/lightmap.js` over the top-down map, driven by each district's existing `lamp` decor. |
| 4 — wire parallax into the render loop | **Retired.** `drawProceduralBackground` was defined but never called — 130 lines orphaned when the top-down map replaced the side-on viewport. Deleted. Parallax depth is meaningless looking straight down. |
| 5 — palette-index character shading | **Done**, plus the regression test it lacked. That test caught the floating name tag drawing in `#ffffff`, a 65th colour. |
| 6 — neon flicker curve + card wrap memoisation | **Done**, plus the four tests it lacked. |
| 7 — full verification pass | **Done.** 291 tests passing. |

Two of the plan's own premises were also wrong and are worth remembering:
the suite was 75 tests when this was written and is now 291, and the plan assumed
the side-on background was live. **Pre-flight any older plan against the code
before executing it.**

---
## Global Constraints

- Strict 4-frame animation budget (frames 0,1,2,3) on every animated system — non-negotiable, already enforced by `WeatherEffectsSystem.frameIndex`, `CardVisualRenderer.shimmerFrame`, `PixelCanvasEngine.animationFrameCount`; new code must not exceed it.
- All drawing coordinates must be integers — wrap any new offset/position math in `Math.floor`.
- `imageSmoothingEnabled = false` (and vendor-prefixed variants) on every 2D context, `willReadFrequently: false` on every `getContext('2d', ...)` call.
- Never use `shadowBlur`, `shadowColor`, or `globalAlpha` during gameplay draws — bake alpha into the `rgba(...)` fillStyle string instead.
- The 64-color `MASTER_PALETTE_64` (src/pixel_engine/pixel-engine.js) is the canonical palette. `test/pixel-engine.test.js` asserts exactly 64 unique colors — do not add a 65th color or any ad-hoc hex literal for shading; derive shadow/highlight colors via palette-index shifts only.
- No build step: plain JS, CommonJS `require`/`module.exports` in Node, `<script src="...">` tags in the browser. Every new file must export via both `if (typeof module !== 'undefined')` and `if (typeof window !== 'undefined')`, matching every existing file in `src/pixel_engine/`.
- No new npm dependencies (package.json has only `ws` runtime + `playwright` dev). Do not introduce jsdom/node-canvas to "properly" test DOM canvas code — follow the existing repo pattern of hand-rolled mock `ctx` objects and prototype-method calls against a fake `this` (see `test/pixel-engine.test.js`'s `drawHighDetailCharacterSprite` test).
- `npm test` currently passes **75/75** (`node --test test/**/*.test.js` plus a syntax-check of `index.html`, `cards.js`, `server/server.js`). This must stay green after every task. Note the original spec's "62/62" figure is stale — the suite has grown since that document was written.

## Adapted From the Original Spec — Read Before Executing

`CLAUDE_CODE_GRAPHICS_PROMPT.md` was written without inspecting the actual repo and makes three assumptions that don't hold. This plan deliberately diverges from it in these places:

1. **No `public/assets/` per-sprite-PNG pipeline, no `asset-loader.js`.** The repo already has an atlas-based asset pipeline (`scripts/generate_procedural_atlases.js` → `assets/atlases/*.png`, `scripts/generate_full_scale_sprite_packs.js` → `assets/sprite_packs/*.png` + `sprite_manifest.json`), covered by `test/atlases.test.js` and `test/sprite-packs.test.js`. However — confirmed via grep — **nothing in `index.html` ever loads these PNGs** (`new Image()` / `.src =` against `assets/atlases` or `assets/sprite_packs` returns zero hits). The game renders 100% live via Canvas2D fill calls (`drawProceduralBackground`, `drawHighDetailCharacterSprite`, `CardVisualRenderer`). Switching the renderer to consume the atlas files would be a real architecture change (load images, wait for `onload`, slice frames), not a "fidelity upgrade," and risks the existing 75 passing tests. This plan improves the code that is actually on screen instead. Wiring up the orphaned atlas pipeline is a legitimate follow-up but is out of scope here — flag it to the user as a separate future initiative if visual fidelity from procedural fills hits a ceiling.
2. **No new `particle-system.js`.** The spec's Section 11 file manifest says to create this and lists `weather-effects-system.js` under "Files to Ignore" — but `weather-effects-system.js` **is** the particle system: it already implements the spec's `RainSystem` (16 drops, 1×4px lines) and `NeonFlicker` (4-frame cycle) as `WeatherEffectsSystem` methods, plus steam plumes and police sirens the spec doesn't even ask for. Task 6 extends this existing file instead of duplicating it.
3. **No 65th "highlight white" palette color.** `test/pixel-engine.test.js` locks `MASTER_PALETTE_64` to exactly 64 unique colors. `paletteShift()` (Task 1) produces usable highlights by clamping toward the brightest existing tone in a color's group, which satisfies the spec's actual intent ("highlights: shift palette index up") without breaking that invariant.

## File Structure

- **Modify** `src/pixel_engine/pixel-engine.js` — add `paletteShift`/`snapToPixel` helpers (Task 1), offscreen bg/mg layer caching on `PixelCanvasEngine` (Task 2), palette-index shading in `drawHighDetailCharacterSprite` (Task 5).
- **Create** `src/pixel_engine/lightmap.js` — streetlamp/neon position registries + pre-rendered lightmap compositing (Task 3).
- **Modify** `index.html` — split `drawProceduralBackground` into cached sky/far and near/street layers, wire the lightmap composite into the render loop (Task 4).
- **Modify** `src/pixel_engine/weather-effects-system.js` — correct `renderNeonFlicker` to the spec's 4-stage alpha curve without `globalAlpha` (Task 6).
- **Modify** `src/pixel_engine/card-visual-system.js` — memoize card text word-wrap to stop re-running `measureText` every render tick (Task 6).
- **Create** `test/lightmap.test.js`; **modify** `test/pixel-engine.test.js`, `test/weather-effects-system.test.js`, `test/card-visual-system.test.js`.

---

### Task 1: Palette-shift and pixel-snap helpers

**Files:**
- Modify: `src/pixel_engine/pixel-engine.js` (add after `CITY_THEME_OVERRIDES`, before `calculateIntegerScale`, around line 38)
- Modify: `src/pixel_engine/pixel-engine.js` module.exports block (lines 361–372) and `window` assignment (line 357)
- Test: `test/pixel-engine.test.js`

**Interfaces:**
- Produces: `paletteShift(hex: string, steps: number) => string` — looks up `hex` (case-insensitive) in the four `MASTER_PALETTE_64` groups, returns the color `steps` positions away in that group, clamped to the group's bounds. Returns `hex` unchanged if not found in any group.
- Produces: `snapToPixel(value: number) => number` — `Math.floor(value)`.

- [ ] **Step 1: Write the failing tests**

Add to `test/pixel-engine.test.js` (extend the existing `require` destructure to include `paletteShift, snapToPixel`):

```javascript
const {
  NATIVE_WIDTH,
  NATIVE_HEIGHT,
  MASTER_PALETTE_64,
  CITY_THEME_OVERRIDES,
  calculateIntegerScale,
  drawHighDetailCharacterSprite,
  paletteShift,
  snapToPixel
} = require('../src/pixel_engine/pixel-engine.js');

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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `paletteShift is not a function` (destructure yields `undefined`).

- [ ] **Step 3: Implement the helpers**

In `src/pixel_engine/pixel-engine.js`, insert after the `CITY_THEME_OVERRIDES` block (after line 38):

```javascript
const PALETTE_GROUPS = [
  MASTER_PALETTE_64.blacks_grays,
  MASTER_PALETTE_64.warm_tones,
  MASTER_PALETTE_64.cool_tones,
  MASTER_PALETTE_64.skin_tones
];

/**
 * Shifts a hex color `steps` positions within its MASTER_PALETTE_64 tone group.
 * Negative steps darken (shadow), positive steps lighten (highlight).
 * Clamps at group boundaries; returns the input unchanged if not a palette color.
 */
function paletteShift(hex, steps) {
  const normalized = hex.toUpperCase();
  for (const group of PALETTE_GROUPS) {
    const index = group.indexOf(normalized);
    if (index !== -1) {
      const clamped = Math.max(0, Math.min(group.length - 1, index + steps));
      return group[clamped];
    }
  }
  return hex;
}

function snapToPixel(value) {
  return Math.floor(value);
}
```

Update the exports at the bottom of the file. Replace the `module.exports` block (lines 361–372):

```javascript
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    NATIVE_WIDTH,
    NATIVE_HEIGHT,
    MASTER_PALETTE_64,
    CITY_THEME_OVERRIDES,
    calculateIntegerScale,
    PixelCanvasEngine,
    SpriteRenderer,
    drawHighDetailCharacterSprite,
    paletteShift,
    snapToPixel
  };
}
```

And extend the `window` assignment (currently only `window.drawHighDetailCharacterSprite = ...` at line 357-359) to also expose the new helpers:

```javascript
if (typeof window !== 'undefined') {
  window.drawHighDetailCharacterSprite = drawHighDetailCharacterSprite;
  window.paletteShift = paletteShift;
  window.snapToPixel = snapToPixel;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS — all prior 75 tests plus the 4 new ones (79 total).

- [ ] **Step 5: Commit**

```bash
git add src/pixel_engine/pixel-engine.js test/pixel-engine.test.js
git commit -m "feat: add paletteShift and snapToPixel helpers for palette-correct shading"
```

---

### Task 2: Offscreen background/midground layer caching on PixelCanvasEngine

**Files:**
- Modify: `src/pixel_engine/pixel-engine.js` — `PixelCanvasEngine` class (lines 60–132)
- Test: `test/pixel-engine.test.js`

**Interfaces:**
- Consumes: nothing new (pure class extension).
- Produces: `engine.drawBackground(drawFn)`, `engine.drawMidground(drawFn, offsetX)`, `engine.invalidateBackground()` on `PixelCanvasEngine` instances. `drawFn` signature: `(ctx: CanvasRenderingContext2D, width: number, height: number) => void`. `engine.needsBgRedraw: boolean`, `engine.bgLayer`/`engine.bgCtx`, `engine.mgLayer`/`engine.mgCtx` become instance properties. Task 4 consumes these directly.

Because `PixelCanvasEngine`'s constructor calls `document.createElement`, it cannot be instantiated inside the Node test runner (no DOM). Follow the same technique the file's other DOM-dependent code implicitly requires: test the new prototype methods by calling them against a **fake `this`** object that only has the properties the method touches — no real canvas needed.

- [ ] **Step 1: Write the failing test**

Add to `test/pixel-engine.test.js`:

```javascript
const { PixelCanvasEngine } = require('../src/pixel_engine/pixel-engine.js');

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
  const fakeEngine = { activeCity: 'Harlem', needsBgRedraw: false };
  PixelCanvasEngine.prototype.setCityTheme.call(fakeEngine, 'Harlem');
  assert.equal(fakeEngine.needsBgRedraw, false, 'Setting the same city must not force a redraw');

  PixelCanvasEngine.prototype.setCityTheme.call(fakeEngine, 'Chicago');
  assert.equal(fakeEngine.activeCity, 'Chicago');
  assert.equal(fakeEngine.needsBgRedraw, true, 'Changing city must invalidate the cached background');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `PixelCanvasEngine.prototype.drawBackground` is undefined; the `setCityTheme` redraw-on-change test fails against current behavior (it never invalidates).

- [ ] **Step 3: Implement the layer caching**

In `src/pixel_engine/pixel-engine.js`, inside the `PixelCanvasEngine` constructor, after the `virtualCanvas`/`virtualCtx` setup (after line 74, before `this.setupSmoothing(this.displayCtx);` on line 76), add:

```javascript
    // Offscreen background/midground layers for parallax caching
    this.bgLayer = document.createElement("canvas");
    this.bgLayer.width = this.nativeWidth;
    this.bgLayer.height = this.nativeHeight;
    this.bgCtx = this.bgLayer.getContext("2d", { willReadFrequently: false });
    this.setupSmoothing(this.bgCtx);

    this.mgLayer = document.createElement("canvas");
    this.mgLayer.width = this.nativeWidth;
    this.mgLayer.height = this.nativeHeight;
    this.mgCtx = this.mgLayer.getContext("2d", { willReadFrequently: false });
    this.setupSmoothing(this.mgCtx);

    this.needsBgRedraw = true;
```

Also update the two existing `getContext("2d", ...)` calls in the constructor (lines 63 and 74) to include `willReadFrequently: false`:

```javascript
    this.displayCtx = displayCanvas.getContext("2d", { alpha: false, desynchronized: true, willReadFrequently: false });
```

```javascript
    this.virtualCtx = this.virtualCanvas.getContext("2d", { alpha: false, willReadFrequently: false });
```

Replace the existing `setCityTheme` method (lines 93–97) so it invalidates the cache on an actual change:

```javascript
  setCityTheme(cityName) {
    if (CITY_THEME_OVERRIDES[cityName] && cityName !== this.activeCity) {
      this.activeCity = cityName;
      this.invalidateBackground();
    }
  }
```

Add the three new methods directly after `setCityTheme`:

```javascript
  drawBackground(drawFn) {
    if (this.needsBgRedraw) {
      this.bgCtx.clearRect(0, 0, this.nativeWidth, this.nativeHeight);
      drawFn(this.bgCtx, this.nativeWidth, this.nativeHeight);
      this.needsBgRedraw = false;
    }
    this.virtualCtx.drawImage(this.bgLayer, 0, 0);
  }

  drawMidground(drawFn, offsetX = 0) {
    this.mgCtx.clearRect(0, 0, this.nativeWidth, this.nativeHeight);
    drawFn(this.mgCtx, this.nativeWidth, this.nativeHeight);
    this.virtualCtx.drawImage(this.mgLayer, Math.floor(offsetX), 0);
  }

  invalidateBackground() {
    this.needsBgRedraw = true;
  }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS — 83 total tests.

- [ ] **Step 5: Commit**

```bash
git add src/pixel_engine/pixel-engine.js test/pixel-engine.test.js
git commit -m "feat: cache background/midground layers on PixelCanvasEngine for parallax rendering"
```

---

### Task 3: Lightmap module (streetlamp + neon pre-rendered lighting)

**Files:**
- Create: `src/pixel_engine/lightmap.js`
- Create: `test/lightmap.test.js`

**Interfaces:**
- Consumes: nothing (standalone module, mirrors the dual-export pattern of every file in `src/pixel_engine/`).
- Produces: `getStreetlampPositions(city: string) => Array<{x:number, y:number}>`, `getNeonSignPositions(city: string) => Array<{x:number, y:number, color:string}>` (rgba string, alpha channel `1`), `renderLightmap(ctx, W, H, city, heat)` (draws into a provided 2D context), `applyLightmap(nativeCtx, lightmapCanvas)` (multiply-composites), `generateLightmapCanvas(W, H, city, heat) => HTMLCanvasElement` (DOM-only, used by Task 4, not unit-tested directly). Task 4 consumes all five.

- [ ] **Step 1: Write the failing tests**

Create `test/lightmap.test.js`:

```javascript
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module '../src/pixel_engine/lightmap.js'`.

- [ ] **Step 3: Implement the lightmap module**

Create `src/pixel_engine/lightmap.js`:

```javascript
/**
 * Concrete Kings: The Block Chronicles
 * Pre-Rendered Lightmap System (streetlamp glow + neon pools, composited once per beat)
 * Version: 1.0.0
 */

const STREETLAMP_POSITIONS = {
  Harlem:    [{ x: 160, y: 520 }, { x: 1120, y: 520 }],
  Chicago:   [{ x: 140, y: 500 }, { x: 900, y: 500 }, { x: 1150, y: 500 }],
  Miami:     [{ x: 180, y: 540 }, { x: 1100, y: 540 }],
  Detroit:   [{ x: 150, y: 510 }, { x: 1130, y: 510 }],
  NOLA:      [{ x: 170, y: 530 }, { x: 1110, y: 530 }],
  Baltimore: [{ x: 160, y: 515 }, { x: 1120, y: 515 }],
  Atlanta:   [{ x: 155, y: 505 }, { x: 1125, y: 505 }],
  Oakland:   [{ x: 165, y: 525 }, { x: 1115, y: 525 }]
};

const NEON_SIGN_POSITIONS = {
  Harlem:    [{ x: 640, y: 360, color: 'rgba(255, 122, 69, 1)' }],
  Chicago:   [{ x: 640, y: 340, color: 'rgba(94, 170, 255, 1)' }],
  Miami:     [{ x: 640, y: 320, color: 'rgba(111, 232, 216, 1)' }],
  Detroit:   [{ x: 640, y: 360, color: 'rgba(217, 56, 46, 1)' }],
  NOLA:      [{ x: 640, y: 350, color: 'rgba(240, 171, 67, 1)' }],
  Baltimore: [{ x: 640, y: 355, color: 'rgba(255, 205, 104, 1)' }],
  Atlanta:   [{ x: 640, y: 345, color: 'rgba(170, 39, 36, 1)' }],
  Oakland:   [{ x: 640, y: 365, color: 'rgba(51, 148, 136, 1)' }]
};

function getStreetlampPositions(city) {
  return STREETLAMP_POSITIONS[city] || STREETLAMP_POSITIONS.Harlem;
}

function getNeonSignPositions(city) {
  return NEON_SIGN_POSITIONS[city] || NEON_SIGN_POSITIONS.Harlem;
}

function renderLightmap(ctx, W, H, city, heat) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fillRect(0, 0, W, H);

  getStreetlampPositions(city).forEach(lamp => {
    const gradient = ctx.createRadialGradient(lamp.x, lamp.y, 0, lamp.x, lamp.y, 128);
    gradient.addColorStop(0, "rgba(255, 196, 117, 0.4)");
    gradient.addColorStop(1, "rgba(255, 196, 117, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(lamp.x - 128, lamp.y - 128, 256, 256);
  });

  getNeonSignPositions(city).forEach(sign => {
    const gradient = ctx.createRadialGradient(sign.x, sign.y, 0, sign.x, sign.y, 64);
    gradient.addColorStop(0, sign.color.replace("1)", "0.3)"));
    gradient.addColorStop(1, sign.color.replace("1)", "0)"));
    ctx.fillStyle = gradient;
    ctx.fillRect(sign.x - 64, sign.y - 64, 128, 128);
  });

  if (heat >= 7) {
    ctx.fillStyle = "rgba(255, 122, 69, 0.05)";
    ctx.fillRect(0, 0, W, H);
  }
}

function applyLightmap(nativeCtx, lightmapCanvas) {
  nativeCtx.globalCompositeOperation = "multiply";
  nativeCtx.drawImage(lightmapCanvas, 0, 0);
  nativeCtx.globalCompositeOperation = "source-over";
}

function generateLightmapCanvas(W, H, city, heat) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  renderLightmap(ctx, W, H, city, heat);
  return canvas;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getStreetlampPositions,
    getNeonSignPositions,
    renderLightmap,
    applyLightmap,
    generateLightmapCanvas
  };
}

if (typeof window !== 'undefined') {
  window.getStreetlampPositions = getStreetlampPositions;
  window.getNeonSignPositions = getNeonSignPositions;
  window.renderLightmap = renderLightmap;
  window.applyLightmap = applyLightmap;
  window.generateLightmapCanvas = generateLightmapCanvas;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS — 89 total tests.

- [ ] **Step 5: Commit**

```bash
git add src/pixel_engine/lightmap.js test/lightmap.test.js
git commit -m "feat: add pre-rendered lightmap module with streetlamp and neon glow pools"
```

---

### Task 4: Wire parallax layers and lightmap compositing into the render loop

**Files:**
- Modify: `index.html` (script tags around line 1016; `drawProceduralBackground` at lines 1435–1564; render loop at lines 2508–2545)

**Interfaces:**
- Consumes: `PixelCanvasEngine.drawBackground`/`drawMidground`/`invalidateBackground`/`setCityTheme` (Task 2), `generateLightmapCanvas`/`applyLightmap` (Task 3), `this.mapController.x` (existing, `src/pixel_engine/block-map-navigation.js:101`), `this.storyEngine.heat` (existing, confirmed live at `index.html:2998`).
- Produces: `drawSkyAndFarLayer(ctx, city, frame)`, `drawNearLayer(ctx, city, frame)` — global functions in `index.html`'s inline script (no module boundary there; nothing outside this file needs to import them).

There is no unit-test harness for `index.html`'s inline script beyond the existing syntax check in `npm test` (`new Function(scriptBody)` — parse-only, not executed). This task's correctness is verified by that syntax check plus the visual/Playwright pass in Task 7; do not invent a fake behavioral test for it.

- [ ] **Step 1: Add the lightmap script tag**

In `index.html`, after line 1016 (`<script src="src/pixel_engine/pixel-engine.js"></script>`), add:

```html
<script src="src/pixel_engine/lightmap.js"></script>
```

- [ ] **Step 2: Run the syntax check to confirm the tag doesn't break parsing**

Run: `npm test`
Expected: PASS (script tag addition doesn't touch the inline `<script>` block npm test parses).

- [ ] **Step 3: Split `drawProceduralBackground` into a far layer and a near layer**

Replace the single `drawProceduralBackground(ctx, city, frame)` function (lines 1435–1564) with two functions covering the same drawing, split at the point where the spec's parallax model separates sky/distant buildings from street-level brick/signage. The sky gradient, star/window dots, and the two distant building blocks (current lines 1442–1493, "everything before the near brick facade block") become `drawSkyAndFarLayer`; the brick facade, awning, windows, bodega sign, and street-level trim (current lines 1495–1563) become `drawNearLayer`. Both keep using the existing `hdRect`/`hdScaleX`/`hdScaleY` helpers unchanged — those read `ctx.canvas.width`/`height`, which stays correct because the offscreen `bgCtx`/`mgCtx` canvases Task 2 created are sized to the same `nativeWidth`/`nativeHeight` as the old single canvas:

```javascript
function drawSkyAndFarLayer(ctx, city, frame) {
  const colorMap = CITY_THEME_OVERRIDES[city] || {};
  const skyTop = city === 'Miami' ? '#521c6e' : (city === 'Detroit' ? '#11233f' : '#0a1526');
  const skyBottom = city === 'Miami' ? '#ff7a45' : (city === 'Atlanta' ? '#aa2724' : '#11233f');
  const brickColor = colorMap["7a1d1c"] ? "#" + colorMap["7a1d1c"] : "#7a1d1c";
  const trimColor = colorMap["474d5e"] ? "#" + colorMap["474d5e"] : "#474d5e";

  const grad = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
  grad.addColorStop(0, skyTop);
  grad.addColorStop(1, skyBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  if (city === 'Chicago' || city === 'Oakland') {
    ctx.fillStyle = '#8b95ab';
    ctx.fillRect(...hdRect(ctx, 40 + (frame % 4) * 2, 15, 20, 2));
    ctx.fillRect(...hdRect(ctx, 180 - (frame % 4) * 2, 25, 30, 2));
  } else {
    ctx.fillStyle = '#f4f7ff';
    [[30,10],[110,20],[220,12],[280,25]].forEach(([x,y]) => {
      const r = hdRect(ctx, x, y, 1, 1);
      ctx.fillRect(r[0], r[1], r[2], r[3]);
    });
  }

  ctx.fillStyle = '#1c375c';
  if (city === 'Detroit') {
    ctx.fillRect(...hdRect(ctx, 20, 35, 40, 25));
    ctx.fillRect(...hdRect(ctx, 50, 20, 5, 20));
    ctx.fillRect(...hdRect(ctx, 150, 40, 60, 20));
    ctx.fillRect(...hdRect(ctx, 250, 30, 30, 30));
  } else if (city === 'Chicago' || city === 'Harlem') {
    ctx.fillRect(...hdRect(ctx, 10, 20, 25, 40));
    ctx.fillRect(...hdRect(ctx, 50, 10, 35, 50));
    ctx.fillRect(...hdRect(ctx, 120, 25, 20, 35));
    ctx.fillRect(...hdRect(ctx, 180, 15, 30, 45));
    ctx.fillRect(...hdRect(ctx, 260, 30, 25, 30));
  } else if (city === 'Miami') {
    ctx.fillStyle = '#2a1138';
    [40, 280].forEach(tx => {
      ctx.fillRect(...hdRect(ctx, tx, 30, 2, 30));
      ctx.fillRect(...hdRect(ctx, tx - 6, 28, 14, 2));
      ctx.fillRect(...hdRect(ctx, tx - 4, 26, 10, 2));
    });
    ctx.fillStyle = '#1c375c';
  } else {
    ctx.fillRect(...hdRect(ctx, 20, 40, 50, 20));
    ctx.fillRect(...hdRect(ctx, 110, 35, 70, 25));
    ctx.fillRect(...hdRect(ctx, 220, 45, 60, 15));
  }

  const lightColor = city === 'Miami' ? '#6fe8d8' : '#ffc475';
  ctx.fillStyle = lightColor;
  ctx.fillRect(...hdRect(ctx, 40, 70 - (frame % 2), 4, 4));
  ctx.fillRect(...hdRect(ctx, 270, 70 - (frame % 2), 4, 4));

  ctx.fillStyle = '#666e82';
  ctx.fillRect(...hdRect(ctx, 41, 74, 2, 46));
  ctx.fillRect(...hdRect(ctx, 271, 74, 2, 46));
}

function drawNearLayer(ctx, city, frame) {
  const colorMap = CITY_THEME_OVERRIDES[city] || {};
  const brickColor = colorMap["7a1d1c"] ? "#" + colorMap["7a1d1c"] : "#7a1d1c";
  const trimColor = colorMap["474d5e"] ? "#" + colorMap["474d5e"] : "#474d5e";

  ctx.fillStyle = brickColor;
  if (city === 'Harlem' || city === 'Baltimore') {
    ctx.fillRect(...hdRect(ctx, 60, 40, 200, 80));
    ctx.fillStyle = '#2b0d0d';
    for (let by = 45; by < 120; by += 12) {
      for (let bx = 60; bx < 260; bx += 20) {
        ctx.fillRect(...hdRect(ctx, bx + (by % 2 * 5), by, 2, 1));
      }
    }
  } else if (city === 'Chicago') {
    ctx.fillRect(...hdRect(ctx, 60, 40, 200, 80));
    ctx.fillStyle = '#393e4d';
    for (let bx = 60; bx < 260; bx += 40) {
      ctx.fillRect(...hdRect(ctx, bx, 40, 1, 80));
    }
  } else if (city === 'Miami') {
    ctx.fillRect(...hdRect(ctx, 60, 45, 200, 75));
    ctx.fillStyle = '#f25438';
    ctx.fillRect(...hdRect(ctx, 60, 50, 200, 3));
    ctx.fillRect(...hdRect(ctx, 158, 45, 4, 75));
  } else if (city === 'Detroit') {
    ctx.fillRect(...hdRect(ctx, 60, 40, 200, 80));
    ctx.fillStyle = '#101116';
    for (let bx = 65; bx < 260; bx += 10) {
      ctx.fillRect(...hdRect(ctx, bx, 40, 1, 80));
    }
  } else {
    ctx.fillRect(...hdRect(ctx, 60, 40, 200, 80));
  }

  ctx.fillStyle = (city === 'Miami') ? '#6fe8d8' : ((city === 'Detroit') ? '#181920' : '#ffe299');
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 5; col++) {
      if (city === 'Miami' && col === 2) continue;
      const win = hdRect(ctx, 75 + col * 35, 52 + row * 25, 16, 16);
      ctx.fillRect(win[0], win[1], win[2], win[3]);

      ctx.fillStyle = '#181920';
      ctx.fillRect(...hdRect(ctx, 75 + col * 35 + 7, 52 + row * 25, 2, 16));
      ctx.fillRect(...hdRect(ctx, 75 + col * 35, 52 + row * 25 + 7, 16, 2));
      ctx.fillStyle = (city === 'Miami') ? '#6fe8d8' : ((city === 'Detroit') ? '#181920' : '#ffe299');
    }
  }

  ctx.fillStyle = '#6e3e14';
  ctx.fillRect(...hdRect(ctx, 145, 75, 30, 45));
  ctx.fillStyle = '#c9822b';
  ctx.fillRect(...hdRect(ctx, 170, 98, 2, 2));

  ctx.fillStyle = '#474d5e';
  ctx.fillRect(...hdRect(ctx, 140, 110, 40, 4));
  ctx.fillRect(...hdRect(ctx, 135, 114, 50, 4));
  ctx.fillRect(...hdRect(ctx, 130, 118, 60, 3));

  ctx.fillStyle = trimColor;
  ctx.fillRect(...hdRect(ctx, 0, 120, 320, 20));

  ctx.fillStyle = '#2d313d';
  for (let sx = 0; sx < 320; sx += 40) {
    ctx.fillRect(...hdRect(ctx, sx, 120, 1, 20));
  }

  ctx.fillStyle = '#101116';
  ctx.fillRect(...hdRect(ctx, 0, 140, 320, 40));

  ctx.fillStyle = '#ffcd68';
  for (let rx = 10; rx < 320; rx += 40) {
    ctx.fillRect(...hdRect(ctx, rx, 158, 20, 4));
  }
}
```

- [ ] **Step 4: Run the syntax check**

Run: `npm test`
Expected: PASS — the function split is a pure refactor, no behavior change yet.

- [ ] **Step 5: Wire the layered draw + lightmap composite into the render loop**

In `index.html`, replace the render loop body currently at lines 2522–2532:

```javascript
            this.mapController.update();
            this.weatherSystem.advanceFrame();
            
            const vCtx = this.pixelEngine.virtualCtx;
            this.pixelEngine.clearNative('#08080a');
            
            const city = this.game.activeCity || 'Harlem';
            drawProceduralBackground(vCtx, city, this.shimmerFrame);
            
            this.weatherSystem.render(vCtx);
```

with:

```javascript
            this.mapController.update();
            this.weatherSystem.advanceFrame();
            
            const vCtx = this.pixelEngine.virtualCtx;
            this.pixelEngine.clearNative('#08080a');
            
            const city = this.game.activeCity || 'Harlem';
            this.pixelEngine.setCityTheme(city);

            this.pixelEngine.drawBackground(bgCtx => drawSkyAndFarLayer(bgCtx, city, this.shimmerFrame));

            const scrollOffset = Math.floor(this.mapController.x * 0.15);
            this.pixelEngine.drawMidground(mgCtx => drawNearLayer(mgCtx, city, this.shimmerFrame), -scrollOffset);

            const heat = (this.storyEngine && this.storyEngine.heat) || 0;
            const lightmapKey = city + '_' + heat;
            if (this.lightmapKey !== lightmapKey) {
              this.lightmapCanvas = generateLightmapCanvas(this.pixelEngine.nativeWidth, this.pixelEngine.nativeHeight, city, heat);
              this.lightmapKey = lightmapKey;
            }
            applyLightmap(vCtx, this.lightmapCanvas);

            this.weatherSystem.render(vCtx);
```

This preserves every downstream line unchanged (`this.mapController.render(vCtx)`, remote avatar draws, `this.pixelEngine.present()`, proximity checks) since `vCtx` is still the same `this.pixelEngine.virtualCtx` they already draw onto.

- [ ] **Step 6: Run the syntax check**

Run: `npm test`
Expected: PASS.

- [ ] **Step 7: Manual smoke check**

Open `index.html` in a browser (or use the `run` skill), start a game, and confirm: no console errors, the background renders (sky + buildings + street), and switching city (if reachable in the current game flow) doesn't leave stale art from the previous city. Full cross-viewport/Playwright verification happens in Task 7 — this step is just a fast fail-early check before moving on.

- [ ] **Step 8: Commit**

```bash
git add index.html
git commit -m "feat: layer procedural backgrounds with parallax scroll and lightmap compositing"
```

---

### Task 5: Palette-index character shading (replace flat black/white overlays)

**Files:**
- Modify: `src/pixel_engine/pixel-engine.js` — `drawHighDetailCharacterSprite` (lines 188–355)
- Test: `test/pixel-engine.test.js`

**Interfaces:**
- Consumes: `paletteShift` (Task 1).
- Produces: no new exports — behavioral change only, guarded by the regression test below.

The spec's rule 2.2 is explicit: "Shadows: shift palette index down by 1-2 stops; never add black on top" and "Highlights: shift palette index up by 1-2 stops; never add white on top." The current implementation violates this three times: the ambient drop shadow, the melanin shading overlay (`rgba(20, 10, 7, 0.25)`), and the pants wrinkle shadow (`rgba(8, 8, 10, 0.2)`) all layer flat black alpha on top of the base color instead of shifting the palette index.

- [ ] **Step 1: Write the failing regression test**

Add to `test/pixel-engine.test.js`:

```javascript
test('Pixel Engine: drawHighDetailCharacterSprite shades via palette-index shifts, never flat black/white overlays', () => {
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

  const forbidden = ['rgba(20, 10, 7, 0.25)', 'rgba(8, 8, 10, 0.2)'];
  forbidden.forEach(style => {
    assert.ok(!fillStyles.includes(style), `Shading must not use flat overlay "${style}" — shift the palette index instead`);
  });

  const shadowSkin = paletteShift(origin.skinColor, -2);
  assert.ok(fillStyles.includes(shadowSkin), 'Melanin shading must be the palette-shifted skin tone');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `fillStyles` still contains `'rgba(20, 10, 7, 0.25)'` and `'rgba(8, 8, 10, 0.2)'`; the shifted skin tone is never assigned.

- [ ] **Step 3: Replace the flat overlays with palette shifts**

In `src/pixel_engine/pixel-engine.js`, inside `drawHighDetailCharacterSprite`:

Replace the melanin shading block (large-scale branch, lines 210–213):

```javascript
     // Melanin shading shadow (left side & bottom)
     ctx.fillStyle = 'rgba(20, 10, 7, 0.25)';
     ctx.fillRect(px + 48, py - 72 + yBob, 8, 32);
     ctx.fillRect(px + 48, py - 48 + yBob, 32, 8);
```

with:

```javascript
     // Melanin shading shadow (left side & bottom) — palette-index shift, no black overlay
     ctx.fillStyle = paletteShift(origin.skinColor, -2);
     ctx.fillRect(px + 48, py - 72 + yBob, 8, 32);
     ctx.fillRect(px + 48, py - 48 + yBob, 32, 8);
```

Replace the small-scale melanin shading (lines 224–226):

```javascript
     // Skin shadow
     ctx.fillStyle = 'rgba(20, 10, 7, 0.25)';
     ctx.fillRect(px + 12, py - 18 + yBob, 2, 8);
```

with:

```javascript
     // Skin shadow — palette-index shift, no black overlay
     ctx.fillStyle = paletteShift(origin.skinColor, -1);
     ctx.fillRect(px + 12, py - 18 + yBob, 2, 8);
```

Replace the pants wrinkle shadow (large-scale branch, lines 317–320):

```javascript
     // Pants shadow wrinkles
     ctx.fillStyle = 'rgba(8, 8, 10, 0.2)';
     ctx.fillRect(px + 44 + legOffset, py + 12, 16, 4);
     ctx.fillRect(px + 68 - legOffset, py + 12, 16, 4);
```

with:

```javascript
     // Pants shadow wrinkles — palette-index shift, no black overlay
     ctx.fillStyle = paletteShift(origin.pantsColor, -1);
     ctx.fillRect(px + 44 + legOffset, py + 12, 16, 4);
     ctx.fillRect(px + 68 - legOffset, py + 12, 16, 4);
```

Leave the ambient drop shadow (`rgba(8, 8, 10, 0.35)` ellipse under the character's feet) unchanged — that's a ground contact shadow cast onto the *background*, not shading on the character's own palette-colored surfaces, so the spec's "never add black on top" rule (which is about shading a colored surface) doesn't apply to it.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — 90 total tests.

- [ ] **Step 5: Commit**

```bash
git add src/pixel_engine/pixel-engine.js test/pixel-engine.test.js
git commit -m "fix: shade character sprites via palette-index shifts instead of flat black overlays"
```

---

### Task 6: Neon flicker curve fix and card text wrap memoization

**Files:**
- Modify: `src/pixel_engine/weather-effects-system.js` — `renderNeonFlicker` (lines 155–161)
- Modify: `src/pixel_engine/card-visual-system.js` — `renderCardText` (lines 276–305)
- Test: `test/weather-effects-system.test.js`, `test/card-visual-system.test.js`

**Interfaces:**
- Consumes: nothing new.
- Produces: no new exports — `renderNeonFlicker` behavior change (4-stage alpha curve instead of binary on/off) and a new module-private `wrapCardText(ctx, text, maxWidth)` helper inside `card-visual-system.js` used by `renderCardText`.

**Part A — neon flicker.** The spec (Section 7.3) wants a 4-stage alpha curve `[1.0, 0.7, 1.0, 0.9]`. The current code (`isLit = frameIndex !== 1`) only has two states (fully on / fully off). The spec's own DO-NOT list also forbids `ctx.globalAlpha` during gameplay, so the alpha must be baked into the `rgba(...)` fillStyle string, not applied via `ctx.globalAlpha`.

- [ ] **Step 1: Write the failing test**

Add to `test/weather-effects-system.test.js`:

```javascript
test('Weather System: renderNeonFlicker cycles a 4-stage alpha curve baked into fillStyle, never touching globalAlpha', () => {
  const system = new WeatherEffectsSystem(320, 180);
  system.setMode(WEATHER_MODES.NEON_FLICKER);

  const fillStyles = [];
  const ctx = new Proxy({}, {
    set(target, prop, value) {
      if (prop === 'globalAlpha') {
        throw new Error('renderNeonFlicker must not use ctx.globalAlpha during gameplay');
      }
      if (prop === 'fillStyle') fillStyles.push(value);
      target[prop] = value;
      return true;
    },
    get(target, prop) {
      if (prop === 'fillRect') return () => {};
      return target[prop];
    }
  });

  for (let i = 0; i < 4; i++) {
    system.render(ctx);
    system.advanceFrame();
  }

  const alphas = fillStyles.map(s => Number(s.match(/,\s*([\d.]+)\)$/)[1]));
  assert.deepEqual(alphas, [1, 0.7, 1, 0.9]);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — current `renderNeonFlicker` only produces solid `'#f25438'` or skips drawing; the regex match on a non-rgba string throws or the alpha array doesn't match.

- [ ] **Step 3: Implement the 4-stage curve**

In `src/pixel_engine/weather-effects-system.js`, replace `renderNeonFlicker` (lines 155–161):

```javascript
  /**
   * Anim ID: A-05 - Bodega Neon Flicker (4-Frame Loop)
   */
  renderNeonFlicker(ctx) {
    const isLit = (this.frameIndex !== 1); // Random flicker off on frame 1
    if (isLit) {
      ctx.fillStyle = '#f25438'; // Neon Crimson (#F25438)
      ctx.fillRect(100, 48, 40, 8);
    }
  }
```

with:

```javascript
  /**
   * Anim ID: A-05 - Bodega Neon Flicker (4-Frame Loop, alpha baked into fillStyle — never ctx.globalAlpha)
   */
  renderNeonFlicker(ctx) {
    const alphas = [1, 0.7, 1, 0.9];
    const alpha = alphas[this.frameIndex];
    ctx.fillStyle = `rgba(242, 84, 56, ${alpha})`; // Neon Crimson (#F25438)
    ctx.fillRect(100, 48, 40, 8);
  }
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS.

**Part B — card text memoization.** `renderCardText` calls `ctx.measureText` inside a word-wrap loop on every single `renderCard` invocation, even when the card's text hasn't changed between animation frames — this is exactly the anti-pattern the spec's Section 8.1 rule flags ("Never use `measureText` in the render loop; pre-measure during setup").

- [ ] **Step 5: Write the failing test**

Add to `test/card-visual-system.test.js` (extend the `require` destructure to include `CARD_CATEGORIES` if not already present — it already is):

```javascript
test('Card Visual System: renderCardText memoizes word-wrap so repeated renders of the same text skip measureText', () => {
  const renderer = new CardVisualRenderer();
  let measureCalls = 0;
  const mockCtx = {
    fillStyle: '', font: '', textAlign: '', lineWidth: 0, strokeStyle: '',
    fillRect() {}, fillText() {}, strokeRect() {},
    save() {}, restore() {}, beginPath() {}, rect() {}, clip() {},
    moveTo() {}, lineTo() {}, closePath() {}, fill() {}, stroke() {},
    measureText(str) { measureCalls++; return { width: str.length * 6 }; }
  };
  const category = CARD_CATEGORIES.BLOCK_LOYALTY;
  const text = 'A recurring caption that should only be measured once';

  renderer.renderCard(mockCtx, text, category, false);
  const firstPassCalls = measureCalls;
  assert.ok(firstPassCalls > 0, 'first render must measure text at least once');

  renderer.renderCard(mockCtx, text, category, false);
  assert.equal(measureCalls, firstPassCalls, 'second render of identical text must not call measureText again');
});
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `measureCalls` after the second render is roughly double `firstPassCalls`.

- [ ] **Step 7: Implement the memoized wrap helper**

In `src/pixel_engine/card-visual-system.js`, add a module-level cache above the `CardVisualRenderer` class (before line 128):

```javascript
const textWrapCache = new Map();

function wrapCardText(ctx, text, maxWidth) {
  const cacheKey = (text || '') + '|' + maxWidth;
  if (textWrapCache.has(cacheKey)) {
    return textWrapCache.get(cacheKey);
  }

  const words = (text || '').split(' ');
  const lines = [];
  let line = '';
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      lines.push(line);
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  textWrapCache.set(cacheKey, lines);
  return lines;
}
```

Replace `renderCardText` (lines 276–305):

```javascript
  renderCardText(ctx, text, category) {
    ctx.fillStyle = category.type === CARD_TYPES.BLACK ? '#f4f7ff' : '#181920';
    
    // Background fill for lower text area
    ctx.fillStyle = category.type === CARD_TYPES.BLACK ? '#101116' : '#fff7e6';
    ctx.fillRect(8, 142, this.width - 16, this.height - 150);

    ctx.fillStyle = category.type === CARD_TYPES.BLACK ? '#f4f7ff' : '#101116';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';

    // Simple multi-line text wrapper
    const words = (text || '').split(' ');
    let line = '';
    let y = 162;
    const maxWidth = this.width - 24;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, this.width / 2, y);
        line = words[n] + ' ';
        y += 14;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, this.width / 2, y);
  }
```

with:

```javascript
  renderCardText(ctx, text, category) {
    // Background fill for lower text area
    ctx.fillStyle = category.type === CARD_TYPES.BLACK ? '#101116' : '#fff7e6';
    ctx.fillRect(8, 142, this.width - 16, this.height - 150);

    ctx.fillStyle = category.type === CARD_TYPES.BLACK ? '#f4f7ff' : '#101116';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';

    const maxWidth = this.width - 24;
    const lines = wrapCardText(ctx, text, maxWidth);

    let y = 162;
    lines.forEach(line => {
      ctx.fillText(line, this.width / 2, y);
      y += 14;
    });
  }
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS — 92 total tests.

- [ ] **Step 9: Commit**

```bash
git add src/pixel_engine/weather-effects-system.js src/pixel_engine/card-visual-system.js test/weather-effects-system.test.js test/card-visual-system.test.js
git commit -m "fix: correct neon flicker alpha curve and memoize card text word-wrap"
```

---

### Task 7: Full verification pass

**Files:** none (verification only — fix-forward if anything below turns up a bug).

**Interfaces:** none.

- [ ] **Step 1: Run the full automated suite**

Run: `npm test`
Expected: PASS — all tests green (92+, exact count depends on Task 1–6 additions), including the pre-existing `index.html`/`cards.js`/`server/server.js` syntax checks.

- [ ] **Step 2: Launch the app and visually confirm the upgrade**

Use the `run` skill (or Playwright MCP directly) to start the local server (`server/server.js` via `start-server.bat` or `node server/server.js`), open `index.html`, and step through to the in-game screen for at least two different cities (e.g. Harlem and Miami — they have visibly different sky/brick colors).

Confirm:
- No errors in the browser console.
- The background shows visible depth: sky/far buildings sit still while the near brick/street layer shifts slightly as `mapController.x` changes (walk the character left/right).
- The scene reads visibly darker/moodier where the lightmap's streetlamp and neon glow pools sit versus flat mid-tone elsewhere (the multiply composite should be visible, not invisible or blown-out white).
- Character sprites show a warm/skin-toned shadow (not a flat gray/black smudge) on the melanin shading and pants wrinkle areas.
- A displayed card (Setup, Judging, or Round Result screen) renders text correctly wrapped with no visual regression from the memoization change.
- The bodega neon sign (visible during `NEON_FLICKER` weather mode, if reachable in the current game state) pulses through 4 visibly distinct brightness levels instead of a hard on/off blink.

- [ ] **Step 3: Check at representative viewport sizes**

Resize the browser (or use Playwright's `browser_resize`) to at least: 1280×720 (native, scale 1×), 1920×1080 (desktop), and 1280×800 (Steam Deck). Confirm `calculateIntegerScale` still produces clean integer scaling with no blur (`image-rendering: pixelated` should already handle this — this step just confirms nothing in Tasks 1–6 broke it).

- [ ] **Step 4: Open `pixel-art-demo.html`**

Confirm it still loads without console errors — it exercises `PixelCanvasEngine`/`SpriteRenderer` directly and would surface any constructor-level regression from Task 2's layer-caching additions.

- [ ] **Step 5: Report results**

If every check in Steps 1–4 passes, the upgrade is complete — no further commit needed (Steps 1-4 are read-only verification). If any check fails, fix the specific regression in the file it belongs to, re-run `npm test`, and commit the fix with a message describing what broke and why (e.g. `fix: correct lightmap canvas sizing that caused a black screen at 1280x800`).

---

## Final Notes

- Every task above is independently shippable and independently testable — you can stop after any task and the game will run correctly with whatever fidelity improvements have landed so far.
- The three "Adapted From the Original Spec" deviations (no per-file PNG pipeline, no duplicate particle-system.js, no 65th palette color) are deliberate engineering calls grounded in what's actually wired into the renderer today. If the user wants the orphaned atlas pipeline (`assets/atlases/`, `assets/sprite_packs/`) actually consumed by the game instead of the live procedural Canvas2D drawing, that's a separate, larger architecture initiative and should get its own plan.
