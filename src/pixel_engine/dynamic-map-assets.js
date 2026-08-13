/**
 * Concrete Kings: Dynamic Narrative Map — Asset Manifest
 *
 * Every path here resolves inside assets/map/web/, which is TRACKED, and is
 * built by scripts/process-map-sprites.sh from the vendor art in assets/.
 * That indirection is load-bearing: assets/ holds ~511,000 PNGs of which git
 * tracks ~123, so the Modern Exteriors library this art comes from is an
 * untracked local drop. An earlier version of this file pointed straight at it
 * and the map only resolved on one machine. test/map-sprites.test.js fails if a
 * mapping ever points outside assets/map/web/ again.
 *
 * The sprites are pre-cropped and pre-scaled to the size the renderer draws
 * them at, so nothing is resampled at runtime (HANDOFF trap 2.6). Aspect ratios
 * differ on purpose — a 40x64 storefront and a 64x55 precinct are not squares —
 * and the renderers fit them inside the draw box with dmFitSprite rather than
 * stretching them to it, which is what the old 5-argument drawImage did.
 *
 * Images are loaded lazily via Image() in the browser; if a file is missing or
 * fails to load, the renderer falls back to its geometric glyph (decoration must
 * never break the screen — see AGENTS.md).
 *
 * In Node (tests) there is no Image, so load() is a no-op and getImage()
 * returns null, exercising the fallback path.
 */

const DM_ASSET_BASE = 'assets/';
const DM_MAP_SPRITE_DIR = 'map/web/';

/**
 * Only the location types with no generated art in assets/generated/ appear
 * here. HOME, RESTAURANT, STORE, PARK, APARTMENT, ALLEY and CLUB all resolve
 * through MapAssetRegistry first and never reach this table, so mapping them
 * would be dead weight that only ever fires when something is already wrong.
 *
 * TRANSITION (Rail Yards) is deliberately absent and keeps the geometric glyph.
 * The only transit art in the library is a bare subway stairwell and an
 * interior train-door animation strip; neither reads as a rail yard, and a
 * wrong building is worse than an honest glyph. Same call as T-Bone's portrait
 * and the missing Atlanta arrival art.
 */
const DM_LOCATION_ASSETS = {
  INSTITUTION: [DM_MAP_SPRITE_DIR + 'building_institution.png'],
  SOCIAL: [DM_MAP_SPRITE_DIR + 'building_social.png'],
  LANDMARK: [DM_MAP_SPRITE_DIR + 'building_landmark.png'],
  HIDDEN: [DM_MAP_SPRITE_DIR + 'building_hidden.png'],
  // Present and null on purpose: an explicit "this type draws no sprite", which
  // getLocationAsset distinguishes from an unknown type. Without the entry
  // TRANSITION would inherit _default and the Rail Yards would render as a
  // market storefront, which is the wrong-building outcome this avoids.
  TRANSITION: null,
  // generic fallback for any other type that has no generated art
  _default: [DM_MAP_SPRITE_DIR + 'building_default.png']
};

/**
 * Per-location building art, keyed by the level's own location id.
 *
 * Checked BEFORE the generated registry, and that order is the point. The
 * generated set (assets/generated/map_building_*.png) is 32x32 PNGs of 113
 * bytes: one flat colour each, drawn at 40 and 64px, so every location on the
 * map was a slightly blurry coloured square. Its day / evening / night variants
 * are the same size and evening and night are the same colour, so collapsing
 * three files per location to one loses nothing that was there.
 *
 * Built by scripts/process-map-buildings.sh, which records why each building
 * was matched to each place.
 *
 * detroit_lot is present and null: a vacant lot, and the only lot-adjacent art
 * in the drop is a roadworks barrier and scaffolding. Null suppresses the flat
 * placeholder too, so it falls all the way through to the geometric glyph
 * rather than being "rescued" by the thing this table exists to replace.
 */
const DM_LOCATION_ID_ASSETS = {
  stoop: DM_MAP_SPRITE_DIR + 'building_loc_stoop.png',
  blue_plate: DM_MAP_SPRITE_DIR + 'building_loc_blue_plate.png',
  corner_store: DM_MAP_SPRITE_DIR + 'building_loc_corner_store.png',
  chi_grey: DM_MAP_SPRITE_DIR + 'building_loc_chi_grey.png',
  bmore_steps: DM_MAP_SPRITE_DIR + 'building_loc_bmore_steps.png',
  miami_cut: DM_MAP_SPRITE_DIR + 'building_loc_miami_cut.png',
  detroit_lot: null
};

