# Top-Down Walkable City Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the ASCII tile-grid City Map with a dense, walkable top-down pixel city — one hand-authored district per city — and make it the game's single exploration surface.

**Architecture:** Four new focused modules under `src/pixel_engine/`: pure district data, a pure renderer, a stateful controller (movement/collision/camera/POI), and a reusable asset registry that lets generated pixel art override any procedurally-drawn element. The top-down map takes over the `blockMap` screen; the side-on `stage-canvas` is removed from `#game`, which also lifts the player's hand back above the fold at 1280x720.

**Tech Stack:** Plain browser JS loaded via `<script>` tags (no bundler), canvas 2D, `node --test` with the existing `MockCanvas` and `loadGameModule()` harnesses.

## Global Constraints

- Native target is 1280x720 with **no vertical scrolling** on the map screen. Map canvas is 960x520; district world is 2400x1300 (2.5x the viewport in both axes).
- Asset conventions come from `RETRO_PIXEL_TOPDOWN_MAP_PROMPT_PACK.md` and are binding: **16x16 native tiles**, 32x32 for buildings and props; atlases are power-of-2 with a 1-pixel gutter; sprite keys use that pack's category vocabulary — `ground`, `road`, `building`, `furniture`, `flora`, `decal`, `prop`, `icon`.
- Draw order follows the pack's §6.3 layers exactly: ground and roads (0), props and furniture (1), flora and weather (2), decals on buildings (3), roof details (4).
- Noir palette discipline from the pack: **dark dominant, neon accents used sparingly**. Neon hues are for small accents — signage, car bodies, active POI outlines — never large fills such as roofs or ground.
- The pack's "road = walk with speed modifier" (§6.2) is **out of scope**. Movement speed is uniform; roads are plain walkable. Revisit only as a separate change.
- The pack's §9 names `block-map-navigation.js` as the tilemap/collision home. This plan deliberately diverges: that file is the side-on system being replaced, and separating data/render/state into new modules is what makes collision and camera unit-testable. `BlockMapController` is retained only as the source of the five hotspot definitions.
- The five POIs are identical in every district and are the only POIs: `BARBER_SHOP`, `BODEGA`, `SHOP_DEAL`, `CHESS_PARK`, `LOCKED_DOOR`. Do not invent per-district POIs — new markers without new mechanics is fake UI.
- Every district colour must come from `assets/palettes/concrete_kings_64.json`. The four groups are `blacks_grays`, `warm_tones`, `cool_tones`, `skin_tones`, 16 entries each, uppercase hex.
- Quest filter chips and fog of war are **removed, not ported**. Neither has a data model: quest glyphs are hardcoded at grid cells 4,3 / 16,3 / 16,8 and there is no explored/visited tracking anywhere.
- Zoom controls are removed. The camera follows the player at fixed scale.
- Three couplings must survive the migration or they break silently: the shared `stage-canvas` (renders when `gameActive || mapActive`), the online `avatar_update` broadcast of `{x, y, origin, frame, cityTheme}`, and `weatherSystem` compositing.
- Heat gating for travel keeps using the existing `app.isLocationFastTravelable(city)` (returns `locationHeat[city] === 0`) and `app.locationHeat`.
- The renderer must draw correctly with **zero** assets present. Asset lookups return `null` and each element falls back to its procedural form.
- Do not use `cat`/heredoc to create files. Use the file-creation tool.

---

### Task 1: Asset registry

**Files:**
- Create: `src/pixel_engine/asset-registry.js`
- Create: `assets/manifest.json`
- Test: `test/asset-registry.test.js`

**Interfaces:**
- Produces:
  - `class AssetRegistry`, constructed as `new AssetRegistry({ loadImage })` where `loadImage(path) => Promise<image|null>` is injectable (defaults to a real `Image()` loader in the browser).
  - `registry.loadManifest(manifestObject) => boolean` — synchronous; `false` on malformed input, leaving the registry empty.
  - `await registry.preload() => void` — resolves every declared source; a source that resolves `null` is marked unavailable.
  - `registry.get(key) => { image, x, y, w, h } | null` — `null` for unknown key, unavailable source, or not-yet-preloaded source.
  - `registry.tileSize` (number, default 32) and `registry.diagnostics` (array of strings).

- [ ] **Step 1: Write the failing test**

Create `test/asset-registry.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { AssetRegistry } = require('../src/pixel_engine/asset-registry.js');

const MANIFEST = {
  version: 1,
  tileSize: 16,
  sources: {
    harlem_tiles: 'assets/sprite_packs/city_harlem_tiles.png',
    missing_pack: 'assets/sprite_packs/does_not_exist.png'
  },
  sprites: {
    'harlem.road_h':        { source: 'harlem_tiles', x: 0,  y: 0, w: 16, h: 16 },
    'harlem.building_roofA': { source: 'harlem_tiles', x: 32, y: 0, w: 32, h: 32 },
    'harlem.ghost':         { source: 'missing_pack', x: 0,  y: 0, w: 16, h: 16 }
  }
};

function fakeLoader() {
  return async (path) => (path.includes('does_not_exist') ? null : { fakeImage: path });
}

test('AssetRegistry: resolves a known key to a slice descriptor after preload', async () => {
  const r = new AssetRegistry({ loadImage: fakeLoader() });
  assert.equal(r.loadManifest(MANIFEST), true);
  await r.preload();

  const slice = r.get('harlem.building_roofA');
  assert.ok(slice, 'known key must resolve');
  assert.equal(slice.x, 32);
  assert.equal(slice.y, 0);
  assert.equal(slice.w, 32);
  assert.equal(slice.h, 32);
  assert.equal(slice.image.fakeImage, 'assets/sprite_packs/city_harlem_tiles.png');
  assert.equal(r.tileSize, 16, 'pack mandates 16x16 native tiles');
});

test('AssetRegistry: unknown key returns null', async () => {
  const r = new AssetRegistry({ loadImage: fakeLoader() });
  r.loadManifest(MANIFEST);
  await r.preload();
  assert.equal(r.get('harlem.nope'), null);
});

test('AssetRegistry: a key on a missing source returns null without throwing', async () => {
  const r = new AssetRegistry({ loadImage: fakeLoader() });
  r.loadManifest(MANIFEST);
  await r.preload();

  assert.equal(r.get('harlem.ghost'), null, 'missing source must not resolve');
  assert.ok(r.diagnostics.some(d => d.includes('missing_pack')), 'failure must be recorded for diagnostics');
});

test('AssetRegistry: keys return null before preload runs', () => {
  const r = new AssetRegistry({ loadImage: fakeLoader() });
  r.loadManifest(MANIFEST);
  assert.equal(r.get('harlem.building_roofA'), null, 'no image yet, so no slice');
});

test('AssetRegistry: a malformed manifest yields an empty registry rather than throwing', () => {
  const r = new AssetRegistry({ loadImage: fakeLoader() });
  assert.equal(r.loadManifest(null), false);
  assert.equal(r.loadManifest({ version: 1 }), false, 'no sources/sprites is malformed');
  assert.equal(r.loadManifest({ sources: 'nope', sprites: {} }), false);
  assert.equal(r.get('harlem.road_h'), null);
});

test('AssetRegistry: a sprite naming an undeclared source is rejected at manifest load', () => {
  const r = new AssetRegistry({ loadImage: fakeLoader() });
  r.loadManifest({
    version: 1, tileSize: 16,
    sources: { a: 'assets/a.png' },
    sprites: { 'x.y': { source: 'nonexistent', x: 0, y: 0, w: 32, h: 32 } }
  });
  assert.equal(r.get('x.y'), null);
  assert.ok(r.diagnostics.some(d => d.includes('nonexistent')));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/asset-registry.test.js`
Expected: FAIL — `Cannot find module '../src/pixel_engine/asset-registry.js'`.

- [ ] **Step 3: Write the implementation**

Create `src/pixel_engine/asset-registry.js`:

```js
/**
 * Concrete Kings: The Block Chronicles
 * Asset Registry — manifest-driven sprite lookup with procedural fallback.
 *
 * Every consumer must treat a null from get() as "draw it procedurally".
 * A missing asset is never fatal: the map has to render with zero art present.
 */

function defaultLoadImage(path) {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined') { resolve(null); return; }
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = path;
  });
}

class AssetRegistry {
  constructor(options = {}) {
    this.loadImage = options.loadImage || defaultLoadImage;
    this.tileSize = 32;
    this.sources = {};              // name -> path
    this.sprites = new Map();       // key -> { source, x, y, w, h }
    this.images = new Map();        // name -> image
    this.unavailable = new Set();   // source names that failed
    this.diagnostics = [];
  }

  loadManifest(manifest) {
    this.sprites.clear();
    this.images.clear();
    this.unavailable.clear();
    this.sources = {};

    if (!manifest || typeof manifest !== 'object') {
      this.diagnostics.push('manifest: not an object');
      return false;
    }
    if (!manifest.sources || typeof manifest.sources !== 'object' || Array.isArray(manifest.sources)) {
      this.diagnostics.push('manifest: missing or invalid "sources"');
      return false;
    }
    if (!manifest.sprites || typeof manifest.sprites !== 'object' || Array.isArray(manifest.sprites)) {
      this.diagnostics.push('manifest: missing or invalid "sprites"');
      return false;
    }

    if (typeof manifest.tileSize === 'number' && manifest.tileSize > 0) {
      this.tileSize = manifest.tileSize;
    }
    this.sources = { ...manifest.sources };

    Object.entries(manifest.sprites).forEach(([key, def]) => {
      if (!def || typeof def !== 'object') {
        this.diagnostics.push(`sprite "${key}": invalid definition`);
        return;
      }
      if (!Object.prototype.hasOwnProperty.call(this.sources, def.source)) {
        this.diagnostics.push(`sprite "${key}": undeclared source "${def.source}"`);
        return;
      }
      this.sprites.set(key, {
        source: def.source,
        x: def.x | 0, y: def.y | 0,
        w: def.w | 0, h: def.h | 0
      });
    });

    return true;
  }

  async preload() {
    const names = Object.keys(this.sources);
    for (const name of names) {
      const img = await this.loadImage(this.sources[name]);
      if (img) {
        this.images.set(name, img);
      } else {
        this.unavailable.add(name);
        this.diagnostics.push(`source "${name}" unavailable: ${this.sources[name]}`);
      }
    }
  }

  get(key) {
    const def = this.sprites.get(key);
    if (!def) return null;
    if (this.unavailable.has(def.source)) return null;
    const image = this.images.get(def.source);
    if (!image) return null;
    return { image, x: def.x, y: def.y, w: def.w, h: def.h };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AssetRegistry };
}
if (typeof window !== 'undefined') {
  window.AssetRegistry = AssetRegistry;
}
```

- [ ] **Step 4: Create the manifest**

Create `assets/manifest.json`. It declares all eight city packs so generated art is picked up the moment it replaces a placeholder. Sprite keys follow `<district>.<element>`; the eight packs are currently byte-identical placeholders, so only a minimal, honest set of keys is declared — one material band per city — and the renderer falls back procedurally for everything else:

