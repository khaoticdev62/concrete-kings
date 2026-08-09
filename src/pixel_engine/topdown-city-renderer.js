/**
 * Concrete Kings: The Block Chronicles
 * Top-down city renderer.
 *
 * Every element checks the asset registry first and falls back to a
 * procedural form. The map must look correct with zero assets present, so
 * a null from registry.get() is the normal case, not an error path.
 *
 * Draw order follows RETRO_PIXEL_TOPDOWN_MAP_PROMPT_PACK.md section 6.3:
 * ground and roads (0), props and furniture (1), flora and weather (2),
 * decals on buildings (3), roof details (4).
 */

/**
 * Prefixed for the same reason as the controller: as classic <script> tags
 * these files share one global scope, so a bare `const WORLD` here collides
 * with the data module's declaration and stops this file parsing.
 */
let RND_DATA;
if (typeof require !== 'undefined') {
  RND_DATA = require('./topdown-city-data.js');
} else {
  RND_DATA = { WORLD: window.TOPDOWN_WORLD };
}
const RND_WORLD = RND_DATA.WORLD;

/** Lightmap, loaded the same dual-mode way. Optional: no module, no lighting. */
let RND_Lightmap = null;
if (typeof require !== 'undefined') {
  try { RND_Lightmap = require('./lightmap.js').TopDownLightmap; } catch (e) { RND_Lightmap = null; }
} else if (typeof window !== 'undefined') {
  RND_Lightmap = window.TopDownLightmap || null;
}

/**
 * paletteShift, for deriving shadows and highlights.
 *
 * Shading has to come from the palette: test/pixel-engine.test.js locks
 * MASTER_PALETTE_64 to exactly 64 colours, so a tone cannot be darkened
 * arithmetically. The identity fallback means a missing pixel-engine degrades to
 * flat shading rather than throwing.
 */
let RND_paletteShift = null;
if (typeof require !== 'undefined') {
  try { RND_paletteShift = require('./pixel-engine.js').paletteShift; } catch (e) { RND_paletteShift = null; }
}
if (!RND_paletteShift && typeof window !== 'undefined') RND_paletteShift = window.paletteShift;
if (!RND_paletteShift) RND_paletteShift = (hex) => hex;

/** One light direction for the whole map: from the north-west. */
const LIGHT_FROM_NW = true;

const SHADOW_OFFSET = 3;   // one shared offset is what sells the depth

/**
 * On-screen size of each street furniture piece, in world pixels.
 *
 * These are also the pixel dimensions the sprite PNGs must have on disk. The
 * canvas runs with imageSmoothingEnabled = false, so any downscale here is a
 * point-sample: a 96x96 generator canvas drawn at 18x30 loses ~80% of its
 * pixels and the sampling grid can miss a thin lamp post entirely. That is how
 * the first pass shipped lamps that looked like hair-thin squiggles.
 * scripts/process-props.sh pre-scales the art to these numbers so the draw is
 * 1:1, and test/manifest-integrity.test.js asserts the two stay in step.
 */
const FURNITURE_DISPLAY = {
  street_lamp: { w: 18, h: 30 },
  phone_booth: { w: 14, h: 26 },
  dumpster:    { w: 24, h: 22 }
};
const FACE_HEIGHT = 6;     // visible building front face

/**
 * Ground decal vocabulary, looked up as `<district>_<name>`.
 *
 * These come from the generated 4x4 city tile atlases. The atlases were first
 * tried as a tiled ground texture and that fails: the cells are individually
 * illustrated, each with a dark border and one dominant motif, so repeating one
 * stamps the same crack across the whole map in a visible grid. The flat
 * procedural surfaces read better. What the atlases genuinely got right is
 * discrete detail, so it is scattered over the pavement instead.
 *
 * A district with none of these declared draws no decals, which is the
 * pre-asset look. Six of the eight are in that state — see
 * assets/ASSET_INVENTORY.md.
 */
const DECAL_KEYS = ['decal_drain', 'decal_manhole', 'decal_vent', 'decal_litter', 'decal_stain'];
const DECAL_COUNT = 18;    // per district, across every sidewalk band

/**
 * Decals are drawn at the width of the sidewalk they sit on, not at a fixed
 * size. Sidewalk bands here are 20px, so a 32px decal cannot fit inside one at
 * all — and a decal spanning the pavement is the correct read anyway, which is
 * how a real drain or manhole sits. Clamped so an unusually wide band does not
 * produce a giant manhole.
 */
const DECAL_MIN = 14;
const DECAL_MAX = 26;

const POI_LABELS = {
  BARBER_SHOP: 'BARBER',
  BODEGA: 'BODEGA',
  SHOP_DEAL: 'COUNTER DEAL',
  CHESS_PARK: 'CHESS PARK',
  LOCKED_DOOR: 'ALLEY GATE'
};