const DM_TERRAIN_ASSET = DM_MAP_SPRITE_DIR + 'ground_asphalt.png';
const DM_POLICE_ASSET = DM_MAP_SPRITE_DIR + 'building_institution.png';
const DM_CHARACTER_ASSET = DM_MAP_SPRITE_DIR + 'character_fallback.png';

/**
 * Fit a sprite inside a square draw box without distorting it.
 *
 * The renderers used to call ctx.drawImage(img, x, y, size, size), which
 * stretches whatever it is given to a square. A 240x384 storefront became a
 * 40x40 smear. Returns the drawn size and the offsets that centre it
 * horizontally and sit it on the box's bottom edge, because map sprites are
 * buildings and a building stands on the ground rather than floating in the
 * middle of its cell.
 */
function dmFitSprite(img, box) {
  const iw = (img && img.width) || 0;
  const ih = (img && img.height) || 0;
  if (!iw || !ih) return { dw: box, dh: box, ox: 0, oy: 0 };
  const scale = Math.min(box / iw, box / ih);
  const dw = Math.max(1, Math.round(iw * scale));
  const dh = Math.max(1, Math.round(ih * scale));
  return { dw, dh, ox: Math.round((box - dw) / 2), oy: box - dh };
}

class DMAssetManager {
  constructor(base) {
    this.base = base || DM_ASSET_BASE;
    this.cache = {};   // key -> HTMLImageElement | null (null = failed/loading)
    this._loading = {};
    // invoked (once) whenever any image finishes loading, so the renderer can
    // re-draw and pick up the newly-available sprite. Set by the map system.
    this.onImageLoaded = null;
  }

  _key(path) { return path; }

  _notifyLoaded() { if (typeof this.onImageLoaded === 'function') { try { this.onImageLoaded(); } catch (e) {} } }

  // Returns a promise that resolves to the loaded Image, or null if unavailable.
  load(path) {
    const key = this._key(path);
    if (key in this.cache) return Promise.resolve(this.cache[key]);
    if (typeof Image === 'undefined') { this.cache[key] = null; return Promise.resolve(null); }
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { this.cache[key] = img; this._notifyLoaded(); resolve(img); };
      img.onerror = () => { this.cache[key] = null; this._notifyLoaded(); resolve(null); };
      img.src = this.base + path;
      // safety: don't hang forever
      setTimeout(() => { if (!(key in this.cache)) { this.cache[key] = null; this._notifyLoaded(); resolve(null); } }, 3000);
    });
  }

  // Synchronous get for render loop — returns the cached Image or null.
  get(path) {
    const key = this._key(path);
    if (key in this.cache) return this.cache[key];
    // trigger background load; render loop will pick it up next frame
    this.load(path);
    return null;
  }

  /**
   * null for a type mapped to no art, so the caller draws its glyph. An
   * unknown type still gets _default; a type present with a null entry does
   * not. hasOwnProperty rather than a truthiness check, because those two
   * cases are the whole point of the distinction.
   */
  getLocationAsset(type) {
    if (Object.prototype.hasOwnProperty.call(DM_LOCATION_ASSETS, type)) {
      const list = DM_LOCATION_ASSETS[type];
      return (list && list[0]) || null;
    }
    return DM_LOCATION_ASSETS._default[0];
  }

  /**
   * Per-location art, or null.
   *
   * Returns { path } for a mapped id, { path: null } for an id mapped to no art
   * on purpose, and null for an id this table says nothing about. The caller
   * needs all three: the middle case must skip the generated fallback, the last
   * case must use it.
   */
  getLocationAssetById(id) {
    if (!id || !Object.prototype.hasOwnProperty.call(DM_LOCATION_ID_ASSETS, id)) return null;
    return { path: DM_LOCATION_ID_ASSETS[id] || null };
  }

  getTerrain() { return DM_TERRAIN_ASSET; }
  getPolice() { return DM_POLICE_ASSET; }
  getCharacter() { return DM_CHARACTER_ASSET; }
  getEventAsset(eventId) {
    if (eventId === 'police_sweep' || eventId === 'police_raid') return DM_POLICE_ASSET;
    return null;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DMAssetManager, DM_LOCATION_ASSETS, DM_LOCATION_ID_ASSETS, DM_ASSET_BASE,
    DM_MAP_SPRITE_DIR, DM_TERRAIN_ASSET, DM_CHARACTER_ASSET, DM_POLICE_ASSET,
    dmFitSprite
  };
}
if (typeof window !== 'undefined') {
  window.DMAssetManager = DMAssetManager;
  window.dmFitSprite = dmFitSprite;
}