```json
{
  "version": 1,
  "tileSize": 16,
  "sources": {
    "harlem_tiles": "assets/sprite_packs/city_harlem_tiles.png",
    "detroit_tiles": "assets/sprite_packs/city_detroit_tiles.png",
    "chicago_tiles": "assets/sprite_packs/city_chicago_tiles.png",
    "miami_tiles": "assets/sprite_packs/city_miami_tiles.png",
    "baltimore_tiles": "assets/sprite_packs/city_baltimore_tiles.png",
    "atlanta_tiles": "assets/sprite_packs/city_atlanta_tiles.png",
    "oakland_tiles": "assets/sprite_packs/city_oakland_tiles.png",
    "nola_tiles": "assets/sprite_packs/city_nola_tiles.png"
  },
  "sprites": {}
}
```

`sprites` is intentionally empty: declaring keys that point at placeholder bands would make the map look worse than procedural rendering. As real art lands, add entries with no code change required. Keys must use the prompt pack's category vocabulary — `ground`, `road`, `building`, `furniture`, `flora`, `decal`, `prop`, `icon`:

```json
"harlem.road_h":         { "source": "harlem_tiles", "x": 0,  "y": 0,  "w": 16, "h": 16 },
"harlem.ground_walk":    { "source": "harlem_tiles", "x": 16, "y": 0,  "w": 16, "h": 16 },
"harlem.building_roofA": { "source": "harlem_tiles", "x": 0,  "y": 32, "w": 32, "h": 32 },
"harlem.flora_tree":     { "source": "harlem_tiles", "x": 32, "y": 0,  "w": 16, "h": 16 },
"harlem.prop_car_h":     { "source": "harlem_tiles", "x": 48, "y": 0,  "w": 32, "h": 16 }
```

Buildings and props use 32x32 (or 32x16 for cars); everything else is 16x16, per the pack. Atlases keep a 1-pixel gutter between tiles, so slice coordinates step by `tile + 1` when reading a gutter-spaced atlas.

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test test/asset-registry.test.js`
Expected: PASS (6 tests).

- [ ] **Step 6: Run the full suite**

Run: `node --test "test/**/*.test.js"`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add src/pixel_engine/asset-registry.js assets/manifest.json test/asset-registry.test.js
git commit -m "feat: add asset registry with manifest lookup and procedural fallback"
```

---

### Task 2: District data

**Files:**
- Create: `src/pixel_engine/topdown-city-data.js`
- Test: `test/topdown-city-data.test.js`

**Interfaces:**
- Produces:
  - `WORLD = { width: 2400, height: 1300 }`
  - `VIEWPORT = { width: 960, height: 520 }`
  - `POI_IDS = ['BARBER_SHOP','BODEGA','SHOP_DEAL','CHESS_PARK','LOCKED_DOOR']`
  - `DISTRICTS` — object keyed by uppercase district key. Each value: `{ id, city, name, palette, roads, sidewalks, parcels, decor, pois }`.
    - `palette`: `{ ground, asphalt, lane, zebra, walk, walkHi, roofA, roofADk, roofB, roofBDk, roofC, roofCDk, face, accent, tree, treeDk, grass, shadow }` — all uppercase hex from the master palette except `shadow`, which is `rgba(0,0,0,0.45)`.
    - `roads`: `[{ x, y, w, h, dir }]` where `dir` is `'h'` or `'v'`.
    - `sidewalks`: `[{ x, y, w, h }]`.
    - `parcels`: `[{ x, y, w, h, kind, roof, solid }]` where `kind` is `'building'|'park'|'lot'|'court'`, `roof` is `'roofA'|'roofB'|'roofC'|'grass'|'asphalt'`, `solid` is boolean.
    - `decor`: `[{ type, x, y, dir }]` where `type` is `'tree'|'car'`; `dir` (`'h'|'v'`) applies to cars only.
    - `pois`: exactly 5 entries `{ id, x, y }`, ids exactly `POI_IDS`.
  - `getDistrict(key)` — returns the district or `null`.
  - `districtKeys()` — returns `['HARLEM','DETROIT','CHICAGO','MIAMI','BALTIMORE','ATLANTA','OAKLAND','NOLA']`.
  - `CITY_TO_DISTRICT` — maps the city strings already used by `app.locationHeat` (`'Harlem'`, `'Detroit'`, `'Chicago'`, `'Miami'`, `'Baltimore'`, `'Atlanta'`, `'Oakland'`, `'NOLA'`) to district keys.

- [ ] **Step 1: Write the failing test**

Create `test/topdown-city-data.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  DISTRICTS, WORLD, VIEWPORT, POI_IDS,
  getDistrict, districtKeys, CITY_TO_DISTRICT
} = require('../src/pixel_engine/topdown-city-data.js');

const PALETTE_KEYS = ['ground','asphalt','lane','zebra','walk','walkHi',
  'roofA','roofADk','roofB','roofBDk','roofC','roofCDk','face','accent',
  'tree','treeDk','grass','shadow'];

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

test('District data: all eight districts exist and are keyed consistently', () => {
  assert.equal(districtKeys().length, 8);
  districtKeys().forEach(k => {
    assert.ok(DISTRICTS[k], `${k} must exist`);
    assert.equal(DISTRICTS[k].id, k, `${k}.id must match its key`);
  });
});

test('District data: every city in the heat table maps to a district', () => {
  ['Harlem','Detroit','Chicago','Miami','Baltimore','Atlanta','Oakland','NOLA'].forEach(city => {
    const key = CITY_TO_DISTRICT[city];
    assert.ok(key, `${city} must map to a district key`);
    assert.ok(DISTRICTS[key], `${city} maps to missing district ${key}`);
  });
});

test('District data: palettes are complete and use uppercase hex', () => {
  districtKeys().forEach(k => {
    const p = DISTRICTS[k].palette;
    PALETTE_KEYS.forEach(pk => {
      assert.ok(p[pk], `${k}.palette.${pk} missing`);
    });
    Object.entries(p).forEach(([pk, val]) => {
      if (pk === 'shadow') {
        assert.match(val, /^rgba\(/, `${k}.palette.shadow must be rgba`);
      } else {
        assert.match(val, /^#[0-9A-F]{6}$/, `${k}.palette.${pk} must be uppercase hex, got ${val}`);
      }
    });
  });
});

test('District data: every colour is a verbatim master-palette entry', () => {
  // The master palette is the shared gamut. Inventing colours is how eight
  // districts stop looking like one world.
  const fs = require('fs');
  const path = require('path');
  const master = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'assets', 'palettes', 'concrete_kings_64.json'), 'utf8'));
  const allowed = new Set(Object.values(master.groups).flat().map(c => c.toUpperCase()));

  districtKeys().forEach(k => {
    Object.entries(DISTRICTS[k].palette).forEach(([pk, val]) => {
      if (pk === 'shadow') return;
      assert.ok(allowed.has(val.toUpperCase()),
        `${k}.palette.${pk} = ${val} is not in concrete_kings_64.json`);
    });
  });
});

test('District data: large fills stay dark, per the noir discipline rule', () => {
  // Prompt pack: dark dominant, neon accents sparingly. Bright hues belong in
  // lane/zebra/accent (thin marks), never in area fills like roofs or ground.
  const luminance = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
  };
  const AREA_FILLS = ['ground', 'asphalt', 'roofA', 'roofB', 'roofC'];

  districtKeys().forEach(k => {
    AREA_FILLS.forEach(pk => {
      const val = DISTRICTS[k].palette[pk];
      assert.ok(luminance(val) < 120,
        `${k}.palette.${pk} = ${val} is too bright (${Math.round(luminance(val))}) for a large fill`);
    });
  });
});

test('District data: every district has roads, sidewalks, and at least one solid parcel', () => {
  districtKeys().forEach(k => {
    const d = DISTRICTS[k];
    assert.ok(d.roads.length >= 2, `${k} needs at least 2 road bands`);
    assert.ok(d.sidewalks.length >= 1, `${k} needs sidewalks`);
    assert.ok(d.parcels.some(p => p.solid), `${k} needs at least one solid parcel`);
    d.roads.forEach(r => assert.ok(r.dir === 'h' || r.dir === 'v', `${k} road dir must be h or v`));
  });
});

test('District data: nothing extends outside world bounds', () => {
  districtKeys().forEach(k => {
    const d = DISTRICTS[k];
    [...d.roads, ...d.sidewalks, ...d.parcels].forEach(r => {
      assert.ok(r.x >= 0 && r.y >= 0, `${k}: rect starts off-world at ${r.x},${r.y}`);
      assert.ok(r.x + r.w <= WORLD.width, `${k}: rect exceeds world width`);
      assert.ok(r.y + r.h <= WORLD.height, `${k}: rect exceeds world height`);
    });
    d.pois.forEach(p => {
      assert.ok(p.x >= 0 && p.x <= WORLD.width, `${k}: POI ${p.id} off-world x`);
      assert.ok(p.y >= 0 && p.y <= WORLD.height, `${k}: POI ${p.id} off-world y`);
    });
  });
});

test('District data: every district has exactly the five canonical POIs', () => {
  districtKeys().forEach(k => {
    const ids = DISTRICTS[k].pois.map(p => p.id);
    assert.equal(ids.length, 5, `${k} must have exactly 5 POIs`);
    assert.deepEqual([...ids].sort(), [...POI_IDS].sort(), `${k} POI ids must match the canonical set`);
  });
});

test('District data: no POI is stranded inside a solid parcel', () => {
  districtKeys().forEach(k => {
    const d = DISTRICTS[k];
    d.pois.forEach(poi => {
      const box = { x: poi.x - 8, y: poi.y - 5, w: 16, h: 10 };
      d.parcels.filter(p => p.solid).forEach(p => {
        assert.equal(rectsOverlap(box, p), false,
          `${k}: POI ${poi.id} at ${poi.x},${poi.y} is inside a solid parcel — unreachable`);
      });
    });
  });
});

test('District data: world is 2.5x the viewport so the camera has somewhere to go', () => {
  assert.equal(WORLD.width, VIEWPORT.width * 2.5);
  assert.equal(WORLD.height, VIEWPORT.height * 2.5);
});

test('District data: getDistrict returns null for an unknown key', () => {
  assert.equal(getDistrict('ATLANTIS'), null);
  assert.equal(getDistrict('HARLEM').city, 'Harlem');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/topdown-city-data.test.js`
Expected: FAIL — `Cannot find module '../src/pixel_engine/topdown-city-data.js'`.

- [ ] **Step 3: Write the module scaffold and the eight palettes**

Create `src/pixel_engine/topdown-city-data.js`. Start with constants and palettes. Every colour below is taken from `assets/palettes/concrete_kings_64.json`; the per-city intent comes from the district profiles in `CITY_ART_PROMPTS.md`:

