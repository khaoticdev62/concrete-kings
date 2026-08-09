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

/**
 * One light direction for the whole map: from the NORTH-WEST, low in the sky.
 *
 * Not a constant, because nothing can meaningfully parameterise it — it is a
 * convention every draw in this file obeys by hand: highlights on north and west
 * edges, shade on south and east, and every cast shadow travelling south-east.
 * Kept as a comment rather than an unread `const LIGHT_FROM_NW = true`, which is
 * what it was before and which stated the convention without enforcing it.
 */

/**
 * Contact-shadow offset for small props — trees, cars, furniture, POIs.
 *
 * Buildings do NOT use this. They used to, and a shared 3px offset is precisely
 * why the map read as flat: from directly above you cannot see how tall a thing
 * is, so the shadow length IS the height cue. Giving a five-storey tenement and
 * a kerbside lamp the same 3px shadow states that both are 3px tall, and the
 * whole map collapses onto one plane. Building shadows are now cast from their
 * own storey count — see shadowOffsetOf().
 */
const SHADOW_OFFSET = 3;

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
/**
 * Building volume.
 *
 * A top-down view has exactly two ways to say "this is tall": the height of the
 * wall face you can see, and the length of the shadow it throws. The previous
 * version had a 6px face and a 3px shadow on every building regardless of size,
 * so it had neither — every parcel was a coloured rectangle with a hairline
 * border, which is what "extremely flat" means.
 *
 * STOREY_PX is the drawn height of one floor of visible south wall. Buildings
 * range 2-6 storeys, so faces run 18-54px against footprints of 100-500px:
 * clearly varied without the wall swallowing the roof.
 *
 * SHADOW_PER_STOREY is how far south-east the shadow travels per floor. It is
 * larger than STOREY_PX on purpose — a low sun throws a shadow longer than the
 * object is tall, and the long shadows crossing the street are what actually
 * produces the sense of height.
 */
const STOREY_PX = 9;
const SHADOW_PER_STOREY = 7;
const MIN_FLOORS = 2;
const MAX_FLOORS = 6;

/**
 * The face is carved out of the SOUTHERN edge of the parcel rather than being
 * added below it.
 *
 * Collision uses parcel.x/y/w/h directly, so a face hanging past the footprint
 * would let the player stand inside a wall — and with a 54px face on a district
 * whose blocks butt onto 20px pavement, inside several walls at once. Eating into
 * the plan instead keeps the walkable grid exactly as designed: a taller building
 * simply shows more wall and less roof. Capped so a shallow parcel (Harlem has
 * 100px-deep rows) keeps a readable roof.
 */
const MAX_FACE_FRACTION = 0.42;

/**
 * World pixels of shadow thrown per pixel of prop height.
 *
 * Slightly shallower than the buildings' SHADOW_PER_STOREY/STOREY_PX (0.78), and
 * that gap is deliberate rather than sloppiness: see castShadow() for why a prop's
 * shadow has to stay in contact with the prop while a building's does not.
 */
const PROP_SHADOW_SLOPE = 0.55;

/**
 * Real height of each street prop in world pixels, used only for shadow length.
 *
 * These are heights, not drawn sizes: a lamp is 18x30 on screen but stands ~34px
 * tall, while a car is 30px long and only ~12px tall. Sharing one shadow offset
 * across both — which is what the map did — states that a lamp post and a parked
 * car are the same height, and that is a large part of why the street read flat.
 */