class TopDownCityRenderer {
  constructor(options = {}) {
    this.registry = options.registry || null;
    this.stats = { assetDraws: 0, proceduralDraws: 0 };
    // Decal placement is computed once per district and reused. Re-rolling it
    // every frame would make the litter crawl around the pavement.
    this.decalCache = new Map();
    // Pooled lamp light on the street surface. Optional by design: with the
    // module absent the map renders exactly as it did before.
    this.lightmap = options.lightmap !== undefined
      ? options.lightmap
      : (RND_Lightmap ? new RND_Lightmap() : null);
  }

  /**
   * Deterministic decal placement for a district.
   *
   * Seeded from the district key so the same block always looks the same across
   * frames, reloads and both players' screens in online mode. Positions are
   * sampled inside sidewalk bands only, which is both where this kind of detail
   * belongs and where the decals' baked-in field colour matches — the slicer
   * tones each one to the district's `walk` colour.
   */
  decalPlan(districtKey, d) {
    const cached = this.decalCache.get(districtKey);
    if (cached) return cached;

    // The plan deliberately does not consult the registry. Assets preload
    // asynchronously and the map renders immediately, so a registry-dependent
    // plan built on frame one is built from nothing — and caching that kept the
    // decals off the map permanently while every test passed. Planning positions
    // and kinds up front and resolving art only at draw time removes that race
    // rather than guarding against it.
    const spots = [];
    if (d.sidewalks.length) {
      // Small deterministic LCG. Seeded from the key's characters so each
      // district gets its own arrangement without storing one.
      let seed = 0;
      for (const ch of String(districtKey)) seed = (seed * 31 + ch.charCodeAt(0)) % 2147483647;
      seed = seed || 1;
      const rand = () => (seed = (seed * 48271) % 2147483647) / 2147483647;

      for (let i = 0; i < DECAL_COUNT; i++) {
        const band = d.sidewalks[Math.floor(rand() * d.sidewalks.length)];
        // Span the band's narrow axis and slide along its long one, so the whole
        // decal stays on the pavement instead of bleeding onto the road.
        const size = Math.max(DECAL_MIN, Math.min(DECAL_MAX, Math.min(band.w, band.h)));
        if (band.w < size || band.h < size) continue;
        spots.push({
          kind: DECAL_KEYS[Math.floor(rand() * DECAL_KEYS.length)],
          size,
          x: Math.round(band.x + rand() * (band.w - size)),
          y: Math.round(band.y + rand() * (band.h - size))
        });
      }
    }

    this.decalCache.set(districtKey, spots);
    return spots;
  }

  /**
   * Ground decals, asset-first like everything else.
   *
   * A district that has any decal art uses only that art, and skips the planned
   * slots it has no sprite for — mixing one district's photographic drain with a
   * drawn one beside it reads as a mistake. A district with no art at all draws
   * every slot procedurally, so no block is left bare while its neighbours have
   * detail. Only three of the eight districts have atlases so far.
   */
  drawDecals(ctx, districtKey, d, p) {
    const prefix = `${String(districtKey).toLowerCase()}_`;
    const hasArt = DECAL_KEYS.some(kind => this.sharedSlice(prefix + kind));

    this.decalPlan(districtKey, d).forEach(spot => {
      const slice = this.sharedSlice(prefix + spot.kind);
      if (slice) {
        ctx.drawImage(slice.image, slice.x, slice.y, slice.w, slice.h,
          spot.x, spot.y, spot.size, spot.size);
        this.stats.assetDraws++;
      } else if (!hasArt) {
        this.drawProceduralDecal(ctx, spot, p);
      }
    });
  }