```js
/**
 * Concrete Kings: The Block Chronicles
 * Top-down district layouts. Pure data — no canvas, no DOM.
 *
 * Colours are restricted to the 64-entry master palette
 * (assets/palettes/concrete_kings_64.json) so the eight districts read as
 * one world. Per-city intent follows the profiles in CITY_ART_PROMPTS.md.
 */

const WORLD = { width: 2400, height: 1300 };
const VIEWPORT = { width: 960, height: 520 };

const POI_IDS = ['BARBER_SHOP', 'BODEGA', 'SHOP_DEAL', 'CHESS_PARK', 'LOCKED_DOOR'];

const SHADOW = 'rgba(0,0,0,0.45)';

/**
 * Every colour below is a verbatim entry from concrete_kings_64.json.
 *
 * Two constraints shape these, and a validation test enforces both:
 *  1. Large fills (ground, asphalt, roofA/B/C) stay dark — relative luminance
 *     under 120 — per the prompt pack's "dark dominant" rule. Bright hues are
 *     confined to `lane`, `zebra` and `accent`, which are thin marks and
 *     highlights, never area fills.
 *  2. The master palette contains no true greens. Foliage therefore uses the
 *     dark teal-green ramp hiding in cool_tones (#0D2926 / #174540 / #246961),
 *     which reads correctly as noir vegetation. Do not invent greens.
 */

// Harlem — brick, sodium amber, fire escapes, stoop culture
const PAL_HARLEM = {
  ground:'#101116', asphalt:'#22252E', lane:'#C9822B', zebra:'#CBD5ED',
  walk:'#474D5E', walkHi:'#565E70', roofA:'#7A1D1C', roofADk:'#4D1414',
  roofB:'#6B341D', roofBDk:'#3B1C11', roofC:'#393E4D', roofCDk:'#2D313D',
  face:'#181920', accent:'#FFCD68', tree:'#246961', treeDk:'#174540',
  grass:'#246961', shadow:SHADOW
};

// Detroit — post-industrial, corrugated metal, half-empty lots
const PAL_DETROIT = {
  ground:'#08080A', asphalt:'#181920', lane:'#9C5C1D', zebra:'#A0AAC2',
  walk:'#393E4D', walkHi:'#474D5E', roofA:'#AA2724', roofADk:'#7A1D1C',
  roofB:'#565E70', roofBDk:'#393E4D', roofC:'#3B1C11', roofCDk:'#26120B',
  face:'#101116', accent:'#F0AB43', tree:'#174540', treeDk:'#0D2926',
  grass:'#174540', shadow:SHADOW
};

// Chicago — limestone, cold lake light, el-track steel.
// Cyan is an accent only; roofs are lake blue, steel and dark brick.
const PAL_CHICAGO = {
  ground:'#0A1526', asphalt:'#22252E', lane:'#C9822B', zebra:'#E2E8F7',
  walk:'#474D5E', walkHi:'#666E82', roofA:'#1C375C', roofADk:'#11233F',
  roofB:'#565E70', roofBDk:'#393E4D', roofC:'#4D1414', roofCDk:'#2B0D0D',
  face:'#11233F', accent:'#6FE8D8', tree:'#246961', treeDk:'#174540',
  grass:'#246961', shadow:SHADOW
};

// Miami — muted stucco and terrazzo. The Art Deco neon lives in `accent`
// only: signage, car bodies, the active POI outline. Hot pink and cyan roof
// fills would break the pack's "dark dominant, neon sparingly" rule outright.
const PAL_MIAMI = {
  ground:'#11233F', asphalt:'#2D313D', lane:'#B6C0D8', zebra:'#E2E8F7',
  walk:'#666E82', walkHi:'#8B95AB', roofA:'#7A1D1C', roofADk:'#4D1414',
  roofB:'#1C375C', roofBDk:'#11233F', roofC:'#6B341D', roofCDk:'#3B1C11',
  face:'#0A1526', accent:'#6FE8D8', tree:'#174540', treeDk:'#0D2926',
  grass:'#174540', shadow:SHADOW
};

// Baltimore — formstone, marble steps, harbour blue
const PAL_BALTIMORE = {
  ground:'#0A1526', asphalt:'#22252E', lane:'#C9822B', zebra:'#E2E8F7',
  walk:'#666E82', walkHi:'#8B95AB', roofA:'#6B341D', roofADk:'#3B1C11',
  roofB:'#274F80', roofBDk:'#1C375C', roofC:'#565E70', roofCDk:'#393E4D',
  face:'#181920', accent:'#F0AB43', tree:'#246961', treeDk:'#174540',
  grass:'#246961', shadow:SHADOW
};

// Atlanta — red clay, porch wood, humid canopy
const PAL_ATLANTA = {
  ground:'#140A07', asphalt:'#26120B', lane:'#C9822B', zebra:'#CBD5ED',
  walk:'#522717', walkHi:'#6B341D', roofA:'#AA2724', roofADk:'#7A1D1C',
  roofB:'#854224', roofBDk:'#522717', roofC:'#393E4D', roofCDk:'#2D313D',
  face:'#140A07', accent:'#FFCD68', tree:'#246961', treeDk:'#174540',
  grass:'#246961', shadow:SHADOW
};

// Oakland — bay fog grey, mural colour, shipping steel
const PAL_OAKLAND = {
  ground:'#101116', asphalt:'#2D313D', lane:'#C9822B', zebra:'#CBD5ED',
  walk:'#565E70', walkHi:'#788196', roofA:'#174540', roofADk:'#0D2926',
  roofB:'#274F80', roofBDk:'#1C375C', roofC:'#AA2724', roofCDk:'#7A1D1C',
  face:'#181920', accent:'#F0AB43', tree:'#246961', treeDk:'#174540',
  grass:'#246961', shadow:SHADOW
};

// NOLA — cast iron, gas lamp, cypress and slate
const PAL_NOLA = {
  ground:'#140A07', asphalt:'#22252E', lane:'#C9822B', zebra:'#CBD5ED',
  walk:'#6B341D', walkHi:'#854224', roofA:'#174540', roofADk:'#0D2926',
  roofB:'#7A1D1C', roofBDk:'#4D1414', roofC:'#6E3E14', roofCDk:'#2B0D0D',
  face:'#26120B', accent:'#FFCD68', tree:'#246961', treeDk:'#174540',
  grass:'#246961', shadow:SHADOW
};
```

- [ ] **Step 4: Author the Harlem layout as the worked reference**

Append to `src/pixel_engine/topdown-city-data.js`. A shared helper builds the road/sidewalk skeleton every district uses — a two-by-two block grid with one horizontal avenue and one vertical street — so only parcels, decor, and POI placement are authored per district:

```js
/**
 * Every district shares this street skeleton: one horizontal avenue and one
 * vertical street crossing at the world centre. Districts differ by parcels,
 * decoration and POI placement, which is what makes them read as places.
 */
const AVENUE_Y = 600;
const AVENUE_H = 116;
const STREET_X = 1120;
const STREET_W = 104;

function streetSkeleton() {
  return {
    roads: [
      { x: 0, y: AVENUE_Y, w: WORLD.width, h: AVENUE_H, dir: 'h' },
      { x: STREET_X, y: 0, w: STREET_W, h: WORLD.height, dir: 'v' }
    ],
    sidewalks: [
      { x: 0, y: AVENUE_Y - 20, w: WORLD.width, h: 20 },
      { x: 0, y: AVENUE_Y + AVENUE_H, w: WORLD.width, h: 20 },
      { x: STREET_X - 20, y: 0, w: 20, h: WORLD.height },
      { x: STREET_X + STREET_W, y: 0, w: 20, h: WORLD.height }
    ]
  };
}

/** Evenly spaced street trees along an axis. */
function treeRow(startX, y, count, gap) {
  const out = [];
  for (let i = 0; i < count; i++) out.push({ type: 'tree', x: startX + i * gap, y });
  return out;
}

const HARLEM_SKELETON = streetSkeleton();

const DISTRICTS = {
  HARLEM: {
    id: 'HARLEM',
    city: 'Harlem',
    name: 'Harlem Stoop',
    palette: PAL_HARLEM,
    roads: HARLEM_SKELETON.roads,
    sidewalks: HARLEM_SKELETON.sidewalks,
    parcels: [
      // NW block — brownstone row
      { x: 60,   y: 90,  w: 210, h: 400, kind: 'building', roof: 'roofA', solid: true },
      { x: 290,  y: 90,  w: 190, h: 400, kind: 'building', roof: 'roofB', solid: true },
      { x: 500,  y: 90,  w: 160, h: 250, kind: 'building', roof: 'roofC', solid: true },
      { x: 500,  y: 360, w: 160, h: 130, kind: 'building', roof: 'roofA', solid: true },
      { x: 690,  y: 90,  w: 250, h: 190, kind: 'building', roof: 'roofC', solid: true },
      { x: 690,  y: 300, w: 250, h: 190, kind: 'lot',      roof: 'asphalt', solid: false },
      // NE block — court and towers
      { x: 1290, y: 90,  w: 420, h: 270, kind: 'court',    roof: 'roofA', solid: false },
      { x: 1740, y: 90,  w: 220, h: 270, kind: 'building', roof: 'roofB', solid: true },
      { x: 1990, y: 90,  w: 350, h: 180, kind: 'building', roof: 'roofC', solid: true },
      { x: 1990, y: 300, w: 350, h: 190, kind: 'building', roof: 'roofA', solid: true },
      { x: 1290, y: 390, w: 670, h: 100, kind: 'building', roof: 'roofC', solid: true },
      // SW block — bodega row and lot
      { x: 60,   y: 810, w: 260, h: 200, kind: 'building', roof: 'roofB', solid: true },
      { x: 340,  y: 810, w: 210, h: 200, kind: 'building', roof: 'roofA', solid: true },
      { x: 570,  y: 810, w: 170, h: 200, kind: 'building', roof: 'roofC', solid: true },
      { x: 760,  y: 810, w: 180, h: 200, kind: 'building', roof: 'roofB', solid: true },
      { x: 60,   y: 1040, w: 430, h: 200, kind: 'lot',     roof: 'asphalt', solid: false },
      { x: 510,  y: 1040, w: 220, h: 200, kind: 'building', roof: 'roofC', solid: true },
      { x: 750,  y: 1040, w: 190, h: 200, kind: 'building', roof: 'roofA', solid: true },
      // SE block — park and row
      { x: 1290, y: 810, w: 390, h: 300, kind: 'park',     roof: 'grass', solid: false },
      { x: 1700, y: 810, w: 260, h: 200, kind: 'building', roof: 'roofA', solid: true },
      { x: 1980, y: 810, w: 360, h: 200, kind: 'building', roof: 'roofC', solid: true },
      { x: 1700, y: 1040, w: 260, h: 200, kind: 'building', roof: 'roofB', solid: true },
      { x: 1980, y: 1040, w: 360, h: 200, kind: 'building', roof: 'roofA', solid: true },
      { x: 1290, y: 1140, w: 390, h: 100, kind: 'building', roof: 'roofC', solid: true }
    ],
    decor: [
      ...treeRow(90, 560, 11, 96),
      ...treeRow(1310, 560, 11, 96),
      ...treeRow(90, 770, 11, 96),
      ...treeRow(1310, 770, 11, 96),
      { type: 'car', x: 180, y: 620, dir: 'h' },
      { type: 'car', x: 520, y: 620, dir: 'h' },
      { type: 'car', x: 1480, y: 620, dir: 'h' },
      { type: 'car', x: 760, y: 680, dir: 'h' },
      { type: 'car', x: 1860, y: 680, dir: 'h' },
      { type: 'car', x: 1150, y: 240, dir: 'v' },
      { type: 'car', x: 1180, y: 940, dir: 'v' },
      { type: 'car', x: 1150, y: 1180, dir: 'v' }
    ],
    pois: [
      { id: 'BARBER_SHOP', x: 170,  y: 540 },
      { id: 'BODEGA',      x: 1480, y: 780 },
      { id: 'SHOP_DEAL',   x: 2100, y: 780 },
      { id: 'CHESS_PARK',  x: 1480, y: 960 },
      { id: 'LOCKED_DOOR', x: 820,  y: 780 }
    ]
  }
};
```