const PROP_HEIGHT = {
  street_lamp: 34,
  phone_booth: 26,
  dumpster: 18,
  car: 12,
  tree: 22,
  player: 22
};

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
        this.disc(ctx, cx, cy, s * 0.36, p.walkHi);
        this.disc(ctx, cx, cy, s * 0.28, p.roofADk);
        // A single across-the-lid seam is what makes it read as a cover.
        this.fill(ctx, cx - s * 0.24, cy - 0.5, s * 0.48, 1, p.walk);
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
        this.oval(ctx, cx, cy, s * 0.34, s * 0.24, this.withAlpha(p.shadow, 0.5));
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

  /**
   * Storey count for a parcel.
   *
   * `parcel.floors` wins where a district author sets it. Otherwise it is derived
   * from the footprint: deep parcels are the tenement rows and go tall, shallow
   * ones are the two-storey shopfronts filling the gaps, with a deterministic
   * wobble from the coordinates so a row of identical footprints still produces a
   * varied skyline. Derived rather than authored so all eight districts gain height
   * without 150 hand-edited parcels — and pure and static so the geometry can be
   * asserted in Node with no canvas.
   */
  static floorsOf(parcel) {
    if (!parcel) return MIN_FLOORS;
    if (Number.isFinite(parcel.floors)) {
      return Math.max(MIN_FLOORS, Math.min(MAX_FLOORS, Math.floor(parcel.floors)));
    }
    const depth = parcel.h || 0;
    let floors = depth >= 380 ? 6 : depth >= 260 ? 5 : depth >= 180 ? 4 : depth >= 120 ? 3 : 2;
    const wobble = (Math.floor(parcel.x / 10) * 7 + Math.floor(parcel.y / 10) * 13) % 3;
    floors += wobble - 1;
    return Math.max(MIN_FLOORS, Math.min(MAX_FLOORS, floors));
  }

  /**
   * Height of the visible south wall, in world pixels.
   *
   * Carved out of the parcel's own depth (see MAX_FACE_FRACTION) so collision
   * bounds stay exactly what the district data declares.
   */
  static faceHeightOf(parcel) {
    if (!parcel) return 0;
    const wanted = TopDownCityRenderer.floorsOf(parcel) * STOREY_PX;
    const cap = Math.floor((parcel.h || 0) * MAX_FACE_FRACTION);
    return Math.max(0, Math.min(wanted, cap));
  }

  /**
   * How far south-east this building's shadow reaches.
   *
   * Proportional to storey count, unlike the flat 3px every parcel used to get.
   * This is the load-bearing depth cue: looking straight down, a long shadow is the
   * only thing that distinguishes a tower from a tarpaulin.
   */
  static shadowOffsetOf(parcel) {
    return TopDownCityRenderer.floorsOf(parcel) * SHADOW_PER_STOREY;
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
    // Its texture goes down immediately, BEFORE the roads and pavements, so those
    // paint over it. Run afterwards — which is where it used to live, inside
    // textureSurfaces — it scattered near-black ground flecks across the asphalt
    // and the pavement as well, because the pass covers the whole world. On the
    // light pavement those flecks read as holes punched in the concrete, and they
    // are what I previously mistook for the asphalt grain being too dark.
    this.fill(ctx, 0, 0, RND_WORLD.width, RND_WORLD.height, p.ground);
    this.textureGround(ctx, d, p);

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
    //
    // Two passes, and the split matters. Every building's shadow is laid down
    // before any building is drawn, so a tall block's shadow always falls across
    // the street and never paints over its neighbour's roof. Drawn per-parcel in
    // one pass it was order-dependent: whichever parcel happened to come later in
    // the data smeared its shadow over the one before it.
    d.parcels.forEach(parcel => this.parcelShadow(ctx, parcel, p));
    d.parcels.forEach(parcel => this.drawParcel(ctx, key, parcel, p));
  }

  /**
   * The shadow a building throws onto the ground, as one filled polygon.
   *
   * Geometry: a box under a distant light casts its footprint translated by
   * (height x tan(elevation)) along the light direction, and the shadow on the
   * ground is the union of the footprint and that translation — a hexagon, the
   * convex hull of the two rectangles. Filling it as one path is not a style
   * choice: the shadow colour is translucent, so drawing the swept region as a
   * stack of offset rectangles would darken wherever they overlapped and the
   * building would sit in a black smear.
   *
   * Open parcels (lots, parks, courts) are flat ground and cast nothing.
   */
  parcelShadow(ctx, parcel, p) {
    if (parcel.kind !== 'building') return;
    const off = TopDownCityRenderer.shadowOffsetOf(parcel);
    const x = parcel.x;
    const y = parcel.y;
    const w = parcel.w;
    const h = parcel.h;

    ctx.fillStyle = p.shadow;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w + off, y + off);
    ctx.lineTo(x + w + off, y + h + off);
    ctx.lineTo(x + off, y + h + off);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.fill();
    this.stats.proceduralDraws++;
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
    // fillStyle is hoisted out of the inner loop on purpose. A building face is up
    // to 670x54, so the loop below runs ~36,000 times per parcel and this runs over
    // every parcel of a district while the surface layer is being cached —
    // re-assigning fillStyle per pixel was measurably the slowest line in it.
    ctx.fillStyle = to;
    for (let row = 0; row < h; row++) {
      const t = dir > 0 ? (row + 1) / h : 1 - row / h;
      const threshold = Math.floor(t * 16);
      if (threshold <= 0) continue;
      const mRow = M[row % 4];
      for (let col = 0; col < w; col++) {
        if (mRow[col % 4] < threshold) ctx.fillRect(x + col, y + row, 1, 1);
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
  /**
   * Grit on the bare ground, drawn before anything is laid on top of it.
   *
   * Density raised from 0.015. The unbuilt band between the block frontage and the
   * pavement is 90px deep and was reading as a featureless void — a large part of
   * why the map looked flat even after the buildings gained height. It is rear yard
   * and alley, so it wants gravel, not emptiness.
   */
  textureGround(ctx, d, p) {
    this.grain(ctx, 0, 0, RND_WORLD.width, RND_WORLD.height, p.ground, 0.035,
      'ground' + (d.id || 'x'), { cluster: 3, lightBias: 0.10 });
  }

  textureSurfaces(ctx, d, p) {
    const id = d.id || 'x';

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

    // Shadows are laid down in their own pass by drawSurface, before any building
    // is drawn — see the comment there.

    if (parcel.kind === 'park' || parcel.kind === 'lot' || parcel.kind === 'court') {
      if (!this.tryAsset(ctx, key, `ground_${parcel.kind}`, parcel.x, parcel.y, parcel.w, parcel.h)) {
        this.fill(ctx, parcel.x, parcel.y, parcel.w, parcel.h, roofCol);

        if (parcel.kind === 'lot') {
          // Asphalt texture first, or the field under the markings is a flat slab —
          // the roads get this from textureSurfaces() but a lot is a parcel and was
          // missed by it.
          this.grain(ctx, parcel.x, parcel.y, parcel.w, parcel.h, roofCol, 0.06,
            'lot' + parcel.x + parcel.y, { cluster: 3, lightBias: 0.10 });

          // Two banks of stalls with a driving aisle between them, and the lines
          // worn rather than crisp. Full-depth lines in walkHi across the whole
          // parcel — which is what this drew — have no aisle to park off and read as
          // prison bars, brightly, at every zoom.
          const line = RND_paletteShift(p.walk, -1);
          const bank = Math.max(10, Math.floor((parcel.h - 16) * 0.36));
          const northY = parcel.y + 6;
          const southY = parcel.y + parcel.h - 6 - bank;
          for (let x = parcel.x + 16; x < parcel.x + parcel.w - 10; x += 26) {
            this.fill(ctx, x, northY, 2, bank, line);
            this.fill(ctx, x, southY, 2, bank, line);
          }
          // Kerb: lit on the north edge, shaded on the south, like every other
          // horizontal surface on the map.
          this.fill(ctx, parcel.x, parcel.y, parcel.w, 3, p.walk);
          this.fill(ctx, parcel.x, parcel.y, parcel.w, 1, RND_paletteShift(p.walk, 2));
          this.fill(ctx, parcel.x, parcel.y + parcel.h - 3, parcel.w, 3,
            RND_paletteShift(p.walk, -1));
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

    // ---- Building ----
    // The roof no longer occupies the whole parcel: the southern band of it is the
    // wall you are looking at from slightly in front, so the volume is carved out of
    // the declared footprint and collision bounds are untouched.
    const faceH = TopDownCityRenderer.faceHeightOf(parcel);
    const roofH = Math.max(6, parcel.h - faceH);
    const faceY = parcel.y + roofH;

    // Ambient occlusion: the ground darkens where it meets the south and east
    // walls. Surfaces met at a hard seam with no occlusion is the single clearest
    // difference from the generated art.
    const ao = this.withAlpha(p.shadow, 0.45);
    ctx.fillStyle = ao;
    ctx.fillRect(parcel.x, parcel.y + parcel.h, parcel.w + 3, 3);
    ctx.fillRect(parcel.x + parcel.w, parcel.y + 2, 3, parcel.h);
    if (!this.tryAsset(ctx, key, `building_${parcel.roof}`, parcel.x, parcel.y, parcel.w, roofH)) {
      this.fill(ctx, parcel.x, parcel.y, parcel.w, roofH, roofCol);

      // Roof surface: grain plus tar-seam courses, so a roof is a material rather
      // than a rectangle of one colour.
      //
      // lightBias is very low on purpose. The warm ramp steps hard — one step up
      // from Harlem's #7A1D1C brick is #AA2724 — so light flecks at any real
      // frequency turn a roof into red confetti. They did, at 0.26. Roof texture
      // wants to be almost entirely the darker step, light flecks rare accidents.
      this.grain(ctx, parcel.x, parcel.y, parcel.w, roofH, roofCol, 0.05,
        'roof' + parcel.x + parcel.y, { cluster: 2, lightBias: 0.05 });
      this.seams(ctx, parcel.x, parcel.y, parcel.w, roofH,
        RND_paletteShift(roofCol, -1), 0, 34);

      // Parapet: a raised lip, lit cap on the north and west, its cast shadow
      // falling inward onto the roof, shaded cap on the south and east.
      //
      // Only ONE step of highlight. Two steps put #D9382E — near-signal-red — around
      // the whole roof, and a continuous bright line of uniform width around a shape
      // does not read as a lip, it reads as a selection box. An earlier attempt also
      // lit the south and east inner faces, which completed the ring and made it
      // unmistakably a border. The version before that filled roofDk along BOTH the
      // top and bottom edges, which implies light from nowhere at all.
      const lit = RND_paletteShift(roofCol, 1);
      const shade = RND_paletteShift(roofCol, -2);
      const cast = RND_paletteShift(roofCol, -1);
      this.fill(ctx, parcel.x, parcel.y, parcel.w, 2, lit);                 // north cap
      this.fill(ctx, parcel.x, parcel.y, 2, roofH, lit);                    // west cap
      this.fill(ctx, parcel.x + 2, parcel.y + 2, parcel.w - 2, 3, cast);    // its shadow
      this.fill(ctx, parcel.x + 2, parcel.y + 2, 3, roofH - 2, cast);
      this.fill(ctx, parcel.x, faceY - 2, parcel.w, 2, shade);              // south cap
      this.fill(ctx, parcel.x + parcel.w - 2, parcel.y, 2, roofH, shade);   // east cap
    }

    this.drawFace(ctx, parcel, faceY, faceH, roofCol, p);

    // ---- Layer 4: rooftop clutter ----
    // Spacing is deliberately tight. Density is what makes a top-down city read
    // as inhabited rather than as coloured blocks; sparse clutter looks unfinished.
    // Confined to the roof band, not the parcel: a vent floating on the wall face
    // destroys the volume the face is there to establish.
    const STEP = 46;
    const cols = Math.max(1, Math.floor(parcel.w / STEP));
    const rows = Math.max(1, Math.floor(roofH / STEP));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ux = parcel.x + 14 + c * STEP;
        const uy = parcel.y + 14 + r * STEP;
        // Vary the unit by position so rooftops are not a regular lattice.
        const variant = (c + r * 3) % 4;
        if (variant === 3) continue;  // leave gaps

        // Every unit gets its own short south-east shadow. Rooftop clutter with no
        // shadow reads as a pattern printed on the roof; with one it reads as objects
        // sitting on it — the same cue that gives the buildings their height, applied
        // one scale down.
        const stand = (sx, sy, sw, sh, lift) => {
          ctx.fillStyle = this.withAlpha(p.shadow, 0.6);
          ctx.fillRect(sx + lift, sy + lift, sw, sh);
          this.stats.proceduralDraws++;
        };

        if (variant === 0) {                                    // AC unit
          if (ux + 20 > parcel.x + parcel.w - 6 || uy + 14 > parcel.y + roofH - 6) continue;
          stand(ux, uy, 20, 14, 4);
          this.fill(ctx, ux, uy, 20, 14, roofDk);
          this.fill(ctx, ux, uy, 20, 2, RND_paletteShift(roofDk, 2));
          this.fill(ctx, ux + 3, uy + 4, 14, 5, roofCol);
        } else if (variant === 1) {                              // vent pair
          if (ux + 16 > parcel.x + parcel.w - 6 || uy + 8 > parcel.y + roofH - 6) continue;
          stand(ux, uy, 16, 8, 3);
          this.fill(ctx, ux, uy, 7, 8, roofDk);
          this.fill(ctx, ux + 9, uy, 7, 8, roofDk);
          this.fill(ctx, ux, uy, 7, 1, RND_paletteShift(roofDk, 2));
          this.fill(ctx, ux + 9, uy, 7, 1, RND_paletteShift(roofDk, 2));
        } else {                                                 // skylight
          if (ux + 18 > parcel.x + parcel.w - 6 || uy + 10 > parcel.y + roofH - 6) continue;
          stand(ux, uy, 18, 10, 3);
          this.fill(ctx, ux, uy, 18, 10, roofDk);
          this.fill(ctx, ux + 2, uy + 2, 14, 6, p.walkHi);
        }
      }
    }

    // Water tank and stair head on anything with real footprint. Both are the
    // tallest things on a roof, so both get a proportionally longer shadow.
    if (parcel.w > 90 && roofH > 60) {
      const tankX = parcel.x + parcel.w - 34;
      const tankY = parcel.y + 14;
      ctx.fillStyle = this.withAlpha(p.shadow, 0.6);
      ctx.fillRect(tankX + 9, tankY + 9, 22, 22);
      ctx.fillRect(parcel.x + 18, parcel.y + roofH - 24, 26, 18);
      this.stats.proceduralDraws += 2;
      this.fill(ctx, tankX, tankY, 22, 22, roofDk);
      this.fill(ctx, tankX, tankY, 22, 3, RND_paletteShift(roofDk, 2));
      this.fill(ctx, tankX + 4, tankY + 5, 14, 13, p.face);
      this.fill(ctx, parcel.x + 12, parcel.y + roofH - 30, 26, 18, roofDk);
      this.fill(ctx, parcel.x + 16, parcel.y + roofH - 26, 18, 10, p.face);
    }
  }

  /**
   * The south wall of a building.
   *
   * The wall is built from the ROOF colour, two steps down, not from the palette's
   * `face`. `face` is near-black in every district, so a wall painted with it is
   * indistinguishable from the ground it stands on: the first version of this had the
   * windows apparently floating in a void with no building behind them. A dark brick
   * wall under a brick roof reads as one solid object, and the district's roof mix
   * carries straight down into the street elevation.
   *
   * With light from the north-west this wall faces away from it, so its storeys read
   * from their lit windows rather than from shading. That is what makes the height
   * countable — you can see a five-storey block because you can count five rows of
   * windows up its front.
   *
   * Windows are seeded from the parcel's own coordinates, so the same building is lit
   * the same way on every load and on both players' screens. The map is shared state
   * in online mode, and a wall that reshuffles itself per client is a visible desync.
   */
  drawFace(ctx, parcel, faceY, faceH, roofCol, p) {
    if (faceH <= 0) return;
    const floors = Math.max(1, Math.round(faceH / STOREY_PX));
    const storey = faceH / floors;

    const wall = RND_paletteShift(roofCol, -2);
    const wallDk = RND_paletteShift(roofCol, -3);

    // Base wall, dithered darker towards the pavement so the building grounds rather
    // than floating, plus a lit cornice line under the parapet.
    this.dither(ctx, parcel.x, faceY, parcel.w, faceH, wall, wallDk, 1);
    this.fill(ctx, parcel.x, faceY, parcel.w, 1, RND_paletteShift(roofCol, -1));

    // A window is 5px wide on an 11px pitch, so a 200px frontage carries 17 of them.
    // Anything sparser stops reading as a tenement.
    const PITCH = 11;
    const WIN_W = 5;
    const inset = 5;
    const usable = parcel.w - inset * 2;
    if (usable < PITCH) return;
    const perRow = Math.floor(usable / PITCH);
    const startX = parcel.x + inset + Math.floor((usable - perRow * PITCH) / 2);
    const rand = this.seeded('face' + parcel.x + ':' + parcel.y + ':' + parcel.w);
    const winH = Math.max(3, Math.floor(storey * 0.5));

    // Three window states, not two. On/off alone produced a waffle iron: an even grid
    // of identical bright rectangles on an even grid of identical dark ones. A dim
    // tier plus a masonry column every few bays breaks the lattice, which is what
    // real tenement frontages have — piers between the window bays.
    const bright = p.accent;
    const dim = RND_paletteShift(p.accent, -2);
    // Unlit glass is a NEUTRAL near-black, not the wall colour stepped down. On a
    // brick roof both -2 and -3 bottom out at the same #2B0D0D, so an unlit window
    // was invisible and the wall showed only scattered lit ones with no grid behind
    // them. A dark hole distinct from the brick is what lets you count the storeys.
    const glass = RND_paletteShift(p.face, -1);
    const frame = RND_paletteShift(roofCol, -1);
    const pier = (Math.floor(parcel.w / PITCH) % 3) + 5;   // 5-7 bays between piers

    for (let f = 0; f < floors; f++) {
      const wy = Math.round(faceY + f * storey + Math.max(1, (storey - winH) / 2));
      if (wy + winH > faceY + faceH - 1) break;
      // The ground floor is shopfronts: wider openings, and most of them lit.
      const ground = f === floors - 1;
      for (let i = 0; i < perRow; i++) {
        if (!ground && i % pier === pier - 1) continue;    // masonry pier
        const wx = startX + i * PITCH;
        const ww = ground ? WIN_W + 3 : WIN_W;
        if (wx + ww > parcel.x + parcel.w - inset) continue;
        const roll = rand();
        const tone = ground
          ? (roll < 0.62 ? bright : roll < 0.85 ? dim : glass)
          : (roll < 0.26 ? bright : roll < 0.46 ? dim : glass);
        this.fill(ctx, wx, wy, ww, winH, tone);
        // A 1px lintel above and sill below keep a row of bright rectangles from
        // reading as a dashed line painted on the wall.
        if (tone !== glass) {
          this.fill(ctx, wx, wy + winH, ww, 1, frame);
          this.fill(ctx, wx, wy - 1, ww, 1, wallDk);
        }
      }
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

    // Cast shadow to the south-east, stretched by the tree's height.
    this.castShadow(ctx, x, y + 2, 10, 7, PROP_HEIGHT.tree, p, 0.5);

    // Canopy: one CLUSTER of overlapping discs per tone, not concentric rings.
    //
    // Concentric discs were tried and they read as a shell with a highlight bubble in
    // it, because every layer shared a centre and so every boundary was a smooth arc
    // echoing the one outside it. Offsetting the lobes within each tone gives an
    // irregular silhouette and irregular internal boundaries, which is what makes a
    // mass of leaves rather than a target.
    const rim = RND_paletteShift(p.treeDk, -1);
    const lit = RND_paletteShift(p.tree, 1);
    const lobes = [[0, 0, 10], [-6, -3, 7], [5, 3, 7], [1, -7, 6], [-4, 5, 6]];

    lobes.forEach(([dx, dy, r]) => this.disc(ctx, x + dx, y + dy, r, rim));
    lobes.forEach(([dx, dy, r]) => this.disc(ctx, x + dx - 1, y + dy - 1, r - 1, p.treeDk));
    // Mid tone pulled towards the light, so the dark rim survives on the south-east.
    this.disc(ctx, x - 2, y - 2, 7, p.tree);
    this.disc(ctx, x + 2, y - 4, 4, p.tree);
    this.disc(ctx, x - 5, y + 2, 4, p.tree);

    // Highlights as small specks along the north-west arc rather than one big crown
    // disc — a single lit circle inside a dark one is an eye, not a lit canopy.
    [[-6, -5], [-3, -7], [-7, -1], [-1, -4]].forEach(([dx, dy]) =>
      this.disc(ctx, x + dx, y + dy, 2, lit));
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

  /**
   * A hard-edged filled ellipse, rasterised as horizontal spans.
   *
   * Canvas paths anti-alias, and there is no flag to stop them —
   * imageSmoothingEnabled only governs image scaling. So every ctx.arc() and
   * ctx.ellipse() in this renderer was laying soft gradient edges into a scene built
   * entirely from fillRect: the trees came out as smooth teal amoebas and were, at
   * 4x, obviously from a different game than the buildings beside them.
   *
   * Spans give the same shape with hard pixel edges, and one fill per row means a
   * translucent colour still cannot stack against itself.
   */
  oval(ctx, cx, cy, rx, ry, colour) {
    if (rx <= 0 || ry <= 0) return;
    ctx.fillStyle = colour;
    const ox = Math.round(cx);
    const oy = Math.round(cy);
    for (let dy = -Math.ceil(ry); dy <= Math.ceil(ry); dy++) {
      const t = 1 - (dy * dy) / (ry * ry);
      if (t <= 0) continue;
      const half = Math.round(rx * Math.sqrt(t));
      if (half <= 0) continue;
      ctx.fillRect(ox - half, oy + dy, half * 2, 1);
    }
    this.stats.proceduralDraws++;
  }

  /** A hard-edged filled circle. */
  disc(ctx, cx, cy, r, colour) {
    this.oval(ctx, cx, cy, r, r, colour);
  }

  /**
   * Shadow for a prop standing on the street, stretched south-east by its height.
   *
   * `height` is the object's real height in world pixels, not its drawn size, and it
   * is what makes a lamp post read as taller than a car.
   *
   * Displaced south-east and elongated, rather than rotated to the exact light angle:
   * a sheared path would be truer, but it has to be drawn hard-edged (see oval()) and
   * the displacement alone already carries the direction. A round shadow displaced far
   * enough to show real height detaches from its object and then reads as a hole in
   * the road, because nothing connects the two — which is why props use a shallower
   * slope than the buildings, whose swept hexagon still touches its own footprint.
   */
  castShadow(ctx, cx, cy, rx, ry, height, p, alpha) {
    const len = Math.max(0, height) * PROP_SHADOW_SLOPE;
    this.oval(ctx, cx + len * 0.35, cy + len * 0.35, rx + len / 2, ry + len / 4,
      this.withAlpha(p.shadow, alpha === undefined ? 0.42 : alpha));
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
      this.castShadow(ctx, cx, cy + (dir === 'v' ? L / 2 - 4 : 0),
        dir === 'v' ? W * 0.5 : L * 0.45, 4, PROP_HEIGHT.car, p, 0.35);

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

    // A car is low, so its shadow is a short skirt rather than a long throw.
    this.castShadow(ctx, x + w / 2, y + h / 2, w * 0.46, h * 0.42, PROP_HEIGHT.car, p, 0.45);

    // One continuous cabin, not two separate glass panels.
    //
    // The panels were placed at each end with body colour between them, which cut a
    // 30x16 car into three amber bars — at map scale that reads as three unrelated
    // markings on the tarmac, not a vehicle. A car seen from above is a bonnet, one
    // cabin, and a boot; the cabin is a single dark mass with the glass inside it, and
    // keeping it whole is what makes the silhouette read at this size.
    const cabin = RND_paletteShift(body, -2);
    const gleam = RND_paletteShift(body, 1);

    if (dir === 'v') {
      this.fill(ctx, x + 1, y, w - 2, h, bodyDk);                 // shell
      this.fill(ctx, x + 2, y + 1, w - 4, h - 2, body);           // lit body
      this.fill(ctx, x + 2, y + 6, w - 4, h - 13, cabin);         // cabin mass
      this.fill(ctx, x + 3, y + 7, w - 6, 4, glass);              // windscreen
      this.fill(ctx, x + 3, y + h - 11, w - 6, 3, glass);         // rear glass
      this.fill(ctx, x + 2, y + 1, w - 4, 1, gleam);              // lit north edge
      this.fill(ctx, x, y + 5, 1, 5, bodyDk);                     // wheels
      this.fill(ctx, x + w - 1, y + 5, 1, 5, bodyDk);
      this.fill(ctx, x, y + h - 10, 1, 5, bodyDk);
      this.fill(ctx, x + w - 1, y + h - 10, 1, 5, bodyDk);
    } else {
      this.fill(ctx, x, y + 1, w, h - 2, bodyDk);
      this.fill(ctx, x + 1, y + 2, w - 2, h - 4, body);
      this.fill(ctx, x + 6, y + 2, w - 13, h - 4, cabin);
      this.fill(ctx, x + 7, y + 3, 4, h - 6, glass);
      this.fill(ctx, x + w - 11, y + 3, 3, h - 6, glass);
      this.fill(ctx, x + 1, y + 2, w - 2, 1, gleam);
      this.fill(ctx, x + 5, y, 5, 1, bodyDk);
      this.fill(ctx, x + 5, y + h - 1, 5, 1, bodyDk);
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
      this.castShadow(ctx, x, y + 1, size.w * 0.55, 3.5, PROP_HEIGHT[kind] || 20, p, 0.4);
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
      // The post is the tallest thing on the pavement, so its shadow is the longest,
      // and a row of them rakes across the road in the light direction.
      this.castShadow(ctx, x, y, 3, 2.5, PROP_HEIGHT.street_lamp, p, 0.34);
      this.fill(ctx, x - 3, y - 3, 6, 6, p.roofADk);   // lamp head
      this.fill(ctx, x - 1, y - 1, 2, 2, p.accent);    // bulb
      return;
    }

    // Booth or dumpster: a standing box, so it gets a proper cast shadow plus a lit
    // top edge rather than a flat block offset by three pixels.
    this.castShadow(ctx, x, y, 6, 4, PROP_HEIGHT[kind] || 20, p, 0.42);
    this.fill(ctx, x - 5, y - 14, 10, 16, p.walkHi);
    this.fill(ctx, x - 5, y - 14, 10, 2, RND_paletteShift(p.walkHi, 2));
    this.fill(ctx, x - 4, y - 11, 8, 5, p.face);
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

      // POI props are the tallest street objects, so their height comes from the
      // sprite itself rather than the PROP_HEIGHT table.
      this.castShadow(ctx, poi.x, poi.y + 4, w * 0.42, 7, h * 0.55, p, 0.4);

      ctx.drawImage(slice.image, slice.x, slice.y, slice.w, slice.h, x, y, w, h);
      this.stats.assetDraws++;

      // Active POIs get an accent underline rather than a box, so the art is
      // never boxed in by UI chrome.
      if (active) this.fill(ctx, poi.x - w / 2, poi.y + 8, w, 3, col);

      footprint = h;
    } else {
      this.castShadow(ctx, poi.x, poi.y + footprint / 2 - 4, footprint * 0.45, 5,
        footprint * 0.6, p, 0.4);
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

    // Shorter than the props' throw on purpose. The player's own shadow is the one
    // piece of the scene that has to stay tight under the sprite: stretched out to
    // match a lamp post it trails ahead of you and reads as a second character.
    this.castShadow(ctx, x, y + 12, 10, 4, PROP_HEIGHT.player * 0.55, p, 0.55);

    this.fill(ctx, x - 7, y - 18 + bob, 14, 9, p.roofADk);   // hair
    this.fill(ctx, x - 5, y - 10 + bob, 10, 6, '#854224');   // face
    this.fill(ctx, x - 8, y - 4 + bob, 16, 12, p.accent);    // jacket
    this.fill(ctx, x - 6, y + 8 + bob, 5, 8, p.face);        // legs
    this.fill(ctx, x + 1, y + 8 + bob, 5, 8, p.face);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TopDownCityRenderer, POI_LABELS, SHADOW_OFFSET, FURNITURE_DISPLAY,
    STOREY_PX, SHADOW_PER_STOREY, MIN_FLOORS, MAX_FLOORS, MAX_FACE_FRACTION,
    PROP_HEIGHT, PROP_SHADOW_SLOPE
  };
}
if (typeof window !== 'undefined') {
  window.TopDownCityRenderer = TopDownCityRenderer;
  window.TOPDOWN_POI_LABELS = POI_LABELS;
}