  /**
   * Drawn stand-ins for the decal vocabulary, in the district's own palette.
   *
   * Kept deliberately plain. These sit on a 20px sidewalk band and read at a
   * glance as "the pavement has something on it", which is the whole job; a
   * detailed drawing at this size turns to noise.
   */
  drawProceduralDecal(ctx, spot, p) {
    const s = spot.size;
    const cx = spot.x + s / 2;
    const cy = spot.y + s / 2;

    switch (spot.kind) {
      case 'decal_manhole':
        // Light rim, dark cover. The other way round — dark ring with a light
        // centre — reads as a hollow circle rather than a lid sitting in a
        // socket, because on most district palettes roofADk is close enough to
        // the pavement that only the inner disc registers.
        ctx.fillStyle = p.walkHi;
        ctx.beginPath();
        ctx.ellipse(cx, cy, s * 0.36, s * 0.36, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = p.roofADk;
        ctx.beginPath();
        ctx.ellipse(cx, cy, s * 0.28, s * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
        // A single across-the-lid seam is what makes it read as a cover.
        this.fill(ctx, cx - s * 0.24, cy - 0.5, s * 0.48, 1, p.walk);
        this.stats.proceduralDraws++;
        break;

      case 'decal_drain':
      case 'decal_vent': {
        // A slotted grate: dark plate, lighter slots across it.
        const w = Math.round(s * 0.7);
        const h = Math.round(s * 0.5);
        this.fill(ctx, cx - w / 2, cy - h / 2, w, h, p.roofADk);
        for (let i = 1; i < 4; i++) {
          this.fill(ctx, cx - w / 2 + 2, cy - h / 2 + i * (h / 4), w - 4, 1, p.walkHi);
        }
        break;
      }

      case 'decal_litter':
        // A few specks rather than one shape, so it reads as scatter.
        [[-4, -3], [2, -5], [5, 1], [-2, 4], [1, 0]].forEach(([dx, dy], i) => {
          this.fill(ctx, cx + dx, cy + dy, 2, 2, i % 2 ? p.walkHi : p.face);
        });
        break;

      case 'decal_stain':
      default:
        ctx.fillStyle = this.withAlpha(p.shadow, 0.5);
        ctx.beginPath();
        ctx.ellipse(cx, cy, s * 0.34, s * 0.24, 0, 0, Math.PI * 2);
        ctx.fill();
        this.stats.proceduralDraws++;
        break;
    }
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

  /**
   * Combines a palette colour with an alpha multiplier into one rgba() string.
   *
   * Exists so gameplay draws never touch ctx.globalAlpha. globalAlpha is global
   * state: any early return, exception or nested draw between setting it and
   * resetting it leaks a translucent context into everything drawn afterwards.
   * Alpha baked into fillStyle cannot leak.
   *
   * Handles both palette forms. Most keys are hex, but `shadow` is already an
   * rgba() string, so its own alpha is multiplied rather than discarded —
   * replacing it would make every shadow darker than the palette intends.
   */
  withAlpha(colour, mult) {
    const str = String(colour);
    const rgba = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(str);
    if (rgba) {
      const base = rgba[4] === undefined ? 1 : parseFloat(rgba[4]);
      return `rgba(${rgba[1]},${rgba[2]},${rgba[3]},${(base * mult).toFixed(3)})`;
    }
    const hex = /^#([0-9a-f]{6})$/i.exec(str);
    if (hex) {
      const n = parseInt(hex[1], 16);
      return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${mult.toFixed(3)})`;
    }
    return str;   // unknown format: pass through rather than drawing nothing
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

    // ---- Static surface: ground, roads, markings, sidewalks, parcels ----
    // Drawn once per district into an off-screen world-sized canvas and blitted,
    // because the texture work below is per-pixel over a 2400x1300 world and
    // cannot run every frame. Without a canvas (Node) it draws inline instead.
    const layer = this.surfaceLayer(key, d, p);
    if (layer) {
      ctx.drawImage(layer, 0, 0);
    } else {
      this.drawSurface(ctx, key, d, p);
    }

    // ---- Layer 0: ground decals, drawn onto the pavement before anything
    //      stands on it, so furniture and the player occlude them correctly ----
    this.drawDecals(ctx, key, d, p);


    // ---- Layer 0.5: lamp light pools on the surface ----
    // After the road, sidewalks and ground decals, before anything standing on
    // the street, so furniture and the player sit IN the light rather than under
    // a wash laid over the top of them.
    if (this.lightmap) {
      this.lightmap.render(ctx, d, p, cam, { width: ctx.canvas.width, height: ctx.canvas.height });
    }

    // ---- Layer 1: props and furniture ----
    d.decor.filter(i => i.type === 'car').forEach(item => {
      this.drawCar(ctx, item.x, item.y, item.dir, p);
    });
    const FURNITURE_KIND = { lamp: 'street_lamp', booth: 'phone_booth', dumpster: 'dumpster' };
    d.decor.filter(i => FURNITURE_KIND[i.type]).forEach(item => {
      this.drawFurniture(ctx, FURNITURE_KIND[item.type], item.x, item.y, p);
    });

    // ---- Layer 2: flora (weather composites separately, over this canvas) ----
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

  /**
   * Everything in a district that never moves.
   *
   * Split out of render() so it can be rendered once into a cached off-screen
   * canvas. Order matters: base surfaces, then their texture, then markings on
   * top of the texture, then parcels with their ambient occlusion.
   */
  drawSurface(ctx, key, d, p) {
    // ---- Layer 0: ground ----
    this.fill(ctx, 0, 0, RND_WORLD.width, RND_WORLD.height, p.ground);

    // ---- Layer 0: roads, then lane dashes ----
    d.roads.forEach(r => {
      if (!this.tryAsset(ctx, key, `road_${r.dir}`, r.x, r.y, r.w, r.h)) {
        this.fill(ctx, r.x, r.y, r.w, r.h, p.asphalt);
      }
    });
    // ---- Layer 0: sidewalks with a highlight edge ----
    d.sidewalks.forEach(s => {
      if (!this.tryAsset(ctx, key, 'ground_walk', s.x, s.y, s.w, s.h)) {
        this.fill(ctx, s.x, s.y, s.w, s.h, p.walk);
        this.fill(ctx, s.x, s.y, s.w, 2, p.walkHi);
      }
    });

    // Texture passes, after the flat bases and before anything reading as paint.
    this.textureSurfaces(ctx, d, p);

    // Paint goes on AFTER the texture. Drawn before it, the grain chewed holes in
    // every crosswalk bar and lane dash — clearly visible at 3x.
    d.roads.forEach(r => {
      if (r.dir === 'h') {
        const cy = r.y + r.h / 2 - 2;
        for (let x = r.x + 12; x < r.x + r.w - 24; x += 52) this.fill(ctx, x, cy, 26, 4, p.lane);
      } else {
        const cx = r.x + r.w / 2 - 2;
        for (let y = r.y + 12; y < r.y + r.h - 24; y += 52) this.fill(ctx, cx, y, 4, 26, p.lane);
      }
    });

    // ---- Layer 0: zebra crossings where the avenue meets the street ----
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


    // Parcels last: their occlusion has to fall on finished ground.
    d.parcels.forEach(parcel => this.drawParcel(ctx, key, parcel, p));
  }

  /**
   * Cached static surface for one district, or null where no canvas exists.
   *
   * One district at a time: a world-sized RGBA canvas is about 12MB, so holding
   * all eight would cost ~96MB for districts the player is not standing in.
   */
  surfaceLayer(key, d, p) {
    if (this.surfaceCacheKey === key && this.surfaceCanvas) return this.surfaceCanvas;
    const make = this.createCanvas
      || (typeof document !== 'undefined' ? () => document.createElement('canvas') : null);
    if (!make) return null;

    const canvas = make();
    canvas.width = RND_WORLD.width;
    canvas.height = RND_WORLD.height;
    const lctx = canvas.getContext('2d');
    if (!lctx) return null;
    lctx.imageSmoothingEnabled = false;
    this.drawSurface(lctx, key, d, p);

    this.surfaceCanvas = canvas;
    this.surfaceCacheKey = key;
    return canvas;
  }

  /** Drops the cached surface. Call when a district's appearance changes. */
  invalidateSurface() {
    this.surfaceCanvas = null;
    this.surfaceCacheKey = null;
  }

  /**
   * Deterministic PRNG, seeded per district and per pass.
   *
   * Texture must be identical on every load and on both players' screens, so
   * Math.random is not an option.
   */
  seeded(seedText) {
    let seed = 0;
    for (const ch of String(seedText)) seed = (seed * 31 + ch.charCodeAt(0)) % 2147483647;
    seed = seed || 1;
    return () => (seed = (seed * 48271) % 2147483647) / 2147483647;
  }

  /**
   * Scatters single pixels of a neighbouring palette tone across a rect.
   *
   * This is what stops a surface being one flat colour. Density is deliberately
   * low and the tone only one step away: at high density or contrast it reads as
   * television static rather than asphalt grain.
   */
  /**
   * Scatters small clusters of a neighbouring palette tone across a rect.
   *
   * Clusters, and biased dark, on purpose. Uniform single-pixel noise at a density
   * high enough to shift the tone distribution reads as television static — it was
   * tried and it looked like interference, not asphalt. Real pixel-art surfaces use
   * small clumps, mostly darker than the base, with light flecks rare: light
   * speckle on a near-black road reads as stars.
   */
  grain(ctx, x, y, w, h, base, density, seedText, opts) {
    const o = opts || {};
    const cluster = o.cluster === undefined ? 2 : o.cluster;
    const lightBias = o.lightBias === undefined ? 0.18 : o.lightBias;
    const rand = this.seeded(seedText);
    const light = RND_paletteShift(base, 1);
    const dark = RND_paletteShift(base, -1);
    // density is coverage, so the clump count divides by the area each clump covers.
    const count = Math.floor((w * h) * density / (cluster * cluster));
    for (let i = 0; i < count; i++) {
      const px = x + Math.floor(rand() * w);
      const py = y + Math.floor(rand() * h);
      const cw = 1 + Math.floor(rand() * cluster);
      const ch = 1 + Math.floor(rand() * cluster);
      ctx.fillStyle = rand() < lightBias ? light : dark;
      ctx.fillRect(px, py, cw, ch);
    }
    this.stats.proceduralDraws++;
  }

  /**
   * 4x4 ordered dither between two tones, for a gradient inside a fixed palette.
   * `dir` is 1 to fade the second tone in downward, -1 upward.
   */
  dither(ctx, x, y, w, h, from, to, dir) {
    const M = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
    this.fill(ctx, x, y, w, h, from);
    for (let row = 0; row < h; row++) {
      const t = dir > 0 ? (row + 1) / h : 1 - row / h;
      const threshold = Math.floor(t * 16);
      for (let col = 0; col < w; col++) {
        if (M[row % 4][col % 4] < threshold) {
          ctx.fillStyle = to;
          ctx.fillRect(x + col, y + row, 1, 1);
        }
      }
    }
  }

  /**
   * Material texture for the three large surfaces.
   *
   * Runs after the flat bases and before anything that reads as paint, so lane
   * markings and crosswalks stay crisp on top of a textured road. Densities are
   * tuned by looking at a 3x crop: the failure mode at higher values is television
   * static, and the value gap between road and pavement has to survive, because
   * the prompt pack requires walkability to read by value alone.
   */
  textureSurfaces(ctx, d, p) {
    const id = d.id || 'x';

    // Ground: sparse grit over the whole world.
    this.grain(ctx, 0, 0, RND_WORLD.width, RND_WORLD.height, p.ground, 0.015,
      'ground' + id, { cluster: 4, lightBias: 0.04 });

    // Roads: asphalt grain, then expansion joints across the direction of travel,
    // then a darker tar patch or two so no stretch is uniform.
    d.roads.forEach((r, i) => {
      this.grain(ctx, r.x, r.y, r.w, r.h, p.asphalt, 0.07, 'road' + i + id,
        { cluster: 3, lightBias: 0.10 });
      const joint = RND_paletteShift(p.asphalt, -1);
      if (r.dir === 'h') this.seams(ctx, r.x, r.y, r.w, r.h, joint, 128, 0);
      else this.seams(ctx, r.x, r.y, r.w, r.h, joint, 0, 128);

      const rand = this.seeded('patch' + i + id);
      for (let n = 0; n < 5; n++) {
        const pw = 40 + Math.floor(rand() * 70);
        const ph = 14 + Math.floor(rand() * 20);
        const px = r.x + Math.floor(rand() * Math.max(1, r.w - pw));
        const py = r.y + Math.floor(rand() * Math.max(1, r.h - ph));
        this.fill(ctx, px, py, pw, ph, joint);
        this.grain(ctx, px, py, pw, ph, joint, 0.10, 'patchg' + i + n + id,
          { cluster: 2, lightBias: 0.14 });
      }
    });

    // Sidewalks: slab seams along the band, grit, and a kerb lit on the
    // north-west edge and shaded on the south-east. The old version drew one 2px
    // highlight on the top edge only, which read as a border rather than a kerb.
    d.sidewalks.forEach((s, i) => {
      const along = s.w >= s.h;
      this.seams(ctx, s.x, s.y, s.w, s.h, RND_paletteShift(p.walk, -1),
        along ? 26 : 0, along ? 0 : 26);
      this.grain(ctx, s.x, s.y, s.w, s.h, p.walk, 0.16, 'walk' + i + id,
        { cluster: 2, lightBias: 0.30 });
      this.fill(ctx, s.x, s.y, along ? s.w : 1, along ? 1 : s.h, RND_paletteShift(p.walk, 2));
      this.fill(ctx, along ? s.x : s.x + s.w - 1, along ? s.y + s.h - 1 : s.y,
        along ? s.w : 1, along ? 1 : s.h, RND_paletteShift(p.walk, -2));
    });
  }

  /** Slab, course and expansion-joint lines. */
  seams(ctx, x, y, w, h, colour, stepX, stepY) {
    if (stepX > 0) for (let sx = x + stepX; sx < x + w; sx += stepX) this.fill(ctx, sx, y, 1, h, colour);
    if (stepY > 0) for (let sy = y + stepY; sy < y + h; sy += stepY) this.fill(ctx, x, sy, w, 1, colour);
  }

  drawParcel(ctx, key, parcel, p) {
    const roofCol = p[parcel.roof] || p.roofA;
    const roofDk = p[`${parcel.roof}Dk`] || p.roofADk;

    // Shadow first, always procedural, so depth stays consistent across assets
    this.fill(ctx, parcel.x + SHADOW_OFFSET, parcel.y + SHADOW_OFFSET,
      parcel.w, parcel.h + FACE_HEIGHT, p.shadow);

    if (parcel.kind === 'park' || parcel.kind === 'lot' || parcel.kind === 'court') {
      if (!this.tryAsset(ctx, key, `ground_${parcel.kind}`, parcel.x, parcel.y, parcel.w, parcel.h)) {
        this.fill(ctx, parcel.x, parcel.y, parcel.w, parcel.h, roofCol);

        if (parcel.kind === 'lot') {
          // Painted stalls plus a kerb edge, so a lot never reads as a slab.
          for (let x = parcel.x + 14; x < parcel.x + parcel.w - 8; x += 26) {
            this.fill(ctx, x, parcel.y + 6, 3, parcel.h - 12, p.walkHi);
          }
          this.fill(ctx, parcel.x, parcel.y, parcel.w, 3, p.walk);
          this.fill(ctx, parcel.x, parcel.y + parcel.h - 3, parcel.w, 3, p.walk);
        }

        if (parcel.kind === 'park') {
          // Break the flat fill with darker undergrowth patches and a path.
          for (let gy = parcel.y + 10; gy < parcel.y + parcel.h - 14; gy += 38) {
            for (let gx = parcel.x + 12; gx < parcel.x + parcel.w - 16; gx += 46) {
              const jitter = ((gx + gy) % 3) * 6;
              this.fill(ctx, gx + jitter, gy, 22, 12, p.treeDk);
            }
          }
          const pathY = parcel.y + Math.floor(parcel.h / 2) - 5;
          this.fill(ctx, parcel.x + 4, pathY, parcel.w - 8, 11, p.walk);
          this.fill(ctx, parcel.x + 4, pathY, parcel.w - 8, 2, p.walkHi);
        }

        if (parcel.kind === 'court') {
          // Half-court markings: centre line, circle stand-in, and two keys.
          const midX = parcel.x + parcel.w / 2;
          this.fill(ctx, midX - 2, parcel.y + 6, 4, parcel.h - 12, p.zebra);
          this.fill(ctx, midX - 26, parcel.y + parcel.h / 2 - 26, 52, 4, p.zebra);
          this.fill(ctx, midX - 26, parcel.y + parcel.h / 2 + 22, 52, 4, p.zebra);
          const keyH = Math.min(70, parcel.h - 40);
          this.fill(ctx, parcel.x + 10, parcel.y + (parcel.h - keyH) / 2, 46, 3, p.zebra);
          this.fill(ctx, parcel.x + parcel.w - 56, parcel.y + (parcel.h - keyH) / 2, 46, 3, p.zebra);
          this.fill(ctx, parcel.x + 10, parcel.y + (parcel.h + keyH) / 2, 46, 3, p.zebra);
          this.fill(ctx, parcel.x + parcel.w - 56, parcel.y + (parcel.h + keyH) / 2, 46, 3, p.zebra);
        }
      }
      return;
    }

    // Building: visible front face, then roof, then clutter
    // Front face, dithered from lit at the top to shaded at its base so the
    // building grounds instead of floating on the pavement.
    this.dither(ctx, parcel.x, parcel.y + parcel.h, parcel.w, FACE_HEIGHT,
      p.face, RND_paletteShift(p.face, -2), 1);

    // Ambient occlusion: the ground darkens where it meets the south and east
    // walls. Surfaces met at a hard seam with no occlusion is the single clearest
    // difference from the generated art.
    const ao = this.withAlpha(p.shadow, 0.45);
    ctx.fillStyle = ao;
    ctx.fillRect(parcel.x, parcel.y + parcel.h + FACE_HEIGHT, parcel.w + 3, 3);
    ctx.fillRect(parcel.x + parcel.w, parcel.y + 2, 3, parcel.h + FACE_HEIGHT);
    if (!this.tryAsset(ctx, key, `building_${parcel.roof}`, parcel.x, parcel.y, parcel.w, parcel.h)) {
      this.fill(ctx, parcel.x, parcel.y, parcel.w, parcel.h, roofCol);

      // Roof surface: grain plus tar-seam courses, so a roof is a material rather
      // than a rectangle of one colour.
      this.grain(ctx, parcel.x, parcel.y, parcel.w, parcel.h, roofCol, 0.13,
        'roof' + parcel.x + parcel.y, { cluster: 2, lightBias: 0.26 });
      this.seams(ctx, parcel.x, parcel.y, parcel.w, parcel.h,
        RND_paletteShift(roofCol, -1), 0, 34);

      // Parapet lit on the north and west, shaded on the south and east. The
      // previous version filled roofDk along BOTH the top and bottom edges, which
      // reads as a drawn border because it implies light from nowhere.
      const lit = RND_paletteShift(roofCol, 2);
      const shade = RND_paletteShift(roofCol, -2);
      this.fill(ctx, parcel.x, parcel.y, parcel.w, 2, lit);              // north
      this.fill(ctx, parcel.x, parcel.y, 2, parcel.h, lit);              // west
      this.fill(ctx, parcel.x, parcel.y + parcel.h - 2, parcel.w, 2, shade);  // south
      this.fill(ctx, parcel.x + parcel.w - 2, parcel.y, 2, parcel.h, shade);  // east
    }

    // ---- Layer 4: rooftop clutter ----
    // Spacing is deliberately tight. Density is what makes a top-down city read
    // as inhabited rather than as coloured blocks; sparse clutter looks unfinished.
    const STEP = 46;
    const cols = Math.max(1, Math.floor(parcel.w / STEP));
    const rows = Math.max(1, Math.floor(parcel.h / STEP));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ux = parcel.x + 14 + c * STEP;
        const uy = parcel.y + 14 + r * STEP;
        // Vary the unit by position so rooftops are not a regular lattice.
        const variant = (c + r * 3) % 4;
        if (variant === 3) continue;  // leave gaps

        if (variant === 0) {                                    // AC unit
          if (ux + 20 > parcel.x + parcel.w - 6 || uy + 14 > parcel.y + parcel.h - 6) continue;
          this.fill(ctx, ux, uy, 20, 14, roofDk);
          this.fill(ctx, ux + 3, uy + 3, 14, 5, roofCol);
        } else if (variant === 1) {                              // vent pair
          if (ux + 16 > parcel.x + parcel.w - 6 || uy + 8 > parcel.y + parcel.h - 6) continue;
          this.fill(ctx, ux, uy, 7, 8, roofDk);
          this.fill(ctx, ux + 9, uy, 7, 8, roofDk);
        } else {                                                 // skylight
          if (ux + 18 > parcel.x + parcel.w - 6 || uy + 10 > parcel.y + parcel.h - 6) continue;
          this.fill(ctx, ux, uy, 18, 10, roofDk);
          this.fill(ctx, ux + 2, uy + 2, 14, 6, p.walkHi);
        }
      }
    }

    // Water tank and stair head on anything with real footprint.
    if (parcel.w > 90 && parcel.h > 80) {
      this.fill(ctx, parcel.x + parcel.w - 34, parcel.y + 14, 22, 22, roofDk);
      this.fill(ctx, parcel.x + parcel.w - 30, parcel.y + 18, 14, 14, p.face);
      this.fill(ctx, parcel.x + 12, parcel.y + parcel.h - 30, 26, 18, roofDk);
      this.fill(ctx, parcel.x + 16, parcel.y + parcel.h - 26, 18, 10, p.face);
    }
  }

  /**
   * Tree canopy.
   *
   * Three overlapping offset lobes rather than one circle. A single circle with a
   * smaller circle inside it reads as a poker chip, which is exactly how these
   * looked beside the generated props. Lit on the north-west, shaded on the
   * south-east, with grain over the crown to break up the fill.
   */
  drawTree(ctx, key, x, y, p) {
    if (this.tryAsset(ctx, key, 'flora_tree', x - 12, y - 12, 24, 24)) return;

    const blob = (cx, cy, r, colour) => {
      ctx.fillStyle = colour;
      ctx.beginPath();
      ctx.arc(Math.floor(cx), Math.floor(cy), r, 0, Math.PI * 2);
      ctx.fill();
    };

    // Cast shadow to the south-east, matching the map light.
    ctx.fillStyle = this.withAlpha(p.shadow, 0.5);
    ctx.beginPath();
    ctx.ellipse(x + SHADOW_OFFSET, y + SHADOW_OFFSET + 2, 12, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Canopy mass, then two smaller lobes to break the circle.
    blob(x, y, 11, RND_paletteShift(p.treeDk, -1));
    blob(x - 6, y - 4, 7, p.treeDk);
    blob(x + 5, y + 4, 6, p.treeDk);

    // Lit crown offset north-west, and a darker underside to the south-east.
    blob(x - 2, y - 3, 7, p.tree);
    blob(x - 5, y - 5, 4, RND_paletteShift(p.tree, 1));
    blob(x + 6, y + 5, 4, RND_paletteShift(p.treeDk, -1));

    // Foliage speckle. Clipped to the canopy box so it cannot land on the road.
    this.grain(ctx, x - 10, y - 10, 20, 20, p.tree, 0.09, 'tree' + x + y,
      { cluster: 2, lightBias: 0.35 });
    this.stats.proceduralDraws++;
  }

  /**
   * Props shared by every district — cars and street furniture — look up without
   * a district prefix, like the POI props. Only terrain keys are per-district.
   *
   * Source art is 96px so it reads at POI scale; street furniture is drawn much
   * smaller than that, or a lamp post would dwarf the 24px street trees.
   */
  sharedSlice(element) {
    return this.registry ? this.registry.get(element) : null;
  }

  /** Soft contact shadow. A boxy offset rect looks wrong under an irregular sprite. */
  contactShadow(ctx, cx, cy, rx, ry, p) {
    ctx.fillStyle = this.withAlpha(p.shadow, 0.35);
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Cars. `prop_car` is intentionally absent from assets/manifest.json: the
   * generated art is a front-on view of a vehicle, not a roof-down one, so it
   * read as a gold picture frame on the asphalt. A wrong-perspective sprite is
   * worse than a clean procedural shape, so this falls through to the block
   * below until top-down art exists. Same for `prop_street_lamp`. The asset
   * branch stays, ready for correct art — see assets/ASSET_INVENTORY.md.
   */
  drawCar(ctx, x, y, dir, p) {
    const w = dir === 'v' ? 16 : 30;
    const h = dir === 'v' ? 30 : 16;

    const slice = this.sharedSlice('prop_car');
    if (slice) {
      // Source art points "up"; a horizontal car is the same sprite rotated,
      // which keeps one asset serving both lanes.
      const L = 36, W = 22;
      const cx = x + w / 2;
      const cy = y + h / 2;
      this.contactShadow(ctx, cx, cy + (dir === 'v' ? L / 2 - 4 : 0), dir === 'v' ? W * 0.5 : L * 0.45, 4, p);

      ctx.save();
      ctx.translate(cx, cy);
      if (dir === 'h') ctx.rotate(Math.PI / 2);
      ctx.drawImage(slice.image, slice.x, slice.y, slice.w, slice.h, -W / 2, -L / 2, W, L);
      ctx.restore();
      this.stats.assetDraws++;
      return;
    }

    // Procedural car: contact shadow, body, cabin, windscreen and wheels. The
    // previous form was one accent rectangle with two darker squares in it, which
    // read as a warning sign rather than a vehicle.
    const body = p.accent;
    const bodyDk = RND_paletteShift(body, -1);
    const glass = RND_paletteShift(p.asphalt, 2);

    ctx.fillStyle = this.withAlpha(p.shadow, 0.5);
    ctx.fillRect(x + SHADOW_OFFSET, y + SHADOW_OFFSET, w, h);

    if (dir === 'v') {
      this.fill(ctx, x + 1, y, w - 2, h, bodyDk);            // shell
      this.fill(ctx, x + 2, y + 2, w - 4, h - 4, body);      // lit body
      this.fill(ctx, x + 3, y + 4, w - 6, 6, glass);         // windscreen
      this.fill(ctx, x + 3, y + h - 11, w - 6, 5, glass);    // rear glass
      this.fill(ctx, x + 2, y + 1, w - 4, 1, RND_paletteShift(body, 1));
      this.fill(ctx, x, y + 4, 1, 5, bodyDk);                // wheels
      this.fill(ctx, x + w - 1, y + 4, 1, 5, bodyDk);
      this.fill(ctx, x, y + h - 9, 1, 5, bodyDk);
      this.fill(ctx, x + w - 1, y + h - 9, 1, 5, bodyDk);
    } else {
      this.fill(ctx, x, y + 1, w, h - 2, bodyDk);
      this.fill(ctx, x + 2, y + 2, w - 4, h - 4, body);
      this.fill(ctx, x + 4, y + 3, 6, h - 6, glass);
      this.fill(ctx, x + w - 11, y + 3, 5, h - 6, glass);
      this.fill(ctx, x + 2, y + 2, w - 4, 1, RND_paletteShift(body, 1));
      this.fill(ctx, x + 4, y, 5, 1, bodyDk);
      this.fill(ctx, x + 4, y + h - 1, 5, 1, bodyDk);
      this.fill(ctx, x + w - 10, y, 5, 1, bodyDk);
      this.fill(ctx, x + w - 10, y + h - 1, 5, 1, bodyDk);
    }
  }

  /**
   * Street furniture: lamps, phone booths, dumpsters. Anchored base-to-point so
   * an object stands on the pavement rather than floating centred on it. Falls
   * back to a small dark block, which still reads as clutter.
   */
  drawFurniture(ctx, kind, x, y, p) {
    const size = FURNITURE_DISPLAY[kind] || { w: 16, h: 22 };
    const slice = this.sharedSlice('prop_' + kind);

    if (slice) {
      this.contactShadow(ctx, x, y + 1, size.w * 0.55, 3.5, p);
      ctx.drawImage(slice.image, slice.x, slice.y, slice.w, slice.h,
        x - size.w / 2, y - size.h + 3, size.w, size.h);
      this.stats.assetDraws++;
      return;
    }

    if (kind === 'street_lamp') {
      // Seen from directly above a lamp is mostly its light — but the pool is
      // drawn by lightmap.js now, one layer earlier, so overlapping pools
      // brighten each other and furniture sits IN the light. Drawing a pool
      // here too stacked two glows on every lamp. Only the fitting remains.
      this.fill(ctx, x - 3, y - 3, 6, 6, p.roofADk);   // lamp head
      this.fill(ctx, x - 1, y - 1, 2, 2, p.accent);    // bulb
      return;
    }

    this.fill(ctx, x - 5 + SHADOW_OFFSET, y - 14 + SHADOW_OFFSET, 10, 16, p.shadow);
    this.fill(ctx, x - 5, y - 14, 10, 16, p.walkHi);
    this.fill(ctx, x - 4, y - 13, 8, 5, p.face);
  }

  drawPoi(ctx, poi, active, p) {
    const col = active ? p.accent : p.walkHi;

    // POI props are shared across all eight districts — the same five POIs
    // appear everywhere — so the lookup is district-agnostic, unlike every
    // other element which prefixes the district.
    const slice = this.registry
      ? this.registry.get('prop_poi_' + poi.id.toLowerCase())
      : null;

    let footprint = 30;

    if (slice) {
      // Anchor the sprite so its base sits on the POI point, the way a real
      // object stands on the ground rather than floating centred on it.
      const w = slice.w;
      const h = slice.h;
      const x = poi.x - w / 2;
      const y = poi.y - h + 10;

      ctx.fillStyle = this.withAlpha(p.shadow, 0.4);
      ctx.beginPath();
      ctx.ellipse(poi.x, poi.y + 4, w * 0.42, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.drawImage(slice.image, slice.x, slice.y, slice.w, slice.h, x, y, w, h);
      this.stats.assetDraws++;

      // Active POIs get an accent underline rather than a box, so the art is
      // never boxed in by UI chrome.
      if (active) this.fill(ctx, poi.x - w / 2, poi.y + 8, w, 3, col);

      footprint = h;
    } else {
      this.fill(ctx, poi.x - footprint / 2 + SHADOW_OFFSET, poi.y - footprint / 2 + SHADOW_OFFSET, footprint, footprint, p.shadow);
      this.fill(ctx, poi.x - footprint / 2, poi.y - footprint / 2, footprint, footprint, p.ground);
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.strokeRect(Math.round(poi.x - footprint / 2), Math.round(poi.y - footprint / 2), footprint, footprint);
    }

    // Name renders on the map — this is what replaces the deleted legend.
    const label = POI_LABELS[poi.id] || poi.id;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    const w = ctx.measureText(label).width + 12;
    const labelY = slice ? poi.y + 14 : poi.y + footprint / 2 + 4;
    this.fill(ctx, poi.x - w / 2, labelY, w, 15, p.ground);
    ctx.fillStyle = col;
    ctx.fillText(label, Math.round(poi.x), Math.round(labelY + 11));
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TopDownCityRenderer, POI_LABELS, SHADOW_OFFSET, FURNITURE_DISPLAY };
}
if (typeof window !== 'undefined') {
  window.TopDownCityRenderer = TopDownCityRenderer;
  window.TOPDOWN_POI_LABELS = POI_LABELS;
}