- [ ] **Step 5: Author the remaining seven districts**

Add `DETROIT`, `CHICAGO`, `MIAMI`, `BALTIMORE`, `ATLANTA`, `OAKLAND`, `NOLA` to `DISTRICTS` using the same schema, each with its own palette constant, its own `streetSkeleton()` call, and its own parcel/decor/POI layout.

This is deliberate creative data entry, not boilerplate: **do not copy Harlem's parcel array**. Each district must differ in block structure so the districts read as different places. Vary these levers per district:

- Parcel count and footprint mix — Detroit leans on large `lot` parcels and fewer buildings (half-empty blocks); Miami uses many small buildings; Chicago uses two tall deep parcels.
- Which quadrant holds the open space — Harlem puts the court NE and park SE; move these elsewhere per district.
- Tree density — Atlanta and NOLA dense (`gap: 72`), Detroit sparse (`gap: 150`).
- Car count — Chicago and Miami busy (10+), Detroit quiet (3).
- POI placement — the five POIs must sit in different quadrants per district.

The tests in Step 1 enforce every hard invariant: eight districts, complete uppercase-hex palettes, ≥2 roads, ≥1 solid parcel, nothing off-world, exactly the five canonical POIs, and no POI trapped inside a solid parcel. Run them after each district to catch mistakes immediately.

Close the file with the lookup helpers and exports:

```js
const CITY_TO_DISTRICT = {
  'Harlem': 'HARLEM',
  'Detroit': 'DETROIT',
  'Chicago': 'CHICAGO',
  'Miami': 'MIAMI',
  'Baltimore': 'BALTIMORE',
  'Atlanta': 'ATLANTA',
  'Oakland': 'OAKLAND',
  'NOLA': 'NOLA'
};

function districtKeys() {
  return ['HARLEM', 'DETROIT', 'CHICAGO', 'MIAMI', 'BALTIMORE', 'ATLANTA', 'OAKLAND', 'NOLA'];
}

function getDistrict(key) {
  return DISTRICTS[key] || null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DISTRICTS, WORLD, VIEWPORT, POI_IDS, getDistrict, districtKeys, CITY_TO_DISTRICT };
}
if (typeof window !== 'undefined') {
  window.TOPDOWN_DISTRICTS = DISTRICTS;
  window.TOPDOWN_WORLD = WORLD;
  window.TOPDOWN_VIEWPORT = VIEWPORT;
  window.TOPDOWN_POI_IDS = POI_IDS;
  window.getTopDownDistrict = getDistrict;
  window.topDownDistrictKeys = districtKeys;
  window.CITY_TO_DISTRICT = CITY_TO_DISTRICT;
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `node --test test/topdown-city-data.test.js`
Expected: PASS (11 tests).

- [ ] **Step 7: Run the full suite**

Run: `node --test "test/**/*.test.js"`
Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add src/pixel_engine/topdown-city-data.js test/topdown-city-data.test.js
git commit -m "feat: add eight hand-authored top-down district layouts"
```

---

### Task 3: Controller — movement, collision, camera, POI proximity

**Files:**
- Create: `src/pixel_engine/topdown-city-controller.js`
- Test: `test/topdown-city-controller.test.js`

**Interfaces:**
- Consumes: `WORLD`, `VIEWPORT`, `getDistrict` from `topdown-city-data.js` (Task 2).
- Produces:
  - `class TopDownCityController`, constructed as `new TopDownCityController({ districtKey, attachInput })`. `attachInput` defaults to `true`; pass `false` in tests so no `window` listeners are needed.
  - `PLAYER_BOX = { w: 16, h: 10 }` — the feet box used for collision.
  - `POI_RADIUS = 52` — proximity threshold in world pixels.
  - `controller.x`, `controller.y` — player world position.
  - `controller.speed` — 4, matching the existing `BlockMapController`.
  - `controller.keys` — plain object of lowercased key names, same convention as `BlockMapController`.
  - `controller.facing` — `'LEFT'|'RIGHT'`; `controller.isMoving` — boolean; `controller.animFrame` — 0..3.
  - `controller.camera` — `{ x, y }`, recomputed each `update()`.
  - `controller.activePoi` — the nearest POI within `POI_RADIUS`, else `null`.
  - `controller.setDistrict(districtKey)` — switches district, re-spawns the player at a walkable point, resets the camera. Returns `true` on success, `false` for an unknown key.
  - `controller.collidesAt(x, y)` — boolean; tests the feet box centred on `(x, y)` against solid parcels.
  - `controller.update()` — advances one tick.

- [ ] **Step 1: Write the failing test**

Create `test/topdown-city-controller.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { TopDownCityController, PLAYER_BOX, POI_RADIUS } =
  require('../src/pixel_engine/topdown-city-controller.js');
const { DISTRICTS, WORLD, VIEWPORT } = require('../src/pixel_engine/topdown-city-data.js');

function makeController(districtKey) {
  return new TopDownCityController({ districtKey: districtKey || 'HARLEM', attachInput: false });
}

test('Controller: starts inside the world on a walkable tile', () => {
  const c = makeController();
  assert.ok(c.x >= 0 && c.x <= WORLD.width);
  assert.ok(c.y >= 0 && c.y <= WORLD.height);
  assert.equal(c.collidesAt(c.x, c.y), false, 'spawn point must be walkable');
});

test('Controller: a solid parcel blocks movement into it', () => {
  const c = makeController();
  const solid = DISTRICTS.HARLEM.parcels.find(p => p.solid);
  const cx = solid.x + solid.w / 2;
  const cy = solid.y + solid.h / 2;
  assert.equal(c.collidesAt(cx, cy), true, 'centre of a solid parcel must collide');
});

test('Controller: open road is walkable', () => {
  const c = makeController();
  const road = DISTRICTS.HARLEM.roads.find(r => r.dir === 'h');
  const cy = road.y + road.h / 2;
  assert.equal(c.collidesAt(40, cy), false, 'the avenue must be walkable');
});

test('Controller: blocked on one axis still slides on the other', () => {
  const c = makeController();
  const solid = DISTRICTS.HARLEM.parcels.find(p => p.solid);

  // Stand directly below the parcel, in open space, and push up into it.
  c.x = solid.x + solid.w / 2;
  c.y = solid.y + solid.h + PLAYER_BOX.h;
  const startY = c.y;

  c.keys = { w: true, d: true };  // up (blocked) + right (free)
  c.update();

  assert.equal(c.y, startY, 'vertical movement into the wall must be refused');
  assert.ok(c.x > solid.x + solid.w / 2, 'horizontal movement must still happen');
});

test('Controller: camera centres the player away from world edges', () => {
  const c = makeController();
  c.x = WORLD.width / 2;
  c.y = WORLD.height / 2;
  c.keys = {};
  c.update();

  assert.equal(c.camera.x, Math.round(WORLD.width / 2 - VIEWPORT.width / 2));
  assert.equal(c.camera.y, Math.round(WORLD.height / 2 - VIEWPORT.height / 2));
});

test('Controller: camera clamps at all four world edges', () => {
  const c = makeController();
  c.keys = {};

  c.x = 0; c.y = 0; c.update();
  assert.equal(c.camera.x, 0, 'must not scroll past the left edge');
  assert.equal(c.camera.y, 0, 'must not scroll past the top edge');

  c.x = WORLD.width; c.y = WORLD.height; c.update();
  assert.equal(c.camera.x, WORLD.width - VIEWPORT.width, 'must not scroll past the right edge');
  assert.equal(c.camera.y, WORLD.height - VIEWPORT.height, 'must not scroll past the bottom edge');
});

test('Controller: POI proximity fires inside the radius and not outside', () => {
  const c = makeController();
  const poi = DISTRICTS.HARLEM.pois[0];

  c.x = poi.x; c.y = poi.y; c.keys = {};
  c.update();
  assert.ok(c.activePoi, 'standing on a POI must activate it');
  assert.equal(c.activePoi.id, poi.id);

  c.x = poi.x + POI_RADIUS + 40; c.y = poi.y;
  c.update();
  const stillSame = c.activePoi && c.activePoi.id === poi.id;
  assert.equal(stillSame, false, 'walking well clear of a POI must deactivate it');
});

test('Controller: setDistrict switches district and re-spawns walkable', () => {
  const c = makeController();
  assert.equal(c.setDistrict('MIAMI'), true);
  assert.equal(c.districtKey, 'MIAMI');
  assert.equal(c.collidesAt(c.x, c.y), false, 'new spawn must be walkable');
  assert.equal(c.activePoi, null, 'district switch clears the previous POI');
});

test('Controller: setDistrict rejects an unknown key and keeps the current district', () => {
  const c = makeController();
  assert.equal(c.setDistrict('ATLANTIS'), false);
  assert.equal(c.districtKey, 'HARLEM');
});

test('Controller: the player never leaves the world', () => {
  const c = makeController();
  c.x = 4; c.y = 4;
  c.keys = { a: true, w: true };
  for (let i = 0; i < 20; i++) c.update();
  assert.ok(c.x >= 0, 'cannot walk off the left edge');
  assert.ok(c.y >= 0, 'cannot walk off the top edge');
});

test('Controller: animation frame stays within the 4-frame budget', () => {
  const c = makeController();
  c.keys = { d: true };
  for (let i = 0; i < 100; i++) {
    c.update();
    assert.ok(c.animFrame >= 0 && c.animFrame <= 3, 'frame must stay in 0..3');
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/topdown-city-controller.test.js`
Expected: FAIL — `Cannot find module '../src/pixel_engine/topdown-city-controller.js'`.

- [ ] **Step 3: Write the implementation**

Create `src/pixel_engine/topdown-city-controller.js`:

```js
/**
 * Concrete Kings: The Block Chronicles
 * Top-down city controller — movement, collision, camera, POI proximity.
 *
 * Holds no canvas reference. The renderer reads this controller's state;
 * this controller never draws.
 */

let dataModule;
if (typeof require !== 'undefined') {
  dataModule = require('./topdown-city-data.js');
} else {
  dataModule = {
    WORLD: window.TOPDOWN_WORLD,
    VIEWPORT: window.TOPDOWN_VIEWPORT,
    getDistrict: window.getTopDownDistrict
  };
}

const { WORLD, VIEWPORT, getDistrict } = dataModule;

const PLAYER_BOX = { w: 16, h: 10 };
const POI_RADIUS = 52;

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function boxHitsRect(bx, by, bw, bh, r) {
  return bx < r.x + r.w && bx + bw > r.x && by < r.y + r.h && by + bh > r.y;
}

class TopDownCityController {
  constructor(options = {}) {
    this.districtKey = options.districtKey || 'HARLEM';
    this.district = getDistrict(this.districtKey) || getDistrict('HARLEM');

    this.speed = 4;
    this.facing = 'RIGHT';
    this.isMoving = false;
    this.animFrame = 0;
    this.animTick = 0;
    this.activePoi = null;
    this.keys = {};
    this.camera = { x: 0, y: 0 };

    this.spawn();

    if (options.attachInput !== false) this.setupInputListeners();
  }

  /** Place the player on the avenue centre, nudging along it until walkable. */
  spawn() {
    const avenue = this.district.roads.find(r => r.dir === 'h') || { y: WORLD.height / 2, h: 100 };
    const y = avenue.y + avenue.h / 2;
    let x = WORLD.width / 2;
    for (let i = 0; i < 200 && this.collidesAt(x, y); i++) x -= 16;
    this.x = clamp(x, 0, WORLD.width);
    this.y = clamp(y, 0, WORLD.height);
    this.updateCamera();
  }

  setDistrict(districtKey) {
    const next = getDistrict(districtKey);
    if (!next) return false;
    this.districtKey = districtKey;
    this.district = next;
    this.activePoi = null;
    this.spawn();
    return true;
  }

  setupInputListeners() {
    if (typeof window === 'undefined') return;
    window.addEventListener('keydown', (e) => { this.keys[e.key.toLowerCase()] = true; });
    window.addEventListener('keyup',   (e) => { this.keys[e.key.toLowerCase()] = false; });
  }

  collidesAt(x, y) {
    const bx = x - PLAYER_BOX.w / 2;
    const by = y - PLAYER_BOX.h / 2;
    for (const p of this.district.parcels) {
      if (!p.solid) continue;
      if (boxHitsRect(bx, by, PLAYER_BOX.w, PLAYER_BOX.h, p)) return true;
    }
    return false;
  }

  update() {
    let dx = 0;
    let dy = 0;

    if (this.keys['arrowleft']  || this.keys['a']) { dx -= this.speed; this.facing = 'LEFT'; }
    if (this.keys['arrowright'] || this.keys['d']) { dx += this.speed; this.facing = 'RIGHT'; }
    if (this.keys['arrowup']    || this.keys['w']) { dy -= this.speed; }
    if (this.keys['arrowdown']  || this.keys['s']) { dy += this.speed; }

    this.isMoving = (dx !== 0 || dy !== 0);

    // Resolve per-axis so the player slides along walls instead of sticking.
    if (dx !== 0) {
      const nx = clamp(this.x + dx, 0, WORLD.width);
      if (!this.collidesAt(nx, this.y)) this.x = nx;
    }
    if (dy !== 0) {
      const ny = clamp(this.y + dy, 0, WORLD.height);
      if (!this.collidesAt(this.x, ny)) this.y = ny;
    }

    this.animTick++;
    if (this.animTick % 10 === 0) this.animFrame = (this.animFrame + 1) % 4;

    this.updateCamera();
    this.checkPois();
  }

  updateCamera() {
    this.camera.x = Math.round(clamp(this.x - VIEWPORT.width / 2,  0, WORLD.width  - VIEWPORT.width));
    this.camera.y = Math.round(clamp(this.y - VIEWPORT.height / 2, 0, WORLD.height - VIEWPORT.height));
  }

  checkPois() {
    let best = null;
    let bestDist = Infinity;
    for (const poi of this.district.pois) {
      const d = Math.hypot(this.x - poi.x, this.y - poi.y);
      if (d <= POI_RADIUS && d < bestDist) { best = poi; bestDist = d; }
    }
    this.activePoi = best;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TopDownCityController, PLAYER_BOX, POI_RADIUS };
}
if (typeof window !== 'undefined') {
  window.TopDownCityController = TopDownCityController;
  window.TOPDOWN_PLAYER_BOX = PLAYER_BOX;
  window.TOPDOWN_POI_RADIUS = POI_RADIUS;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/topdown-city-controller.test.js`
Expected: PASS (11 tests).

If the slide test fails because the chosen solid parcel sits against a world edge, that is a real data problem, not a test problem — fix the Harlem layout so the first solid parcel has open space below it.

- [ ] **Step 5: Run the full suite**

Run: `node --test "test/**/*.test.js"`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/pixel_engine/topdown-city-controller.js test/topdown-city-controller.test.js
git commit -m "feat: add top-down city controller with per-axis collision and camera"
```

---

### Task 4: Renderer

**Files:**
- Create: `src/pixel_engine/topdown-city-renderer.js`
- Test: `test/topdown-city-renderer.test.js`

**Interfaces:**
- Consumes: district objects from `topdown-city-data.js` (Task 2); `AssetRegistry.get(key)` from Task 1; a controller-shaped object exposing `x`, `y`, `facing`, `animFrame`, `activePoi`, `camera`, `district`, `districtKey` (Task 3).
- Produces:
  - `class TopDownCityRenderer`, constructed as `new TopDownCityRenderer({ registry })`. `registry` is optional; when absent every element draws procedurally.
  - `renderer.render(ctx, controller)` — draws one frame into `ctx`, translated by the controller's camera.
  - `renderer.spriteKey(districtKey, element)` — returns the lookup key, lowercase district plus element, e.g. `('HARLEM','building_roofA') => 'harlem.building_roofA'`. `element` must use the prompt pack's category vocabulary: `ground_*`, `road_*`, `building_*`, `furniture_*`, `flora_*`, `decal_*`, `prop_*`, `icon_*`.
  - `renderer.stats` — `{ assetDraws, proceduralDraws }`, reset each `render()` call, used by tests to prove fallback behaviour.

- [ ] **Step 1: Write the failing test**

Create `test/topdown-city-renderer.test.js`:

```js
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

test('Renderer: draws in the prompt pack layer order — ground before flora before player', () => {
  // Pack section 6.3: ground/roads 0, props/furniture 1, flora/weather 2,
  // building decals 3, roof details 4. Order matters: flora drawn under a
  // building roof would look wrong, and the player must never be occluded.
  const order = [];
  const ctx = recordingCtx();
  ctx.fillRect = () => { order.push('rect'); };
  ctx.arc = () => { order.push('arc'); };

  const r = new TopDownCityRenderer({});
  r.render(ctx, controller());

  assert.equal(order[0], 'rect', 'ground fill must be the first draw of the frame');
  assert.ok(order.includes('arc'), 'flora (circles) must be drawn');
  assert.ok(order.lastIndexOf('arc') > order.indexOf('rect'),
    'flora must come after ground');
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/topdown-city-renderer.test.js`
Expected: FAIL — `Cannot find module '../src/pixel_engine/topdown-city-renderer.js'`.

- [ ] **Step 3: Write the implementation**

Create `src/pixel_engine/topdown-city-renderer.js`:

```js
/**
 * Concrete Kings: The Block Chronicles
 * Top-down city renderer.
 *
 * Every element checks the asset registry first and falls back to a
 * procedural form. The map must look correct with zero assets present, so
 * a null from registry.get() is the normal case, not an error path.
 */

let rdataModule;
if (typeof require !== 'undefined') {
  rdataModule = require('./topdown-city-data.js');
} else {
  rdataModule = { WORLD: window.TOPDOWN_WORLD, VIEWPORT: window.TOPDOWN_VIEWPORT };
}
const { WORLD, VIEWPORT } = rdataModule;

const SHADOW_OFFSET = 3;   // one shared offset is what sells the depth
const FACE_HEIGHT = 6;     // visible building front face

class TopDownCityRenderer {
  constructor(options = {}) {
    this.registry = options.registry || null;
    this.stats = { assetDraws: 0, proceduralDraws: 0 };
  }

  spriteKey(districtKey, element) {
    return `${String(districtKey).toLowerCase()}.${element}`;
  }

  /** Draw a registered sprite if present; return false to draw procedurally. */
  tryAsset(ctx, districtKey, element, x, y, w, h) {
    if (!this.registry) return false;
    const slice = this.registry.get(this.spriteKey(districtKey, element));
    if (!slice) return false;
    ctx.drawImage(slice.image, slice.x, slice.y, slice.w, slice.h, x, y, w, h);
    this.stats.assetDraws++;
    return true;
  }

  fill(ctx, x, y, w, h, col) {
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    this.stats.proceduralDraws++;
  }

  render(ctx, controller) {
    this.stats.assetDraws = 0;
    this.stats.proceduralDraws = 0;

    const d = controller.district;
    const p = d.palette;
    const key = controller.districtKey;
    const cam = controller.camera;

    ctx.imageSmoothingEnabled = false;
    ctx.save();
    ctx.translate(-cam.x, -cam.y);

    // Ground
    this.fill(ctx, 0, 0, WORLD.width, WORLD.height, p.ground);

    // ---- Layer 0: ground and roads (prompt pack section 6.3) ----
    d.roads.forEach(r => {
      if (!this.tryAsset(ctx, key, `road_${r.dir}`, r.x, r.y, r.w, r.h)) {
        this.fill(ctx, r.x, r.y, r.w, r.h, p.asphalt);
      }
    });
    d.roads.forEach(r => {
      if (r.dir === 'h') {
        const cy = r.y + r.h / 2 - 2;
        for (let x = r.x + 12; x < r.x + r.w - 24; x += 52) this.fill(ctx, x, cy, 26, 4, p.lane);
      } else {
        const cx = r.x + r.w / 2 - 2;
        for (let y = r.y + 12; y < r.y + r.h - 24; y += 52) this.fill(ctx, cx, y, 4, 26, p.lane);
      }
    });

    // Sidewalks with a highlight edge
    d.sidewalks.forEach(s => {
      this.fill(ctx, s.x, s.y, s.w, s.h, p.walk);
      this.fill(ctx, s.x, s.y, s.w, 2, p.walkHi);
    });

    // Zebra crossings where the avenue meets the street
    const avenue = d.roads.find(r => r.dir === 'h');
    const street = d.roads.find(r => r.dir === 'v');
    if (avenue && street) {
      for (let i = 0; i < 6; i++) {
        this.fill(ctx, street.x + 8 + i * 16, avenue.y + 4, 9, 30, p.zebra);
        this.fill(ctx, street.x + 8 + i * 16, avenue.y + avenue.h - 34, 9, 30, p.zebra);
      }
      for (let i = 0; i < 6; i++) {
        this.fill(ctx, street.x - 40, avenue.y + 10 + i * 16, 30, 9, p.zebra);
        this.fill(ctx, street.x + street.w + 10, avenue.y + 10 + i * 16, 30, 9, p.zebra);
      }
    }

    // ---- Layers 0-4: parcels carry their own roof detail (layer 4) internally ----
    d.parcels.forEach(parcel => this.drawParcel(ctx, key, parcel, p));

    // ---- Layer 1: props and furniture ----
    d.decor.filter(i => i.type === 'car').forEach(item => {
      this.drawCar(ctx, key, item.x, item.y, item.dir, p);
    });

    // ---- Layer 2: flora and weather (weather composites in renderTopDownFrame) ----
    d.decor.filter(i => i.type === 'tree').forEach(item => {
      this.drawTree(ctx, key, item.x, item.y, p);
    });

    // POIs, then the player on top — never occluded
    d.pois.forEach(poi => {
      const active = controller.activePoi && controller.activePoi.id === poi.id;
      this.drawPoi(ctx, poi, active, p);
    });
    this.drawPlayer(ctx, controller, p);

    ctx.restore();
  }

  drawParcel(ctx, key, parcel, p) {
    const roofCol = p[parcel.roof] || p.roofA;
    const darkKey = `${parcel.roof}Dk`;
    const roofDk = p[darkKey] || p.roofADk;

    // Shadow first, always procedural, so depth is consistent across assets
    this.fill(ctx, parcel.x + SHADOW_OFFSET, parcel.y + SHADOW_OFFSET,
              parcel.w, parcel.h + FACE_HEIGHT, p.shadow);

    if (parcel.kind === 'park' || parcel.kind === 'lot' || parcel.kind === 'court') {
      if (!this.tryAsset(ctx, key, `${parcel.kind}_${parcel.roof}`, parcel.x, parcel.y, parcel.w, parcel.h)) {
        this.fill(ctx, parcel.x, parcel.y, parcel.w, parcel.h, roofCol);
        if (parcel.kind === 'lot') {
          for (let x = parcel.x + 14; x < parcel.x + parcel.w - 8; x += 26) {
            this.fill(ctx, x, parcel.y + 6, 3, parcel.h - 12, p.walkHi);
          }
        }
        if (parcel.kind === 'court') {
          this.fill(ctx, parcel.x + parcel.w / 2 - 2, parcel.y + 6, 4, parcel.h - 12, p.zebra);
        }
      }
      return;
    }

    // Building: visible front face, then roof, then clutter
    this.fill(ctx, parcel.x, parcel.y + parcel.h, parcel.w, FACE_HEIGHT, p.face);
    if (!this.tryAsset(ctx, key, `building_${parcel.roof}`, parcel.x, parcel.y, parcel.w, parcel.h)) {
      this.fill(ctx, parcel.x, parcel.y, parcel.w, parcel.h, roofCol);
      this.fill(ctx, parcel.x, parcel.y, parcel.w, 3, roofDk);
      this.fill(ctx, parcel.x, parcel.y + parcel.h - 3, parcel.w, 3, roofDk);
    }

    // Rooftop clutter: AC units and a stairwell box
    const cols = Math.max(1, Math.floor(parcel.w / 70));
    const rows = Math.max(1, Math.floor(parcel.h / 70));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ux = parcel.x + 22 + c * 70;
        const uy = parcel.y + 22 + r * 70;
        if (ux + 18 > parcel.x + parcel.w - 8 || uy + 14 > parcel.y + parcel.h - 8) continue;
        this.fill(ctx, ux, uy, 18, 14, roofDk);
        this.fill(ctx, ux + 3, uy + 3, 12, 5, roofCol);
      }
    }
    if (parcel.w > 90 && parcel.h > 80) {
      this.fill(ctx, parcel.x + parcel.w - 34, parcel.y + 14, 22, 22, roofDk);
      this.fill(ctx, parcel.x + parcel.w - 30, parcel.y + 18, 14, 14, p.face);
    }
  }

  drawTree(ctx, key, x, y, p) {
    if (this.tryAsset(ctx, key, 'flora_tree', x - 12, y - 12, 24, 24)) return;
    ctx.fillStyle = p.shadow;
    ctx.beginPath(); ctx.arc(x + SHADOW_OFFSET, y + SHADOW_OFFSET, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p.treeDk;
    ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p.tree;
    ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
    this.stats.proceduralDraws++;
  }

  drawCar(ctx, key, x, y, dir, p) {
    const w = dir === 'v' ? 16 : 30;
    const h = dir === 'v' ? 30 : 16;
    if (this.tryAsset(ctx, key, `prop_car_${dir}`, x, y, w, h)) return;
    this.fill(ctx, x + SHADOW_OFFSET, y + SHADOW_OFFSET, w, h, p.shadow);
    this.fill(ctx, x, y, w, h, p.accent);
    if (dir === 'v') {
      this.fill(ctx, x + 3, y + 5, w - 6, 8, p.face);
      this.fill(ctx, x + 3, y + 19, w - 6, 6, p.face);
    } else {
      this.fill(ctx, x + 5, y + 3, 8, h - 6, p.face);
      this.fill(ctx, x + 19, y + 3, 6, h - 6, p.face);
    }
  }

  drawPoi(ctx, poi, active, p) {
    const col = active ? p.accent : p.walkHi;
    const size = 30;
    this.fill(ctx, poi.x - size / 2 + SHADOW_OFFSET, poi.y - size / 2 + SHADOW_OFFSET, size, size, p.shadow);
    this.fill(ctx, poi.x - size / 2, poi.y - size / 2, size, size, p.ground);
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.strokeRect(Math.round(poi.x - size / 2), Math.round(poi.y - size / 2), size, size);

    // Name renders on the map — this is what replaces the deleted legend.
    const label = POI_LABELS[poi.id] || poi.id;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    const w = ctx.measureText(label).width + 12;
    this.fill(ctx, poi.x - w / 2, poi.y + size / 2 + 4, w, 15, p.ground);
    ctx.fillStyle = col;
    ctx.fillText(label, Math.round(poi.x), Math.round(poi.y + size / 2 + 15));
    ctx.textAlign = 'left';
  }

  drawPlayer(ctx, controller, p) {
    const x = controller.x;
    const y = controller.y;
    const bob = (controller.animFrame === 1 || controller.animFrame === 3) ? 1 : 0;

    ctx.fillStyle = p.shadow;
    ctx.beginPath(); ctx.ellipse(x, y + 12, 11, 4, 0, 0, Math.PI * 2); ctx.fill();

    this.fill(ctx, x - 7, y - 18 + bob, 14, 9, p.roofADk);   // hair
    this.fill(ctx, x - 5, y - 10 + bob, 10, 6, '#854224');   // face
    this.fill(ctx, x - 8, y - 4 + bob, 16, 12, p.accent);    // jacket
    this.fill(ctx, x - 6, y + 8 + bob, 5, 8, p.face);        // legs
    this.fill(ctx, x + 1, y + 8 + bob, 5, 8, p.face);
  }
}

const POI_LABELS = {
  BARBER_SHOP: 'BARBER',
  BODEGA: 'BODEGA',
  SHOP_DEAL: 'COUNTER DEAL',
  CHESS_PARK: 'CHESS PARK',
  LOCKED_DOOR: 'ALLEY GATE'
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TopDownCityRenderer, POI_LABELS, SHADOW_OFFSET };
}
if (typeof window !== 'undefined') {
  window.TopDownCityRenderer = TopDownCityRenderer;
  window.TOPDOWN_POI_LABELS = POI_LABELS;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/topdown-city-renderer.test.js`
Expected: PASS (7 tests).

- [ ] **Step 5: Run the full suite**

Run: `node --test "test/**/*.test.js"`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/pixel_engine/topdown-city-renderer.js test/topdown-city-renderer.test.js
git commit -m "feat: add top-down city renderer with per-element asset fallback"
```

---

### Task 5: Wire the map onto the blockMap screen

The side-on viewport stays in place through this task, so the new map can be verified working before anything is removed. Task 6 does the removal.

**Files:**
- Modify: `index.html:1214-1278` (the `blockMap` section markup)
- Modify: `index.html` (script tags near `src/pixel_engine/block-map-navigation.js`, around line 1470)
- Modify: `index.html` (`app` — add `topDownController`, `topDownRenderer`, `assetRegistry`, `initTopDownCity()`, `renderTopDownFrame()`, `travelToDistrict()`, `renderDistrictRail()`; replace `showBlockMap`)
- Test: `test/topdown-city-screen.test.js`

**Interfaces:**
- Consumes: `AssetRegistry` (Task 1), `CITY_TO_DISTRICT`/`districtKeys`/`getDistrict` (Task 2), `TopDownCityController` (Task 3), `TopDownCityRenderer` (Task 4), plus the existing `app.isLocationFastTravelable(city)`, `app.locationHeat`, and `app.triggerHotspot(spot)`.
- Produces: `app.travelToDistrict(districtKey) => boolean` — refuses when heat gates the city, otherwise switches district, sets `app.game.activeCity`, retunes weather/BGM, and re-renders the rail.

- [ ] **Step 1: Write the failing test**

Create `test/topdown-city-screen.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGameModule } = require('./helpers/load-app.js');
const { CITY_TO_DISTRICT } = require('../src/pixel_engine/topdown-city-data.js');

function fakeDocument() {
  const elements = {};
  const make = (id) => ({
    id, textContent: '', innerHTML: '', value: '', style: {},
    _classes: new Set(),
    classList: {
      contains(n) { return elements[id]._classes.has(n); },
      add(n) { elements[id]._classes.add(n); },
      remove(n) { elements[id]._classes.delete(n); },
      toggle(n, f) { f ? elements[id]._classes.add(n) : elements[id]._classes.delete(n); }
    },
    appendChild() {}, querySelector() { return null; }, querySelectorAll() { return []; },
    getContext() { return null; },
    addEventListener() {}
  });
  return {
    getElementById(id) { if (!elements[id]) elements[id] = make(id); return elements[id]; },
    createElement(tag) { return make('created-' + tag); },
    querySelector() { return null; },
    querySelectorAll() { return []; }
  };
}

test('Screen: the blockMap markup has the top-down canvas and district rail, and no legacy grid', () => {
  const fs = require('fs');
  const path = require('path');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  assert.ok(html.includes('id="topDownMapCanvas"'), 'top-down canvas must exist');
  assert.ok(html.includes('id="districtRail"'), 'district rail must exist');
  assert.ok(html.includes('id="mapPromptLine"'), 'contextual prompt line must exist');

  assert.equal(html.includes('id="strategicMapCanvas"'), false, 'legacy grid canvas must be gone');
  assert.equal(html.includes('setQuestFilter'), false, 'quest filter must be gone — it had no data model');
  assert.equal(html.includes('app.zoomMap'), false, 'zoom controls must be gone');
  assert.equal(html.includes('Fog / Unexplored'), false, 'fog legend must be gone');
});

test('Screen: travelToDistrict is refused when heat gates the city', () => {
  global.document = fakeDocument();
  global.window = { addEventListener() {}, dispatchEvent() {} };
  global.alert = () => {};
  try {
    const { app } = loadGameModule();
    app.locationHeat = { ...app.locationHeat, Detroit: 3 };
    const before = app.game.activeCity;

    assert.equal(app.travelToDistrict('DETROIT'), false, 'heat 3 must block travel');
    assert.equal(app.game.activeCity, before, 'active city must not change on a refused travel');
  } finally {
    delete global.document; delete global.window; delete global.alert;
  }
});

test('Screen: travelToDistrict succeeds for a clear city and sets the active city', () => {
  global.document = fakeDocument();
  global.window = { addEventListener() {}, dispatchEvent() {} };
  global.alert = () => {};
  try {
    const { app } = loadGameModule();
    app.locationHeat = { ...app.locationHeat, Chicago: 0 };

    assert.equal(app.travelToDistrict('CHICAGO'), true);
    assert.equal(app.game.activeCity, 'Chicago');
  } finally {
    delete global.document; delete global.window; delete global.alert;
  }
});

test('Screen: travelToDistrict rejects an unknown district key', () => {
  global.document = fakeDocument();
  global.window = { addEventListener() {}, dispatchEvent() {} };
  global.alert = () => {};
  try {
    const { app } = loadGameModule();
    assert.equal(app.travelToDistrict('ATLANTIS'), false);
  } finally {
    delete global.document; delete global.window; delete global.alert;
  }
});

test('Screen: every city in the heat table has a district to travel to', () => {
  global.document = fakeDocument();
  global.window = { addEventListener() {}, dispatchEvent() {} };
  try {
    const { app } = loadGameModule();
    Object.keys(app.locationHeat).forEach(city => {
      assert.ok(CITY_TO_DISTRICT[city], `${city} in locationHeat has no district mapping`);
    });
  } finally {
    delete global.document; delete global.window;
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/topdown-city-screen.test.js`
Expected: FAIL — the markup assertions fail (`topDownMapCanvas` absent, `strategicMapCanvas` present) and `app.travelToDistrict is not a function`.

- [ ] **Step 3: Replace the blockMap markup**

In `index.html`, replace the whole `<section id="blockMap" class="screen">` block (currently lines 1214-1278) with:

```html
  <!-- BLOCK MAP — top-down walkable district -->
  <section id="blockMap" class="screen">
    <div class="panel" style="position:relative;">
      <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; align-items:center; margin-bottom:8px;">
        <h2 id="mapDistrictTitle" style="margin:0; font-family:'Press Start 2P', monospace; font-size:12px;">HARLEM STOOP</h2>
        <span class="status-pill">Reputation: <b id="mapRep" style="color:#ffcd68;">0</b> · Weather: <b id="mapWeather" style="color:#ff7a45;">CLEAR</b></span>
      </div>

      <div style="display:flex; gap:12px; align-items:flex-start;">
        <!-- Left: district rail (this is fast travel) -->
        <div class="panel" style="flex:0 0 200px; background:#101116; border:2px solid #2d313d; padding:10px;">
          <h3 style="margin-top:0; font-family:'Press Start 2P', monospace; font-size:9px; color:#ffcd68; border-bottom:1px solid #2d313d; padding-bottom:6px;">DISTRICTS</h3>
          <div id="districtRail" style="display:flex; flex-direction:column; gap:6px;"></div>
        </div>

        <!-- Centre: the walkable map -->
        <div style="flex:1; min-width:0;">
          <div class="crt-screen" style="border:3px solid #ffcd68; background:#08080a;">
            <canvas id="topDownMapCanvas" width="960" height="520" class="pixel-canvas" style="width:100%; height:auto; display:block; image-rendering:pixelated;"></canvas>
          </div>
          <div id="mapPromptLine" style="margin-top:6px; min-height:16px; font-family:'Press Start 2P', monospace; font-size:9px; color:#ffcd68; text-align:center;">Walk with WASD / Arrows.</div>
        </div>
      </div>

      <div style="margin-top:10px; display:flex; gap:10px;">
        <button class="secondary" onclick="app.showGame()">BACK TO TABLE</button>
        <button onclick="app.showSetup()">EXIT TO MENU</button>
      </div>
    </div>
  </section>
```

- [ ] **Step 4: Add the script tags**

In `index.html`, immediately after the existing `<script src="src/pixel_engine/block-map-navigation.js"></script>` line, add:

```html
<script src="src/pixel_engine/asset-registry.js"></script>
<script src="src/pixel_engine/topdown-city-data.js"></script>
<script src="src/pixel_engine/topdown-city-controller.js"></script>
<script src="src/pixel_engine/topdown-city-renderer.js"></script>
```

- [ ] **Step 5: Add the app methods**

In `index.html`, add these properties and methods to the `app` object literal, immediately after the existing `showBlockMap()` method. Then delete the old `showBlockMap` body and replace it with the version below, and delete `setQuestFilter`, `shouldRenderQuestSymbol`, `zoomMap`, `renderStrategicMap`, and `renderBlockMap` along with the `activeQuestFilter` property:

```js
  topDownController: null,
  topDownRenderer: null,
  assetRegistry: null,

  initTopDownCity() {
    if (this.topDownController) return;

    this.assetRegistry = new AssetRegistry();
    fetch('assets/manifest.json')
      .then(r => r.json())
      .then(m => {
        this.assetRegistry.loadManifest(m);
        return this.assetRegistry.preload();
      })
      .catch(() => {
        // No manifest, or it failed to parse: the map renders procedurally.
      });

    const startCity = (this.game && this.game.activeCity) || 'Harlem';
    const startKey = CITY_TO_DISTRICT[startCity] || 'HARLEM';

    this.topDownController = new TopDownCityController({ districtKey: startKey });
    this.topDownRenderer = new TopDownCityRenderer({ registry: this.assetRegistry });
  },

  showBlockMap() {
    this.initTopDownCity();
    this.show('blockMap');
    this.renderDistrictRail();

    const rep = document.getElementById('mapRep');
    const weather = document.getElementById('mapWeather');
    const player = this.game.players[this.humanIndex];
    if (rep) rep.textContent = (player && player.stats ? player.stats.reputation : 0);
    if (weather) weather.textContent = this.game.weatherMode || 'CLEAR';
  },

  renderDistrictRail() {
    const rail = document.getElementById('districtRail');
    if (!rail) return;
    rail.innerHTML = '';

    districtKeys().forEach(key => {
      const d = getTopDownDistrict(key);
      const travelable = this.isLocationFastTravelable(d.city);
      const heat = this.locationHeat[d.city] || 0;
      const isHere = this.topDownController && this.topDownController.districtKey === key;

      const btn = document.createElement('button');
      btn.className = 'secondary';
      btn.style.fontSize = '7px';
      btn.style.width = '100%';
      btn.style.textAlign = 'left';
      btn.style.padding = '6px 4px';
      btn.textContent = d.name.toUpperCase();

      if (isHere) {
        btn.style.borderColor = '#6fe8d8';
        btn.style.color = '#6fe8d8';
        btn.disabled = true;
      } else if (travelable) {
        btn.onclick = () => this.travelToDistrict(key);
      } else {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.color = '#f25438';
        btn.textContent = `${d.name.toUpperCase()} · HEAT ${heat}`;
      }
      rail.appendChild(btn);
    });
  },

  travelToDistrict(districtKey) {
    const d = getTopDownDistrict(districtKey);
    if (!d) return false;
    if (!this.isLocationFastTravelable(d.city)) return false;

    this.initTopDownCity();
    if (!this.topDownController.setDistrict(districtKey)) return false;

    this.game.activeCity = d.city;
    this.setWeather('CLEAR');
    if (this.pixelEngine) this.pixelEngine.setCityTheme(d.city);
    if (this.audioEngine && this.audioEngine.isPlayingBGM) this.audioEngine.startBGM(d.city);

    const title = document.getElementById('mapDistrictTitle');
    if (title) title.textContent = d.name.toUpperCase();
    this.renderDistrictRail();
    return true;
  },

  renderTopDownFrame() {
    if (!this.topDownController || !this.topDownRenderer) return;
    const canvas = document.getElementById('topDownMapCanvas');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.topDownController.update();
    this.topDownRenderer.render(ctx, this.topDownController);

    const prompt = document.getElementById('mapPromptLine');
    const spot = this.topDownController.activePoi;
    if (prompt) {
      prompt.textContent = spot
        ? (TOPDOWN_POI_LABELS[spot.id] || spot.id) + ' — press ENTER'
        : 'Walk with WASD / Arrows.';
    }

    if (spot && this.topDownController.keys['enter']) {
      this.topDownController.keys['enter'] = false;
      const hotspot = this.mapController.hotspots.find(h => h.id === spot.id);
      if (hotspot) this.triggerHotspot(hotspot);
    }
  },
```

- [ ] **Step 6: Drive the frame from the animation loop**

In `index.html`, inside the `loop` function's throttled block (the `if (elapsed > interval)` body, around line 3444), add a branch for the map screen before the existing `const gameActive = ...` line:

```js
        // 1.75 Top-down district map
        if (document.getElementById('blockMap').classList.contains('active')) {
          this.renderTopDownFrame();
        }
```

- [ ] **Step 7: Run test to verify it passes**

Run: `node --test test/topdown-city-screen.test.js`
Expected: PASS (5 tests).

- [ ] **Step 8: Run the full suite**

Run: `node --test "test/**/*.test.js"`
Expected: all pass. If `test/save-load-and-blockmap.test.js` fails, it asserts against the removed fast-travel list; update it to assert against `travelToDistrict` and the district rail instead of deleting the coverage.

- [ ] **Step 9: Verify in the browser**

Run `node server/server.js`, open `http://localhost:3001`, then:
- Start a Local game, click `[ MAP ]`.
- Confirm the map renders a dense top-down city, not a `#` grid; POI names appear on the map; there is no legend, no quest filter, no zoom buttons.
- Walk with WASD. Confirm the camera follows, the player cannot enter buildings, and sliding along a wall works.
- Walk onto the BARBER marker. Confirm the prompt line reads `BARBER — press ENTER`, and Enter opens Ray's NPC scene.
- Click a district in the rail with heat 0 (Chicago). Confirm the title and palette change and the rail marks the new district as current.
- Confirm a heat-gated district (Detroit, heat 3) is disabled and shows its heat.
- Resize to exactly 1280x720 and confirm the map screen does not scroll vertically.
- Confirm zero console errors other than the pre-existing `favicon.ico` 404.

- [ ] **Step 10: Commit**

```bash
git add index.html test/topdown-city-screen.test.js test/save-load-and-blockmap.test.js
git commit -m "feat: replace the tile-grid block map with the walkable top-down city"
```

---

### Task 6: Remove the side-on viewport and re-home weather and multiplayer

This is the migration with real blast radius. Do it only once Task 5's map is verified working in the browser.

**Files:**
- Modify: `index.html:900` (delete the `stage-canvas` element)
- Modify: `index.html:2085`, `index.html:3444-3507`, `index.html:5231` (remove or re-home every `stage-canvas` reference)
- Test: `test/topdown-city-migration.test.js`

**Interfaces:**
- Consumes: `app.renderTopDownFrame()` (Task 5), `app.topDownController` (Task 3).
- Produces: weather composites onto the top-down canvas; the online `avatar_update` broadcast emits the top-down controller's coordinates.

- [ ] **Step 1: Write the failing test**

Create `test/topdown-city-migration.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

function indexHtml() {
  return fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
}

test('Migration: the side-on stage-canvas is fully removed', () => {
  const html = indexHtml();
  assert.equal(html.includes('stage-canvas'), false,
    'no stage-canvas element or reference may survive — a stale getElementById returns null and throws at runtime');
});

test('Migration: the online avatar broadcast survives and uses the top-down controller', () => {
  const html = indexHtml();
  assert.ok(html.includes("type: 'avatar_update'"), 'multiplayer position broadcast must still exist');

  const idx = html.indexOf("type: 'avatar_update'");
  const block = html.slice(idx - 400, idx + 400);
  assert.ok(block.includes('topDownController'),
    'the broadcast must read top-down coordinates, not the removed mapController');
});

test('Migration: the broadcast sends a character origin, not a city name', () => {
  // The receiver does CHARACTER_ORIGINS[p.origin]. A city name here is not a
  // valid key, so every remote avatar would silently render as BARBER.
  const html = indexHtml();
  const idx = html.indexOf("type: 'avatar_update'");
  const block = html.slice(idx, idx + 500);

  assert.ok(/origin:\s*this\.mapController\.origin\.id/.test(block),
    'origin must be a CHARACTER_ORIGINS key');
  assert.equal(/origin:\s*[^,]*district\.city/.test(block), false,
    'origin must not be a city name');
});

test('Migration: weather still composites somewhere', () => {
  const html = indexHtml();
  assert.ok(html.includes('weatherSystem.render('), 'weather must still be rendered');
  assert.ok(html.includes('weatherSystem.advanceFrame('), 'weather must still advance');
});

test('Migration: the game screen no longer hosts a walkable viewport', () => {
  const html = indexHtml();
  const gameStart = html.indexOf('<section id="game"');
  const gameEnd = html.indexOf('<section id="judging"');
  const gameSection = html.slice(gameStart, gameEnd);

  assert.equal(gameSection.includes('<canvas id="stage-canvas"'), false);
  assert.equal(gameSection.includes('BLOCK VIEWPORT'), false,
    'the side-on viewport heading must be gone from the card table');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/topdown-city-migration.test.js`
Expected: FAIL — `stage-canvas` is still present in four places and the broadcast still reads `mapController`.

- [ ] **Step 3: Remove the canvas and its wrapper from the game screen**

In `index.html`, delete the `stage-canvas` element at line 900 together with its `BLOCK VIEWPORT` panel wrapper and the walk-hint paragraph beneath it (the `Walk with WASD / Arrows. Enter hotspots...` line). Leave the rest of the `#game` section intact.

- [ ] **Step 4: Re-home weather and the multiplayer broadcast**

In `index.html`, delete the whole `// 2. Active location viewport stage` block (lines 3444-3507) — the `gameActive || mapActive` branch, the `pixelEngine` construction inside it, the `mapController.update()`/`render()` calls, the remote-avatar loop, the hotspot Enter check, and the broadcast.

Then extend `renderTopDownFrame()` (added in Task 5) so weather and multiplayer keep working on the new canvas. Replace the method body with:

```js
  renderTopDownFrame() {
    if (!this.topDownController || !this.topDownRenderer) return;
    const canvas = document.getElementById('topDownMapCanvas');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.topDownController.update();
    this.topDownRenderer.render(ctx, this.topDownController);

    // Weather composites over the city, in world space so it tracks the camera.
    if (this.weatherSystem) {
      this.weatherSystem.advanceFrame();
      ctx.save();
      ctx.translate(-this.topDownController.camera.x, -this.topDownController.camera.y);
      this.weatherSystem.render(ctx);
      ctx.restore();
    }

    // Remote players, drawn in world space alongside the local player.
    if (this.game.mode === MODE.ONLINE && this.remoteAvatars) {
      ctx.save();
      ctx.translate(-this.topDownController.camera.x, -this.topDownController.camera.y);
      this.remoteAvatars.forEach((p, name) => {
        const origin = CHARACTER_ORIGINS[p.origin] || CHARACTER_ORIGINS.BARBER;
        drawHighDetailCharacterSprite(ctx, origin, Math.floor(p.x), Math.floor(p.y), p.frame, false, true, name);
      });
      ctx.restore();
    }

    const prompt = document.getElementById('mapPromptLine');
    const spot = this.topDownController.activePoi;
    if (prompt) {
      prompt.textContent = spot
        ? (TOPDOWN_POI_LABELS[spot.id] || spot.id) + ' — press ENTER'
        : 'Walk with WASD / Arrows.';
    }

    if (spot && this.topDownController.keys['enter']) {
      this.topDownController.keys['enter'] = false;
      const hotspot = this.mapController.hotspots.find(h => h.id === spot.id);
      if (hotspot) this.triggerHotspot(hotspot);
    }

    // Broadcast top-down coordinates so remote avatars stay in sync.
    if (this.game.mode === MODE.ONLINE && this.ws && this.ws.readyState === 1) {
      const c = this.topDownController;
      if (c.isMoving || this.lastX !== c.x || this.lastY !== c.y) {
        this.ws.send(JSON.stringify({
          type: 'avatar_update',
          x: c.x,
          y: c.y,
          // Must stay a CHARACTER_ORIGINS key ('BARBER', 'STREET_SCHOLAR', ...):
          // the receiver does CHARACTER_ORIGINS[p.origin]. Sending a city name
          // here silently falls every remote avatar back to BARBER.
          origin: this.mapController.origin.id,
          frame: c.animFrame,
          cityTheme: this.game.activeCity || 'Harlem'
        }));
        this.lastX = c.x;
        this.lastY = c.y;
      }
    }
  },
```

Note: `mapController` is retained solely as the source of the five hotspot definitions consumed by `triggerHotspot`. Do not delete `BlockMapController` in this task — its `hotspots` array is still the single definition of POI ids, names, and prompts.

- [ ] **Step 5: Clean the two remaining references**

`index.html:2085` and `index.html:5231` both call `getElementById('stage-canvas')`. Read each in context and delete the surrounding statement, since a `null` element there would throw. Verify with `grep -n "stage-canvas" index.html` returning nothing.

- [ ] **Step 6: Run tests to verify they pass**

Run: `node --test test/topdown-city-migration.test.js`
Expected: PASS (5 tests).

- [ ] **Step 7: Run the full suite**

Run: `node --test "test/**/*.test.js"`
Expected: all pass.

- [ ] **Step 8: Verify in the browser**

Run `node server/server.js`, open `http://localhost:3001`, resize to exactly 1280x720, then:
- Start a Local game. Confirm the card table now fits: your hand, the black card, the RPG stat HUD, and the SHOP button are all visible **without scrolling**, and no prompt is cut off.
- Confirm `document.body.scrollHeight <= window.innerHeight` on the game screen.
- Open the map, walk, trigger a POI, return to the table. Confirm zero console errors beyond the `favicon.ico` 404.
- Set weather to RAIN STORM from the dev console and confirm the effect draws over the top-down city.

- [ ] **Step 9: Commit**

```bash
git add index.html test/topdown-city-migration.test.js
git commit -m "refactor: remove the side-on viewport, re-home weather and avatar sync"
```

---

### Task 7: Rewrite the wireframe document

**Files:**
- Modify: `UI_WIREFRAME_CITY_MAP.txt` (full rewrite)

**Interfaces:**
- Consumes: the final behaviour of Tasks 1-6.

- [ ] **Step 1: Rewrite the file**

Replace the entire contents of `UI_WIREFRAME_CITY_MAP.txt` with a document describing the shipped design. It must cover: the 1280x720 frame with the 960x520 map canvas and 2400x1300 world; the district rail as the travel interface with heat gating; walkable two-axis movement with per-axis collision and camera-follow; the five canonical POIs with names rendered on the map; the asset manifest contract and procedural fallback; and per-district palette sourcing from `CITY_ART_PROMPTS.md` constrained to `concrete_kings_64.json`.

It must **not** describe the ASCII glyph grid, the glyph legend, fog of war, the quest filter, or zoom controls. Add a short "Removed and why" section recording that the quest filter and fog were cut because neither had a data model — quest glyphs were hardcoded at grid cells 4,3 / 16,3 / 16,8 and no explored/visited tracking existed — so both were decoration.

- [ ] **Step 2: Verify no stale concepts survive**

Run:

```bash
grep -niE "fog|legend|quest filter|zoom|ascii|# = |@ = " UI_WIREFRAME_CITY_MAP.txt
```

Expected: matches only inside the "Removed and why" section. Any other match means a stale concept survived the rewrite.

- [ ] **Step 3: Run the full suite**

Run: `node --test "test/**/*.test.js"`
Expected: all pass (the doc change should not affect tests; this confirms nothing else drifted).

- [ ] **Step 4: Commit**

```bash
git add UI_WIREFRAME_CITY_MAP.txt
git commit -m "docs: rewrite the city map wireframe for the top-down walkable design"
```

---

## Self-Review Notes

**Spec coverage.** Section 1 (what replaces what) → Tasks 5 and 6. Section 2 (four modules) → Tasks 1-4. Section 3 (behaviour: camera, collision, POIs, district switching) → Tasks 3 and 5. Section 4 (screen layout) → Task 5. Section 5 (asset import) → Task 1, consumed in Task 4. Section 6 (wireframe doc) → Task 7. Testing section → the four test files across Tasks 1-6. All three migration couplings (shared canvas, avatar broadcast, weather) are covered by Task 6's tests.

**Placeholder scan.** No TBD/TODO. Task 2 Step 5 asks for seven districts of creative layout data rather than printing all seven arrays; this is deliberate and bounded — the schema is fully specified, one complete worked example (Harlem) is given, all eight palettes are given verbatim, the specific levers to vary are enumerated, and Step 1's tests enforce every hard invariant. That is guidance, not a placeholder.

**Type consistency.** `districtKey` is the uppercase key everywhere (`'HARLEM'`), `city` is the display/heat-table string (`'Harlem'`), and `CITY_TO_DISTRICT` is the only bridge between them. `POI_IDS` in the data module matches the five `id` values in `BlockMapController.hotspots` exactly, which is what lets Task 5's `hotspots.find(h => h.id === spot.id)` resolve. `registry.get()` returns `{image, x, y, w, h}` in Task 1 and is destructured the same way in Task 4. `WORLD`/`VIEWPORT` are imported from the data module by both the controller and the renderer rather than redeclared. `spriteKey` builds `building_${parcel.roof}`, and Task 4's asset test registers `harlem.building_roofA`, matching the `roof: 'roofA'` value in Harlem's parcel data. All element names follow the prompt pack categories.

**One known rough edge, flagged deliberately.** `renderTopDownFrame()` is written in Task 5 and rewritten wholesale in Task 6. That duplication is intentional: it keeps Task 5 independently verifiable in the browser with the side-on view still present as a fallback, so the risky removal in Task 6 happens against a known-good map.

**One bug caught during this review.** The first draft of Task 6 broadcast `origin: c.district.city`, which would have sent `'Harlem'` where the receiver does `CHARACTER_ORIGINS[p.origin]` — not a valid key, so every remote avatar would have silently rendered as BARBER with no error anywhere. Fixed to `this.mapController.origin.id`, and Task 6 now carries a dedicated regression test for it, because this is a silent-failure class that no amount of local play would reveal.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-08-topdown-city-map.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
